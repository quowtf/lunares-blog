import type { Post } from '@/payload-types'
import type { CardVariant, RodadaItem } from '@/types/archive'

import { getVariantByIndex } from '@/components/archive/ui/card/card-variants'

import { formatArchiveDate } from './formatArchiveDate'
import { getGalleryImagesFromPost } from './getGalleryImagesFromPost'
import { getPostExcerpt } from './getPostExcerpt'
import { getPostHeroMedia } from './getPostHeroMedia'
import { mediaToImageAsset } from './mediaToImageAsset'

export type RodadaPostData = Pick<
  Post,
  | 'id'
  | 'title'
  | 'slug'
  | 'heroImage'
  | 'privateHeroImage'
  | 'content'
  | 'galleryImages'
  | 'privateGalleryImages'
  | 'PostType'
  | 'publishedAt'
  | 'createdAt'
>

type MapOptions = {
  index?: number
  variant?: CardVariant
}

export function mapPostToRodadaItem(
  post: RodadaPostData,
  options: MapOptions = {},
): RodadaItem | null {
  // Rodada thumbnails are only the optional gallery images; the hero must not
  // be duplicated into the triptych when there are no extras.
  const images = getGalleryImagesFromPost(post, 3, { includeFallbacks: false })

  // heroImage for the route silhouette — fall back to first gallery image if missing
  const heroImage = mediaToImageAsset(getPostHeroMedia(post)) ?? images[0]
  if (!heroImage) return null

  const content = getPostExcerpt(post)

  return {
    id: String(post.id),
    type: 'rodada',
    date: formatArchiveDate(post.publishedAt ?? post.createdAt),
    variant: getVariantByIndex(options.index ?? 0, options.variant),
    title: post.title || '',
    content: content || undefined,
    heroImage,
    images,
  }
}
