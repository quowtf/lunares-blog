import type { Media, Post } from '@/payload-types'
import type { ImageAsset } from '@/types/archive'

import { mediaToImageAsset } from './mediaToImageAsset'

type GalleryImagePostData = Pick<Post, 'galleryImages' | 'heroImage' | 'meta'>

/** Use the dedicated 400×400 'gallery' imageSize for triptych cards. */
const GALLERY_ASSET_OPTIONS = { preferredSize: 'gallery' } as const

function pushUniqueImage(images: ImageAsset[], media: Media | number | null | undefined) {
  const asset = mediaToImageAsset(media, GALLERY_ASSET_OPTIONS)
  if (!asset) return

  const exists = images.some((image) => image.src === asset.src)
  if (!exists) images.push(asset)
}

export function getGalleryImagesFromPost(post: GalleryImagePostData, limit = 3): ImageAsset[] {
  const images: ImageAsset[] = []

  if (Array.isArray(post.galleryImages)) {
    for (const media of post.galleryImages) {
      pushUniqueImage(images, media)
      if (images.length >= limit) break
    }
  }

  if (images.length < limit) pushUniqueImage(images, post.heroImage)
  if (images.length < limit) pushUniqueImage(images, post.meta?.image ?? null)

  return images.slice(0, limit)
}
