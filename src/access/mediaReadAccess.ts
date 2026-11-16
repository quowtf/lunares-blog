import type { Access } from 'payload'

import { getPublicMediaWhere } from '@/utilities/archive/mediaVisibility'
import { hasValidSession } from '@/utilities/auth/roles'

/**
 * Media files are public only while the content that references them is public.
 *
 * Always returns a `where` constraint instead of `true`: Payload's file route
 * (`checkFileAccess`) only loads the document when there is a constraint, and
 * the blob handler needs the document to choose the right Cache-Control header.
 */
export const mediaReadAccess: Access = ({ req }) => {
  if (hasValidSession(req.user)) {
    return { id: { exists: true } }
  }

  // Fail closed by default. Set ARCHIVE_MEDIA_GATE=off only for a controlled
  // rollback or before the reference backfill has run on a fresh database.
  if (process.env.ARCHIVE_MEDIA_GATE === 'off') {
    return { id: { exists: true } }
  }

  return getPublicMediaWhere()
}
