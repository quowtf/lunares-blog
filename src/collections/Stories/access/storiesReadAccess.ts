import type { Access } from 'payload'

/**
 * Who can see private stories: admins and active friends.
 * Shared by the collection access control, /momentos and the private image route.
 */
export function canViewPrivateStories(
  user: { role?: string | null; status?: string | null } | null | undefined,
): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.role === 'friend' && user.status === 'active'
}

export const storiesReadAccess: Access = ({ req: { user } }) => {
  if (canViewPrivateStories(user)) return true

  // Anonymous or inactive friend: only public stories
  return {
    visibility: {
      equals: 'public',
    },
  }
}
