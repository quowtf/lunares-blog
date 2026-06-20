import type { CollectionAfterChangeHook } from 'payload'
import type { Post } from '@/payload-types'

/**
 * After a gallery post is published with `postToStories` enabled,
 * create a Story for each image in `galleryImages` with a 12-hour duration.
 */
export const createStoriesFromGallery: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
}) => {
  const { payload } = req

  // Only trigger when transitioning to published
  const justPublished = doc._status === 'published' && previousDoc?._status !== 'published'
  if (!justPublished) return doc

  // Only for gallery posts with the flag enabled
  if (doc.PostType !== 'gallery') return doc
  if (!doc.postToStories) return doc

  const galleryImages = doc.galleryImages
  if (!galleryImages || galleryImages.length === 0) return doc

  const authorId = req.user?.id ?? (Array.isArray(doc.authors) ? doc.authors[0] : undefined)
  const resolvedAuthorId =
    typeof authorId === 'object' && authorId !== null ? (authorId as { id: number }).id : authorId

  if (!resolvedAuthorId) {
    payload.logger.warn('[createStoriesFromGallery] No author found, skipping story creation')
    return doc
  }

  for (const image of galleryImages) {
    const imageId = typeof image === 'object' ? image.id : image

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).create({
        collection: 'stories',
        data: {
          image: imageId,
          author: resolvedAuthorId,
          visibility: 'public',
          duration: '12',
        },
        overrideAccess: true,
      })
    } catch (err) {
      payload.logger.error({
        err,
        msg: `[createStoriesFromGallery] Failed to create story for image ${imageId}`,
      })
    }
  }

  payload.logger.info(
    `[createStoriesFromGallery] Created ${galleryImages.length} stories from post "${doc.title}"`,
  )

  return doc
}
