import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

import { canViewPrivateStories } from '@/collections/Stories/access/storiesReadAccess'
import { streamMediaFile } from '@/utilities/streamMediaFile'

export const dynamic = 'force-dynamic'

function notFound(): Response {
  return new Response('Not found', { status: 404 })
}

/**
 * Streams the image of a story with access control applied.
 * Private stories are only served to admins / active friends, and only
 * while unexpired. Response is never cacheable.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: rawId } = await params
    const storyId = Number(rawId)
    if (!Number.isInteger(storyId) || storyId <= 0) return notFound()

    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })

    let story
    try {
      story = await payload.findByID({
        collection: 'stories',
        id: storyId,
        depth: 1,
        overrideAccess: false,
        user,
      })
    } catch {
      // Not found or read access denied
      return notFound()
    }

    // Redundant manual checks: findByID cannot be filtered by filterActiveStories
    if (story.visibility === 'private' && !canViewPrivateStories(user)) return notFound()
    if (!story.expiresAt || new Date(story.expiresAt).getTime() <= Date.now()) return notFound()

    // Private stories use the private-media collection. Legacy private stories
    // may still point to the public media collection; support both.
    const image =
      story.visibility === 'private' ? (story.privateImage ?? story.image) : story.image
    if (!image || typeof image === 'number') return notFound()

    const streamed = await streamMediaFile(image, new URL(_req.url).origin)
    if (!streamed) return notFound()

    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', streamed.contentType)
    responseHeaders.set('Content-Disposition', 'inline')
    responseHeaders.set('Cache-Control', 'private, no-store')
    responseHeaders.set('X-Content-Type-Options', 'nosniff')

    if (streamed.contentType === 'image/svg+xml') {
      responseHeaders.set('Content-Security-Policy', "script-src 'none'")
    }

    return new Response(streamed.body, { headers: responseHeaders, status: 200 })
  } catch (err) {
    console.error('[stories/image] failed:', err)
    return notFound()
  }
}
