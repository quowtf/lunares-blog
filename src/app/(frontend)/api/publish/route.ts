import { getPayload } from 'payload'
import config from '@payload-config'

import type { Media, Post } from '@/payload-types'

import { getServerSideURL } from '@/utilities/getURL'
import { checkPublishAuth } from '@/utilities/publish/auth'
import { createGalleryPost } from '@/utilities/publish/createGalleryPost'
import { createTextPost } from '@/utilities/publish/createTextPost'
import { parsePublicationDate } from '@/utilities/publish/date'
import { processImageFile } from '@/utilities/publish/images'
import { normalizePostType, type PublishPostType } from '@/utilities/publish/validation'

const MAX_GALLERY_IMAGES = 3
const GALLERY_IMAGE_FIELDS = [
  'images1',
  'images2',
  'images3',
  'image1',
  'image2',
  'image3',
  'images',
  'image',
  'files',
]

type UploadedImageField = {
  field: string
  file: File
}

function errorResponse(message: string, status: number): Response {
  return Response.json({ success: false, error: message }, { status })
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function firstValue(data: Record<string, unknown>, names: string[]): unknown {
  for (const name of names) {
    if (data[name] !== undefined) return data[name]
  }

  return undefined
}

function readFormString(formData: FormData, names: string[]): string {
  for (const name of names) {
    const value = formData.get(name)
    if (typeof value === 'string') return value.trim()
  }

  return ''
}

function isFile(value: FormDataEntryValue): value is File {
  return value instanceof File && value.size > 0
}

function getImageFiles(formData: FormData): UploadedImageField[] {
  return GALLERY_IMAGE_FIELDS.flatMap((field) =>
    formData
      .getAll(field)
      .filter(isFile)
      .map((file) => ({ field, file })),
  )
}

function isDryRun(req: Request): boolean {
  return new URL(req.url).searchParams.get('dryRun') === '1'
}

function toMediaId(media: number | Media): number {
  return typeof media === 'number' ? media : media.id
}

function successResponse({
  post,
  type,
  dateFallback,
  extra,
}: {
  post: Post
  type: PublishPostType
  dateFallback: boolean
  extra?: Record<string, unknown>
}): Response {
  return Response.json({
    success: true,
    type,
    id: post.id,
    slug: post.slug,
    publishedAt: post.publishedAt,
    dateFallback,
    url: null,
    adminUrl: `${getServerSideURL()}/admin/collections/posts/${post.id}`,
    ...extra,
  })
}

async function handleJson(req: Request): Promise<Response> {
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
  const rawPost = firstValue(data, ['post', 'tipo-de-post', 'type'])
  const postType = normalizePostType(rawPost)

  if (!postType) {
    return errorResponse('Invalid post type. Use "t" or "q".', 400)
  }

  if (postType === 'gallery') {
    return errorResponse('Gallery requires multipart/form-data with 1-3 images', 400)
  }

  const title = readString(data.title)
  if (!title) {
    return errorResponse('Missing title', 400)
  }

  const content = readString(data.content)
  if (!content) {
    return errorResponse('Missing content', 400)
  }

  const rawDate = firstValue(data, ['date', 'fecha-de-publicacion', 'publishedAt'])
  const { publishedAt, dateFallback } = parsePublicationDate(rawDate)

  if (isDryRun(req)) {
    return Response.json({
      success: true,
      dryRun: true,
      received: {
        post: rawPost ?? null,
        title: data.title ?? null,
        content: data.content ?? null,
        date: rawDate ?? null,
      },
      normalized: {
        type: postType,
        title,
        content,
        publishedAt,
        dateFallback,
      },
    })
  }

  try {
    const payload = await getPayload({ config })
    const post = await createTextPost({
      payload,
      postType,
      title,
      content,
      publishedAt,
    })

    return successResponse({ post, type: postType, dateFallback })
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

async function handleMultipart(req: Request): Promise<Response> {
  let formData: FormData

  try {
    formData = await req.formData()
  } catch {
    return errorResponse('Invalid form data', 400)
  }

  const rawPost = readFormString(formData, ['post', 'tipo-de-post', 'type'])
  const postType = normalizePostType(rawPost)

  if (postType !== 'gallery') {
    return errorResponse('Multipart is only supported for gallery posts. Use "g".', 400)
  }

  const uploads = getImageFiles(formData)

  if (uploads.length === 0) {
    return errorResponse('Missing images', 400)
  }

  if (uploads.length > MAX_GALLERY_IMAGES) {
    return errorResponse('Maximum 3 images allowed', 400)
  }

  console.info('[publish] gallery upload', {
    fields: Array.from(formData.keys()),
    images: uploads.map(({ field, file }) => ({
      field,
      name: file.name,
      size: file.size,
      type: file.type,
    })),
  })

  const rawDate = readFormString(formData, ['date', 'fecha-de-publicacion', 'publishedAt'])
  const { publishedAt, dateFallback } = parsePublicationDate(rawDate)

  if (isDryRun(req)) {
    return Response.json({
      success: true,
      dryRun: true,
      received: {
        post: rawPost || null,
        date: rawDate || null,
        fields: Array.from(formData.keys()),
        images: uploads.map(({ field, file }) => ({
          field,
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      },
      normalized: {
        type: postType,
        publishedAt,
        dateFallback,
        imageCount: uploads.length,
      },
    })
  }

  let images

  try {
    images = await Promise.all(uploads.map(({ file }) => processImageFile(file)))
  } catch (error) {
    return errorResponse(`Invalid image: ${(error as Error).message}`, 400)
  }

  try {
    const payload = await getPayload({ config })
    const post = await createGalleryPost({
      payload,
      images,
      publishedAt,
    })

    return successResponse({
      post,
      type: 'gallery',
      dateFallback,
      extra: {
        images: post.galleryImages?.map(toMediaId) ?? [],
      },
    })
  } catch (error) {
    const err = error as Error

    console.error({
      err,
      message: 'Error creating gallery post',
      stack: err.stack,
    })

    return errorResponse(err.message, 500)
  }
}

export async function POST(req: Request): Promise<Response> {
  const auth = checkPublishAuth(req)

  if (!auth.ok) {
    return errorResponse(auth.error, auth.status)
  }

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    return handleMultipart(req)
  }

  return handleJson(req)
}
