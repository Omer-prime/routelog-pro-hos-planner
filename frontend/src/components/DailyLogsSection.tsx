import { useState } from 'react'
import type { DailyLog } from '../types'
import { formatHours } from '../utils'
import { DailyLogSheet } from './DailyLogSheet'

type DailyLogsSectionProps = {
  logs: DailyLog[]
}

export function DailyLogsSection({ logs }: DailyLogsSectionProps) {
  const [openDays, setOpenDays] = useState<Set<number>>(() =>
    logs[0] ? new Set([logs[0].day]) : new Set(),
  )

  function toggleDay(day: number) {
    setOpenDays((current) => {
      const next = new Set(current)
      if (next.has(day)) {
        next.delete(day)
      } else {
        next.add(day)
      }
      return next
    })
  }

  return (
    <section className="grid gap-5">
      <style>
        {`
          @page {
            size: Letter landscape;
            margin: 0.25in;
          }

          @media print {
            html,
            body {
              width: 11in;
              height: 8.5in;
              background: white !important;
            }

            body * {
              visibility: hidden;
            }

            .daily-logs-print-area,
            .daily-logs-print-area * {
              visibility: visible;
            }

            .daily-logs-print-area {
              position: absolute;
              inset: 0;
              display: block !important;
              width: 10.5in;
              background: white;
            }

            .daily-log-panel,
            .daily-log-panel[hidden] {
              display: block !important;
              border: 0 !important;
              box-shadow: none !important;
            }

            .daily-log-panel > div[hidden] {
              display: block !important;
            }

            .no-print {
              display: none !important;
            }

            .daily-log-sheet {
              width: 10.5in !important;
              min-height: 7.4in !important;
              max-height: 7.4in !important;
              overflow: hidden !important;
              break-before: page;
              break-after: page;
              break-inside: avoid;
              page-break-before: always;
              page-break-after: always;
              page-break-inside: avoid;
              margin: 0 !important;
              padding: 0.1in !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }

            .daily-log-panel:first-child .daily-log-sheet {
              break-before: auto;
              page-break-before: auto;
            }

            .daily-log-sheet * {
              box-shadow: none !important;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            .log-header {
              display: grid !important;
              grid-template-columns: 1.1fr 1.5fr 1.1fr !important;
              gap: 0.08in !important;
              padding-bottom: 0.06in !important;
            }

            .log-title {
              font-size: 16px !important;
              line-height: 1 !important;
              margin-top: 1px !important;
            }

            .log-eyebrow,
            .paper-field-label {
              font-size: 7px !important;
              line-height: 1.1 !important;
              letter-spacing: 0 !important;
            }

            .paper-field-value {
              min-height: 0.2in !important;
              padding: 1px 2px !important;
              font-size: 9px !important;
              line-height: 1.15 !important;
            }

            .log-grid-section {
              margin-top: 0.07in !important;
              overflow: visible !important;
            }

            .log-grid-inner {
              min-width: 0 !important;
              width: 100% !important;
            }

            .log-axis-cell {
              height: 0.22in !important;
              padding-bottom: 1px !important;
              font-size: 7px !important;
            }

            .log-duty-row,
            .log-hours-row {
              font-size: 8px !important;
              line-height: 1.1 !important;
              padding-left: 4px !important;
              padding-right: 4px !important;
            }

            .log-total-row {
              padding-top: 2px !important;
              padding-bottom: 2px !important;
              font-size: 8px !important;
            }

            .remarks-section {
              margin-top: 0.06in !important;
            }

            .remarks-header {
              padding-bottom: 0.03in !important;
            }

            .remarks-title {
              font-size: 8px !important;
            }

            .remarks-badge,
            .event-badge {
              padding: 1px 3px !important;
              font-size: 6px !important;
              line-height: 1 !important;
            }

            .remarks-row {
              display: grid !important;
              grid-template-columns: 0.9in 1.2in minmax(0,1fr) 0.55in !important;
              gap: 0.04in !important;
              padding-top: 0.025in !important;
              padding-bottom: 0.025in !important;
              font-size: 7px !important;
              line-height: 1.1 !important;
            }
          }
        `}
      </style>

      {/* Section header */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">Printable Driver Logs</h2>
          <p className="mt-1 text-sm text-[#64748B]">24-hour ELD sheets by local day</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#64748B] transition-colors hover:border-[#CBD5E1] hover:text-[#0F172A]"
            type="button"
            onClick={() => setOpenDays(new Set(logs.map((log) => log.day)))}
          >
            Expand All
          </button>
          <button
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#64748B] transition-colors hover:border-[#CBD5E1] hover:text-[#0F172A]"
            type="button"
            onClick={() => setOpenDays(new Set())}
          >
            Collapse All
          </button>
          <button
            className="h-9 rounded-lg bg-[#0F172A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B]"
            type="button"
            onClick={() => window.print()}
          >
            Print Logs
          </button>
        </div>
      </div>

      {/* Log panels */}
      <div className="daily-logs-print-area grid gap-3">
        {logs.map((log) => {
          const isOpen = openDays.has(log.day)

          return (
            <section
              className="daily-log-panel overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)]"
              key={log.day}
            >
              <button
                className="no-print flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-[#F8FAFC]"
                onClick={() => toggleDay(log.day)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-sm font-bold text-[#2563EB]">
                    {log.day}
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-[#0F172A]">
                      Day {log.day} — Driver Log
                    </span>
                    <span className="text-xs font-medium text-[#64748B]">
                      {log.events.length} events · {formatHours(log.totals.driving_hours)} driving ·{' '}
                      {formatHours(log.totals.total_hours)} total
                    </span>
                  </div>
                </div>
                <ChevronIcon isOpen={isOpen} />
              </button>
              <div hidden={!isOpen}>
                <DailyLogSheet log={log} />
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`shrink-0 text-[#64748B] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
