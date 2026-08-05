import type { Post } from '@/payload-types'
import type { CardVariant, RodadaItem } from '@/types/archive'

import { getVariantByIndex } from '@/components/archive/ui/card/card-variants'

import { formatArchiveDate } from './formatArchiveDate'
import { getGalleryImagesFromPost } from './getGalleryImagesFromPost'
import { getPostExcerpt } from './getPostExcerpt'
import { mediaToImageAsset } from './mediaToImageAsset'

export type RodadaPostData = Pick<
  Post,
  | 'id'
  | 'title'
  | 'slug'
  | 'heroImage'
  | 'content'
  | 'galleryImages'
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
  const images = getGalleryImagesFromPost(post)
  if (images.length === 0) return null

  // heroImage for the route silhouette — fall back to first gallery image if missing
  const heroImage = mediaToImageAsset(post.heroImage) ?? images[0]
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
