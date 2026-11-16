'use server'

import type { Where } from 'payload'

import type { ArchivePostData } from '@/components/archive/archive-post-card'
import { archivePostSelect } from '@/utilities/archive/postSelect'
import { getArchiveCutoff } from '@/utilities/archive/archiveWindow'
import type { ArchiveCursor, LoadArchivePostsResult } from '@/utilities/archive/archiveCursor'
import { hasValidSession } from '@/utilities/auth/roles'
import { getPayloadRequest } from '@/utilities/getPayloadRequest'

const PAGE_SIZE = 10

type LoadArchivePostsInput = {
  cursor?: unknown
}

function readCursor(
  value: unknown,
): { cursor: ArchiveCursor | null; valid: true } | { valid: false } {
  if (value == null) return { cursor: null, valid: true }
  if (typeof value !== 'object') return { valid: false }

  const candidate = value as { id?: unknown; publishedAt?: unknown }

  if (
    typeof candidate.id !== 'number' ||
    !Number.isInteger(candidate.id) ||
    candidate.id <= 0 ||
    typeof candidate.publishedAt !== 'string'
  ) {
    return { valid: false }
  }

  const publishedAt = new Date(candidate.publishedAt)
  if (Number.isNaN(publishedAt.getTime())) return { valid: false }

  return {
    cursor: { id: candidate.id, publishedAt: publishedAt.toISOString() },
    valid: true,
  }
}

/**
 * Loads the next page of archived posts.
 *
 * The session is verified on the server on every call. The query runs with
 * `overrideAccess: false` and the authenticated request, so Payload's access
 * control remains the final authority over what this user can read.
 */
export async function loadArchivePosts(
  input?: LoadArchivePostsInput,
): Promise<LoadArchivePostsResult> {
  const { payload, req, user } = await getPayloadRequest()

  if (!hasValidSession(user)) {
    return { ok: false, reason: 'unauthorized' }
  }

  const parsedCursor = readCursor(input?.cursor)
  if (!parsedCursor.valid) {
    return { ok: false, reason: 'error' }
  }

  const cutoff = getArchiveCutoff().toISOString()
  const conditions: Where[] = [
    {
      _status: {
        equals: 'published',
      },
    },
    {
      publishedAt: {
        exists: true,
      },
    },
    {
      publishedAt: {
        less_than: cutoff,
      },
    },
  ]

  if (parsedCursor.cursor) {
    conditions.push({
      or: [
        {
          publishedAt: {
            less_than: parsedCursor.cursor.publishedAt,
          },
        },
        {
          and: [
            {
              publishedAt: {
                equals: parsedCursor.cursor.publishedAt,
              },
            },
            {
              id: {
                less_than: parsedCursor.cursor.id,
              },
            },
          ],
        },
      ],
    })
  }

  try {
    const result = await payload.find({
      collection: 'posts',
      depth: 1,
      draft: false,
      limit: PAGE_SIZE + 1,
      overrideAccess: false,
      pagination: true,
      req,
      select: archivePostSelect,
      sort: ['-publishedAt', '-id'],
      where: {
        and: conditions,
      },
    })

    const hasMore = result.docs.length > PAGE_SIZE
    const docs = result.docs.slice(0, PAGE_SIZE)
    const lastDoc = docs.at(-1)

    return {
      hasMore,
      nextCursor:
        lastDoc?.id != null && lastDoc.publishedAt
          ? { id: lastDoc.id, publishedAt: lastDoc.publishedAt }
          : null,
      ok: true,
      posts: docs as ArchivePostData[],
    }
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: 'Failed to load archived posts',
    })

    return { ok: false, reason: 'error' }
  }
}
