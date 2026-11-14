export type TextPostType = 'thought' | 'quote'

export function normalizePostType(value: unknown): TextPostType | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()

  if (normalized === 't' || normalized === 'thought') return 'thought'
  if (normalized === 'q' || normalized === 'quote') return 'quote'

  return null
}
