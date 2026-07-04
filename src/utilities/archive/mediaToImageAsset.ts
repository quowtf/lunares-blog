import type { Media } from '@/payload-types'
import type { ImageAsset } from '@/types/archive'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { getPreferredMediaFile, shouldUseUnoptimizedImage } from '@/utilities/payloadMedia'

type MediaToImageAssetOptions = {
  /** When set, prefer this imageSize variant over the original. */
  preferredSize?: string
}

export function mediaToImageAsset(
  media: Media | number | null | undefined,
  options: MediaToImageAssetOptions = {},
): ImageAsset | null {
  if (!media || typeof media === 'number') return null

  // If a specific imageSize is requested and available, use it
  if (options.preferredSize) {
    const sizeData = media.sizes?.[options.preferredSize as keyof typeof media.sizes]
    if (sizeData && typeof sizeData === 'object' && 'url' in sizeData && sizeData.url) {
      const src = getMediaUrl(sizeData.url, media.updatedAt)
      if (src) {
        return {
          alt: media.alt || '',
          src,
          unoptimized: shouldUseUnoptimizedImage(src, sizeData.mimeType),
        }
      }
    }
  }

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
