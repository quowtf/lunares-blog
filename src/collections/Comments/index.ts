import type { CollectionConfig } from 'payload'

import { notifyComment } from './hooks/notifyComment'

export const Comments: CollectionConfig = {
  slug: 'comments',

  admin: {
    useAsTitle: 'text',
  },

  access: {
    read: ({ req }) => {
      return req.user?.role === 'admin'
    },

    create: ({ req }) => {
      const user = req.user
      if (!user) return false

      return (
        user.role === 'admin' ||
        (user.role === 'friend' && user.status === 'active')
      )
    },

    update: ({ req }) => {
      return req.user?.role === 'admin'
    },

    delete: ({ req }) => {
      return req.user?.role === 'admin'
    },
  },

  fields: [
    {
      name: 'text',
      type: 'textarea',
      required: true,
    },

    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
      },
    },

    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
    },
  ],

  hooks: {
    beforeChange: [
      ({ req, data }) => {
        if (req.user) {
          data.user = req.user.id
        }
        return data
      },
    ],
    afterChange: [notifyComment],
  },
}
