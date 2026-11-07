import { getPayload } from 'payload'
import config from '@payload-config'

import type { Media } from '@/payload-types'
import { getPreferredMediaFile } from '@/utilities/payloadMedia'
import { streamMediaFile } from '@/utilities/streamMediaFile'

export const dynamic = 'force-dynamic'

type SizeName = 'original' | 'thumbnail' | 'medium'

const VALID_SIZES: SizeName[] = ['original', 'thumbnail', 'medium']

function parseSize(value: string | null): SizeName {
  return VALID_SIZES.find((size) => size === value) ?? 'original'
}

function resolveFile(media: Media, size: SizeName): { url: string; mimeType?: string | null } | null {
  if (size === 'original') return getPreferredMediaFile(media)

  const variant = media.sizes?.[size]
  if (!variant?.url) return getPreferredMediaFile(media)

  return { url: variant.url, mimeType: variant.mimeType }
}

function notFound(): Response {
  return new Response('Not found', { status: 404 })
}

/**
 * Stable public URL for a media document.
 *
 * `GET /api/media/:id/image` resolves the *current* file of a media doc on every
 * request, so the URL keeps working even if the file (and therefore the blob
 * URL / filename) is replaced from the admin panel.
 *
 * Optional query params:
 * - `size=thumbnail|medium` (default: original, with HEIC fallback to a variant)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: rawId } = await params
    const id = Number(rawId)
    if (!Number.isInteger(id) || id <= 0) return notFound()

    const payload = await getPayload({ config })

    let media: Media
    try {
      media = await payload.findByID({
        collection: 'media',
        id,
        depth: 0,
        overrideAccess: false,
      })
    } catch {
      // Not found or read access denied
      return notFound()
    }

    const { searchParams } = new URL(req.url)
    const size = parseSize(searchParams.get('size'))

    const file = resolveFile(media, size)
    if (!file?.url) return notFound()

    // Changes whenever the document (and therefore the file) is updated.
    const etag = `"media-${media.id}-${size}-${new Date(media.updatedAt).getTime()}"`
    const ifNoneMatch = req.headers.get('if-none-match')

    if (ifNoneMatch?.split(',').some((tag) => tag.trim() === etag)) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      })
    }

    const streamed = await streamMediaFile(
      { url: file.url, filename: media.filename, mimeType: file.mimeType },
      new URL(req.url).origin,
    )

    if (!streamed) return notFound()

    const headers = new Headers()
    headers.set('Content-Type', streamed.contentType)
    headers.set('Content-Disposition', 'inline')
    headers.set('ETag', etag)
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300')
    headers.set('X-Content-Type-Options', 'nosniff')

    if (streamed.contentType === 'image/svg+xml') {
      headers.set('Content-Security-Policy', "script-src 'none'")
    }

    return new Response(streamed.body, { headers, status: 200 })
  } catch (err) {
    console.error('[media/image] failed:', err)
    return notFound()
  }
}
