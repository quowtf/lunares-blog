import type { CollectionBeforeChangeHook } from 'payload'

export const computeExpiresAt: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation === 'create') {
    if (!data.expiresAt) {
      const duration = Number(data.duration ?? '24')
      data.expiresAt = new Date(Date.now() + duration * 3600 * 1000).toISOString()
    }
  }

  if (operation === 'update') {
    if (data.expiresAt !== undefined && data.expiresAt !== originalDoc?.expiresAt) {
      return data
    }

    if (data.duration !== undefined && data.duration !== originalDoc?.duration) {
      const createdAt = originalDoc?.createdAt ?? new Date().toISOString()
      const duration = Number(data.duration)
      data.expiresAt = new Date(
        new Date(createdAt).getTime() + duration * 3600 * 1000,
      ).toISOString()
      return data
    }

    data.expiresAt = originalDoc?.expiresAt
  }

  return data
}
