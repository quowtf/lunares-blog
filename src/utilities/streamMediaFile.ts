import { get } from '@vercel/blob'

import { getBlobReadWriteToken, getBlobStoreAccess } from './blobStorage'

export type StreamableMedia = {
  url?: string | null
  filename?: string | null
  mimeType?: string | null
}

export type StreamedMedia = {
  body: ReadableStream
  contentType: string
  contentDisposition?: string
}

/**
 * Streams the bytes of a media doc without redirecting to the storage URL.
 *
 * Private Vercel Blob stores reject unauthenticated reads (the plain URL
 * returns 204), so private files go through the SDK `get()` with the store
 * token — same approach as `vercelPrivateBlobFileHandler`. This includes
 * relative URLs like `/api/private-media/file/foo.jpg`, whose route requires
 * an authenticated session and would fail on a server-side fetch.
 *
 * Returns null when the file cannot be read (treat as 404).
 */
export async function streamMediaFile(
  media: StreamableMedia,
  origin: string,
): Promise<StreamedMedia | null> {
  const url = media.url
  if (!url) return null

  const absolute = url.startsWith('http') ? url : `${origin}${url.startsWith('/') ? '' : '/'}${url}`

  try {
    const parsed = new URL(absolute)
    const isBlobUrl = parsed.hostname.endsWith('.blob.vercel-storage.com')

    // Private stores reject unauthenticated reads on the blob URL itself, so
    // those go through the SDK `get()` with the store token — same approach
    // as `vercelPrivateBlobFileHandler`.
    if (getBlobStoreAccess() === 'private') {
      const token = getBlobReadWriteToken()
      if (!token) return null

      // Blob keys are not URL-encoded. Decode the pathname so filenames with
      // spaces or special characters resolve correctly.
      const fileMarkerIndex = parsed.pathname.indexOf('/file/')
      const fileKey = isBlobUrl
        ? decodeURIComponent(parsed.pathname.replace(/^\//, ''))
        : fileMarkerIndex >= 0
          ? decodeURIComponent(parsed.pathname.slice(fileMarkerIndex + '/file/'.length))
          : media.filename
            ? decodeURIComponent(media.filename)
            : null

      if (fileKey) {
        const result = await get(fileKey, { access: 'private', token })
        if (!result?.stream) return null

        return {
          body: result.stream,
          contentType: result.blob.contentType,
          contentDisposition: result.blob.contentDisposition,
        }
      }
    }

    // Public stores.
    const response = await fetch(absolute)
    if (!response.ok || !response.body) return null

    return {
      body: response.body,
      contentType:
        response.headers.get('content-type') ?? media.mimeType ?? 'application/octet-stream',
      contentDisposition: response.headers.get('content-disposition') ?? undefined,
    }
  } catch {
    return null
  }
}
