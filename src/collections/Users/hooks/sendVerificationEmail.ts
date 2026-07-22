import type { CollectionAfterChangeHook } from 'payload'

import {
  generateVerificationCode,
  getVerificationExpiry,
  sendVerificationCode,
} from '@/utilities/email'

export const sendVerificationEmail: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  context,
}) => {
  if (operation !== 'create') return doc
  if (doc.role === 'admin') return doc
  if (context?.skipVerificationEmail) return doc

  const code = generateVerificationCode()
  const expiry = getVerificationExpiry()

  // Store code and expiry on user (bypass hooks to avoid loops)
  await req.payload.update({
    collection: 'users',
    id: doc.id,
    data: {
      verificationCode: code,
      verificationExpiry: expiry.toISOString(),
      verificationAttempts: 0,
    },
    // Skip hooks to prevent infinite loop
    context: { skipVerificationEmail: true },
  })

  await sendVerificationCode(doc.email, code)

  return doc
}
