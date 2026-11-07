import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import type { Story } from '@/payload-types'

export async function POST(req: Request): Promise<Response> {
  try {
    // Validate secret
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    const expectedSecret = process.env.STORIES_SECRET
    if (!expectedSecret) {
      console.error('STORIES_SECRET not configured')
      return new Response('Server configuration error', { status: 500 })
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      console.warn('Unauthorized attempt to create story')
      return new Response('Unauthorized', { status: 401 })
    }

    const payload = await getPayload({ config })

    // Parse multipart form data
    const formData = await req.formData()

    const caption = formData.get('caption') as string | null
    const rawVisibility = formData.get('visibility')
    const visibility = rawVisibility === 'private' ? 'private' : 'public'
    let imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return new Response('Image is required', { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)

    // Infer mimetype from extension if missing or invalid
    const ext = imageFile.name.toLowerCase().split('.').pop() || ''
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    let mimetype = imageFile.type

    if (!mimetype || !validImageTypes.includes(mimetype)) {
      const extToMime: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        heic: 'image/jpeg',
        heif: 'image/jpeg',
      }
      mimetype = extToMime[ext] || 'image/jpeg'
    }

    // Convert HEIC/HEIF to JPEG using sharp
    if (['heic', 'heif'].includes(ext)) {
      const sharp = (await import('sharp')).default
      buffer = await sharp(buffer).jpeg({ quality: 85 }).toBuffer()
      mimetype = 'image/jpeg'
      // Update filename to .jpg
      imageFile = new File([buffer], imageFile.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), {
        type: 'image/jpeg',
      })
    }

    // Private stories must use the private-media collection so the file is
    // never exposed through the public media route.
    const mediaData = {
      alt: caption || 'Story image',
      filename: imageFile.name,
    }
    const mediaFile = {
      name: imageFile.name,
      data: buffer,
      mimetype: mimetype,
      size: buffer.length,
    }

    const mediaDoc =
      visibility === 'private'
        ? await payload.create({
            collection: 'private-media',
            data: mediaData,
            file: mediaFile,
          })
        : await payload.create({
            collection: 'media',
            data: mediaData,
            file: mediaFile,
          })

    // Get the first admin user as author (assumed to be the owner)
    const users = await payload.find({
      collection: 'users',
      limit: 1,
      where: {
        role: {
          equals: 'admin',
        },
      },
    })

    if (users.docs.length === 0) {
      return new Response('No admin user found', { status: 500 })
    }

    const authorId = users.docs[0].id

    // Create story
    const story = await payload.create({
      collection: 'stories',
      data: {
        ...(visibility === 'private'
          ? { privateImage: mediaDoc.id }
          : { image: mediaDoc.id }),
        caption: caption || '',
        author: authorId,
        visibility,
        duration: '24',
      } as unknown as Story,
    })

    return Response.json({
      success: true,
      story: {
        id: story.id,
        caption: story.caption,
        createdAt: story.createdAt,
      },
    })
  } catch (error) {
    const err = error as Error
    console.error({
      err,
      message: 'Error creating story',
      stack: err.stack,
      cause: err.cause,
    })
    return new Response(`Error creating story: ${err.message}`, { status: 500 })
  }
}