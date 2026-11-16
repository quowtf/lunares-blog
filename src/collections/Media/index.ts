import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { isAdmin } from '@/access/isAdmin'
import { mediaReadAccess } from '@/access/mediaReadAccess'
import { vercelPrivateBlobFileHandler } from '@/utilities/vercelPrivateBlobFileHandler'

import { cleanupMediaReferences } from './hooks/cleanupMediaReferences'
import { stripMetadata } from './hooks/stripMetadata'
import { syncAlwaysPublicVisibility } from './hooks/syncAlwaysPublicVisibility'

export const Media: CollectionConfig = {
  slug: 'media',

  folders: true,

  access: {
    create: isAdmin,
    delete: isAdmin,
    read: mediaReadAccess,
    update: isAdmin,
  },

  hooks: {
    beforeValidate: [stripMetadata],
    afterChange: [syncAlwaysPublicVisibility],
    afterDelete: [cleanupMediaReferences],
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

    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    {
      name: 'alwaysPublic',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: 'Siempre pública',
      admin: {
        position: 'sidebar',
        description:
          'Assets estáticos que nunca deben pasar al gate de posts. No se copian a private-media.',
      },
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'private',
      index: true,
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Post window', value: 'post-window' },
        { label: 'Private', value: 'private' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'latestPostPublishedAt',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'publicUntil',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'archiveRetentionUntil',
      type: 'date',
      index: true,
      access: {
        read: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
}
