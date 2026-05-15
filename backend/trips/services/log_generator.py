from math import ceil, floor


def generate_daily_logs(events):
    if not events:
        return []

    max_end_hour = max(event["end_hour"] for event in events)
    total_days = max(1, ceil(max_end_hour / 24))
    daily_events = {day: [] for day in range(1, total_days + 1)}

    for event in events:
        for split_event in _split_event_by_day(event):
            daily_events.setdefault(split_event["day"], []).append(split_event)

    daily_logs = []
    for day in sorted(daily_events):
        day_events = sorted(daily_events[day], key=lambda item: item["start_hour"])
        filled_events = _add_missing_off_duty(day, day_events)
        totals = _calculate_totals(filled_events)

        daily_logs.append(
            {
                "day": day,
                "totals": totals,
                "events": filled_events,
            }
        )

    return daily_logs


def _split_event_by_day(event):
    start = event["start_hour"]
    end = event["end_hour"]
    split_events = []

    while start < end:
        day = floor(start / 24) + 1
        day_start_global = (day - 1) * 24
        day_end_global = day * 24
        chunk_end = min(end, day_end_global)
        local_start = start - day_start_global
        local_end = chunk_end - day_start_global

        split_event = {
            **event,
            "day": day,
            "start_hour": round(local_start, 2),
            "end_hour": round(local_end, 2),
            "global_start_hour": round(start, 2),
            "global_end_hour": round(chunk_end, 2),
            "duration_hours": round(chunk_end - start, 2),
            "source_sequence": event["sequence"],
        }
        split_events.append(split_event)
        start = chunk_end

    return split_events


def _add_missing_off_duty(day, events):
    filled_events = []
    cursor = 0

    for event in events:
        if event["start_hour"] > cursor:
            filled_events.append(_missing_off_duty_event(day, cursor, event["start_hour"]))

        filled_events.append(event)
        cursor = max(cursor, event["end_hour"])

    if cursor < 24:
        filled_events.append(_missing_off_duty_event(day, cursor, 24))

    return sorted(filled_events, key=lambda item: item["start_hour"])


def _missing_off_duty_event(day, start_hour, end_hour):
    global_start = ((day - 1) * 24) + start_hour
    global_end = ((day - 1) * 24) + end_hour

    return {
        "sequence": None,
        "day": day,
        "name": "Off Duty",
        "status": "off_duty",
        "location": "Not driving",
        "start_hour": round(start_hour, 2),
        "end_hour": round(end_hour, 2),
        "global_start_hour": round(global_start, 2),
        "global_end_hour": round(global_end, 2),
        "duration_hours": round(end_hour - start_hour, 2),
        "miles": 0,
        "remarks": "Automatically added to complete 24-hour daily log",
        "is_generated": True,
    }


def _calculate_totals(events):
    totals = {
        "off_duty_hours": 0,
        "sleeper_berth_hours": 0,
        "driving_hours": 0,
        "on_duty_not_driving_hours": 0,
    }

    for event in events:
        status = event["status"]
        duration = event["duration_hours"]

        if status == "driving":
            totals["driving_hours"] += duration
        elif status == "on_duty_not_driving":
            totals["on_duty_not_driving_hours"] += duration
        elif status == "sleeper_berth":
            totals["sleeper_berth_hours"] += duration
        else:
            totals["off_duty_hours"] += duration

    rounded_totals = {key: round(value, 2) for key, value in totals.items()}
    rounded_totals["total_hours"] = 24
    return rounded_totals
