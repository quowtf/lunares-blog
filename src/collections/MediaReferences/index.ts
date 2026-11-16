import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

/**
 * Internal index of which documents reference each public `media` item.
 * It powers the media access gate, shared-media protection and retention.
 */
export const MediaReferences: CollectionConfig<'media-references'> = {
  slug: 'media-references',
  admin: {
    hidden: true,
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'media',
      type: 'relationship',
      relationTo: 'media',
      required: true,
      index: true,
    },
    {
      name: 'sourceCollection',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Posts', value: 'posts' },
        { label: 'Pages', value: 'pages' },
        { label: 'Stories', value: 'stories' },
      ],
    },
    {
      name: 'sourceId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'fieldPath',
      type: 'text',
      required: true,
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      index: true,
    },
  ],
}
