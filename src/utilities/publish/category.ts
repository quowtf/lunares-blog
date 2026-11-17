import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { slugify } from 'payload/shared'

import type { User } from '@/payload-types'

const MAX_SLUG_BASE_LENGTH = 60

function buildCategorySlugBase(title: string): string {
  return (
    (slugify(title) || 'category').slice(0, MAX_SLUG_BASE_LENGTH).replace(/^-+|-+$/g, '') ||
    'category'
  )
}

/**
 * Resolves a taxonomy string against `categories.title`, creating the category
 * when it does not exist. Titles can include emojis.
 */
export async function resolveCategoryId({
  payload,
  category,
  user,
}: {
  payload: Payload
  category?: string
  user: User
}): Promise<number | null> {
  const title = category?.trim()
  if (!title) return null

  const existing = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    user,
    where: {
      title: {
        equals: title,
      },
    },
  })

  const found = existing.docs[0]
  if (found) return found.id

  const baseSlug = buildCategorySlugBase(title)
  const slugTaken = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    user,
    where: {
      slug: {
        equals: baseSlug,
      },
    },
  })

  const slug = slugTaken.docs.length > 0 ? `${baseSlug}-${randomUUID().slice(0, 4)}` : baseSlug

  const created = await payload.create({
    collection: 'categories',
    data: {
      title,
      slug,
    },
    overrideAccess: true,
    user,
  })

  return created.id
}
