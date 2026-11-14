import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { slugify } from 'payload/shared'

import type { Post, User } from '@/payload-types'

import { textToLexical } from './lexical'
import type { TextPostType } from './validation'

const MAX_SLUG_BASE_LENGTH = 60

type CreateTextPostArgs = {
  payload: Payload
  postType: TextPostType
  title: string
  content: string
  publishedAt: string
}

function buildSlug(postType: TextPostType, title: string, publishedAt: string): string {
  const base = (slugify(title) || postType).slice(0, MAX_SLUG_BASE_LENGTH).replace(/-+$/, '')
  const date = publishedAt.slice(0, 10).replace(/-/g, '')
  const suffix = randomUUID().slice(0, 4)

  return `${base}-${date}-${suffix}`
}

async function resolveAdminUser(payload: Payload): Promise<User> {
  const configuredId = process.env.ADMIN_USER_ID?.trim()

  if (configuredId) {
    try {
      return await payload.findByID({
        collection: 'users',
        id: configuredId,
        overrideAccess: true,
      })
    } catch (error) {
      payload.logger.warn({
        err: error,
        msg: 'ADMIN_USER_ID not found; falling back to first admin user',
      })
    }
  }

  const admins = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 1,
    sort: 'createdAt',
    overrideAccess: true,
  })

  if (admins.docs.length === 0) {
    throw new Error('No admin user found')
  }

  return admins.docs[0]
}

export async function createTextPost({
  payload,
  postType,
  title,
  content,
  publishedAt,
}: CreateTextPostArgs): Promise<Post> {
  const author = await resolveAdminUser(payload)

  return payload.create({
    collection: 'posts',
    data: {
      title,
      content: textToLexical(content),
      PostType: postType,
      _status: 'published',
      publishedAt,
      authors: [author.id],
      slug: buildSlug(postType, title, publishedAt),
    },
    overrideAccess: true,
    user: author,
  })
}
