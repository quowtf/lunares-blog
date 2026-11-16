import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { createLocalReq, getPayload } from 'payload'

/**
 * Returns a Payload instance plus a local request bound to the current visitor.
 *
 * Passing `req` to local API calls makes `overrideAccess: false` see the real
 * user, which matters for the date-gated archive access.
 */
export async function getPayloadRequest() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })
  const req = await createLocalReq({ user: user ?? undefined }, payload)

  return { payload, req, user }
}
