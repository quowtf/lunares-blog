/**
 * Resolves media URLs for the frontend.
 *
 * Payload may store absolute URLs with `http://localhost:3000` when media was
 * uploaded locally, while the files actually live on a deployed origin.
 * Set `NEXT_PUBLIC_MEDIA_URL` (https, no trailing slash) to rewrite those URLs.
 *
 * When no media URL is configured, localhost absolute URLs are reduced to
 * relative paths so Next.js can serve `/api/media/file/...` from the dev server.
 */

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, '')
}

function appendCacheTag(url: string, cacheTag?: string | null): string {
  if (!cacheTag || cacheTag === '') return url

  const encoded = encodeURIComponent(cacheTag)
  return url.includes('?') ? `${url}&v=${encoded}` : `${url}?v=${encoded}`
}

export function getMediaBaseURL(): string {
  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL
  if (mediaUrl) return stripTrailingSlash(mediaUrl)

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return stripTrailingSlash(process.env.NEXT_PUBLIC_SERVER_URL || '')
}

function resolveMediaOrigin(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url
  }

  try {
    const parsed = new URL(url)
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]'

    if (!isLocalhost) {
      return url
    }

    const mediaBase = process.env.NEXT_PUBLIC_MEDIA_URL
    if (mediaBase) {
      return `${stripTrailingSlash(mediaBase)}${parsed.pathname}${parsed.search}`
    }

    return `${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}

export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  let resolved = resolveMediaOrigin(url.trim())

  if (resolved.startsWith('/') && process.env.NEXT_PUBLIC_MEDIA_URL) {
    resolved = `${stripTrailingSlash(process.env.NEXT_PUBLIC_MEDIA_URL)}${resolved}`
  }

  return appendCacheTag(resolved, cacheTag)
}

function getVercelBlobHostnames(): string[] {
  const access = process.env.BLOB_STORE_ACCESS === 'private' ? 'private' : 'public'
  const hostnames = new Set<string>([`**.${access}.blob.vercel-storage.com`])

  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([a-z\d]+)_/i)?.[1]
  if (storeId) {
    hostnames.add(`${storeId.toLowerCase()}.${access}.blob.vercel-storage.com`)
  }

  return Array.from(hostnames)
}

export function getMediaRemotePatterns(): { hostname: string; protocol: 'http' | 'https' }[] {
  const candidates = [
    process.env.NEXT_PUBLIC_MEDIA_URL,
    process.env.NEXT_PUBLIC_SERVER_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
  ].filter(Boolean) as string[]

  const patterns = new Map<string, 'http' | 'https'>()

  for (const candidate of candidates) {
    try {
      const { hostname, protocol } = new URL(candidate)
      patterns.set(hostname, protocol.replace(':', '') as 'http' | 'https')
    } catch {
      // ignore invalid URLs
    }
  }

  for (const hostname of getVercelBlobHostnames()) {
    patterns.set(hostname, 'https')
  }

  return Array.from(patterns.entries()).map(([hostname, protocol]) => ({
    hostname,
    protocol,
  }))
}
