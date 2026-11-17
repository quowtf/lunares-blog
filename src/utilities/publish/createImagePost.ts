import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { slugify } from 'payload/shared'

import type { Post } from '@/payload-types'

import { resolveAdminUser } from './author'
import { resolveCategoryId } from './category'
import type { ProcessedImage } from './images'
import { textToLexical } from './lexical'

const MAX_SLUG_BASE_LENGTH = 60
const MAX_ALT_LENGTH = 200

type CreateImagePostArgs = {
  payload: Payload
  image: ProcessedImage
  category?: string
  title?: string
  content?: string
  publishedAt: string
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return value.slice(0, maxLength).trimEnd()
}

function buildSlug(
  title: string | undefined,
  content: string | undefined,
  publishedAt: string,
): string {
  const base =
    (slugify(title ?? '') || slugify(truncate(content ?? '', MAX_SLUG_BASE_LENGTH)) || 'image')
      .slice(0, MAX_SLUG_BASE_LENGTH)
      .replace(/^-+|-+$/g, '') || 'image'

  const date = publishedAt.slice(0, 10).replace(/-/g, '')
  const suffix = randomUUID().slice(0, 4)

  return `${base}-${date}-${suffix}`
}

function buildAlt(image: ProcessedImage, title?: string, content?: string): string {
  const text = [title, content].find((value) => Boolean(value?.trim()))?.trim()

  if (text) return truncate(text.replace(/\s+/g, ' '), MAX_ALT_LENGTH)

  return image.filename.replace(/\.[^.]+$/, '')
}

export async function createImagePost({
  payload,
  image,
  category,
  title,
  content,
  publishedAt,
}: CreateImagePostArgs): Promise<Post> {
  const author = await resolveAdminUser(payload)
  const cleanTitle = title?.trim() || undefined
  const cleanContent = content?.trim() || undefined
  const cleanCategory = category?.trim() || undefined
  const categoryId = await resolveCategoryId({
    payload,
    category: cleanCategory,
    user: author,
  })

  const media = await payload.create({
    collection: 'media',
    data: {
      alt: buildAlt(image, cleanTitle, cleanContent),
    },
    file: {
      name: image.filename,
      data: image.buffer,
      mimetype: image.mimetype,
      size: image.size,
    },
    overrideAccess: true,
    user: author,
  })

  return payload.create({
    collection: 'posts',
    data: {
      PostType: 'image',
      _status: 'published',
      publishedAt,
      authors: [author.id],
      heroImage: media.id,
      ...(categoryId ? { categories: [categoryId] } : {}),
      ...(cleanTitle ? { title: cleanTitle } : {}),
      ...(cleanContent ? { content: textToLexical(cleanContent) } : {}),
      slug: buildSlug(cleanTitle, cleanContent, publishedAt),
    },
    overrideAccess: true,
    user: author,
  })
}
