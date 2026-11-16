import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { MediaReferenceSource } from './collectMediaReferences'
import {
  refreshMediaVisibility,
  reindexSource,
  removeSourceReferences,
} from './reindexMediaReferences'

function shouldSkip(
  sourceCollection: MediaReferenceSource,
  doc: Record<string, unknown>,
  previousDoc: Record<string, unknown> | undefined,
): boolean {
  if (sourceCollection === 'stories') return false
  if (sourceCollection === 'pages') {
    return doc._status === 'draft' && previousDoc?._status === 'draft'
  }

  // Posts can autosave every 100ms. Draft-to-draft saves cannot affect a
  // public visitor, so leave the index alone until the post is published or
  // stops being published.
  return doc._status !== 'published' && previousDoc?._status !== 'published'
}

export function createMediaReferenceHooks(sourceCollection: MediaReferenceSource): {
  afterChange: CollectionAfterChangeHook
  afterDelete: CollectionAfterDeleteHook
} {
  const afterChange: CollectionAfterChangeHook = async ({
    context,
    doc,
    previousDoc,
    req,
  }) => {
    if (context?.skipMediaReferenceSync) return doc
    if (!doc?.id) return doc

    const docRecord = doc as unknown as Record<string, unknown>
    const previousRecord = previousDoc as unknown as Record<string, unknown> | undefined
    if (shouldSkip(sourceCollection, docRecord, previousRecord)) return doc

    const affected = await reindexSource({
      payload: req.payload,
      req,
      sourceCollection,
      doc: docRecord as Record<string, unknown> & { id: number | string },
    })

    // The previous document may have referenced media that the new one no
    // longer does; reindexSource already includes those ids.
    await refreshMediaVisibility(req.payload, affected, req)
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ context, doc, req }) => {
    if (context?.skipMediaReferenceSync || !doc?.id) return doc

    const affected = await removeSourceReferences({
      payload: req.payload,
      req,
      sourceCollection,
      sourceId: doc.id,
    })
    await refreshMediaVisibility(req.payload, affected, req)
    return doc
  }

  return { afterChange, afterDelete }
}
