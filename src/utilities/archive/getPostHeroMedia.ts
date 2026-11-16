import type { Post } from '@/payload-types'
import {
  unwrapMediaValue,
  type MediaDoc,
  type MediaValue,
} from '@/utilities/media/mediaValue'

/** Prefer the private copy; fall back to the public image while it exists. */
export function getPostHeroMedia(
  post: Pick<Post, 'heroImage' | 'privateHeroImage'>,
): MediaDoc | number | null {
  return unwrapMediaValue(post.privateHeroImage ?? post.heroImage ?? null)
}

export function getPostGalleryMedia(
  post: Pick<Post, 'galleryImages' | 'privateGalleryImages'>,
): MediaValue[] {
  const privateImages = Array.isArray(post.privateGalleryImages) ? post.privateGalleryImages : []
  if (privateImages.length > 0) return privateImages

  return Array.isArray(post.galleryImages) ? post.galleryImages : []
}
