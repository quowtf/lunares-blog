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

  // Store code and expiry on user, then send email
  // Wrapped in try/catch so verification failure doesn't break registration
  try {
    await req.payload.update({
      collection: 'users',
      id: doc.id,
      req,
      data: {
        verificationCode: code,
        verificationExpiry: expiry.toISOString(),
        verificationAttempts: 0,
      },
      context: { skipVerificationEmail: true },
    })

    await sendVerificationCode(doc.email, code)
  } catch (error) {
    console.error('[sendVerificationEmail] Failed:', error)
  }

  return doc
}
