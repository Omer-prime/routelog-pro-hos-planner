import type { ComplianceWarning, TripPlanResponse } from '../types'

type HosComplianceSummaryProps = {
  data: TripPlanResponse
}

const appliedRules = [
  '11-hour driving limit applied',
  '14-hour driving window considered',
  '30-minute break after 8 driving hours',
  '10-hour off-duty rest added when required',
  '70-hour / 8-day cycle used',
  'Fuel stop rule: every 1,000 miles',
  'Pickup time: 1 hour',
  'Dropoff time: 1 hour',
]

export function HosComplianceSummary({ data }: HosComplianceSummaryProps) {
  const warnings = collectWarnings(data)

  return (
    <section
      className={`rounded-2xl border bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)] ${
        warnings.length ? 'border-amber-300' : 'border-[#E2E8F0]'
      }`}
    >
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Compliance Logic</h2>
          <p className="mt-0.5 text-sm text-[#64748B]">
            Property-carrying driver rules applied to this trip.
          </p>
        </div>
        {warnings.length > 0 && (
          <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 sm:mt-0">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Review needed
          </span>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="mb-5 grid gap-2">
          {warnings.map((warning) => (
            <div
              className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
              key={`${warning.type ?? 'warning'}-${warning.message}`}
            >
              <span className="mt-0.5 shrink-0 text-sm text-amber-500">⚠</span>
              <p className="text-sm font-medium text-amber-900">{warning.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {appliedRules.map((rule) => (
          <div
            className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3"
            key={rule}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[10px] font-bold text-[#059669]">
              ✓
            </span>
            <span className="text-sm font-medium leading-5 text-[#0F172A]">{rule}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function collectWarnings(data: TripPlanResponse): ComplianceWarning[] {
  const warnings = [...(data.warnings ?? [])]

  if (data.trip_summary.cycle_issue) {
    warnings.push({ type: 'cycle', message: data.trip_summary.cycle_issue })
  }

  if (data.route_summary.route_issue) {
    warnings.push({ type: 'route', message: data.route_summary.route_issue })
  }

  return warnings
}
