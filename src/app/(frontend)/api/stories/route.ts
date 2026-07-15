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
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return new Response('Image is required', { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload image to media collection
    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: caption || 'Story image',
        filename: imageFile.name,
      },
      file: {
        name: imageFile.name,
        data: buffer,
        mimetype: imageFile.type,
        size: buffer.length,
      },
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
        image: mediaDoc.id,
        caption: caption || '',
        author: authorId,
        visibility: 'public',
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
    console.error({ err: error, message: 'Error creating story' })
    return new Response('Error creating story', { status: 500 })
  }
}