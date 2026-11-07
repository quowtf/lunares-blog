import type { CollectionBeforeLoginHook } from 'payload'

import { APIError } from 'payload'

import { AUTH_ERROR_MESSAGES } from '@/utilities/authMessages'

export const beforeLogin: CollectionBeforeLoginHook = async ({ user }) => {
  // Legacy users created before the status field existed have `null` here.
  // Treat them as active; new registrations are always explicitly `pending`.
  if (user.status === 'pending') {
    throw new APIError(AUTH_ERROR_MESSAGES.pending, 403, null, true)
  }

  if (user.status === 'blocked') {
    throw new APIError(AUTH_ERROR_MESSAGES.blocked, 403, null, true)
  }

  return user
}
