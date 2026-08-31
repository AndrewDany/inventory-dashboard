// src/lib/statusStyles.ts
// ------------------------------------------------------------
// Single source of truth for status → color mapping across the app
// (sales orders, purchase orders, adjustments, returns, etc).
//
// Rationale: statuses across the app tend to fall into the same five
// "families" no matter which table they live in. Mapping every status
// to one of these families keeps color meaning consistent everywhere —
// a red badge always means "cancelled/failed", green always means
// "done", etc. — instead of each table inventing its own palette.

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

// Tailwind classes for each tone. Update colors here and every status
// badge in the app updates together.
const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
}

// Maps every status string used anywhere in the app to a tone.
// Add new statuses here as they're introduced so they stay consistent
// with the rest of the app instead of picking an ad-hoc color.
const statusTone: Record<string, StatusTone> = {
  // Sales & purchase orders
  draft: 'neutral',
  ordered: 'info',
  confirmed: 'info',
  shipped: 'success',
  received: 'success',
  cancelled: 'danger',

  // Generic / shared across returns, adjustments, expenses, etc.
  pending: 'warning',
  approved: 'success',
  completed: 'success',
  processing: 'info',
  rejected: 'danger',
  failed: 'danger',
  refunded: 'danger',
}

/** Returns the Tailwind classes for a given status string (case-insensitive). */
export function getStatusClasses(status: string): string {
  const tone = statusTone[status.toLowerCase()] ?? 'neutral'
  return toneClasses[tone]
}