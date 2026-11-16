/**
 * Archive visibility window.
 *
 * The public archive starts on the first day of the previous month in Mexico
 * City time. Everything older is gated behind an admin or active friend
 * session.
 */
export const ARCHIVE_TIME_ZONE = 'America/Mexico_City'

type ZonedParts = {
  day: number
  hour: number
  minute: number
  month: number
  second: number
  year: number
}

const zonedPartsFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: '2-digit',
  second: '2-digit',
  timeZone: ARCHIVE_TIME_ZONE,
  year: 'numeric',
})

function getZonedParts(date: Date): ZonedParts {
  const parts = zonedPartsFormatter.formatToParts(date)
  const values = new Map(parts.map((part) => [part.type, part.value]))

  return {
    day: Number(values.get('day')),
    hour: Number(values.get('hour')),
    minute: Number(values.get('minute')),
    month: Number(values.get('month')),
    second: Number(values.get('second')),
    year: Number(values.get('year')),
  }
}

function getTimeZoneOffsetMs(date: Date): number {
  const parts = getZonedParts(date)
  const asUTC = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )

  return asUTC - date.getTime()
}

function startOfMonthInArchiveTimeZone(year: number, month: number): Date {
  const utcGuess = Date.UTC(year, month - 1, 1, 0, 0, 0)
  const offsetMs = getTimeZoneOffsetMs(new Date(utcGuess))

  return new Date(utcGuess - offsetMs)
}

export function getArchiveMonth(date = new Date()): { month: number; year: number } {
  const { month, year } = getZonedParts(date)
  return { month, year }
}

export function getArchiveCutoff(now = new Date()): Date {
  const { month, year } = getArchiveMonth(now)
  const previousMonth = month === 1 ? 12 : month - 1
  const previousYear = month === 1 ? year - 1 : year

  return startOfMonthInArchiveTimeZone(previousYear, previousMonth)
}
