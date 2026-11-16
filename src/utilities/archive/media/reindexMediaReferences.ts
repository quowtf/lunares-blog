import type { Payload, PayloadRequest } from 'payload'

import { collectMediaReferences, type MediaReferenceSource } from './collectMediaReferences'
import { computeIsPublic, getSourcePublicDate } from './computeIsPublic'
import { recomputeMediaVisibility } from './recomputeMediaVisibility'

type SourceDoc = Record<string, unknown> & { id: number | string }

async function findReferencedMediaIds(
  payload: Payload,
  sourceCollection: MediaReferenceSource,
  sourceId: string,
  req?: PayloadRequest,
): Promise<number[]> {
  const existing = await payload.find({
    collection: 'media-references',
    where: {
      and: [
        { sourceCollection: { equals: sourceCollection } },
        { sourceId: { equals: sourceId } },
      ],
    },
    limit: 0,
    depth: 0,
    overrideAccess: true,
    req,
  })

  return existing.docs.map((reference) => reference.media as number)
}

async function deleteSourceReferences(
  payload: Payload,
  sourceCollection: MediaReferenceSource,
  sourceId: string,
  req?: PayloadRequest,
): Promise<void> {
  await payload.delete({
    collection: 'media-references',
    where: {
      and: [
        { sourceCollection: { equals: sourceCollection } },
        { sourceId: { equals: sourceId } },
      ],
    },
    overrideAccess: true,
    req,
  })
}

/**
 * Replaces the reference rows for one document and returns every media id
 * whose visibility may have changed (old and new references).
 */
export async function reindexSource({
  doc,
  payload,
  req,
  sourceCollection,
}: {
  doc: SourceDoc
  payload: Payload
  req?: PayloadRequest
  sourceCollection: MediaReferenceSource
}): Promise<number[]> {
  const sourceId = String(doc.id)
  const affected = new Set<number>(
    await findReferencedMediaIds(payload, sourceCollection, sourceId, req),
  )

  await deleteSourceReferences(payload, sourceCollection, sourceId, req)

  const references = collectMediaReferences({ doc, sourceCollection }).filter(
    (reference) => reference.relationTo === 'media',
  )

  const isPublic = computeIsPublic(sourceCollection, doc)
  const sourceDate = getSourcePublicDate(sourceCollection, doc)

  for (const reference of references) {
    affected.add(reference.mediaId)

    await payload.create({
      collection: 'media-references',
      data: {
        media: reference.mediaId,
        sourceCollection,
        sourceId,
        fieldPath: reference.fieldPath,
        isPublic,
        publishedAt: sourceCollection === 'posts' ? sourceDate : null,
        expiresAt: sourceCollection === 'stories' ? sourceDate : null,
      },
      overrideAccess: true,
      req,
    })
  }

  return Array.from(affected)
}

export async function removeSourceReferences({
  payload,
  req,
  sourceCollection,
  sourceId,
}: {
  payload: Payload
  req?: PayloadRequest
  sourceCollection: MediaReferenceSource
  sourceId: number | string
}): Promise<number[]> {
  const normalizedId = String(sourceId)
  const affected = await findReferencedMediaIds(payload, sourceCollection, normalizedId, req)
  await deleteSourceReferences(payload, sourceCollection, normalizedId, req)
  return affected
}

export async function refreshMediaVisibility(
  payload: Payload,
  mediaIds: number[],
  req?: PayloadRequest,
): Promise<void> {
  for (const mediaId of new Set(mediaIds)) {
    await recomputeMediaVisibility(payload, mediaId, req)
  }
}
