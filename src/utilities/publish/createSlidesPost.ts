import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { slugify } from 'payload/shared'

import type { Post } from '@/payload-types'

import { resolveAdminUser } from './author'
import { resolveCategoryId } from './category'
import type { ProcessedImage } from './images'
import { textToLexical } from './lexical'

const MAX_SLUG_BASE_LENGTH = 60

type CreateSlidesPostArgs = {
  payload: Payload
  images: ProcessedImage[]
  category?: string
  title: string
  content: string
  publishedAt: string
}

function buildSlugBase(value: string, fallback: string): string {
  return (
    (slugify(value) || fallback).slice(0, MAX_SLUG_BASE_LENGTH).replace(/^-+|-+$/g, '') || fallback
  )
}

function buildSlug(title: string, publishedAt: string): string {
  const base = buildSlugBase(title, 'slides')
  const date = publishedAt.slice(0, 10).replace(/-/g, '')
  const suffix = randomUUID().slice(0, 4)

  return `${base}-${date}-${suffix}`
}

export async function createSlidesPost({
  payload,
  images,
  category,
  title,
  content,
  publishedAt,
}: CreateSlidesPostArgs): Promise<Post> {
  const author = await resolveAdminUser(payload)
  const cleanTitle = title.trim()
  const cleanContent = content.trim()
  const cleanCategory = category?.trim() || undefined
  const categoryId = await resolveCategoryId({
    payload,
    category: cleanCategory,
    user: author,
  })
  const galleryImageIds: number[] = []

  for (const [index, image] of images.entries()) {
    const alt = images.length > 1 ? `${cleanTitle} ${index + 1}`.trim() : cleanTitle

    const media = await payload.create({
      collection: 'media',
      data: { alt },
      file: {
        name: image.filename,
        data: image.buffer,
        mimetype: image.mimetype,
        size: image.size,
      },
      overrideAccess: true,
      user: author,
    })

    galleryImageIds.push(media.id)
  }

  return payload.create({
    collection: 'posts',
    data: {
      PostType: 'slides',
      _status: 'published',
      publishedAt,
      authors: [author.id],
      galleryImages: galleryImageIds,
      ...(categoryId ? { categories: [categoryId] } : {}),
      title: cleanTitle,
      content: textToLexical(cleanContent),
      slug: buildSlug(cleanTitle, publishedAt),
    },
    overrideAccess: true,
    user: author,
  })
}
