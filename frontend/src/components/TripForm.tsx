import { useState } from 'react'
import type { TripFormValues } from '../types'

type TripFormProps = {
  isLoading: boolean
  onSubmit: (values: TripFormValues) => void
}

const initialValues: TripFormValues = {
  current_location: 'Dallas, TX',
  pickup_location: 'Austin, TX',
  dropoff_location: 'Atlanta, GA',
  current_cycle_used: 10,
}

const demoRoutes = [
  {
    label: 'Short Trip',
    description: 'Dallas → Austin → Houston',
    current_location: 'Dallas, TX',
    pickup_location: 'Austin, TX',
    dropoff_location: 'Houston, TX',
  },
  {
    label: 'Medium Trip',
    description: 'Dallas → Austin → Atlanta',
    current_location: 'Dallas, TX',
    pickup_location: 'Austin, TX',
    dropoff_location: 'Atlanta, GA',
  },
  {
    label: 'Long Trip',
    description: 'LA → Phoenix → Miami',
    current_location: 'Los Angeles, CA',
    pickup_location: 'Phoenix, AZ',
    dropoff_location: 'Miami, FL',
  },
  {
    label: 'Fuel Test',
    description: 'Seattle → Portland → Dallas',
    current_location: 'Seattle, WA',
    pickup_location: 'Portland, OR',
    dropoff_location: 'Dallas, TX',
  },
]

export function TripForm({ isLoading, onSubmit }: TripFormProps) {
  const [values, setValues] = useState<TripFormValues>(initialValues)

  function updateField(field: keyof TripFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: field === 'current_cycle_used' ? Number(value) : value,
    }))
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(values)
      }}
    >
      {/* Demo route pills */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#64748B]">
          Quick demo routes
        </p>
        <div className="flex flex-wrap gap-2">
          {demoRoutes.map((route) => (
            <button
              className="group flex items-center gap-2.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-left shadow-[0_1px_4px_rgba(15,23,42,0.05)] transition-colors hover:border-[#BFDBFE] hover:bg-[#EFF6FF] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              key={route.label}
              onClick={() =>
                setValues((current) => ({
                  ...current,
                  current_location: route.current_location,
                  pickup_location: route.pickup_location,
                  dropoff_location: route.dropoff_location,
                }))
              }
              type="button"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F0F9FF] text-[#2563EB] group-hover:bg-[#DBEAFE]">
                <RouteSmallIcon />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#0F172A]">{route.label}</span>
                <span className="block text-xs text-[#64748B]">{route.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Input fields */}
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Current Location"
          iconLabel="A"
          placeholder="e.g. Dallas, TX"
          value={values.current_location}
          onChange={(value) => updateField('current_location', value)}
        />
        <Field
          label="Pickup Location"
          iconLabel="P"
          placeholder="e.g. Austin, TX"
          value={values.pickup_location}
          onChange={(value) => updateField('pickup_location', value)}
        />
        <Field
          label="Dropoff Location"
          iconLabel="D"
          placeholder="e.g. Atlanta, GA"
          value={values.dropoff_location}
          onChange={(value) => updateField('dropoff_location', value)}
        />
        <Field
          label="Current 70-hour Cycle Used"
          iconLabel="H"
          placeholder="0–70 hours"
          helperText="Hours already used before this trip starts."
          type="number"
          min="0"
          max="70"
          step="0.25"
          value={String(values.current_cycle_used)}
          onChange={(value) => updateField('current_cycle_used', value)}
        />
      </div>

      {/* Submit */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-5">
        <button
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-8 text-sm font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#94A3B8] disabled:shadow-none sm:w-fit"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Planning trip...
            </>
          ) : (
            <>
              <ArrowRightIcon />
              Generate Trip Plan
            </>
          )}
        </button>
        <p className="text-xs text-[#64748B]">
          Use US city/state format for best routing accuracy.
        </p>
      </div>
    </form>
  )
}

type FieldProps = {
  label: string
  iconLabel: string
  placeholder?: string
  helperText?: string
  value: string
  onChange: (value: string) => void
  type?: string
  min?: string
  max?: string
  step?: string
}

function Field({
  label,
  iconLabel,
  placeholder,
  helperText,
  value,
  onChange,
  type = 'text',
  min,
  max,
  step,
}: FieldProps) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-[#0F172A]">{label}</span>
      <div className="flex h-11 items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 transition focus-within:border-[#2563EB] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#BFDBFE]/70">
        <span className="mr-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#2563EB] text-[10px] font-bold text-white">
          {iconLabel}
        </span>
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
          type={type}
          min={min}
          max={max}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          required
        />
      </div>
      {helperText && (
        <span className="text-xs text-[#64748B]">{helperText}</span>
      )}
    </label>
  )
}

function RouteSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="3" cy="3" r="1.25" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="11" cy="11" r="1.25" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M3 4.5C3 7 6.5 7 6.5 9.5C6.5 10.5 8 11 9.75 10.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 8H13M9 4L13 8L9 12"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
