/**
 * Timezone-safe date/time formatting and parsing utilities.
 * All functions work with string representations to avoid timezone shifts.
 */

/** Pad number to 2 digits */
function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Format a Date object to dd/mm/yyyy string (timezone-safe, uses local time) */
export function formatDate(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

/** Format a Date object to hh:mm string */
export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Format a Date object to dd/mm/yyyy hh:mm string */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

/** Parse dd/mm/yyyy string into a Date (local timezone, noon to avoid DST edge) */
export function parseDate(str: string): Date | null {
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const d = new Date(+m[3]!, +m[2]! - 1, +m[1]!, 12, 0, 0, 0)
  return isNaN(d.getTime()) ? null : d
}

/** Parse hh:mm string into a Date (today, with given hours/minutes) */
export function parseTime(str: string): Date | null {
  const m = str.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = +m[1]!, min = +m[2]!
  if (h > 23 || min > 59) return null
  const d = new Date()
  d.setHours(h, min, 0, 0)
  return d
}

/** Parse dd/mm/yyyy hh:mm string into a Date */
export function parseDateTime(str: string): Date | null {
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const d = new Date(+m[3]!, +m[2]! - 1, +m[1]!, +m[4]!, +m[5]!, 0, 0)
  return isNaN(d.getTime()) ? null : d
}

/** Convert any date-like value to formatted string based on variant */
export function toDateString(value: Date | string | null | undefined, variant: 'date' | 'datetime' | 'time'): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return typeof value === 'string' ? value : ''
  if (variant === 'time') return formatTime(d)
  if (variant === 'datetime') return formatDateTime(d)
  return formatDate(d)
}

/** Parse a formatted string back to Date based on variant */
export function fromDateString(str: string, variant: 'date' | 'datetime' | 'time'): Date | null {
  if (!str) return null
  if (variant === 'time') return parseTime(str)
  if (variant === 'datetime') return parseDateTime(str)
  return parseDate(str)
}
