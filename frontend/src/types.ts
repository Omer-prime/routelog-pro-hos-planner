export type TripFormValues = {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used: number
}

export type RouteLeg = {
  from: string
  to: string
  type: string
  distance_miles: number
  estimated_drive_hours: number
}

export type RouteCoordinate = {
  lat: number
  lng: number
  display_name?: string
}

export type RouteSummary = {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_coordinates: RouteCoordinate
  pickup_coordinates: RouteCoordinate
  dropoff_coordinates: RouteCoordinate
  total_miles: number
  average_speed_mph: number
  estimated_drive_hours: number
  coordinate_count: number
  route_coordinates: RouteCoordinate[]
  legs: RouteLeg[]
  route_issue?: string
}

export type TripSummary = {
  total_distance_miles: number
  estimated_drive_hours: number
  total_on_duty_hours: number
  total_off_duty_hours: number
  total_elapsed_hours: number
  current_cycle_used_hours: number
  ending_cycle_used_hours: number
  cycle_remaining_hours: number
  fuel_stops: number
  daily_rests: number
  cycle_resets: number
  cycle_issue?: string
}

export type ComplianceWarning = {
  type?: 'cycle' | 'route' | string
  message: string
}

export type DutyStatus =
  | 'off_duty'
  | 'sleeper_berth'
  | 'driving'
  | 'on_duty_not_driving'

export type TimelineEvent = {
  sequence: number | null
  day: number
  name: string
  status: DutyStatus
  location: string
  start_hour: number
  end_hour: number
  global_start_hour?: number
  global_end_hour?: number
  duration_hours: number
  miles: number
  remarks: string
  coordinate?: RouteCoordinate
  source_sequence?: number
  is_generated?: boolean
}

export type DailyLogTotals = {
  off_duty_hours: number
  sleeper_berth_hours: number
  driving_hours: number
  on_duty_not_driving_hours: number
  total_hours: number
}

export type DailyLog = {
  day: number
  totals: DailyLogTotals
  events: TimelineEvent[]
}

export type TripPlanResponse = {
  route_summary: RouteSummary
  trip_summary: TripSummary
  event_timeline: TimelineEvent[]
  daily_logs: DailyLog[]
  warnings?: ComplianceWarning[]
}
