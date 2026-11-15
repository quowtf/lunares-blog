import type { Payload } from 'payload'

import type { User } from '@/payload-types'

export async function resolveAdminUser(payload: Payload): Promise<User> {
  const configuredId = process.env.ADMIN_USER_ID?.trim()

  if (configuredId) {
    try {
      return await payload.findByID({
        collection: 'users',
        id: configuredId,
        overrideAccess: true,
      })
    } catch (error) {
      payload.logger.warn({
        err: error,
        msg: 'ADMIN_USER_ID not found; falling back to first admin user',
      })
    }
  }

  const admins = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 1,
    sort: 'createdAt',
    overrideAccess: true,
  })

  if (admins.docs.length === 0) {
    throw new Error('No admin user found')
  }

  return admins.docs[0]
}
