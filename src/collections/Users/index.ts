import type { CollectionConfig } from 'payload'

import { enforceFriendDefaults } from './hooks/beforeChange'
import { notifyRegistration } from './hooks/notifyRegistration'
import { sendVerificationEmail } from './hooks/sendVerificationEmail'

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

    // Email verification fields (hidden from admin)
    {
      name: 'verificationCode',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'verificationExpiry',
      type: 'date',
      admin: { hidden: true },
    },
    {
      name: 'verificationAttempts',
      type: 'number',
      defaultValue: 0,
      admin: { hidden: true },
    },
  ],

  hooks: {
    beforeChange: [enforceFriendDefaults],
    afterChange: [notifyRegistration, sendVerificationEmail],
  },

  timestamps: true,
}
