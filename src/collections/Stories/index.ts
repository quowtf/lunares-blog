import type { CollectionConfig } from 'payload'

import { link } from '../../fields/link'
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
          label: '48 horas',
          value: '48',
        },
        {
          label: '72 horas',
          value: '72',
        },
      ],
      validate: (value: string | null | undefined) => {
        if (value === null || value === undefined || value === '') return true
        const allowed = ['12', '24', '72', '48']
        if (!allowed.includes(value)) {
          return `El campo duration solo permite los valores: ${allowed.join(', ')}`
        }
        return true
      },
    },
    link({
      disableLabel: true,
      appearances: false,
      overrides: {
        name: 'link',
        admin: {
          description: 'Enlace opcional para mostrar en la story',
        },
      },
    }),
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        readOnly: false,
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
