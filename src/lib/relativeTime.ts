const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 30],
  ['week', 1000 * 60 * 60 * 24 * 7],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
]

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export function parseUtcTimestamp(dateStr: string): Date {
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T')
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
  return new Date(hasTimezone ? normalized : `${normalized}Z`)
}

/** "3h ago", "2 days ago", etc. Falls back to "just now" for anything under a minute. */
export function relativeTime(dateStr: string): string {
  const diffMs = parseUtcTimestamp(dateStr).getTime() - Date.now()
  const absMs = Math.abs(diffMs)

  for (const [unit, unitMs] of UNITS) {
    if (absMs >= unitMs) {
      return rtf.format(Math.round(diffMs / unitMs), unit)
    }
  }
  return 'just now'
}

export function formatTimestamp(dateStr: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'UTC',
  }).format(parseUtcTimestamp(dateStr))
}