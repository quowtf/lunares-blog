import type { CollectionConfig } from 'payload'

import { enforceFriendDefaults } from './hooks/beforeChange'

export const Users: CollectionConfig = {
  slug: 'users',

  auth: true,

  access: {
    admin: ({ req }) => {
      return req.user?.role === 'admin'
    },

    create: () => true,

    read: ({ req }) => {
      if (!req.user) return false
      return true
    },
    update: ({ req, id }) => {
      if (!req.user) return false

      return (
        req.user.role === 'admin' ||
        req.user.id === id
      )
    },
    delete: ({ req, id }) => {
      if (!req.user) return false

      return (
        req.user.role === 'admin' ||
        req.user.id === id
      )
    },
  },

  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'status'],
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },

    {
      name: 'role',
      type: 'select',
      defaultValue: 'friend',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Friend', value: 'friend' },
      ],
      required: true,
    },

    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Pending', value: 'pending' },
        { label: 'Blocked', value: 'blocked' },
      ],
    },
  ],

  hooks: {
    beforeChange: [enforceFriendDefaults],
  },

  timestamps: true,
}
