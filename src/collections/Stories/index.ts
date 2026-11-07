import type { CollectionConfig } from 'payload'

import { link } from '../../fields/link'
import { isAdmin } from '../../access/isAdmin'
import { storiesReadAccess } from './access/storiesReadAccess'
import { computeExpiresAt } from './hooks/computeExpiresAt'
import { enforcePrivateStoryImage } from './hooks/enforcePrivateStoryImage'
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
    beforeChange: [setAuthorFromUser, enforcePrivateStoryImage, computeExpiresAt],
    beforeOperation: [filterActiveStories],
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        condition: (_, siblingData) => siblingData?.visibility !== 'private',
        description: 'Imagen para historias públicas.',
      },
    },
    {
      name: 'privateImage',
      type: 'upload',
      relationTo: 'private-media',
      required: false,
      admin: {
        condition: (_, siblingData) => siblingData?.visibility === 'private',
        description:
          'Imagen para historias privadas. Solo la ven el admin y los amigos activos.',
      },
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
      admin: {
        description:
          'Las historias privadas expiran siempre a las 6 horas y solo las ven el admin y los amigos activos.',
      },
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
      admin: {
        // Irrelevant for private stories: they always expire after 6 hours
        condition: (_, siblingData) => siblingData?.visibility !== 'private',
      },
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
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'type',
                type: 'radio',
                admin: {
                  layout: 'horizontal',
                  width: '50%',
                },
                defaultValue: 'reference',
                options: [
                  {
                    label: 'Internal link',
                    value: 'reference',
                  },
                  {
                    label: 'Custom URL',
                    value: 'custom',
                  },
                ],
              },
              {
                name: 'newTab',
                type: 'checkbox',
                admin: {
                  style: {
                    alignSelf: 'flex-end',
                  },
                  width: '50%',
                },
                label: 'Open in new tab',
              },
            ],
          },
          {
            name: 'reference',
            type: 'relationship',
            admin: {
              condition: (_, siblingData) => siblingData?.type === 'reference',
            },
            label: 'Document to link to',
            relationTo: ['pages', 'posts'],
            required: false,
          },
          {
            name: 'url',
            type: 'text',
            admin: {
              condition: (_, siblingData) => siblingData?.type === 'custom',
            },
            label: 'Custom URL',
            required: false,
          },
        ],
      },
    }),
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        readOnly: false,
        description: 'Las historias privadas expiran siempre a las 6 horas.',
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
