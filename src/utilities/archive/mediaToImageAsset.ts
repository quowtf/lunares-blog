import type { Media } from '@/payload-types'
import type { ImageAsset } from '@/types/archive'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { getPreferredMediaFile, shouldUseUnoptimizedImage } from '@/utilities/payloadMedia'

export function mediaToImageAsset(
  media: Media | number | null | undefined,
): ImageAsset | null {
  if (!media || typeof media === 'number') return null

  const preferred = getPreferredMediaFile(media)
  if (!preferred) return null

  const src = getMediaUrl(preferred.url, media.updatedAt)
  if (!src) return null

  return {
    alt: media.alt || '',
    src,
    unoptimized: shouldUseUnoptimizedImage(src, preferred.mimeType),
  }
}
