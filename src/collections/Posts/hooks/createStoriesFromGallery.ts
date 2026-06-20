import type { CollectionAfterChangeHook } from 'payload'
import type { Post } from '@/payload-types'

/**
 * After a gallery or image post is published with `postToStories` enabled,
 * create a Story for each image. For gallery posts it uses `galleryImages`,
 * for image posts it uses `heroImage`.
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

  // Only for gallery or image posts with the flag enabled
  if (doc.PostType !== 'gallery' && doc.PostType !== 'image') return doc
  if (!doc.postToStories) return doc

  // Collect image IDs depending on post type
  const imageIds: number[] = []

  if (doc.PostType === 'gallery') {
    const galleryImages = doc.galleryImages
    if (galleryImages && galleryImages.length > 0) {
      for (const image of galleryImages) {
        const id = typeof image === 'object' ? image.id : image
        if (id) imageIds.push(id)
      }
    }
  } else if (doc.PostType === 'image') {
    const heroImage = doc.heroImage
    if (heroImage) {
      const id = typeof heroImage === 'object' ? heroImage.id : heroImage
      if (id) imageIds.push(id)
    }
  }

  if (imageIds.length === 0) return doc

  const authorId = req.user?.id ?? (Array.isArray(doc.authors) ? doc.authors[0] : undefined)
  const resolvedAuthorId =
    typeof authorId === 'object' && authorId !== null ? (authorId as { id: number }).id : authorId

  if (!resolvedAuthorId) {
    payload.logger.warn('[createStoriesFromGallery] No author found, skipping story creation')
    return doc
  }

  for (const imageId of imageIds) {
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
    `[createStoriesFromGallery] Created ${imageIds.length} stories from post "${doc.title ?? doc.id}"`,
  )

  return doc
}
