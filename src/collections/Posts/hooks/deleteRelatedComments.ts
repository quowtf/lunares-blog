import type { CollectionBeforeDeleteHook } from 'payload'

export const deleteRelatedComments: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await req.payload.delete({
    collection: 'comments',
    where: {
      post: { equals: id },
    },
    req,
  })
}
