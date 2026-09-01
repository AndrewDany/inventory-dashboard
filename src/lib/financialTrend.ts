import type { MonthlyFinancial } from '../hooks/useMonthlyFinancials'

/**
 * Percent change of `current` vs `previous`. Returns null when there's no
 * meaningful baseline to compare against (missing previous month, or a
 * previous value of 0 where a percentage would be undefined/infinite).
 */
export function monthOverMonthDelta(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

/** Last N values (ascending, oldest first) for a numeric field, for sparklines. */
export function sparklineFor(
  monthly: MonthlyFinancial[],
  field: keyof MonthlyFinancial,
  count = 6
): number[] {
  return monthly.slice(-count).map((m) => Number(m[field]))
}

/** The row immediately before `monthKey` in an ascending-sorted monthly array. */
export function previousMonthRow(monthly: MonthlyFinancial[], monthKey: string): MonthlyFinancial | undefined {
  const index = monthly.findIndex((m) => m.month === monthKey)
  return index > 0 ? monthly[index - 1] : undefined
}