import type { Payload } from 'payload'

import type { Media, PrivateMedia } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { streamMediaFile } from '@/utilities/streamMediaFile'

function safeFilename(prefix: string, id: number, filename?: string | null): string {
  const base = (filename || 'file').split(/[\\/]/).pop() || 'file'
  return `${prefix}-${id}-${base}`
}

async function readFile(
  doc: { filename?: string | null; mimeType?: string | null; url?: string | null },
): Promise<{ buffer: Buffer; mimetype: string } | null> {
  const streamed = await streamMediaFile(doc, getServerSideURL())
  if (!streamed) return null

  const buffer = Buffer.from(await new Response(streamed.body).arrayBuffer())
  return {
    buffer,
    mimetype: streamed.contentType || doc.mimeType || 'application/octet-stream',
  }
}

/**
 * Copies a public media document into the private collection.
 * Idempotent: `archiveSourceId` identifies the original document.
 */
export async function getOrCreatePrivateMediaCopy({
  media,
  payload,
}: {
  media: Pick<Media, 'id' | 'alt' | 'caption' | 'filename' | 'focalX' | 'focalY' | 'mimeType' | 'updatedAt' | 'url'>
  payload: Payload
}): Promise<PrivateMedia> {
  const existing = await payload.find({
    collection: 'private-media',
    where: { archiveSourceId: { equals: media.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs[0]) return existing.docs[0]

  const file = await readFile(media)
  if (!file) throw new Error(`Media ${media.id} file is not readable`)

  try {
    return await payload.create({
      collection: 'private-media',
      data: {
        alt: media.alt ?? undefined,
        caption: media.caption ?? undefined,
        focalX: media.focalX ?? undefined,
        focalY: media.focalY ?? undefined,
        archiveSourceId: media.id,
        archiveSourceUpdatedAt: media.updatedAt,
      },
      file: {
        data: file.buffer,
        mimetype: file.mimetype,
        name: safeFilename('archive', media.id, media.filename),
        size: file.buffer.length,
      },
      depth: 0,
      overrideAccess: true,
    })
  } catch (error) {
    // Another worker may have won the race on the unique archiveSourceId.
    const raced = await payload.find({
      collection: 'private-media',
      where: { archiveSourceId: { equals: media.id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (raced.docs[0]) return raced.docs[0]
    throw error
  }
}

/**
 * Copies a private media document back into the public collection.
 * Used when a post returns to the public window and the original file is gone.
 */
export async function copyPrivateMediaToPublic({
  media,
  payload,
}: {
  media: Pick<
    PrivateMedia,
    'id' | 'alt' | 'caption' | 'filename' | 'focalX' | 'focalY' | 'mimeType' | 'url'
  >
  payload: Payload
}): Promise<Media> {
  const file = await readFile(media)
  if (!file) throw new Error(`Private media ${media.id} file is not readable`)

  return payload.create({
    collection: 'media',
    data: {
      alt: media.alt ?? undefined,
      caption: media.caption ?? undefined,
      focalX: media.focalX ?? undefined,
      focalY: media.focalY ?? undefined,
    },
    file: {
      data: file.buffer,
      mimetype: file.mimetype,
      name: safeFilename('promoted', media.id, media.filename),
      size: file.buffer.length,
    },
    depth: 0,
    overrideAccess: true,
  })
}
