import type { Payload } from 'payload'

import type { Post, PrivateMedia } from '@/payload-types'

import { collectMediaReferences } from './collectMediaReferences'
import { copyPrivateMediaToPublic } from './copyMediaToPrivate'
import { promotePostMediaRefs } from './rewritePostMediaRefs'

export type PromotionResult = {
  patch: Record<string, unknown>
  promoted: boolean
}

/**
 * Resolves every private-media reference in a post back to the public media
 * collection. Reuses the original document when `archiveSourceId` still
 * exists; otherwise copies the private file back into `media`.
 */
export async function promotePostMedia({
  doc,
  payload,
}: {
  doc: Post | (Record<string, unknown> & { id: number | string })
  payload: Payload
}): Promise<PromotionResult> {
  const record = doc as unknown as Record<string, unknown>
  const privateIds = Array.from(
    new Set(
      collectMediaReferences({ doc: record, sourceCollection: 'posts' })
        .filter((reference) => reference.relationTo === 'private-media')
        .map((reference) => reference.mediaId),
    ),
  )

  if (privateIds.length === 0) {
    return { patch: {}, promoted: false }
  }

  const mapping = new Map<number, number>()

  for (const privateId of privateIds) {
    const privateMedia = await payload.findByID({
      collection: 'private-media',
      id: privateId,
      depth: 0,
      disableErrors: true,
      overrideAccess: true,
    })

    if (!privateMedia) continue

    let publicId: number | null = null

    if (privateMedia.archiveSourceId) {
      const original = await payload.findByID({
        collection: 'media',
        id: privateMedia.archiveSourceId,
        depth: 0,
        disableErrors: true,
        overrideAccess: true,
      })

      if (original) {
        publicId = original.id
        if (original.archiveRetentionUntil) {
          await payload.update({
            collection: 'media',
            id: original.id,
            data: { archiveRetentionUntil: null },
            depth: 0,
            overrideAccess: true,
            context: { skipMediaVisibilityHooks: true },
          })
        }
      }
    }

    if (!publicId) {
      const created = await copyPrivateMediaToPublic({
        media: privateMedia as PrivateMedia,
        payload,
      })
      publicId = created.id
    }

    mapping.set(privateId, publicId)
  }

  return {
    patch: promotePostMediaRefs(record, mapping),
    promoted: mapping.size > 0,
  }
}
