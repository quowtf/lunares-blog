import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { slugify } from 'payload/shared'

import type { Post } from '@/payload-types'

import { resolveAdminUser } from './author'
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

export async function createTextPost({
  payload,
  postType,
  title,
  content,
  publishedAt,
}: CreateTextPostArgs): Promise<Post> {
  const author = await resolveAdminUser(payload)
  const cleanTitle = title.trim()
  const cleanContent = content.trim()

  return payload.create({
    collection: 'posts',
    data: {
      title: cleanTitle,
      content: textToLexical(cleanContent),
      PostType: postType,
      _status: 'published',
      publishedAt,
      authors: [author.id],
      slug: buildSlug(postType, cleanTitle, publishedAt),
    },
    overrideAccess: true,
    user: author,
  })
}
