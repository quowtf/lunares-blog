import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { slugify } from 'payload/shared'

import type { Post } from '@/payload-types'

import { resolveAdminUser } from './author'
import type { ProcessedImage } from './images'
import { textToLexical } from './lexical'

const MAX_SLUG_BASE_LENGTH = 60

type CreateRodadaPostArgs = {
  payload: Payload
  heroImage: ProcessedImage
  images?: ProcessedImage[]
  title: string
  content: string
  publishedAt: string
}

function buildSlug(title: string, publishedAt: string): string {
  const base = (slugify(title) || 'rodada').slice(0, MAX_SLUG_BASE_LENGTH).replace(/-+$/, '')

  const date = publishedAt.slice(0, 10).replace(/-/g, '')
  const suffix = randomUUID().slice(0, 4)

  return `${base || 'rodada'}-${date}-${suffix}`
}

function buildAlt(image: ProcessedImage, title: string, index?: number): string {
  if (index === undefined) return title

  return `${title} ${index + 1}`.trim() || image.filename.replace(/\.[^.]+$/, '')
}

export async function createRodadaPost({
  payload,
  heroImage,
  images = [],
  title,
  content,
  publishedAt,
}: CreateRodadaPostArgs): Promise<Post> {
  const author = await resolveAdminUser(payload)
  const cleanTitle = title.trim()
  const cleanContent = content.trim()

  async function upload(image: ProcessedImage, alt: string): Promise<number> {
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

    return media.id
  }

  const heroImageId = await upload(heroImage, buildAlt(heroImage, cleanTitle))
  const galleryImageIds: number[] = []

  for (const [index, image] of images.entries()) {
    galleryImageIds.push(await upload(image, buildAlt(image, cleanTitle, index)))
  }

  return payload.create({
    collection: 'posts',
    data: {
      PostType: 'rodada',
      _status: 'published',
      publishedAt,
      authors: [author.id],
      heroImage: heroImageId,
      ...(galleryImageIds.length > 0 ? { galleryImages: galleryImageIds } : {}),
      title: cleanTitle,
      content: textToLexical(cleanContent),
      slug: buildSlug(cleanTitle, publishedAt),
    },
    overrideAccess: true,
    user: author,
  })
}
