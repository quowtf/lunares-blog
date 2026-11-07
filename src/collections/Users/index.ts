import type { CollectionConfig, FieldAccess } from 'payload'

import { enforceFriendDefaults } from './hooks/beforeChange'
import { beforeLogin } from './hooks/beforeLogin'
import { notifyRegistration } from './hooks/notifyRegistration'
import { sendVerificationEmail } from './hooks/sendVerificationEmail'

const isAdminField: FieldAccess = ({ req }) => {
  return req.user?.role === 'admin'
}

const isAdminOrSelf: FieldAccess = ({ id, req }) => {
  if (req.user?.role === 'admin') return true
  if (!req.user || id === undefined || id === null) return false

  return String(req.user.id) === String(id)
}

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
      access: {
        create: isAdminField,
        read: isAdminOrSelf,
        update: isAdminField,
      },
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
      access: {
        create: isAdminField,
        read: isAdminOrSelf,
        update: isAdminField,
      },
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
      access: {
        create: isAdminField,
        read: isAdminField,
        update: isAdminField,
      },
      admin: { hidden: true },
    },
    {
      name: 'verificationExpiry',
      type: 'date',
      access: {
        create: isAdminField,
        read: isAdminField,
        update: isAdminField,
      },
      admin: { hidden: true },
    },
    {
      name: 'verificationAttempts',
      type: 'number',
      access: {
        create: isAdminField,
        read: isAdminField,
        update: isAdminField,
      },
      defaultValue: 0,
      admin: { hidden: true },
    },
  ],

  hooks: {
    beforeLogin: [beforeLogin],
    beforeChange: [enforceFriendDefaults],
    afterChange: [notifyRegistration, sendVerificationEmail],
  },

  timestamps: true,
}
