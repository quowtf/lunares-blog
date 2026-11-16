import type { Payload, PayloadRequest } from 'payload'

import type { Media } from '@/payload-types'

function dateKey(value: string | Date | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export async function recomputeMediaVisibility(
  payload: Payload,
  mediaId: number,
  req?: PayloadRequest,
  now = new Date(),
): Promise<void> {
  const refs = await payload.find({
    collection: 'media-references',
    where: { media: { equals: mediaId } },
    limit: 0,
    depth: 0,
    overrideAccess: true,
    req,
  })

  const publicRefs = refs.docs.filter((ref) => ref.isPublic)

  const hasPublicPage = publicRefs.some((ref) => ref.sourceCollection === 'pages')

  const publicPostDates = publicRefs
    .filter((ref) => ref.sourceCollection === 'posts' && ref.publishedAt)
    .map((ref) => new Date(ref.publishedAt as string))
    .filter((date) => !Number.isNaN(date.getTime()))

  const storyDates = publicRefs
    .filter(
      (ref) =>
        ref.sourceCollection === 'stories' &&
        ref.expiresAt &&
        new Date(ref.expiresAt as string) > now,
    )
    .map((ref) => new Date(ref.expiresAt as string))
    .filter((date) => !Number.isNaN(date.getTime()))

  const latestPost = publicPostDates.length
    ? new Date(Math.max(...publicPostDates.map((date) => date.getTime())))
    : null

  const publicUntil = storyDates.length
    ? new Date(Math.max(...storyDates.map((date) => date.getTime())))
    : null

  const current = await payload.findByID({
    collection: 'media',
    id: mediaId,
    depth: 0,
    disableErrors: true,
    overrideAccess: true,
    req,
  })

  // The media may have been deleted while the reference rows were being updated.
  if (!current) return

  // Static assets pinned as public are never downgraded by reference counting.
  if (current.alwaysPublic) {
    if (
      current.visibility === 'public' &&
      dateKey(current.latestPostPublishedAt) === null &&
      dateKey(current.publicUntil) === null
    ) {
      return
    }

    await payload.update({
      collection: 'media',
      id: mediaId,
      data: {
        visibility: 'public',
        latestPostPublishedAt: null,
        publicUntil: null,
      },
      depth: 0,
      overrideAccess: true,
      req,
      context: { skipMediaVisibilityHooks: true },
    })
    return
  }

  const visibility: Media['visibility'] = hasPublicPage
    ? 'public'
    : latestPost
      ? 'post-window'
      : 'private'

  const latestPostISO = latestPost?.toISOString() ?? null
  const publicUntilISO = publicUntil?.toISOString() ?? null

  if (
    current.visibility === visibility &&
    dateKey(current.latestPostPublishedAt) === latestPostISO &&
    dateKey(current.publicUntil) === publicUntilISO
  ) {
    return
  }

  await payload.update({
    collection: 'media',
    id: mediaId,
    data: {
      visibility,
      latestPostPublishedAt: latestPostISO,
      publicUntil: publicUntilISO,
    },
    depth: 0,
    overrideAccess: true,
    req,
    context: { skipMediaVisibilityHooks: true },
  })
}
