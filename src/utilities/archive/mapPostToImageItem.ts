import type { Post } from '@/payload-types'
import type { CardVariant, ImageItem } from '@/types/archive'
import { getVariantByIndex } from '@/components/archive/ui/card/card-variants'
import { formatArchiveDate } from './formatArchiveDate'
import { mediaToImageAsset } from './mediaToImageAsset'

export type ImagePostData = Pick<
  Post,
  | 'id'
  | 'title'
  | 'slug'
  | 'heroImage'
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
  const firstCategory = post.categories?.[0]

  if (typeof firstCategory === 'object' && firstCategory?.title) {
    return firstCategory.title
  }

  if (post.PostType) {
    return post.PostType.charAt(0).toUpperCase() + post.PostType.slice(1)
  }

  return undefined
}

export function mapPostToImageItem(
  post: ImagePostData,
  options: MapPostToImageItemOptions = {},
): ImageItem | null {
  const image =
    mediaToImageAsset(post.heroImage) ?? mediaToImageAsset(post.meta?.image ?? null)

  if (!image) return null

  return {
    id: String(post.id),
    type: 'image',
    date: formatArchiveDate(post.publishedAt ?? post.createdAt),
    variant: getVariantByIndex(options.index ?? 0, options.variant),
    label: getPostLabel(post),
    title: post.title,
    subtitle: post.meta?.description ?? undefined,
    image,
  }
}
