import type { DutyStatus } from './types'

export const statusLabels: Record<DutyStatus, string> = {
  off_duty: 'Off Duty',
  sleeper_berth: 'Sleeper Berth',
  driving: 'Driving',
  on_duty_not_driving: 'On Duty Not Driving',
}

export const statusStyles: Record<DutyStatus, string> = {
  off_duty: 'bg-slate-400',
  sleeper_berth: 'bg-violet-500',
  driving: 'bg-emerald-500',
  on_duty_not_driving: 'bg-amber-500',
}

export const statusTextStyles: Record<DutyStatus, string> = {
  off_duty: 'text-slate-600',
  sleeper_berth: 'text-violet-700',
  driving: 'text-emerald-700',
  on_duty_not_driving: 'text-amber-700',
}

export function formatHours(value: number) {
  return `${Number(value).toFixed(2).replace(/\.00$/, '')}h`
}

export function formatMiles(value: number) {
  return `${Math.round(value).toLocaleString()} mi`
}
