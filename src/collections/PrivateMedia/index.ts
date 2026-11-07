import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { isAdminOrActiveFriend } from '@/access/isAdminOrActiveFriend'
import { vercelPrivateBlobFileHandler } from '@/utilities/vercelPrivateBlobFileHandler'

import { stripMetadata } from '../Media/hooks/stripMetadata'

/**
 * Media used by private content (private stories today, private posts later).
 * Files live in the private blob store and reads require an admin or active
 * friend session, so direct URLs cannot be fetched by anonymous visitors.
 */
export const PrivateMedia: CollectionConfig = {
  slug: 'private-media',
  typescript: {
    interface: 'PrivateMedia',
  },

  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdminOrActiveFriend,
    update: isAdmin,
  },

  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'filename', 'updatedAt'],
  },

  hooks: {
    beforeValidate: [stripMetadata],
  },

  upload: {
    handlers: [vercelPrivateBlobFileHandler],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'medium', width: 900 },
    ],
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
