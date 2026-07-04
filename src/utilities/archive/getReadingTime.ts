export function getReadingTime(text: string): string | null {
  if (!text) return null

  const words = text.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))

  return `${minutes} min`
}

export function getReadingTimeLabel(text: string): string | null {
  const time = getReadingTime(text)
  return time ? `${time} read` : null
}
