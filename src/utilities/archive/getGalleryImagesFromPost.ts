import type { Post } from '@/payload-types'
import type { ImageAsset } from '@/types/archive'
import type { MediaValue } from '@/utilities/media/mediaValue'

import { getPostGalleryMedia, getPostHeroMedia } from './getPostHeroMedia'
import { mediaToImageAsset } from './mediaToImageAsset'

type GalleryImagePostData = Pick<
  Post,
  'galleryImages' | 'privateGalleryImages' | 'heroImage' | 'privateHeroImage' | 'meta'
>

/** Use the 400w 'thumbnail' imageSize for triptych cards (CSS handles 1:1 crop). */
const GALLERY_ASSET_OPTIONS = { preferredSize: 'thumbnail' } as const

function pushUniqueImage(images: ImageAsset[], media: MediaValue) {
  const asset = mediaToImageAsset(media, GALLERY_ASSET_OPTIONS)
  if (!asset) return

  const exists = images.some((image) => image.src === asset.src)
  if (!exists) images.push(asset)
}

type GalleryImagesOptions = {
  /** Include hero and meta images when there are not enough gallery images. */
  includeFallbacks?: boolean
}

export function getGalleryImagesFromPost(
  post: GalleryImagePostData,
  limit = 3,
  { includeFallbacks = true }: GalleryImagesOptions = {},
): ImageAsset[] {
  const images: ImageAsset[] = []

  for (const media of getPostGalleryMedia(post)) {
    pushUniqueImage(images, media)
    if (images.length >= limit) break
  }

  if (includeFallbacks && images.length < limit) {
    pushUniqueImage(images, getPostHeroMedia(post))
  }

  if (includeFallbacks && images.length < limit) {
    pushUniqueImage(images, post.meta?.image ?? null)
  }

  return images.slice(0, limit)
}
