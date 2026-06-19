import { getFileKey, getFilePrefix as getDocPrefix } from '@payloadcms/plugin-cloud-storage/utilities'
import { BlobNotFoundError, get } from '@vercel/blob'
import { headersWithCors, type PayloadRequest } from 'payload'

import { getBlobReadWriteToken, getBlobStoreAccess } from './blobStorage'

/**
 * Private Vercel Blob stores require authenticated reads. Payload's default
 * vercel-blob adapter fetches file bytes with an unauthenticated fetch(), which
 * returns 204. This handler runs first and streams blobs via the SDK get().
 */
export async function vercelPrivateBlobFileHandler(
  req: PayloadRequest,
  args: {
    doc: { prefix?: string | null }
    headers?: Headers
    params: {
      clientUploadContext?: unknown
      collection: string
      filename: string
      prefix?: string
    }
  },
): Promise<Response | void> {
  if (getBlobStoreAccess() !== 'private') return

  const token = getBlobReadWriteToken()
  if (!token) return

  const { collection: collectionSlug, filename } = args.params
  const collectionConfig = req.payload.config.collections.find(
    (config) => config.slug === collectionSlug,
  )

  if (!collectionConfig) return

  try {
    const docPrefix = await getDocPrefix({
      clientUploadContext: args.params.clientUploadContext,
      collection: collectionConfig,
      filename,
      prefixQueryParam: args.params.prefix,
      req,
    })

    const { fileKey } = getFileKey({
      collectionPrefix: '',
      docPrefix,
      filename,
      useCompositePrefixes: false,
    })

    const blobResult = await get(fileKey, {
      access: 'private',
      token,
    })

    if (!blobResult?.stream) {
      return new Response(null, { status: 404, statusText: 'Not Found' })
    }

    const responseHeaders = new Headers(args.headers)
    responseHeaders.set('Cache-Control', `public, max-age=${60 * 60 * 24 * 365}`)
    responseHeaders.set('Content-Type', blobResult.blob.contentType)
    responseHeaders.set('Content-Disposition', blobResult.blob.contentDisposition)

    if (blobResult.blob.contentType === 'image/svg+xml') {
      responseHeaders.set('Content-Security-Policy', "script-src 'none'")
    }

    return new Response(blobResult.stream, {
      headers: headersWithCors({ headers: responseHeaders, req }),
      status: blobResult.statusCode,
    })
  } catch (err) {
    if (err instanceof BlobNotFoundError) {
      return new Response(null, { status: 404, statusText: 'Not Found' })
    }

    req.payload.logger.error({ err, msg: 'vercelPrivateBlobFileHandler failed' })
    return new Response('Internal Server Error', { status: 500 })
  }
}
