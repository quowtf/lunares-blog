import type { CollectionBeforeChangeHook } from 'payload'

export const enforceFriendDefaults: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation !== 'create' || req.user?.role === 'admin') {
    return data
  }

  return {
    ...data,
    role: 'friend',
    status: 'pending',
  }
}
