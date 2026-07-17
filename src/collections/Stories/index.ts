import type { CollectionConfig } from 'payload'

import { isAdmin } from '../../access/isAdmin'
import { storiesReadAccess } from './access/storiesReadAccess'
import { computeExpiresAt } from './hooks/computeExpiresAt'
import { setAuthorFromUser } from './hooks/setAuthorFromUser'
import { filterActiveStories } from './hooks/filterActiveStories'

export const Stories: CollectionConfig = {
  slug: 'stories',
  typescript: {
    interface: 'Story',
  },
  timestamps: true,
  access: {
    create: isAdmin,
    read: storiesReadAccess,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [setAuthorFromUser, computeExpiresAt],
    beforeOperation: [filterActiveStories],
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'caption',
      type: 'text',
      required: false,
      maxLength: 500,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }) => user?.id,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'public',
      options: [
        {
          label: 'Public',
          value: 'public',
        },
        {
          label: 'Private',
          value: 'private',
        },
      ],
      validate: (value: string | null | undefined) => {
        if (value === null || value === undefined || value === '') return true
        const allowed = ['public', 'private']
        if (!allowed.includes(value)) {
          return `El campo visibility solo permite los valores: ${allowed.join(', ')}`
        }
        return true
      },
    },
    {
      name: 'duration',
      type: 'select',
      defaultValue: '24',
      options: [
        {
          label: '12 horas',
          value: '12',
        },
        {
          label: '24 horas',
          value: '24',
        },
        {
          label: '32 horas',
          value: '32',
        },
        {
          label: '48 horas',
          value: '48',
        },
      ],
      validate: (value: string | null | undefined) => {
        if (value === null || value === undefined || value === '') return true
        const allowed = ['12', '24', '32', '48']
        if (!allowed.includes(value)) {
          return `El campo duration solo permite los valores: ${allowed.join(', ')}`
        }
        return true
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    // Telemetry fields
    {
      name: 'views',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'taps',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'visible',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Total milliseconds visible',
      },
    },
    {
      name: 'skips',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
  ],
}
