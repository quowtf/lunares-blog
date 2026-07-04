import type { CollectionBeforeLoginHook } from 'payload'

export const beforeLogin: CollectionBeforeLoginHook = async ({ user }) => {
  if (user.status !== 'active') {
    throw new Error('Account not approved yet')
  }

  return user
}