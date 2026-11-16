import type { ImageAsset } from '@/types/archive'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import type { MediaDoc } from '@/utilities/media/mediaValue'
import {
  getPreferredMediaFile,
  isMediaRestrictedForImage,
  shouldUseUnoptimizedImage,
} from '@/utilities/payloadMedia'
import type { MediaValue } from '@/utilities/media/mediaValue'
import { getMediaDoc, unwrapMediaValue } from '@/utilities/media/mediaValue'

type MediaToImageAssetOptions = {
  /** When set, prefer this imageSize variant over the original. */
  preferredSize?: string
}

export function mediaToImageAsset(
  media: MediaValue,
  options: MediaToImageAssetOptions = {},
): ImageAsset | null {
  const unwrapped = unwrapMediaValue(media)
  if (!unwrapped || typeof unwrapped === 'number') return null

  const doc = getMediaDoc(media) as MediaDoc | null
  if (!doc) return null

  // If a specific imageSize is requested and available, use it
  if (options.preferredSize) {
    const sizeData = doc.sizes?.[options.preferredSize as keyof typeof doc.sizes]
    if (sizeData && typeof sizeData === 'object' && 'url' in sizeData && sizeData.url) {
      const src = getMediaUrl(sizeData.url, doc.updatedAt)
      if (src) {
        return {
          alt: doc.alt || '',
          src,
          unoptimized:
            shouldUseUnoptimizedImage(src, sizeData.mimeType) ||
            isMediaRestrictedForImage(doc),
        }
      }
    }
  }

  const preferred = getPreferredMediaFile(doc)
  if (!preferred) return null

  const src = getMediaUrl(preferred.url, doc.updatedAt)
  if (!src) return null

  return {
    alt: doc.alt || '',
    src,
    unoptimized:
      shouldUseUnoptimizedImage(src, preferred.mimeType) || isMediaRestrictedForImage(doc),
  }
}
