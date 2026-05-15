import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import type { RouteCoordinate, RouteSummary, TimelineEvent } from '../types'
import { formatHours, formatMiles, statusLabels } from '../utils'

type RouteMapProps = {
  route?: RouteSummary
  events?: TimelineEvent[]
}

const fallbackCenter: LatLngExpression = [39.8283, -98.5795]
const stopEventNames = new Set(['30-Minute Break', '10-Hour Rest', 'Fuel Stop'])

export function RouteMap({ route, events = [] }: RouteMapProps) {
  const routePositions = route?.route_coordinates.map(toLatLng) ?? []
  const eventStops = route ? buildEventStops(route, events) : []
  const stops = route
    ? [
        {
          label: 'Current location',
          name: route.current_location,
          coordinate: route.current_coordinates,
          color: '#0F172A',
        },
        {
          label: 'Pickup',
          name: route.pickup_location,
          coordinate: route.pickup_coordinates,
          color: '#D97706',
        },
        {
          label: 'Dropoff',
          name: route.dropoff_location,
          coordinate: route.dropoff_coordinates,
          color: '#059669',
        },
      ]
    : []

  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.06)] xl:sticky xl:top-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Route Overview</h2>
          <p className="text-sm text-[#64748B]">Geocoded route with stop markers</p>
        </div>
        {route && (
          <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#64748B] sm:mt-0">
            {formatMiles(route.total_miles)} total
          </span>
        )}
      </div>

      <div className="h-[22rem] overflow-hidden rounded-xl border border-[#E2E8F0]">
        <MapContainer
          center={routePositions[0] ?? fallbackCenter}
          className="h-full w-full"
          zoom={routePositions.length ? 6 : 4}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {routePositions.length > 0 && (
            <>
              <FitBounds positions={routePositions} />
              <Polyline
                pathOptions={{ color: '#2563EB', opacity: 0.85, weight: 4 }}
                positions={routePositions}
              />
            </>
          )}
          {stops.map((stop, index) => (
            <Marker
              icon={stopIcon(String(index + 1), stop.color, 'lg')}
              key={stop.label}
              position={toLatLng(stop.coordinate)}
            >
              <Popup>
                <strong>{stop.label}</strong>
                <br />
                {stop.name}
              </Popup>
            </Marker>
          ))}
          {eventStops.map((stop) => (
            <Marker
              icon={stopIcon(stop.iconLabel, stop.color, 'sm')}
              key={`${stop.event.sequence}-${stop.event.name}-${stop.distanceMiles}`}
              position={toLatLng(stop.coordinate)}
            >
              <Popup>
                <div className="grid gap-1 text-sm text-slate-700">
                  <strong className="text-slate-950">{stop.event.name}</strong>
                  <span>{statusLabels[stop.event.status]}</span>
                  <span>
                    {formatHours(stop.event.start_hour)} – {formatHours(stop.event.end_hour)}
                  </span>
                  <span>{stop.event.location}</span>
                  <span className="text-slate-500">{stop.event.remarks}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {route ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {route.legs.map((leg) => (
            <div
              className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5"
              key={leg.type}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#2563EB]" />
                <p className="truncate text-sm font-semibold text-[#0F172A]">
                  {leg.from} → {leg.to}
                </p>
              </div>
              <div className="mt-1.5 flex gap-3 text-xs text-[#64748B]">
                <span>{formatMiles(leg.distance_miles)}</span>
                <span>·</span>
                <span>{formatHours(leg.estimated_drive_hours)} drive</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center text-sm text-[#64748B]">
          Submit a trip to draw the route and stop markers.
        </div>
      )}
    </section>
  )
}

type FitBoundsProps = {
  positions: LatLngExpression[]
}

function FitBounds({ positions }: FitBoundsProps) {
  const map = useMap()

  useEffect(() => {
    if (positions.length) {
      map.fitBounds(L.latLngBounds(positions), { padding: [28, 28] })
    }
  }, [map, positions])

  return null
}

function toLatLng(coordinate: RouteCoordinate): LatLngExpression {
  return [coordinate.lat, coordinate.lng]
}

type EventStop = {
  event: TimelineEvent
  coordinate: RouteCoordinate
  distanceMiles: number
  color: string
  iconLabel: string
}

function buildEventStops(route: RouteSummary, events: TimelineEvent[]): EventStop[] {
  let drivenMiles = 0

  return events.flatMap((event) => {
    const stopDistanceMiles = drivenMiles

    if (event.status === 'driving') {
      drivenMiles += event.miles
    }

    if (!stopEventNames.has(event.name)) {
      return []
    }

    return [
      {
        event,
        coordinate: event.coordinate ?? interpolateRouteCoordinate(route, stopDistanceMiles),
        distanceMiles: stopDistanceMiles,
        ...eventMarkerStyle(event.name),
      },
    ]
  })
}

function interpolateRouteCoordinate(route: RouteSummary, distanceMiles: number): RouteCoordinate {
  const coordinates = route.route_coordinates

  if (coordinates.length === 0) {
    return route.current_coordinates
  }

  if (coordinates.length === 1 || route.total_miles <= 0) {
    return coordinates[0]
  }

  const segments = coordinates.slice(1).map((coordinate, index) => {
    const start = coordinates[index]
    return {
      start,
      end: coordinate,
      miles: distanceBetween(start, coordinate),
    }
  })
  const lineMiles = segments.reduce((total, segment) => total + segment.miles, 0)
  const targetMiles = Math.min(
    Math.max((distanceMiles / route.total_miles) * lineMiles, 0),
    lineMiles,
  )

  let traveledMiles = 0
  for (const segment of segments) {
    const nextMiles = traveledMiles + segment.miles
    if (targetMiles <= nextMiles) {
      const ratio = segment.miles === 0 ? 0 : (targetMiles - traveledMiles) / segment.miles
      return {
        lat: segment.start.lat + (segment.end.lat - segment.start.lat) * ratio,
        lng: segment.start.lng + (segment.end.lng - segment.start.lng) * ratio,
      }
    }
    traveledMiles = nextMiles
  }

  return coordinates[coordinates.length - 1]
}

function distanceBetween(start: RouteCoordinate, end: RouteCoordinate) {
  const earthRadiusMiles = 3958.8
  const startLat = toRadians(start.lat)
  const endLat = toRadians(end.lat)
  const latDelta = toRadians(end.lat - start.lat)
  const lngDelta = toRadians(end.lng - start.lng)
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2

  return 2 * earthRadiusMiles * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function eventMarkerStyle(name: string) {
  if (name === 'Fuel Stop') {
    return { color: '#7C3AED', iconLabel: 'F' }
  }

  if (name === '10-Hour Rest') {
    return { color: '#64748B', iconLabel: '10' }
  }

  return { color: '#0891B2', iconLabel: '30' }
}

function stopIcon(label: string, color: string, size: 'sm' | 'lg') {
  const pixels = size === 'lg' ? 32 : 26
  const border = size === 'lg' ? 3 : 2
  const fontSize = size === 'lg' ? 13 : 11

  return L.divIcon({
    className: '',
    html: `<div style="display:flex;height:${pixels}px;width:${pixels}px;align-items:center;justify-content:center;border-radius:9999px;border:${border}px solid white;background:${color};color:white;font:700 ${fontSize}px system-ui;box-shadow:0 6px 16px rgba(15,23,42,.22)">${label}</div>`,
    iconAnchor: [pixels / 2, pixels / 2],
    popupAnchor: [0, -pixels / 2],
  })
}
