import type { CollectionAfterChangeHook } from 'payload'

/**
 * Blocking a friend must also kill any live sessions.
 *
 * JWT validation only checks that the session id still exists on the user,
 * not its `expiresAt`, so clearing `sessions` revokes every active cookie.
 * `overrideAccess` is required because the `sessions` field rejects API
 * updates and is managed internally by Payload.
 */
export const revokeSessionsOnBlock: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== 'update' || doc.status !== 'blocked' || previousDoc?.status === 'blocked') {
    return doc
  }

  await req.payload.update({
    collection: 'users',
    id: doc.id,
    data: {
      sessions: [],
    },
    overrideAccess: true,
    req,
  })

  return doc
}
