export type TextPostType = 'thought' | 'quote'
export type PublishPostType = TextPostType | 'gallery'

export function normalizePostType(value: unknown): PublishPostType | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()

  if (normalized === 't' || normalized === 'thought') return 'thought'
  if (normalized === 'q' || normalized === 'quote') return 'quote'
  if (normalized === 'g' || normalized === 'gallery') return 'gallery'

  return null
}
