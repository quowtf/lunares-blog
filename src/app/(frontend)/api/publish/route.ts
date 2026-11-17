import { getPayload } from 'payload'
import config from '@payload-config'

import type { Media, Post } from '@/payload-types'

import { getServerSideURL } from '@/utilities/getURL'
import { checkPublishAuth } from '@/utilities/publish/auth'
import { createGalleryPost } from '@/utilities/publish/createGalleryPost'
import { createImagePost } from '@/utilities/publish/createImagePost'
import { createRodadaPost } from '@/utilities/publish/createRodadaPost'
import { createSlidesPost } from '@/utilities/publish/createSlidesPost'
import { createTextPost } from '@/utilities/publish/createTextPost'
import { parsePublicationDate } from '@/utilities/publish/date'
import { processImageFile, type ProcessedImage } from '@/utilities/publish/images'
import { normalizePostType, type PublishPostType } from '@/utilities/publish/validation'

const MAX_GALLERY_IMAGES = 3
const IMAGE_FIELDS = ['image', 'heroImage', 'imagen', 'file']
const RODADA_HERO_FIELDS = ['ihero', 'imageHero', 'imagehero', 'heroImage', 'imagen', 'image']
const RODADA_IMAGE_FIELDS = ['image1', 'image2', 'image3', 'images1', 'images2', 'images3', 'files']
const SLIDES_IMAGE_FIELDS = [
  'image1',
  'image2',
  'image3',
  'images1',
  'images2',
  'images3',
  'images',
  'files',
  'image',
]
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

function getFirstImageFile(formData: FormData, fields: string[]): File | null {
  for (const field of fields) {
    const file = formData.get(field)
    if (file !== null && isFile(file)) return file
  }

  return null
}

function getSingleImageFile(formData: FormData): File | null {
  return getFirstImageFile(formData, IMAGE_FIELDS)
}

function getRodadaImageFiles(formData: FormData): File[] {
  return RODADA_IMAGE_FIELDS.flatMap((field) => formData.getAll(field).filter(isFile))
}

function getSlidesImageFiles(formData: FormData): File[] {
  return SLIDES_IMAGE_FIELDS.flatMap((field) => formData.getAll(field).filter(isFile))
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
    return errorResponse('Invalid post type. Use "t", "q", "g", "i", "r" or "s".', 400)
  }

  if (postType === 'gallery') {
    return errorResponse('Gallery requires multipart/form-data with 1-3 images', 400)
  }

  if (postType === 'image') {
    return errorResponse('Image posts require multipart/form-data with an image', 400)
  }

  if (postType === 'rodada') {
    return errorResponse(
      'Rodada posts require multipart/form-data with ihero and optional image1-3',
      400,
    )
  }

  if (postType === 'slides') {
    return errorResponse('Slides posts require multipart/form-data with 1-3 images', 400)
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

async function handleImageMultipart(
  req: Request,
  formData: FormData,
  rawPost: string,
): Promise<Response> {
  const imageFile = getSingleImageFile(formData)

  if (!imageFile) {
    return errorResponse('Missing image', 400)
  }

  const title = readFormString(formData, ['title', 'titulo', 'título'])
  const content = readFormString(formData, ['content', 'contenido', 'caption', 'text'])
  const category = readFormString(formData, ['category', 'categories', 'taxonomy', 'tag', 'label'])
  const rawDate = readFormString(formData, ['date', 'fecha-de-publicacion', 'publishedAt'])
  const { publishedAt, dateFallback } = parsePublicationDate(rawDate)

  if (isDryRun(req)) {
    return Response.json({
      success: true,
      dryRun: true,
      received: {
        post: rawPost || null,
        title: title || null,
        content: content || null,
        category: category || null,
        date: rawDate || null,
        fields: Array.from(formData.keys()),
        image: {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type,
        },
      },
      normalized: {
        type: 'image',
        title: title || null,
        content: content || null,
        category: category || null,
        publishedAt,
        dateFallback,
      },
    })
  }

  let image: ProcessedImage

  try {
    image = await processImageFile(imageFile)
  } catch (error) {
    return errorResponse(`Invalid image: ${(error as Error).message}`, 400)
  }

  try {
    const payload = await getPayload({ config })
    const post = await createImagePost({
      payload,
      image,
      category: category || undefined,
      title: title || undefined,
      content: content || undefined,
      publishedAt,
    })

    return successResponse({
      post,
      type: 'image',
      dateFallback,
      extra: {
        heroImage: post.heroImage ? toMediaId(post.heroImage) : null,
        categories:
          post.categories?.map((item) => (typeof item === 'number' ? item : item.id)) ?? [],
      },
    })
  } catch (error) {
    const err = error as Error

    console.error({
      err,
      message: 'Error creating image post',
      stack: err.stack,
    })

    return errorResponse(err.message, 500)
  }
}

async function handleRodadaMultipart(
  req: Request,
  formData: FormData,
  rawPost: string,
): Promise<Response> {
  const heroImageFile = getFirstImageFile(formData, RODADA_HERO_FIELDS)

  if (!heroImageFile) {
    return errorResponse('Missing ihero image', 400)
  }

  const imageFiles = getRodadaImageFiles(formData)

  if (imageFiles.length > MAX_GALLERY_IMAGES) {
    return errorResponse('Maximum 3 gallery images allowed', 400)
  }

  const title = readFormString(formData, ['title', 'titulo', 'título'])
  if (!title) {
    return errorResponse('Missing title', 400)
  }

  const content = readFormString(formData, ['content', 'contenido', 'caption', 'text'])
  if (!content) {
    return errorResponse('Missing content', 400)
  }

  const rawDate = readFormString(formData, ['date', 'fecha-de-publicacion', 'publishedAt'])
  const { publishedAt, dateFallback } = parsePublicationDate(rawDate)

  if (isDryRun(req)) {
    return Response.json({
      success: true,
      dryRun: true,
      received: {
        post: rawPost || null,
        title,
        content,
        date: rawDate || null,
        fields: Array.from(formData.keys()),
        ihero: {
          name: heroImageFile.name,
          size: heroImageFile.size,
          type: heroImageFile.type,
        },
        images: imageFiles.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      },
      normalized: {
        type: 'rodada',
        title,
        content,
        publishedAt,
        dateFallback,
        imageCount: imageFiles.length,
      },
    })
  }

  let processed: ProcessedImage[]

  try {
    processed = await Promise.all([
      processImageFile(heroImageFile, { preserveAlpha: true }),
      ...imageFiles.map((file) => processImageFile(file)),
    ])
  } catch (error) {
    return errorResponse(`Invalid image: ${(error as Error).message}`, 400)
  }

  const [heroImage, ...images] = processed

  try {
    const payload = await getPayload({ config })
    const post = await createRodadaPost({
      payload,
      heroImage,
      images,
      title,
      content,
      publishedAt,
    })

    return successResponse({
      post,
      type: 'rodada',
      dateFallback,
      extra: {
        heroImage: post.heroImage ? toMediaId(post.heroImage) : null,
        images: post.galleryImages?.map(toMediaId) ?? [],
      },
    })
  } catch (error) {
    const err = error as Error

    console.error({
      err,
      message: 'Error creating rodada post',
      stack: err.stack,
    })

    return errorResponse(err.message, 500)
  }
}

async function handleSlidesMultipart(
  req: Request,
  formData: FormData,
  rawPost: string,
): Promise<Response> {
  const imageFiles = getSlidesImageFiles(formData)

  if (imageFiles.length === 0) {
    return errorResponse('Missing images. Send 1 to 3.', 400)
  }

  if (imageFiles.length > MAX_GALLERY_IMAGES) {
    return errorResponse('Maximum 3 images allowed', 400)
  }

  const title = readFormString(formData, ['title', 'titulo', 'título'])
  if (!title) {
    return errorResponse('Missing title', 400)
  }

  const content = readFormString(formData, ['content', 'contenido', 'caption', 'text'])
  if (!content) {
    return errorResponse('Missing content', 400)
  }

  const category = readFormString(formData, ['category', 'categories', 'taxonomy', 'tag', 'label'])
  const rawDate = readFormString(formData, ['date', 'fecha-de-publicacion', 'publishedAt'])
  const { publishedAt, dateFallback } = parsePublicationDate(rawDate)

  if (isDryRun(req)) {
    return Response.json({
      success: true,
      dryRun: true,
      received: {
        post: rawPost || null,
        title,
        content,
        category: category || null,
        date: rawDate || null,
        fields: Array.from(formData.keys()),
        images: imageFiles.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      },
      normalized: {
        type: 'slides',
        title,
        content,
        category: category || null,
        publishedAt,
        dateFallback,
        imageCount: imageFiles.length,
      },
    })
  }

  let images: ProcessedImage[]

  try {
    images = await Promise.all(imageFiles.map((file) => processImageFile(file)))
  } catch (error) {
    return errorResponse(`Invalid image: ${(error as Error).message}`, 400)
  }

  try {
    const payload = await getPayload({ config })
    const post = await createSlidesPost({
      payload,
      images,
      category: category || undefined,
      title,
      content,
      publishedAt,
    })

    return successResponse({
      post,
      type: 'slides',
      dateFallback,
      extra: {
        images: post.galleryImages?.map(toMediaId) ?? [],
        categories:
          post.categories?.map((item) => (typeof item === 'number' ? item : item.id)) ?? [],
      },
    })
  } catch (error) {
    const err = error as Error

    console.error({
      err,
      message: 'Error creating slides post',
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

  if (postType === 'image') {
    return handleImageMultipart(req, formData, rawPost)
  }

  if (postType === 'rodada') {
    return handleRodadaMultipart(req, formData, rawPost)
  }

  if (postType === 'slides') {
    return handleSlidesMultipart(req, formData, rawPost)
  }

  if (postType !== 'gallery') {
    return errorResponse(
      'Multipart requires type "g" (gallery), "i" (image), "r" (rodada) or "s" (slides).',
      400,
    )
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
