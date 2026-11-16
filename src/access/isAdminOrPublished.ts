import type { Access, Where } from 'payload'

import { getArchiveCutoff } from '@/utilities/archive/archiveWindow'

/**
 * Posts are public only inside the archive window (current + previous month).
 * Older posts require an admin or an active friend session.
 */
export const isAdminOrPublished: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') return true

  const published: Where = {
    _status: {
      equals: 'published',
    },
  }

  if (user?.role === 'friend' && user.status === 'active') {
    return published
  }

  return {
    and: [
      published,
      {
        publishedAt: {
          greater_than_equal: getArchiveCutoff().toISOString(),
        },
      },
    ],
  }
}
