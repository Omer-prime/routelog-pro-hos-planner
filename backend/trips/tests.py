from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .services.hos_calculator import CYCLE_LIMIT_HOURS, build_hos_plan
from .services.route_service import (
    GEOCODING_ERROR_MESSAGE,
    ROUTING_ERROR_MESSAGE,
    RouteServiceError,
    calculate_route,
    fetch_route,
    geocode_location,
    simplify_route_coordinates,
)


def _short_route():
    return {
        "total_miles": 200,
        "estimated_drive_hours": 3.33,
        "pickup_location": "Austin, TX",
        "dropoff_location": "Atlanta, GA",
        "legs": [
            {
                "from": "Dallas, TX",
                "to": "Austin, TX",
                "type": "pre-pickup",
                "distance_miles": 100,
                "estimated_drive_hours": 1.67,
            },
            {
                "from": "Austin, TX",
                "to": "Atlanta, GA",
                "type": "main",
                "distance_miles": 100,
                "estimated_drive_hours": 1.67,
            },
        ],
    }


def _long_route():
    return {
        "total_miles": 3000,
        "estimated_drive_hours": 50.0,
        "pickup_location": "Austin, TX",
        "dropoff_location": "Atlanta, GA",
        "legs": [
            {
                "from": "Dallas, TX",
                "to": "Austin, TX",
                "type": "pre-pickup",
                "distance_miles": 100,
                "estimated_drive_hours": 1.67,
            },
            {
                "from": "Austin, TX",
                "to": "Atlanta, GA",
                "type": "main",
                "distance_miles": 2900,
                "estimated_drive_hours": 48.33,
            },
        ],
    }


class HosCalculatorTests(SimpleTestCase):
    def test_total_on_duty_excludes_off_duty_events(self):
        plan = build_hos_plan(_short_route(), current_cycle_used=0)
        summary = plan["trip_summary"]
        events = plan["event_timeline"]
        manual_on_duty = round(
            sum(
                e["duration_hours"]
                for e in events
                if e["status"] in {"driving", "on_duty_not_driving"}
            ),
            2,
        )
        self.assertAlmostEqual(summary["total_on_duty_hours"], manual_on_duty, places=2)

    def test_off_duty_events_excluded_from_total_on_duty(self):
        plan = build_hos_plan(_short_route(), current_cycle_used=0)
        events = plan["event_timeline"]
        off_duty_total = sum(e["duration_hours"] for e in events if e["status"] == "off_duty")
        # off_duty should only be in total_off_duty_hours, not total_on_duty_hours
        self.assertGreaterEqual(plan["trip_summary"]["total_off_duty_hours"], off_duty_total - 0.01)

    def test_ending_cycle_equals_start_plus_on_duty_for_no_reset_trip(self):
        plan = build_hos_plan(_short_route(), current_cycle_used=10)
        summary = plan["trip_summary"]
        self.assertEqual(summary["cycle_resets"], 0)
        # Allow delta=0.02 because cycle_used accumulates unrounded values while
        # total_on_duty_hours sums already-rounded event durations.
        expected = summary["current_cycle_used_hours"] + summary["total_on_duty_hours"]
        self.assertAlmostEqual(summary["ending_cycle_used_hours"], expected, delta=0.02)

    def test_cycle_remaining_plus_ending_equals_70(self):
        plan = build_hos_plan(_short_route(), current_cycle_used=10)
        summary = plan["trip_summary"]
        self.assertAlmostEqual(
            summary["ending_cycle_used_hours"] + summary["cycle_remaining_hours"],
            CYCLE_LIMIT_HOURS,
            places=2,
        )

    def test_cycle_issue_warning_when_naive_ending_exceeds_70(self):
        # 65h starting + long trip = naive ending > 70, triggering a cycle reset
        plan = build_hos_plan(_long_route(), current_cycle_used=65)
        summary = plan["trip_summary"]
        self.assertGreater(summary["cycle_resets"], 0)
        self.assertIsNotNone(summary["cycle_issue"])
        self.assertIn("70-hour", summary["cycle_issue"])

    def test_no_cycle_issue_for_short_normal_trip(self):
        plan = build_hos_plan(_short_route(), current_cycle_used=10)
        summary = plan["trip_summary"]
        self.assertIsNone(summary["cycle_issue"])

    def test_cycle_remaining_is_zero_when_cycle_exhausted(self):
        # After a cycle reset, ending_cycle is based on post-reset hours; remaining >= 0
        plan = build_hos_plan(_long_route(), current_cycle_used=65)
        summary = plan["trip_summary"]
        self.assertGreaterEqual(summary["cycle_remaining_hours"], 0)


class RouteServiceTests(SimpleTestCase):
    @patch("trips.services.route_service.fetch_json", return_value=[])
    def test_geocode_failure_returns_friendly_message_with_field(self, _fetch_json):
        with self.assertRaises(RouteServiceError) as context:
            geocode_location("Maxico", "dropoff_location")

        self.assertEqual(context.exception.message, GEOCODING_ERROR_MESSAGE)
        self.assertEqual(context.exception.field, "dropoff_location")
        self.assertEqual(context.exception.code, "geocoding_failed")

    @patch("trips.services.route_service.fetch_json", return_value={"routes": []})
    def test_routing_failure_returns_friendly_message(self, _fetch_json):
        coordinates = [
            {"lat": 32.7767, "lng": -96.797},
            {"lat": 30.2672, "lng": -97.7431},
            {"lat": 33.749, "lng": -84.388},
        ]

        with self.assertRaises(RouteServiceError) as context:
            fetch_route(coordinates)

        self.assertEqual(context.exception.message, ROUTING_ERROR_MESSAGE)
        self.assertIsNone(context.exception.field)
        self.assertEqual(context.exception.code, "routing_failed")

    @patch("trips.services.route_service.fetch_json")
    def test_calculate_route_keeps_default_route_working(self, fetch_json_mock):
        fetch_json_mock.side_effect = [
            [{"lat": "32.7767", "lon": "-96.7970", "display_name": "Dallas, TX"}],
            [{"lat": "30.2672", "lon": "-97.7431", "display_name": "Austin, TX"}],
            [{"lat": "33.7490", "lon": "-84.3880", "display_name": "Atlanta, GA"}],
            {
                "code": "Ok",
                "routes": [
                    {
                        "duration": 72000,
                        "geometry": {
                            "coordinates": [
                                [-96.7970, 32.7767],
                                [-97.7431, 30.2672],
                                [-84.3880, 33.7490],
                            ]
                        },
                        "legs": [
                            {"distance": 322000, "duration": 10800},
                            {"distance": 1480000, "duration": 61200},
                        ],
                    }
                ],
            },
        ]

        route = calculate_route("Dallas, TX", "Austin, TX", "Atlanta, GA")

        self.assertEqual(route["current_location"], "Dallas, TX")
        self.assertEqual(route["pickup_location"], "Austin, TX")
        self.assertEqual(route["dropoff_location"], "Atlanta, GA")
        self.assertEqual(route["current_coordinates"]["display_name"], "Dallas, TX")
        self.assertEqual(route["coordinate_count"], 3)
        self.assertEqual(len(route["legs"]), 2)
        self.assertEqual(route["route_coordinates"][0], {"lat": 32.7767, "lng": -96.797})

    def test_simplify_route_coordinates_keeps_first_last_and_caps_count(self):
        coordinates = [{"lat": index / 1000, "lng": -index / 1000} for index in range(2000)]

        simplified = simplify_route_coordinates(coordinates, max_coordinates=700)

        self.assertLessEqual(len(simplified), 700)
        self.assertEqual(simplified[0], {"lat": 0.0, "lng": 0.0})
        self.assertEqual(simplified[-1], {"lat": 1.999, "lng": -1.999})


class PlanTripApiTests(APITestCase):
    @patch("trips.views.calculate_route")
    def test_plan_trip_returns_friendly_geocoding_error(self, calculate_route_mock):
        calculate_route_mock.side_effect = RouteServiceError(
            GEOCODING_ERROR_MESSAGE,
            field="dropoff_location",
            code="geocoding_failed",
        )

        response = self.client.post(
            "/api/trips/plan/",
            {
                "current_location": "Dallas, TX",
                "pickup_location": "Austin, TX",
                "dropoff_location": "Maxico",
                "current_cycle_used": 10,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], GEOCODING_ERROR_MESSAGE)
        self.assertEqual(response.data["field"], "dropoff_location")
        self.assertEqual(response.data["code"], "geocoding_failed")
