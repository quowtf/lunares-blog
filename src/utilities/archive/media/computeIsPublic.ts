import { getArchiveCutoff } from '../archiveWindow'
import type { MediaReferenceSource } from './collectMediaReferences'

type SourceDoc = Record<string, unknown>

function asDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function computeIsPublic(
  sourceCollection: MediaReferenceSource,
  doc: SourceDoc,
  now = new Date(),
): boolean {
  if (sourceCollection === 'posts') {
    if (doc._status !== 'published') return false

    const publishedAt = asDate(doc.publishedAt)
    return !publishedAt || publishedAt <= now
  }

  if (sourceCollection === 'pages') {
    if (doc._status === 'draft') return false

    // Mirror Pages.read (`isAdminOrPublished`): a page outside the public
    // window is not readable by anonymous visitors, so its media must not be
    // public either.
    const publishedAt = asDate(doc.publishedAt)
    return !publishedAt || publishedAt >= getArchiveCutoff(now)
  }

  if (doc.visibility !== 'public') return false

  const expiresAt = asDate(doc.expiresAt)
  return Boolean(expiresAt && expiresAt > now)
}

export function getSourcePublicDate(
  sourceCollection: MediaReferenceSource,
  doc: SourceDoc,
): string | null {
  if (sourceCollection === 'posts' && typeof doc.publishedAt === 'string') {
    return doc.publishedAt
  }

  if (sourceCollection === 'stories' && typeof doc.expiresAt === 'string') {
    return doc.expiresAt
  }

  return null
}
