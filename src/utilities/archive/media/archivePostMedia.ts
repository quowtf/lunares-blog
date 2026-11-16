import type { Payload } from 'payload'

import type { Media, Post } from '@/payload-types'
import { getArchiveCutoff } from '../archiveWindow'
import { collectMediaReferences } from './collectMediaReferences'
import { getOrCreatePrivateMediaCopy } from './copyMediaToPrivate'
import { archivePostMediaRefs } from './rewritePostMediaRefs'

const RETENTION_DAYS = 30

export type ArchivePostResult = {
  copied: number
  mediaIds: number[]
  skipped: boolean
}

function uniqueMediaIds(post: Post): number[] {
  return Array.from(
    new Set(
      collectMediaReferences({
        doc: post as unknown as Record<string, unknown>,
        sourceCollection: 'posts',
      })
        .filter(
          // meta.image stays in `media` and is protected by the access gate.
          (reference) => reference.relationTo === 'media' && reference.fieldPath !== 'meta.image',
        )
        .map((reference) => reference.mediaId),
    ),
  )
}

async function setRetentionWhenUnreferenced(
  payload: Payload,
  mediaIds: number[],
): Promise<void> {
  const retentionUntil = new Date(
    Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  for (const mediaId of mediaIds) {
    const remaining = await payload.count({
      collection: 'media-references',
      where: { media: { equals: mediaId } },
      overrideAccess: true,
    })

    if (remaining.totalDocs > 0) continue

    await payload.update({
      collection: 'media',
      id: mediaId,
      data: {
        archiveRetentionUntil: retentionUntil,
        latestPostPublishedAt: null,
        publicUntil: null,
        visibility: 'private',
      },
      depth: 0,
      overrideAccess: true,
      context: { skipMediaVisibilityHooks: true },
    })
  }
}

/**
 * Moves a post's migratable images to `private-media` and clears the public
 * references. The originals in `media` are never deleted here.
 */
export async function archivePostMedia({
  dryRun = false,
  payload,
  post,
}: {
  dryRun?: boolean
  payload: Payload
  post: Post
}): Promise<ArchivePostResult> {
  if (
    post._status !== 'published' ||
    !post.publishedAt ||
    new Date(post.publishedAt) >= getArchiveCutoff()
  ) {
    return { copied: 0, mediaIds: [], skipped: true }
  }

  const mediaIds = uniqueMediaIds(post)

  if (dryRun) {
    return { copied: 0, mediaIds, skipped: mediaIds.length === 0 }
  }

  const mapping = new Map<number, number>()

  for (const mediaId of mediaIds) {
    const media = await payload.findByID({
      collection: 'media',
      id: mediaId,
      depth: 0,
      disableErrors: true,
      overrideAccess: true,
    })

    if (!media) continue

    // Static assets pinned public are shared site-wide; never copy or hide them.
    if (media.alwaysPublic) continue

    const copy = await getOrCreatePrivateMediaCopy({
      media: media as Media,
      payload,
    })
    mapping.set(mediaId, copy.id)
  }

  const patch = archivePostMediaRefs(post as unknown as Record<string, unknown>, mapping)

  await payload.update({
    collection: 'posts',
    id: post.id,
    data: {
      ...patch,
      mediaArchiveState: 'archived',
    },
    depth: 0,
    overrideAccess: true,
    context: {
      disableRevalidate: true,
      skipMediaArchiveState: true,
      skipMediaPromotion: true,
    },
  })

  await setRetentionWhenUnreferenced(payload, mediaIds)

  return { copied: mapping.size, mediaIds, skipped: mediaIds.length === 0 }
}
