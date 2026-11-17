import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { slugify } from 'payload/shared'

import type { Post } from '@/payload-types'

import { resolveAdminUser } from './author'
import type { ProcessedImage } from './images'
import { textToLexical } from './lexical'

const MAX_SLUG_BASE_LENGTH = 60
const MAX_ALT_LENGTH = 200

type CreateImagePostArgs = {
  payload: Payload
  image: ProcessedImage
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
      .replace(/-+$/, '') || 'image'

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
  title,
  content,
  publishedAt,
}: CreateImagePostArgs): Promise<Post> {
  const author = await resolveAdminUser(payload)

  const media = await payload.create({
    collection: 'media',
    data: {
      alt: buildAlt(image, title, content),
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
      ...(title ? { title } : {}),
      ...(content ? { content: textToLexical(content) } : {}),
      slug: buildSlug(title, content, publishedAt),
    },
    overrideAccess: true,
    user: author,
  })
}
