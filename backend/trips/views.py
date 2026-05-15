from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import TripPlanRequestSerializer
from .services.hos_calculator import build_hos_plan
from .services.route_service import RouteServiceError, calculate_route


@api_view(["POST"])
def plan_trip(request):
    serializer = TripPlanRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        route_summary = calculate_route(
            current_location=data["current_location"],
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
        )
    except RouteServiceError as exc:
        error = {
            "detail": exc.message,
            "code": exc.code,
        }
        if exc.field:
            error["field"] = exc.field
        return Response(error, status=status.HTTP_400_BAD_REQUEST)

    hos_plan = build_hos_plan(
        route=route_summary,
        current_cycle_used=data["current_cycle_used"],
    )

    return Response(
        {
            "route_summary": route_summary,
            "trip_summary": hos_plan["trip_summary"],
            "event_timeline": hos_plan["event_timeline"],
            "daily_logs": hos_plan["daily_logs"],
        },
        status=status.HTTP_200_OK,
    )
