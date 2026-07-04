import type { Access } from 'payload'

export const storiesReadAccess: Access = ({ req: { user } }) => {
  // Admin: full access
  if (user?.role === 'admin') return true

  // Active friend: full access
  if (user?.role === 'friend' && user?.status === 'active') return true

  // Anonymous or inactive friend: only public stories
  return {
    visibility: {
      equals: 'public',
    },
  }
}
