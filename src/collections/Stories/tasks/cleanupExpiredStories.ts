import { BlobNotFoundError, del } from '@vercel/blob'
import type { TaskHandler } from 'payload'

/**
 * Cleanup job task handler that removes expired stories.
 *
 * For each expired story:
 * 1. Get the blob URL from the related media document
 * 2. Delete the blob via @vercel/blob `del()`
 * 3. If blob deletion succeeds or blob is already gone → delete the Payload document
 * 4. If blob deletion fails with another error → log and continue
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3
 */
export const cleanupExpiredStories: TaskHandler<{
  input: object
  output: { success: boolean }
}> = async ({ req }) => {
  const payload = req.payload
  const logger = payload.logger

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let expiredStories: any
  try {
    expiredStories = await payload.find({
      collection: 'stories' as 'posts', // cast: types not yet regenerated for stories collection
      where: {
        expiresAt: {
          less_than_equal: new Date().toISOString(),
        },
      },
      sort: 'expiresAt',
      limit: 0, // no limit — low volume expected (<30)
      depth: 1, // populate image relationship
      overrideAccess: true,
      context: { skipExpirationFilter: true },
    })
  } catch (err) {
    // Req 6.7: If the initial query fails, log error and return without exception
    logger.error({ err, msg: '[Cleanup] Failed to query expired stories' })
    return { output: { success: false } }
  }

  const stories = expiredStories.docs as Array<{
    id: number | string
    image?: { url?: string } | number | string | null
  }>

  if (stories.length === 0) {
    // Req 6.6: No expired stories — log info and return successfully
    logger.info('[Cleanup] No expired stories to process')
    return { output: { success: true } }
  }

  let deleted = 0
  let errors = 0
  const processed = stories.length

  for (const story of stories) {
    try {
      // Req 7.3: Derive blob URL from the media document's `url` field
      const image = story.image
      const blobUrl =
        image && typeof image === 'object' && 'url' in image ? (image.url as string) : undefined

      if (blobUrl) {
        // Req 6.2 / 7.1: Delete blob FIRST, before the document
        await del(blobUrl)
      }

      // Blob deleted (or no blob to delete) — now delete the document
      await payload.delete({
        collection: 'stories' as 'posts', // cast: types not yet regenerated
        id: story.id,
        overrideAccess: true,
      })

      deleted++
    } catch (err) {
      if (err instanceof BlobNotFoundError) {
        // Req 7.2: Blob already gone — proceed to delete the document
        try {
          await payload.delete({
            collection: 'stories' as 'posts', // cast: types not yet regenerated
            id: story.id,
            overrideAccess: true,
          })
          deleted++
        } catch (deleteErr) {
          logger.error({
            err: deleteErr,
            msg: `[Cleanup] Failed to delete story document ${story.id} after BlobNotFoundError`,
          })
          errors++
        }
      } else {
        // Req 6.3: Other blob errors — preserve document, log, continue
        logger.error({
          err,
          msg: `[Cleanup] Failed to process story ${story.id}`,
        })
        errors++
      }
    }
  }

  // Req 6.4: Log summary
  logger.info({
    processed,
    deleted,
    errors,
    msg: '[Cleanup] Completed cleanup of expired stories',
  })

  return { output: { success: true } }
}
