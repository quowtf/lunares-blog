import type { Category, Post } from '@/payload-types'

export function getPostCategory(post: Pick<Post, 'categories'>): string | null {
  const category = post.categories

  if (!category?.length) return null

  const first = category.find(
    (item): item is Category => typeof item === 'object' && item !== null && 'title' in item,
  )

  return first?.title ?? null
}

export function getPostCategoryLabel(post: Pick<Post, 'categories'>): string | null {
  const category = getPostCategory(post)
  return category ? category.toUpperCase() : null
}
