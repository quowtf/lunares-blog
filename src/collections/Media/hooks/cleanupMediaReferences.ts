import type { CollectionAfterDeleteHook } from 'payload'

export const cleanupMediaReferences: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (!doc?.id) return doc

  await req.payload.delete({
    collection: 'media-references',
    where: { media: { equals: doc.id } },
    overrideAccess: true,
  })

  return doc
}
