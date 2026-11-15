import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'

import type { Post } from '@/payload-types'

import { resolveAdminUser } from './author'
import type { ProcessedImage } from './images'

type CreateGalleryPostArgs = {
  payload: Payload
  images: ProcessedImage[]
  publishedAt: string
}

function buildGallerySlug(publishedAt: string): string {
  const date = publishedAt.slice(0, 10).replace(/-/g, '')
  const suffix = randomUUID().slice(0, 4)

  return `gallery-${date}-${suffix}`
}

export async function createGalleryPost({
  payload,
  images,
  publishedAt,
}: CreateGalleryPostArgs): Promise<Post> {
  const author = await resolveAdminUser(payload)
  const mediaIds: number[] = []

  for (const image of images) {
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: image.filename.replace(/\.[^.]+$/, ''),
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

    mediaIds.push(media.id)
  }

  return payload.create({
    collection: 'posts',
    data: {
      PostType: 'gallery',
      _status: 'published',
      publishedAt,
      authors: [author.id],
      galleryImages: mediaIds,
      slug: buildGallerySlug(publishedAt),
    },
    overrideAccess: true,
    user: author,
  })
}
