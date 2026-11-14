const MEXICO_CITY_TIME_ZONE = 'America/Mexico_City'
const NOON_UTC_HOUR = 12

export type ParsedPublicationDate = {
  publishedAt: string
  dateFallback: boolean
}

type CalendarDate = {
  year: number
  month: number
  day: number
}

function toCalendarDate(parts: Intl.DateTimeFormatPart[]): CalendarDate {
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)

  return { year, month, day }
}

function todayInMexicoCity(): CalendarDate {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_CITY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return toCalendarDate(formatter.formatToParts(new Date()))
}

function toNoonUtc({ year, month, day }: CalendarDate): string | null {
  const date = new Date(Date.UTC(year, month - 1, day, NOON_UTC_HOUR, 0, 0, 0))

  const isValid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day

  if (!isValid) return null

  return date.toISOString()
}

function parseDateString(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const yearFirst = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(trimmed)
  if (yearFirst) {
    return toNoonUtc({
      year: Number(yearFirst[1]),
      month: Number(yearFirst[2]),
      day: Number(yearFirst[3]),
    })
  }

  const dayFirst = /^(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})$/.exec(trimmed)
  if (dayFirst) {
    const rawYear = Number(dayFirst[3])
    return toNoonUtc({
      year: rawYear < 100 ? 2000 + rawYear : rawYear,
      month: Number(dayFirst[2]),
      day: Number(dayFirst[1]),
    })
  }

  return null
}

/**
 * Accepts `YYYY-MM-DD`, `YYYY/MM/DD`, `DD/MM/YYYY` and `DD/MM/YY`.
 * Stores the calendar day at noon UTC so the timeline never shifts a day.
 * Missing or invalid dates fall back to today in Mexico City.
 */
export function parsePublicationDate(value: unknown): ParsedPublicationDate {
  const raw = typeof value === 'string' ? value.trim() : ''

  if (!raw) {
    const publishedAt = toNoonUtc(todayInMexicoCity())

    return {
      publishedAt: publishedAt ?? new Date().toISOString(),
      dateFallback: false,
    }
  }

  const parsed = parseDateString(raw)

  if (parsed) {
    return { publishedAt: parsed, dateFallback: false }
  }

  const fallback = toNoonUtc(todayInMexicoCity())

  return {
    publishedAt: fallback ?? new Date().toISOString(),
    dateFallback: true,
  }
}
