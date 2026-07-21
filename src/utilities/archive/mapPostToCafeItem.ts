import type { Post } from '@/payload-types'
import type { CafeBadge, CafeItem, CardVariant } from '@/types/archive'
import { getVariantByIndex } from '@/components/archive/ui/card/card-variants'
import { formatArchiveDate } from './formatArchiveDate'
import { mediaToImageAsset } from './mediaToImageAsset'

export type CafePostData = Pick<
  Post,
  | 'id'
  | 'title'
  | 'heroImage'
  | 'PostType'
  | 'publishedAt'
  | 'createdAt'
  | 'coffeeOrigin'
  | 'coffeeProcess'
  | 'coffeeTags'
>

type MapPostToCafeItemOptions = {
  index?: number
  variant?: CardVariant
}

export function mapPostToCafeItem(
  post: CafePostData,
  options: MapPostToCafeItemOptions = {},
): CafeItem | null {
  if (!post.title) return null

  const image = mediaToImageAsset(post.heroImage) ?? undefined

  const badges: CafeBadge[] = []
  if (Array.isArray(post.coffeeTags)) {
    for (const tag of post.coffeeTags) {
      if (typeof tag === 'object' && tag !== null && 'name' in tag && 'color' in tag) {
        badges.push({ name: tag.name, color: tag.color })
      }
    }
  }

  return {
    id: String(post.id),
    type: 'cafe',
    date: formatArchiveDate(post.publishedAt ?? post.createdAt),
    variant: getVariantByIndex(options.index ?? 0, options.variant),
    title: post.title,
    origin: post.coffeeOrigin ?? '',
    process: post.coffeeProcess ?? '',
    image,
    badges,
  }
}
