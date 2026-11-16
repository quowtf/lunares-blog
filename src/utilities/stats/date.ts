const MEXICO_CITY_TIME_ZONE = 'America/Mexico_City'

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone: MEXICO_CITY_TIME_ZONE,
  year: 'numeric',
})

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export type ParsedActivityDate = {
  day: string
  occurredAt: string
}

export function getMexicoCityDay(date = new Date()): string {
  return dayFormatter.format(date)
}

export function parseActivityDate(value: unknown): ParsedActivityDate | null {
  if (value === undefined || value === null || value === '') {
    const now = new Date()

    return {
      day: getMexicoCityDay(now),
      occurredAt: now.toISOString(),
    }
  }

  if (typeof value !== 'string') return null

  const match = DATE_PATTERN.exec(value.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))

  const isValid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day

  if (!isValid) return null

  const normalizedDay = `${match[1]}-${match[2]}-${match[3]}`

  if (normalizedDay > getMexicoCityDay()) return null

  return {
    day: normalizedDay,
    occurredAt: date.toISOString(),
  }
}

export function getMonthDayRange(month: number, year: number): { end: string; start: string } {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  return { end, start }
}

export function getCurrentAndPreviousMonth(now = new Date()): {
  current: { month: number; year: number }
  previous: { month: number; year: number }
} {
  const current = getMexicoCityMonth(now)
  const previousMonth = current.month === 1 ? 12 : current.month - 1
  const previousYear = current.month === 1 ? current.year - 1 : current.year

  return {
    current,
    previous: { month: previousMonth, year: previousYear },
  }
}

function getMexicoCityMonth(date: Date): { month: number; year: number } {
  const parts = dayFormatter.formatToParts(date)
  const values = new Map(parts.map((part) => [part.type, part.value]))

  return {
    month: Number(values.get('month')),
    year: Number(values.get('year')),
  }
}
