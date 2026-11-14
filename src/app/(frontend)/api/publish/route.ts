import { getPayload } from 'payload'
import config from '@payload-config'

import { getServerSideURL } from '@/utilities/getURL'
import { checkPublishAuth } from '@/utilities/publish/auth'
import { createTextPost } from '@/utilities/publish/createTextPost'
import { parsePublicationDate } from '@/utilities/publish/date'
import { normalizePostType } from '@/utilities/publish/validation'

function errorResponse(message: string, status: number): Response {
  return Response.json({ success: false, error: message }, { status })
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(req: Request): Promise<Response> {
  const auth = checkPublishAuth(req)

  if (!auth.ok) {
    return errorResponse(auth.error, auth.status)
  }

  let body: unknown

  try {
    body = await req.json()
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return errorResponse('Invalid JSON body', 400)
  }

  const data = body as Record<string, unknown>
  const postType = normalizePostType(data.post ?? data['tipo-de-post'] ?? data.type)

  if (!postType) {
    return errorResponse('Invalid post type. Use "t" or "q".', 400)
  }

  const title = readString(data.title)
  if (!title) {
    return errorResponse('Missing title', 400)
  }

  const content = readString(data.content)
  if (!content) {
    return errorResponse('Missing content', 400)
  }

  const { publishedAt, dateFallback } = parsePublicationDate(
    data.date ?? data['fecha-de-publicacion'] ?? data.publishedAt,
  )

  try {
    const payload = await getPayload({ config })
    const post = await createTextPost({
      payload,
      postType,
      title,
      content,
      publishedAt,
    })

    return Response.json({
      success: true,
      type: postType,
      id: post.id,
      slug: post.slug,
      publishedAt: post.publishedAt,
      dateFallback,
      url: null,
      adminUrl: `${getServerSideURL()}/admin/collections/posts/${post.id}`,
    })
  } catch (error) {
    const err = error as Error

    console.error({
      err,
      message: 'Error creating text post',
      stack: err.stack,
    })

    return errorResponse(err.message, 500)
  }
}
