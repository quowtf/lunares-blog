import type { Post } from '@/payload-types'
import type { CardVariant, ImageItem } from '@/types/archive'
import { getVariantByIndex } from '@/components/archive/ui/card/card-variants'
import { formatArchiveDate } from './formatArchiveDate'
import { getPostCategory } from './getPostCategory'
import { getPostExcerpt } from './getPostExcerpt'
import { mediaToImageAsset } from './mediaToImageAsset'

export type ImagePostData = Pick<
  Post,
  | 'id'
  | 'title'
  | 'slug'
  | 'heroImage'
  | 'content'
  | 'meta'
  | 'categories'
  | 'PostType'
  | 'publishedAt'
  | 'createdAt'
>

type MapPostToImageItemOptions = {
  index?: number
  variant?: CardVariant
}

function getPostLabel(post: ImagePostData): string | undefined {
  const category = getPostCategory(post)

  if (category) return category

  if (post.PostType) {
    return post.PostType.charAt(0).toUpperCase() + post.PostType.slice(1)
  }

  return undefined
}

export function mapPostToImageItem(
  post: ImagePostData,
  options: MapPostToImageItemOptions = {},
): ImageItem | null {
  const image = mediaToImageAsset(post.heroImage) ?? mediaToImageAsset(post.meta?.image ?? null)

  if (!image) return null

  return {
    id: String(post.id),
    type: 'image',
    date: formatArchiveDate(post.publishedAt ?? post.createdAt),
    variant: getVariantByIndex(options.index ?? 0, options.variant),
    label: getPostLabel(post),
    title: post.title,
    content: getPostExcerpt(post) || undefined,
    image,
  }
}
