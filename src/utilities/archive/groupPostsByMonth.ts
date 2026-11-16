import { ARCHIVE_TIME_ZONE } from './archiveWindow'

const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

export type ArchiveMonthGroup<T> = {
  month: string
  monthKey: string
  items: T[]
}

type DatedPost = {
  publishedAt?: string | null
  createdAt: string
}

const monthPartsFormatter = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  timeZone: ARCHIVE_TIME_ZONE,
  year: 'numeric',
})

function getPostDate(post: DatedPost): Date {
  return new Date(post.publishedAt ?? post.createdAt)
}

export function formatMonthYear(date: Date): string {
  const parts = monthPartsFormatter.formatToParts(date)
  const values = new Map(parts.map((part) => [part.type, part.value]))
  const month = Number(values.get('month'))
  const year = values.get('year')

  return `${MONTH_LABELS[month - 1] ?? ''} ${year ?? ''}`.trim()
}

function getMonthKey(date: Date): string {
  const parts = monthPartsFormatter.formatToParts(date)
  const values = new Map(parts.map((part) => [part.type, part.value]))

  return `${values.get('year')}-${values.get('month')}`
}

export function groupPostsByMonth<T extends DatedPost>(posts: T[]): ArchiveMonthGroup<T>[] {
  const groups = new Map<string, ArchiveMonthGroup<T>>()

  for (const post of posts) {
    const date = getPostDate(post)
    const monthKey = getMonthKey(date)

    const existing = groups.get(monthKey)
    if (existing) {
      existing.items.push(post)
      continue
    }

    groups.set(monthKey, {
      month: formatMonthYear(date),
      monthKey,
      items: [post],
    })
  }

  return Array.from(groups.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}

export type IndexedArchivePost<T> = {
  post: T
  index: number
}

export function groupPostsByMonthWithIndex<T extends DatedPost>(
  posts: T[],
): ArchiveMonthGroup<IndexedArchivePost<T>>[] {
  const groups = groupPostsByMonth(posts)
  let index = 0

  return groups.map((group) => ({
    ...group,
    items: group.items.map((post) => ({
      post,
      index: index++,
    })),
  }))
}
