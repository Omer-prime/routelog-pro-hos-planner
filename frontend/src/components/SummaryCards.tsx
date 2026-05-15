import type { TripPlanResponse } from '../types'
import { formatHours, formatMiles } from '../utils'

type SummaryCardsProps = {
  data: TripPlanResponse
}

type CardDef = {
  label: string
  value: string
  iconBg: string
  iconColor: string
  icon: () => React.ReactElement
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const { route_summary, trip_summary } = data

  const cards: CardDef[] = [
    {
      label: 'Total Miles',
      value: formatMiles(route_summary.total_miles),
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      icon: MilesIcon,
    },
    {
      label: 'Drive Hours',
      value: formatHours(trip_summary.estimated_drive_hours),
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      icon: DriveIcon,
    },
    {
      label: 'Elapsed Hours',
      value: formatHours(trip_summary.total_elapsed_hours),
      iconBg: '#F1F5F9',
      iconColor: '#475569',
      icon: TimerIcon,
    },
    {
      label: 'Fuel Stops',
      value: String(trip_summary.fuel_stops),
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      icon: FuelIcon,
    },
    {
      label: 'Daily Rests',
      value: String(trip_summary.daily_rests),
      iconBg: '#F0FDF4',
      iconColor: '#059669',
      icon: RestIcon,
    },
    {
      label: 'Current Cycle Used',
      value: formatHours(trip_summary.current_cycle_used_hours),
      iconBg: '#F8FAFC',
      iconColor: '#64748B',
      icon: CycleIcon,
    },
    {
      label: 'Trip On-Duty Added',
      value: formatHours(trip_summary.total_on_duty_hours),
      iconBg: '#F0FDF4',
      iconColor: '#059669',
      icon: DutyIcon,
    },
    {
      label: 'Ending Cycle Used',
      value: formatHours(trip_summary.ending_cycle_used_hours),
      iconBg: '#F1F5F9',
      iconColor: '#0F172A',
      icon: CycleIcon,
    },
    {
      label: 'Cycle Remaining',
      value: formatHours(trip_summary.cycle_remaining_hours),
      iconBg: '#F0FDF4',
      iconColor: '#059669',
      icon: CycleIcon,
    },
  ]

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            className="flex min-h-[7rem] flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)]"
            key={card.label}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                {card.label}
              </p>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ background: card.iconBg, color: card.iconColor }}
              >
                <card.icon />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-[#0F172A]">{card.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#64748B]">
        Ending Cycle Used = Current Cycle Used + trip on-duty hours.
      </p>
    </div>
  )
}

function MilesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M1 13L5 5L9 9L12 4L15 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DriveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 5V8.5L10.5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DutyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 4V3C5 2.448 5.448 2 6 2H10C10.552 2 11 2.448 11 3V4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.5 8.5H10.5M5.5 11H9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function TimerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="9" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 6.5V9L9.5 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 2H10M8 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function FuelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 13V4C3 3.448 3.448 3 4 3H9C9.552 3 10 3.448 10 4V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 8H11.5C12.328 8 13 8.672 13 9.5V11C13 11.828 12.328 12.5 11.5 12.5H10"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 13H10M5.5 6.5H7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 11C2 8.238 4.238 6 7 6C9.762 6 12 8.238 12 11H2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 11H14M2 11H0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 4C9 4.552 8.552 5 8 5C7.448 5 7 4.552 7 4C7 3.448 7.448 3 8 3C8.552 3 9 3.448 9 4Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CycleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.5 8C13.5 11.038 11.038 13.5 8 13.5C4.962 13.5 2.5 11.038 2.5 8C2.5 4.962 4.962 2.5 8 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 2.5L11 5.5M8 2.5L11 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
