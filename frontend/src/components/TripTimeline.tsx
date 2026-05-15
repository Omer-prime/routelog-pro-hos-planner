import type { TimelineEvent } from '../types'
import { formatHours, statusLabels } from '../utils'

type TripTimelineProps = {
  events: TimelineEvent[]
}

const statusBadgeStyles: Record<string, string> = {
  driving: 'border-blue-200 bg-blue-50 text-blue-700',
  off_duty: 'border-slate-200 bg-slate-100 text-slate-600',
  sleeper_berth: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  on_duty_not_driving: 'border-amber-200 bg-amber-50 text-amber-700',
}

const eventDotStyles: Record<string, string> = {
  Drive: 'bg-[#2563EB]',
  '30-Minute Break': 'bg-[#0891B2]',
  '10-Hour Rest': 'bg-[#64748B]',
  'Fuel Stop': 'bg-[#7C3AED]',
  Pickup: 'bg-[#D97706]',
  Dropoff: 'bg-[#059669]',
}

export function TripTimeline({ events }: TripTimelineProps) {
  const groupedEvents = groupEventsByDay(events)

  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Event Timeline</h2>
          <p className="text-sm text-[#64748B]">Grouped by duty day with elapsed trip hours</p>
        </div>
        <span className="mt-1 inline-flex shrink-0 items-center rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold text-[#64748B] sm:mt-0">
          {events.length} events
        </span>
      </div>

      <div className="max-h-[650px] overflow-y-auto pr-1">
        <div className="grid gap-5">
          {groupedEvents.map(([day, dayEvents]) => (
            <section className="grid gap-2.5" key={day}>
              {/* Day header */}
              <div className="sticky top-0 z-20 flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white/95 px-4 py-2.5 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white">
                    {day}
                  </span>
                  <h3 className="text-sm font-bold text-[#0F172A]">Day {day}</h3>
                </div>
                <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-semibold text-[#64748B]">
                  {dayEvents.length} events
                </span>
              </div>

              {/* Timeline items */}
              <div className="relative grid gap-2.5 before:absolute before:left-3 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-[#E2E8F0]">
                {dayEvents.map((event) => (
                  <TimelineCard event={event} key={event.sequence} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}

function TimelineCard({ event }: { event: TimelineEvent }) {
  const dotStyle = eventDotStyles[event.name] ?? eventDotStyles.Drive

  return (
    <article className="relative grid grid-cols-[1.75rem_1fr] gap-3">
      <span
        className={`relative z-10 mt-3 h-6 w-6 rounded-full border-4 border-white shadow-sm ${dotStyle}`}
      />
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-[#0F172A]">{event.name}</p>
            <p className="mt-0.5 text-xs text-[#64748B]">{event.location}</p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-sm font-bold text-[#0F172A]">
              {formatHours(event.start_hour)} – {formatHours(event.end_hour)}
            </p>
            <span
              className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                statusBadgeStyles[event.status] ?? 'border-slate-200 bg-slate-100 text-slate-600'
              }`}
            >
              {statusLabels[event.status]}
            </span>
          </div>
        </div>
        {event.remarks && (
          <p className="mt-2 text-xs leading-5 text-[#64748B]">{event.remarks}</p>
        )}
      </div>
    </article>
  )
}

function groupEventsByDay(events: TimelineEvent[]) {
  const groups = new Map<number, TimelineEvent[]>()

  for (const event of events) {
    groups.set(event.day, [...(groups.get(event.day) ?? []), event])
  }

  return [...groups.entries()].sort(([left], [right]) => left - right)
}
