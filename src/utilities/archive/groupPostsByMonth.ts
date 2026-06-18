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

function getPostDate(post: DatedPost): Date {
  return new Date(post.publishedAt ?? post.createdAt)
}

export function formatMonthYear(date: Date): string {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
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
