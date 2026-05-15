import type { DailyLog, DutyStatus, TimelineEvent } from '../types'
import { formatHours } from '../utils'

type DailyLogSheetProps = {
  log: DailyLog
}

type LogRow = {
  status: DutyStatus
  label: string
  total: number
}

const rowHeight = 42
const lineOffset = rowHeight / 2

const statusOrder: DutyStatus[] = [
  'off_duty',
  'sleeper_berth',
  'driving',
  'on_duty_not_driving',
]

const axisLabels = Array.from({ length: 25 }, (_, hour) => {
  if (hour === 0 || hour === 24) return 'Midnight'
  if (hour === 12) return 'Noon'
  return String(hour > 12 ? hour - 12 : hour)
})

export function DailyLogSheet({ log }: DailyLogSheetProps) {
  const rows: LogRow[] = [
    { status: 'off_duty', label: 'Off Duty', total: log.totals.off_duty_hours },
    {
      status: 'sleeper_berth',
      label: 'Sleeper Berth',
      total: log.totals.sleeper_berth_hours,
    },
    { status: 'driving', label: 'Driving', total: log.totals.driving_hours },
    {
      status: 'on_duty_not_driving',
      label: 'On Duty (Not Driving)',
      total: log.totals.on_duty_not_driving_hours,
    },
  ]
  const sortedEvents = [...log.events].sort((a, b) => a.start_hour - b.start_hour)
  const totalMiles = sortedEvents
    .filter((event) => event.status === 'driving')
    .reduce((sum, event) => sum + event.duration_hours * 60, 0)
  const fromLocation = sortedEvents.find((event) => !event.is_generated)?.location ?? ''
  const toLocation =
    [...sortedEvents].reverse().find((event) => !event.is_generated)?.location ?? ''

  return (
    <article className="daily-log-sheet break-inside-avoid bg-white p-4 text-black">
      <header className="log-header grid gap-3 border-b-2 border-black pb-3 lg:grid-cols-[1fr_1.4fr_1.1fr]">
        <div>
          <p className="log-eyebrow text-[11px] font-semibold uppercase tracking-[0.24em]">
            Driver's Daily Log
          </p>
          <h3 className="log-title mt-1 text-2xl font-bold uppercase tracking-wide">
            Day {log.day}
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <PaperField label="Carrier name" value="Carrier Name TBD" />
          <PaperField label="From" value={fromLocation} />
          <PaperField label="To" value={toLocation} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <PaperField label="Total miles driving today" value={`${Math.round(totalMiles)} mi`} />
          <PaperField label="Truck/tractor number" value="Unit TBD" />
          <PaperField label="Total hours" value={formatHours(log.totals.total_hours)} />
        </div>
      </header>

      <section className="log-grid-section mt-4 overflow-x-auto">
        <div className="log-grid-inner min-w-[64rem]">
          <div className="grid grid-cols-[11rem_minmax(0,1fr)_5rem]">
            <div className="border-b border-black" />
            <div className="grid grid-cols-[repeat(25,minmax(0,1fr))] border-b border-black text-[10px] font-semibold">
              {axisLabels.map((label, index) => (
                <div
                  className="log-axis-cell flex h-8 items-end justify-center border-l border-black pb-1 text-center leading-none last:border-r"
                  key={`${label}-${index}`}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="log-axis-cell flex items-end justify-center border-b border-l border-black pb-1 text-[10px] font-bold uppercase">
              Hours
            </div>
          </div>

          <div className="grid grid-cols-[11rem_minmax(0,1fr)_5rem] border-b border-black">
            <div>
              {rows.map((row) => (
                <div
                  className="log-duty-row flex h-[42px] items-center border-b border-black px-3 text-xs font-bold uppercase last:border-b-0"
                  key={row.status}
                >
                  {row.label}
                </div>
              ))}
            </div>

            <div className="relative border-l border-black">
              <GridBackground />
              <DutyLineOverlay events={sortedEvents} />
            </div>

            <div className="border-l border-black">
              {rows.map((row) => (
                <div
                  className="log-hours-row flex h-[42px] items-center justify-center border-b border-black text-sm font-bold last:border-b-0"
                  key={row.status}
                >
                  {formatHours(row.total)}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[11rem_minmax(0,1fr)_5rem] border-b-2 border-black">
            <div className="log-total-row px-3 py-2 text-xs font-bold uppercase">Total</div>
            <div className="border-l border-black" />
            <div className="log-total-row border-l border-black px-2 py-2 text-center text-sm font-bold">
              {formatHours(log.totals.total_hours)}
            </div>
          </div>
        </div>
      </section>

      <section className="remarks-section mt-4">
        <div className="remarks-header flex flex-col gap-2 border-b border-black pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="remarks-title text-sm font-bold uppercase tracking-wide">Remarks</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge label="Generated off-duty time" tone="slate" />
            <Badge label="30-minute break" tone="blue" />
            <Badge label="Pickup" tone="amber" />
            <Badge label="Dropoff" tone="emerald" />
            <Badge label="10-hour rest" tone="violet" />
          </div>
        </div>

        <div className="divide-y divide-slate-300">
          {sortedEvents.map((event, index) => (
            <div className="remarks-row grid gap-2 py-2 text-xs md:grid-cols-[9rem_11rem_1fr_auto]" key={`${event.name}-${index}`}>
              <span className="font-bold">
                {formatClock(event.start_hour)} - {formatClock(event.end_hour)}
              </span>
              <span className="font-medium">{event.location}</span>
              <span className="text-slate-700">{event.remarks}</span>
              <EventBadge event={event} />
            </div>
          ))}
        </div>
      </section>
    </article>
  )
}

type PaperFieldProps = {
  label: string
  value: string
}

function PaperField({ label, value }: PaperFieldProps) {
  return (
    <div>
      <p className="paper-field-label mb-1 text-[10px] font-bold uppercase tracking-wide">
        {label}
      </p>
      <div className="paper-field-value min-h-9 border-b-2 border-black px-1 py-1 text-sm font-semibold">
        {value}
      </div>
    </div>
  )
}

function GridBackground() {
  return (
    <div className="absolute inset-0">
      {statusOrder.map((status, rowIndex) => (
        <div
          className="absolute left-0 right-0 border-b border-black last:border-b-0"
          key={status}
          style={{ height: rowHeight, top: rowIndex * rowHeight }}
        />
      ))}
      {Array.from({ length: 25 }, (_, hour) => (
        <div
          className={`absolute bottom-0 top-0 border-l ${
            hour % 6 === 0 ? 'border-black' : 'border-slate-400'
          } ${hour === 24 ? 'border-r border-r-black' : ''}`}
          key={hour}
          style={{ left: `${(hour / 24) * 100}%` }}
        />
      ))}
      {Array.from({ length: 48 }, (_, halfHour) => (
        <div
          className="absolute bottom-0 top-0 border-l border-slate-200"
          key={halfHour}
          style={{ left: `${((halfHour + 1) / 48) * 100}%` }}
        />
      ))}
    </div>
  )
}

type DutyLineOverlayProps = {
  events: TimelineEvent[]
}

function DutyLineOverlay({ events }: DutyLineOverlayProps) {
  const visibleEvents = events.filter((event) => event.end_hour > event.start_hour)

  return (
    <svg
      className="absolute inset-0 z-10 h-full w-full"
      preserveAspectRatio="none"
      viewBox={`0 0 2400 ${rowHeight * statusOrder.length}`}
    >
      {visibleEvents.map((event, index) => {
        const y = statusY(event.status)
        const x1 = clampHour(event.start_hour) * 100
        const x2 = clampHour(event.end_hour) * 100

        return (
          <line
            key={`duty-${index}`}
            x1={x1}
            x2={x2}
            y1={y}
            y2={y}
            stroke={event.is_generated ? '#64748b' : '#111827'}
            strokeDasharray={event.is_generated ? '12 8' : undefined}
            strokeLinecap="square"
            strokeWidth="6"
          />
        )
      })}

      {visibleEvents.slice(0, -1).map((event, index) => {
        const nextEvent = visibleEvents[index + 1]
        if (!nextEvent || event.status === nextEvent.status) return null

        const x = clampHour(event.end_hour) * 100
        return (
          <line
            key={`connector-${index}`}
            x1={x}
            x2={x}
            y1={statusY(event.status)}
            y2={statusY(nextEvent.status)}
            stroke="#111827"
            strokeLinecap="square"
            strokeWidth="4"
          />
        )
      })}
    </svg>
  )
}

function statusY(status: DutyStatus) {
  return statusOrder.indexOf(status) * rowHeight + lineOffset
}

function clampHour(hour: number) {
  return Math.min(24, Math.max(0, hour))
}

function formatClock(hour: number) {
  const clamped = clampHour(hour)
  if (clamped === 0 || clamped === 24) return 'Midnight'
  if (clamped === 12) return 'Noon'

  const wholeHour = Math.floor(clamped)
  const minutes = Math.round((clamped - wholeHour) * 60)
  const displayHour = wholeHour > 12 ? wholeHour - 12 : wholeHour
  const period = wholeHour >= 12 ? 'PM' : 'AM'

  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
}

type BadgeProps = {
  label: string
  tone: 'slate' | 'blue' | 'amber' | 'emerald' | 'violet'
}

const badgeTones: Record<BadgeProps['tone'], string> = {
  slate: 'border-slate-400 bg-slate-100 text-slate-700',
  blue: 'border-blue-400 bg-blue-50 text-blue-700',
  amber: 'border-amber-400 bg-amber-50 text-amber-800',
  emerald: 'border-emerald-400 bg-emerald-50 text-emerald-700',
  violet: 'border-violet-400 bg-violet-50 text-violet-700',
}

function Badge({ label, tone }: BadgeProps) {
  return (
    <span className={`remarks-badge rounded-sm border px-2 py-1 text-[10px] font-bold uppercase ${badgeTones[tone]}`}>
      {label}
    </span>
  )
}

function EventBadge({ event }: { event: TimelineEvent }) {
  if (event.is_generated) return <Badge label="Generated" tone="slate" />
  if (event.name.includes('30-Minute')) return <Badge label="Break" tone="blue" />
  if (event.name.includes('Pickup')) return <Badge label="Pickup" tone="amber" />
  if (event.name.includes('Dropoff')) return <Badge label="Dropoff" tone="emerald" />
  if (event.name.includes('10-Hour')) return <Badge label="Rest" tone="violet" />
  return null
}
