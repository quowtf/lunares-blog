import type { Post } from '@/payload-types'
import type { CardVariant, GalleryItem, SlidesItem } from '@/types/archive'
import { getVariantByIndex } from '@/components/archive/ui/card/card-variants'
import { formatArchiveDate } from './formatArchiveDate'
import { getGalleryImagesFromPost } from './getGalleryImagesFromPost'
import { getPostExcerpt } from './getPostExcerpt'

export type GalleryPostData = Pick<
  Post,
  | 'id'
  | 'title'
  | 'slug'
  | 'heroImage'
  | 'content'
  | 'categories'
  | 'galleryImages'
  | 'PostType'
  | 'publishedAt'
  | 'createdAt'
>

type MapOptions = {
  index?: number
  variant?: CardVariant
}

function getSlidesLabel(post: GalleryPostData): string | undefined {
  const firstCategory = post.categories?.find(
    (item): item is Extract<typeof item, { title?: string | null }> =>
      typeof item === 'object' && item !== null,
  )

  if (typeof firstCategory === 'object' && firstCategory?.title) {
    return firstCategory.title
  }

  return 'Image'
}

/** PostType gallery: solo las imágenes. */
export function mapPostToGalleryItem(
  post: GalleryPostData,
  options: MapOptions = {},
): GalleryItem | null {
  const images = getGalleryImagesFromPost(post)

  if (images.length === 0) return null

  return {
    id: String(post.id),
    type: 'gallery',
    date: formatArchiveDate(post.publishedAt ?? post.createdAt),
    variant: getVariantByIndex(options.index ?? 0, options.variant),
    images,
  }
}

/** PostType slides: imágenes + título + content + fecha. */
export function mapPostToSlidesItem(
  post: GalleryPostData,
  options: MapOptions = {},
): SlidesItem | null {
  const images = getGalleryImagesFromPost(post)

  if (images.length === 0) return null

  const content = getPostExcerpt(post)

  return {
    id: String(post.id),
    type: 'slides',
    date: formatArchiveDate(post.publishedAt ?? post.createdAt),
    variant: getVariantByIndex(options.index ?? 0, options.variant),
    label: getSlidesLabel(post),
    title: post.title,
    content: content || undefined,
    images,
  }
}
