import type { CollectionBeforeChangeHook } from 'payload'

export const enforceFriendDefaults: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (req.user?.role === 'admin') {
    return data
  }

  // The local API is server-side and privileged by design (same trust boundary
  // as `overrideAccess`). Seed/test users, verification updates and email-code
  // persistence depend on being able to write `role`/`status`.
  if (req.payloadAPI === 'local') {
    return data
  }

  if (operation === 'create') {
    // Bootstrap: the first user created through the public REST endpoint must
    // become an active admin, otherwise nobody could ever log in.
    const existingUsers = await req.payload.count({
      collection: 'users',
    })

    if (existingUsers.totalDocs === 0) {
      return {
        ...data,
        role: 'admin',
        status: 'active',
      }
    }

    return {
      ...data,
      role: 'friend',
      status: 'pending',
    }
  }

  // Only authenticated non-admin updates are locked.
  if (operation === 'update' && req.user && originalDoc) {
    return {
      ...data,
      role: originalDoc.role,
      status: originalDoc.status,
    }
  }

  return data
}
