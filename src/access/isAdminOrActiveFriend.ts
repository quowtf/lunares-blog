import type { Access } from 'payload'

/**
 * Private content is readable by admins and active friends only.
 * Used by private media and private stories.
 */
export const isAdminOrActiveFriend: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true

  return user.role === 'friend' && user.status === 'active'
}
