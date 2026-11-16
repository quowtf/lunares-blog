import type { CollectionBeforeChangeHook } from 'payload'

import type { Post } from '@/payload-types'
import { getArchiveCutoff } from '@/utilities/archive/archiveWindow'
import { collectMediaReferences } from '@/utilities/archive/media/collectMediaReferences'
import { promotePostMedia } from '@/utilities/archive/media/promotePostMedia'

/**
 * Keeps `mediaArchiveState` in sync and promotes private media when a post is
 * saved back into the public window.
 */
export const enforceMediaArchiveState: CollectionBeforeChangeHook<Post> = async ({
  context,
  data,
  originalDoc,
  req,
}) => {
  if (context?.skipMediaArchiveState) return data

  const effective = {
    ...(originalDoc ?? {}),
    ...data,
  } as Record<string, unknown>

  if (effective._status !== 'published') {
    return { ...data, mediaArchiveState: 'none' }
  }

  const publishedAt = effective.publishedAt
    ? new Date(effective.publishedAt as string)
    : new Date()

  if (publishedAt >= getArchiveCutoff()) {
    const result = await promotePostMedia({
      doc: { ...effective, id: (originalDoc?.id ?? data.id) as number },
      payload: req.payload,
    })

    const stillPrivate = collectMediaReferences({
      doc: effective,
      sourceCollection: 'posts',
    }).some((reference) => reference.relationTo === 'private-media')

    return {
      ...data,
      ...result.patch,
      mediaArchiveState: stillPrivate && !result.promoted ? 'needs-promotion' : 'none',
    }
  }

  const references = collectMediaReferences({
    doc: effective,
    sourceCollection: 'posts',
  })

  const hasMigratablePublicMedia = references.some(
    (reference) => reference.relationTo === 'media' && reference.fieldPath !== 'meta.image',
  )

  if (originalDoc?.mediaArchiveState === 'archived' && !hasMigratablePublicMedia) {
    return data
  }

  return { ...data, mediaArchiveState: 'pending' }
}
