export function toNonNegativeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)

    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed
    }
  }

  return null
}

/** True when value carries a decimal part, even a trailing `.0`. */
export function isDecimalValue(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value) && !Number.isInteger(value)
  }

  if (typeof value === 'string') {
    return /^\d+\.\d+$/.test(value.trim())
  }

  return false
}

export type BoulderValue = {
  failed: number
  tops: number
  total: number
}

/**
 * Boulder sessions use one compact value: `tops.failed`.
 *
 * `11.99` means 11 tops and 99 failed attempts, 110 attempts total. Strings
 * keep trailing zeros, so `"11.10"` means 10 failed attempts.
 */
export function parseBoulderValue(value: unknown): BoulderValue | null {
  const raw =
    typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : ''

  const match = /^(\d+)(?:\.(\d+))?$/.exec(raw)
  if (!match) return null

  const tops = Number(match[1])
  const failed = match[2] ? Number(match[2]) : 0

  if (!Number.isSafeInteger(tops) || !Number.isSafeInteger(failed)) return null

  return {
    failed,
    tops,
    total: tops + failed,
  }
}
