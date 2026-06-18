import type { Media } from '@/payload-types'

const SIZE_PRIORITY = [
  'large',
  'medium',
  'small',
  'xlarge',
  'square',
  'thumbnail',
  'og',
] as const

const NON_OPTIMIZABLE_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
])

const NON_OPTIMIZABLE_EXTENSIONS = ['.heic', '.heif']

function hasNonOptimizableExtension(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0] ?? url
  return NON_OPTIMIZABLE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function isNonOptimizableImage(
  url: string,
  mimeType?: string | null,
): boolean {
  if (mimeType && NON_OPTIMIZABLE_MIME_TYPES.has(mimeType.toLowerCase())) {
    return true
  }

  return hasNonOptimizableExtension(url)
}

/**
 * Payload generates webp/jpeg variants on upload. Prefer those over the original
 * when the source file (e.g. HEIC from iPhone) cannot be processed by next/image.
 */
export function getPreferredMediaFile(
  media: Media,
): { url: string; mimeType?: string | null } | null {
  const originalUrl = media.url
  if (!originalUrl) return null

  if (!isNonOptimizableImage(originalUrl, media.mimeType)) {
    return { url: originalUrl, mimeType: media.mimeType }
  }

  for (const sizeName of SIZE_PRIORITY) {
    const size = media.sizes?.[sizeName]
    if (size?.url) {
      return { url: size.url, mimeType: size.mimeType }
    }
  }

  return { url: originalUrl, mimeType: media.mimeType }
}

/**
 * next/image cannot reliably optimize Payload API routes with cache-busting query
 * strings, or formats like HEIC. Serve those directly instead.
 */
export function shouldUseUnoptimizedImage(
  src: string,
  mimeType?: string | null,
): boolean {
  if (!src) return false

  if (isNonOptimizableImage(src, mimeType)) return true

  if (src.startsWith('/api/media/')) return true

  try {
    const { pathname } = new URL(src, 'http://localhost')
    if (pathname.startsWith('/api/media/')) return true
  } catch {
    // ignore invalid URLs
  }

  return false
}
