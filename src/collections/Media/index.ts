import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { vercelPrivateBlobFileHandler } from '@/utilities/vercelPrivateBlobFileHandler'

import { stripMetadata } from './hooks/stripMetadata'

export const Media: CollectionConfig = {
  slug: 'media',

  folders: true,

  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },

  hooks: {
    beforeValidate: [stripMetadata],
  },

  upload: {
    handlers: [vercelPrivateBlobFileHandler],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 300 },
      { name: 'gallery', width: 400, height: 400, crop: 'center' },
      { name: 'square', width: 500, height: 500 },
      { name: 'small', width: 600 },
      { name: 'medium', width: 900 },
      { name: 'large', width: 1400 },
      { name: 'xlarge', width: 1920 },
      { name: 'og', width: 1200, height: 630, crop: 'center' },
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
  ],
}
