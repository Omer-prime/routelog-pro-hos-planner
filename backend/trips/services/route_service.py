import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


AVERAGE_SPEED_MPH = 60
METERS_PER_MILE = 1609.344
SECONDS_PER_HOUR = 3600
GEOCODING_URL = os.getenv("GEOCODING_URL", "https://nominatim.openstreetmap.org/search")
ROUTING_URL = os.getenv("ROUTING_URL", "https://router.project-osrm.org/route/v1/driving")
ROUTE_API_KEY = os.getenv("ROUTE_API_KEY")
HTTP_TIMEOUT_SECONDS = 15
MAX_ROUTE_COORDINATES = 700
COORDINATE_PRECISION = 6
GEOCODING_ERROR_MESSAGE = (
    "We could not find this location. Please enter a more specific city/state, "
    "for example: Atlanta, GA."
)
ROUTING_ERROR_MESSAGE = (
    "Route could not be calculated. Please check that all locations are valid "
    "and reachable by road."
)


class RouteServiceError(Exception):
    def __init__(self, message, field=None, code="route_error"):
        super().__init__(message)
        self.message = message
        self.field = field
        self.code = code


def calculate_route(current_location, pickup_location, dropoff_location):
    try:
        current_coordinates = geocode_location(current_location, "current_location")
        pickup_coordinates = geocode_location(pickup_location, "pickup_location")
        dropoff_coordinates = geocode_location(dropoff_location, "dropoff_location")
        route = fetch_route([current_coordinates, pickup_coordinates, dropoff_coordinates])
    except RouteServiceError:
        raise
    except Exception as exc:
        raise RouteServiceError(f"Route service failed: {exc}") from exc

    legs = build_legs(
        route["legs"],
        [
            (current_location, pickup_location, "deadhead_to_pickup"),
            (pickup_location, dropoff_location, "loaded_to_dropoff"),
        ],
    )
    total_miles = sum(leg["distance_miles"] for leg in legs)
    estimated_drive_hours = route.get("duration_hours") or total_miles / AVERAGE_SPEED_MPH
    route_coordinates = route["route_coordinates"]

    return {
        "current_location": current_location,
        "pickup_location": pickup_location,
        "dropoff_location": dropoff_location,
        "current_coordinates": current_coordinates,
        "pickup_coordinates": pickup_coordinates,
        "dropoff_coordinates": dropoff_coordinates,
        "total_miles": round(total_miles, 2),
        "average_speed_mph": AVERAGE_SPEED_MPH,
        "estimated_drive_hours": round(estimated_drive_hours, 2),
        "coordinate_count": len(route_coordinates),
        "route_coordinates": route_coordinates,
        "legs": legs,
    }


def geocode_location(location, field=None):
    params = {
        "q": location,
        "format": "jsonv2",
        "limit": 1,
    }
    if ROUTE_API_KEY:
        params["key"] = ROUTE_API_KEY

    try:
        data = fetch_json(f"{GEOCODING_URL}?{urlencode(params)}")
    except RouteServiceError as exc:
        raise RouteServiceError(
            GEOCODING_ERROR_MESSAGE,
            field=field,
            code="geocoding_failed",
        ) from exc

    if not data:
        raise RouteServiceError(
            GEOCODING_ERROR_MESSAGE,
            field=field,
            code="geocoding_failed",
        )

    result = data[0]
    try:
        return {
            "lat": float(result["lat"]),
            "lng": float(result["lon"]),
            "display_name": result.get("display_name", location),
        }
    except (KeyError, TypeError, ValueError) as exc:
        raise RouteServiceError(
            GEOCODING_ERROR_MESSAGE,
            field=field,
            code="geocoding_failed",
        ) from exc


def fetch_route(coordinates):
    coordinate_path = ";".join(
        f"{coordinate['lng']},{coordinate['lat']}" for coordinate in coordinates
    )
    query = urlencode(
        {
            "overview": "full",
            "geometries": "geojson",
            "steps": "false",
        }
    )
    try:
        data = fetch_json(f"{ROUTING_URL}/{quote(coordinate_path, safe=';,')}?{query}")
    except RouteServiceError as exc:
        raise RouteServiceError(ROUTING_ERROR_MESSAGE, code="routing_failed") from exc

    if data.get("code") not in (None, "Ok"):
        raise RouteServiceError(ROUTING_ERROR_MESSAGE, code="routing_failed")

    routes = data.get("routes", [])
    if not routes:
        raise RouteServiceError(ROUTING_ERROR_MESSAGE, code="routing_failed")

    route = routes[0]
    geometry = route.get("geometry", {})
    coordinates_list = geometry.get("coordinates", [])

    if not coordinates_list:
        raise RouteServiceError(ROUTING_ERROR_MESSAGE, code="routing_failed")

    route_coordinates = simplify_route_coordinates(
        {"lat": latitude, "lng": longitude} for longitude, latitude in coordinates_list
    )

    return {
        "duration_hours": route.get("duration", 0) / SECONDS_PER_HOUR,
        "route_coordinates": route_coordinates,
        "legs": route.get("legs", []),
    }


def simplify_route_coordinates(coordinates, max_coordinates=MAX_ROUTE_COORDINATES):
    normalized = [
        {
            "lat": round(float(coordinate["lat"]), COORDINATE_PRECISION),
            "lng": round(float(coordinate["lng"]), COORDINATE_PRECISION),
        }
        for coordinate in coordinates
    ]

    if len(normalized) <= max_coordinates:
        return normalized

    if max_coordinates < 2:
        return normalized[:max_coordinates]

    first_coordinate = normalized[0]
    last_coordinate = normalized[-1]
    middle_coordinates = normalized[1:-1]
    step = max(1, -(-len(middle_coordinates) // (max_coordinates - 2)))
    sampled_coordinates = middle_coordinates[::step]

    return [first_coordinate, *sampled_coordinates[: max_coordinates - 2], last_coordinate]


def build_legs(route_legs, labels):
    legs = []
    for index, (start, end, leg_type) in enumerate(labels):
        api_leg = route_legs[index] if index < len(route_legs) else {}
        distance_miles = api_leg.get("distance", 0) / METERS_PER_MILE
        duration_hours = api_leg.get("duration", 0) / SECONDS_PER_HOUR

        if duration_hours <= 0:
            duration_hours = distance_miles / AVERAGE_SPEED_MPH

        legs.append(
            {
                "from": start,
                "to": end,
                "type": leg_type,
                "distance_miles": round(distance_miles, 2),
                "estimated_drive_hours": round(duration_hours, 2),
            }
        )

    return legs


def fetch_json(url):
    headers = {
        "Accept": "application/json",
        "User-Agent": "truck-hos-planner-assessment/1.0",
    }
    request = Request(url, headers=headers)

    try:
        with urlopen(request, timeout=HTTP_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise RouteServiceError(f"Route API returned HTTP {exc.code}.") from exc
    except URLError as exc:
        raise RouteServiceError(f"Could not reach route API: {exc.reason}") from exc
    except TimeoutError as exc:
        raise RouteServiceError("Route API request timed out.") from exc
