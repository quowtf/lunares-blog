import type { Where } from 'payload'

import type { Media } from '@/payload-types'

import { getArchiveCutoff } from './archiveWindow'

export type MediaVisibilityFields = {
  alwaysPublic?: boolean | null
  archiveRetentionUntil?: string | null
  latestPostPublishedAt?: string | null
  publicUntil?: string | null
  visibility?: Media['visibility'] | null
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Single source of truth for "can an anonymous visitor fetch this file now?".
 *
 * The access query in `mediaReadAccess` mirrors this logic. Keep both in sync.
 */
export function isMediaPublicNow(media: MediaVisibilityFields, now = new Date()): boolean {
  if (media.alwaysPublic) return true
  if (media.visibility === 'public') return true

  const publicUntil = toDate(media.publicUntil)
  if (publicUntil && publicUntil > now) return true

  if (media.visibility !== 'post-window') return false

  const latestPost = toDate(media.latestPostPublishedAt)
  if (!latestPost) return false

  return latestPost >= getArchiveCutoff(now)
}

export function getPublicMediaWhere(now = new Date()): Where {
  return {
    or: [
      { alwaysPublic: { equals: true } },
      { visibility: { equals: 'public' } },
      { publicUntil: { greater_than: now.toISOString() } },
      {
        and: [
          { visibility: { equals: 'post-window' } },
          { latestPostPublishedAt: { greater_than_equal: getArchiveCutoff(now).toISOString() } },
        ],
      },
    ],
  }
}
