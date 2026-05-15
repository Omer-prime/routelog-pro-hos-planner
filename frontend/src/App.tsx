import { useState } from 'react'
import { ApiError, planTrip } from './api'
import { DailyLogsSection } from './components/DailyLogsSection'
import { HosComplianceSummary } from './components/HosComplianceSummary'
import { RouteMap } from './components/RouteMap'
import { SummaryCards } from './components/SummaryCards'
import { TripForm } from './components/TripForm'
import { TripTimeline } from './components/TripTimeline'
import type { TripFormValues, TripPlanResponse } from './types'

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function App() {
  const [tripPlan, setTripPlan] = useState<TripPlanResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: TripFormValues) {
    setIsLoading(true)
    setError(null)
    try {
      const response = await planTrip(values)
      setTripPlan(response)
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message)
      } else {
        setError('Something went wrong while planning the trip.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Navbar />
      <HeroSection />

      <main className="mx-auto w-full max-w-[90rem] px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        {/* Planner form */}
        <section
          id="planner"
          className="scroll-mt-20 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-8"
        >
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <PlannerIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">
                Create a Trip Plan
              </h2>
              <p className="mt-0.5 text-sm text-[#64748B]">
                Enter route details and cycle hours to generate a compliant plan.
              </p>
            </div>
          </div>
          <TripForm isLoading={isLoading} onSubmit={handleSubmit} />
          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                !
              </span>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}
        </section>

        {/* Results / loading / empty */}
        <div className="mt-8 grid gap-8">
          {isLoading ? (
            <LoadingSkeleton />
          ) : tripPlan ? (
            <TripResults tripPlan={tripPlan} />
          ) : (
            <EmptyDashboard />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

/* ─── Navbar ──────────────────────────────────────────────────────────────── */

function Navbar() {
  const navItems = [
    { label: 'Planner', id: 'planner' },
    { label: 'Compliance', id: 'compliance' },
    { label: 'Logs', id: 'logs' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[90rem] items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          onClick={() => scrollToSection('planner')}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white">
            <TruckIcon size={15} />
          </div>
          <span className="text-[15px] font-bold text-[#0F172A]">RouteLog Pro</span>
        </button>

        {/* Nav links */}
        <div className="hidden items-center gap-7 md:flex">
          {navItems.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#0F172A]"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => scrollToSection('planner')}
          className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B]"
        >
          Start Planning
        </button>
      </div>
    </nav>
  )
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="border-b border-[#E2E8F0] bg-white">
      <div className="mx-auto max-w-[90rem] px-4 py-14 sm:px-6 lg:px-8 xl:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_460px] xl:grid-cols-[minmax(0,1fr)_500px]">

          {/* Left: copy */}
          <div>
            {/* Eyebrow — thin line + label */}
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#2563EB]" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#2563EB]">
                HOS Trip Planner
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-[#0F172A] sm:text-5xl">
              Plan compliant truck routes and generate driver logs in minutes.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-[#64748B]">
              Build HOS-ready trip plans with live routes, duty-status timelines, rest stops, fuel
              stops, and printable 24-hour driver logs.
            </p>

            {/* CTA row */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => scrollToSection('planner')}
                className="rounded-lg bg-[#2563EB] px-6 py-3 text-sm font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-colors hover:bg-[#1D4ED8]"
              >
                Generate Trip Plan
              </button>
              <button
                onClick={() => scrollToSection('planner')}
                className="rounded-lg border border-[#E2E8F0] bg-white px-6 py-3 text-sm font-bold text-[#0F172A] transition-colors hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
              >
                View Sample Route
              </button>
            </div>

            {/* Trust row — text separators, no icon badges */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#64748B]">
              <span>FMCSA-compliant HOS rules</span>
              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
              <span>70-hour / 8-day cycle</span>
              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
              <span>Printable 24-hour logs</span>
            </div>
          </div>

          {/* Right: static route plan preview */}
          <div className="hidden lg:block">
            <RoutePlanPreview />
          </div>

        </div>
      </div>
    </section>
  )
}

function RoutePlanPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.10)]">
      {/* Top accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#2563EB] to-[#059669]" />

      <div className="p-6">
        {/* Card header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EFF6FF] text-[#2563EB]">
              <TruckIcon size={14} />
            </div>
            <span className="text-sm font-bold text-[#0F172A]">Trip Plan Preview</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-[#059669]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
            HOS Compliant
          </span>
        </div>

        {/* Route stops */}
        <div className="mb-5 rounded-xl bg-[#F8FAFC] p-4">
          <PreviewStop dot="bg-[#0F172A]" city="Dallas, TX" label="Start" />
          <div className="ml-[7px] my-1 h-4 w-px border-l-2 border-dashed border-[#CBD5E1]" />
          <PreviewStop dot="bg-[#D97706]" city="Austin, TX" label="Pickup" />
          <div className="ml-[7px] my-1 h-4 w-px border-l-2 border-dashed border-[#CBD5E1]" />
          <PreviewStop dot="bg-[#059669]" city="Atlanta, GA" label="Dropoff" />
        </div>

        {/* HOS rule checks */}
        <div className="mb-5 grid gap-2">
          {[
            '11-hour driving limit applied',
            '30-minute break enforced',
            '10-hour rest period included',
            'Fuel stop at ~1,000 miles',
          ].map((rule) => (
            <div key={rule} className="flex items-center gap-2.5 text-sm text-[#0F172A]">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[9px] font-bold text-[#059669]">
                ✓
              </span>
              {rule}
            </div>
          ))}
        </div>

        {/* Metric chips */}
        <div className="grid grid-cols-3 divide-x divide-[#E2E8F0] rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
          <PreviewMetric label="Distance" value="1,247 mi" />
          <PreviewMetric label="Drive Time" value="19.2h" />
          <PreviewMetric label="Total Days" value="2 days" />
        </div>
      </div>
    </div>
  )
}

function PreviewStop({ dot, city, label }: { dot: string; city: string; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className={`h-3 w-3 shrink-0 rounded-full ${dot}`} />
        <span className="text-sm font-semibold text-[#0F172A]">{city}</span>
      </div>
      <span className="text-xs font-medium text-[#64748B]">{label}</span>
    </div>
  )
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 text-center">
      <p className="text-sm font-bold text-[#0F172A]">{value}</p>
      <p className="mt-0.5 text-xs text-[#64748B]">{label}</p>
    </div>
  )
}

/* ─── Section title ───────────────────────────────────────────────────────── */

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">{title}</h2>
    </div>
  )
}

/* ─── Trip results ────────────────────────────────────────────────────────── */

function TripResults({ tripPlan }: { tripPlan: TripPlanResponse }) {
  return (
    <>
      <section>
        <SectionTitle title="Trip Overview" />
        <SummaryCards data={tripPlan} />
      </section>

      <section id="compliance" className="scroll-mt-20">
        <HosComplianceSummary data={tripPlan} />
      </section>

      <section id="timeline" className="scroll-mt-20">
        <SectionTitle title="Route & Duty Timeline" />
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(24rem,0.95fr)_minmax(0,1.05fr)]">
          <RouteMap route={tripPlan.route_summary} events={tripPlan.event_timeline} />
          <TripTimeline events={tripPlan.event_timeline} />
        </div>
      </section>

      <section id="logs" className="scroll-mt-20">
        <DailyLogsSection
          key={`${tripPlan.route_summary.current_location}-${tripPlan.route_summary.pickup_location}-${tripPlan.route_summary.dropoff_location}`}
          logs={tripPlan.daily_logs}
        />
      </section>
    </>
  )
}

/* ─── Empty dashboard ─────────────────────────────────────────────────────── */

function EmptyDashboard() {
  return (
    <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-8 sm:p-12">
      <div className="mx-auto max-w-sm text-center">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
          <EmptyRouteIcon />
        </div>
        <h3 className="text-base font-bold text-[#0F172A]">Your route plan will appear here</h3>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          Fill in the form above and click{' '}
          <span className="font-semibold text-[#0F172A]">Generate Trip Plan</span> to see metrics,
          timeline, compliance rules, and printable driver logs.
        </p>
      </div>

      {/* Skeleton preview */}
      <div className="mx-auto mt-10 max-w-4xl grid gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-[#F1F5F9]" />
          ))}
        </div>
        <div className="h-28 rounded-xl bg-[#F1F5F9]" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-52 rounded-xl bg-[#F1F5F9]" />
          <div className="h-52 rounded-xl bg-[#F1F5F9]" />
        </div>
      </div>
    </div>
  )
}

/* ─── Loading skeleton ────────────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="grid gap-8">
      <div>
        <div className="mb-5 h-6 w-32 animate-pulse rounded-md bg-[#E2E8F0]" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#E2E8F0]" />
          ))}
        </div>
      </div>
      <div className="h-44 animate-pulse rounded-2xl bg-[#E2E8F0]" />
      <div>
        <div className="mb-5 h-6 w-48 animate-pulse rounded-md bg-[#E2E8F0]" />
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-[26rem] animate-pulse rounded-2xl bg-[#E2E8F0]" />
          <div className="h-[26rem] animate-pulse rounded-2xl bg-[#E2E8F0]" />
        </div>
      </div>
    </div>
  )
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */

function Footer() {
  const year = new Date().getFullYear()

  const navItems = [
    { label: 'Planner', id: 'planner' },
    { label: 'Compliance', id: 'compliance' },
    { label: 'Logs', id: 'logs' },
  ]

  return (
    <footer className="border-t border-[#E2E8F0] bg-white">
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB] text-white">
                <TruckIcon size={13} />
              </div>
              <span className="text-sm font-bold text-[#0F172A]">RouteLog Pro</span>
            </div>
            <p className="mt-2.5 max-w-[260px] text-sm leading-6 text-[#64748B]">
              Plan compliant truck routes and generate printable HOS logs.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Navigation
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {navItems.map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="text-left text-sm text-[#64748B] transition-colors hover:text-[#0F172A]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#F1F5F9] pt-6">
          <p className="text-xs text-[#94A3B8]">© {year} RouteLog Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

/* ─── Icons ───────────────────────────────────────────────────────────────── */

function TruckIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M1 3H15V16H1V3Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path
        d="M15 8H19L22 11V16H15V8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="18.5" r="2" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="18.5" cy="18.5" r="2" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function PlannerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 7H12M6 10H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function EmptyRouteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="19" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 8C5 11 10 11 10 14C10 16.5 14 17 17 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default App
