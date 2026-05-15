from math import floor

from .log_generator import generate_daily_logs


MAX_DAILY_DRIVING_HOURS = 11
MAX_DUTY_WINDOW_HOURS = 14
BREAK_AFTER_DRIVING_HOURS = 8
BREAK_DURATION_HOURS = 0.5
DAILY_REST_HOURS = 10
CYCLE_LIMIT_HOURS = 70
CYCLE_RESET_HOURS = 34
PICKUP_DURATION_HOURS = 1
DROPOFF_DURATION_HOURS = 1
FUEL_STOP_INTERVAL_MILES = 1000
FUEL_STOP_DURATION_HOURS = 0.5


def build_hos_plan(route, current_cycle_used):
    planner = HosPlanner(current_cycle_used=current_cycle_used)

    planner.drive_leg(route["legs"][0])
    planner.add_on_duty_event(
        name="Pickup",
        location=route["pickup_location"],
        duration_hours=PICKUP_DURATION_HOURS,
        remarks="Pickup loading/check-in",
    )
    planner.drive_leg(route["legs"][1])
    planner.add_on_duty_event(
        name="Dropoff",
        location=route["dropoff_location"],
        duration_hours=DROPOFF_DURATION_HOURS,
        remarks="Dropoff unloading/check-out",
    )

    events = planner.events
    daily_logs = generate_daily_logs(events)
    total_on_duty = sum(
        event["duration_hours"]
        for event in events
        if event["status"] in {"driving", "on_duty_not_driving"}
    )
    total_off_duty = sum(
        event["duration_hours"] for event in events if event["status"] == "off_duty"
    )

    ending_cycle = round(planner.cycle_used, 2)
    cycle_remaining = round(max(0.0, CYCLE_LIMIT_HOURS - planner.cycle_used), 2)

    cycle_issue = None
    naive_ending = round(float(current_cycle_used) + total_on_duty, 2)
    if naive_ending > CYCLE_LIMIT_HOURS:
        cycle_issue = (
            f"This trip requires {planner.cycle_resets} cycle reset(s). "
            f"Without a reset, cycle hours would reach {naive_ending}h, "
            f"exceeding the 70-hour limit."
        )
    elif ending_cycle > CYCLE_LIMIT_HOURS:
        cycle_issue = (
            f"Ending cycle hours ({ending_cycle}h) exceed the 70-hour limit. "
            f"A cycle reset is required."
        )

    return {
        "trip_summary": {
            "total_distance_miles": route["total_miles"],
            "estimated_drive_hours": round(route["estimated_drive_hours"], 2),
            "total_on_duty_hours": round(total_on_duty, 2),
            "total_off_duty_hours": round(total_off_duty, 2),
            "total_elapsed_hours": round(planner.current_time, 2),
            "current_cycle_used_hours": round(current_cycle_used, 2),
            "ending_cycle_used_hours": ending_cycle,
            "cycle_remaining_hours": cycle_remaining,
            "fuel_stops": planner.fuel_stops,
            "daily_rests": planner.daily_rests,
            "cycle_resets": planner.cycle_resets,
            "cycle_issue": cycle_issue,
        },
        "event_timeline": events,
        "daily_logs": daily_logs,
    }


class HosPlanner:
    def __init__(self, current_cycle_used):
        self.current_time = 0
        self.current_day = 1
        self.daily_driving = 0
        self.daily_on_duty = 0
        self.driving_since_break = 0
        self.cycle_used = float(current_cycle_used)
        self.events = []
        self.miles_since_fuel = 0
        self.fuel_stops = 0
        self.daily_rests = 0
        self.cycle_resets = 0

    def drive_leg(self, leg):
        remaining_miles = float(leg["distance_miles"])
        location_label = f"{leg['from']} to {leg['to']}"

        while remaining_miles > 0:
            self._ensure_drive_availability()

            miles_until_fuel = FUEL_STOP_INTERVAL_MILES - self.miles_since_fuel
            max_drive_hours = min(
                MAX_DAILY_DRIVING_HOURS - self.daily_driving,
                MAX_DUTY_WINDOW_HOURS - self.daily_on_duty,
                BREAK_AFTER_DRIVING_HOURS - self.driving_since_break,
                CYCLE_LIMIT_HOURS - self.cycle_used,
                remaining_miles / 60,
                miles_until_fuel / 60,
            )

            if max_drive_hours <= 0:
                self._ensure_drive_availability()
                continue

            miles = max_drive_hours * 60
            self._add_event(
                name="Drive",
                status="driving",
                location=location_label,
                duration_hours=max_drive_hours,
                remarks=f"{leg['type']} driving segment",
                miles=round(miles, 1),
            )

            remaining_miles = round(remaining_miles - miles, 10)
            self.daily_driving += max_drive_hours
            self.daily_on_duty += max_drive_hours
            self.driving_since_break += max_drive_hours
            self.cycle_used += max_drive_hours
            self.miles_since_fuel += miles

            if remaining_miles > 0 and self.miles_since_fuel >= FUEL_STOP_INTERVAL_MILES:
                self.add_on_duty_event(
                    name="Fuel Stop",
                    location=location_label,
                    duration_hours=FUEL_STOP_DURATION_HOURS,
                    remarks="Required fuel stop",
                )
                self.miles_since_fuel = 0
                self.fuel_stops += 1

    def add_on_duty_event(self, name, location, duration_hours, remarks):
        remaining = duration_hours

        while remaining > 0:
            self._ensure_on_duty_availability()
            chunk = min(
                remaining,
                MAX_DUTY_WINDOW_HOURS - self.daily_on_duty,
                CYCLE_LIMIT_HOURS - self.cycle_used,
            )

            if chunk <= 0:
                self._ensure_on_duty_availability()
                continue

            self._add_event(
                name=name,
                status="on_duty_not_driving",
                location=location,
                duration_hours=chunk,
                remarks=remarks,
            )
            remaining -= chunk
            self.daily_on_duty += chunk
            self.cycle_used += chunk

    def _ensure_drive_availability(self):
        if CYCLE_LIMIT_HOURS - self.cycle_used <= 0:
            self._take_cycle_reset()
        elif self.daily_driving >= MAX_DAILY_DRIVING_HOURS:
            self._take_daily_rest("11-hour driving limit reached")
        elif self.daily_on_duty >= MAX_DUTY_WINDOW_HOURS:
            self._take_daily_rest("14-hour duty window reached")
        elif self.driving_since_break >= BREAK_AFTER_DRIVING_HOURS:
            self._take_break()

    def _ensure_on_duty_availability(self):
        if CYCLE_LIMIT_HOURS - self.cycle_used <= 0:
            self._take_cycle_reset()
        elif self.daily_on_duty >= MAX_DUTY_WINDOW_HOURS:
            self._take_daily_rest("14-hour duty window reached")

    def _take_break(self):
        self._add_event(
            name="30-Minute Break",
            status="off_duty",
            location="En route",
            duration_hours=BREAK_DURATION_HOURS,
            remarks="Required break after 8 cumulative driving hours",
        )
        self.driving_since_break = 0

    def _take_daily_rest(self, remarks):
        self._add_event(
            name="10-Hour Rest",
            status="off_duty",
            location="En route",
            duration_hours=DAILY_REST_HOURS,
            remarks=remarks,
        )
        self.current_day += 1
        self.daily_driving = 0
        self.daily_on_duty = 0
        self.driving_since_break = 0
        self.daily_rests += 1

    def _take_cycle_reset(self):
        self._add_event(
            name="34-Hour Cycle Reset",
            status="off_duty",
            location="En route",
            duration_hours=CYCLE_RESET_HOURS,
            remarks="70-hour/8-day cycle limit reached",
        )
        self.current_day += max(1, floor(CYCLE_RESET_HOURS / 24))
        self.daily_driving = 0
        self.daily_on_duty = 0
        self.driving_since_break = 0
        self.cycle_used = 0
        self.cycle_resets += 1

    def _add_event(self, name, status, location, duration_hours, remarks, miles=0):
        start = self.current_time
        end = self.current_time + duration_hours
        self.events.append(
            {
                "sequence": len(self.events) + 1,
                "day": self.current_day,
                "name": name,
                "status": status,
                "location": location,
                "start_hour": round(start, 2),
                "end_hour": round(end, 2),
                "duration_hours": round(duration_hours, 2),
                "miles": miles,
                "remarks": remarks,
            }
        )
        self.current_time = end
