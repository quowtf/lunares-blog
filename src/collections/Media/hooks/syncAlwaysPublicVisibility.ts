import type { CollectionAfterChangeHook } from 'payload'

import type { Media } from '@/payload-types'
import { recomputeMediaVisibility } from '@/utilities/archive/media/recomputeMediaVisibility'

/**
 * Recomputes visibility when the `alwaysPublic` flag changes. The recompute
 * update itself carries `skipMediaVisibilityHooks` to avoid a loop.
 */
export const syncAlwaysPublicVisibility: CollectionAfterChangeHook<Media> = async ({
  context,
  doc,
  previousDoc,
  req,
}) => {
  if (context?.skipMediaVisibilityHooks) return doc
  if (Boolean(doc.alwaysPublic) === Boolean(previousDoc?.alwaysPublic)) return doc

  await recomputeMediaVisibility(req.payload, doc.id, req)
  return doc
}
