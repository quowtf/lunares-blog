import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

export const computeExpiresAt: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation === 'create') {
    const duration = Number(data.duration ?? '24')
    data.expiresAt = new Date(Date.now() + duration * 3600 * 1000).toISOString()
  }

  if (operation === 'update') {
    if (data.expiresAt !== undefined && data.expiresAt !== originalDoc?.expiresAt) {
      throw new APIError('El campo expiresAt es de solo lectura y no puede ser modificado', 400)
    }

    // Preserve original expiresAt
    data.expiresAt = originalDoc?.expiresAt
  }

  return data
}
