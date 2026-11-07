import type { CollectionBeforeChangeHook } from 'payload'

import { PRIVATE_STORY_DURATION_HOURS } from '../constants'

function plusHours(fromMs: number, hours: number): string {
  return new Date(fromMs + hours * 60 * 60 * 1000).toISOString()
}

function computePublicExpiresAt(
  createdAtIso: string,
  durationHours: string | number | null | undefined,
): string {
  const createdAtMs = new Date(createdAtIso).getTime()
  const hours = Number(durationHours)
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 24
  return plusHours(createdAtMs, safeHours)
}

/**
 * - create private → now + 6h (ignores `duration`)
 * - create public  → createdAt + `duration`
 * - update private → conserve original `expiresAt`; ignore `duration` / manual `expiresAt`
 * - update public→private → fresh now + 6h window
 * - update private→public → createdAt + `duration`
 * - update public → manual `expiresAt` wins, then `duration` change recalculates, else unchanged
 */
export const computeExpiresAt: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation === 'create') {
    if (data.visibility === 'private') {
      // Private stories must always expire 6h after creation. Ignore any
      // manual `expiresAt` supplied by the client.
      data.expiresAt = plusHours(Date.now(), PRIVATE_STORY_DURATION_HOURS)
    } else if (!data.expiresAt) {
      data.expiresAt = computePublicExpiresAt(new Date().toISOString(), data.duration)
    }
    return data
  }

  if (operation === 'update') {
    const originalVisibility = originalDoc?.visibility
    const nextVisibility = data.visibility ?? originalVisibility

    if (nextVisibility === 'private') {
      if (originalVisibility === 'private') {
        // Already private: conserve the original expiry, ignore duration/expiresAt edits.
        // Legacy private docs without an expiry get a fresh 6h window.
        data.expiresAt =
          originalDoc?.expiresAt ?? plusHours(Date.now(), PRIVATE_STORY_DURATION_HOURS)
      } else {
        // Public → private: fresh 6h window
        data.expiresAt = plusHours(Date.now(), PRIVATE_STORY_DURATION_HOURS)
      }
      return data
    }

    // Public from here on
    if (data.expiresAt !== undefined && data.expiresAt !== originalDoc?.expiresAt) {
      return data // manual override wins
    }

    const visibilityChanged = data.visibility !== undefined && data.visibility !== originalVisibility
    const durationChanged = data.duration !== undefined && data.duration !== originalDoc?.duration

    if (visibilityChanged || durationChanged) {
      data.expiresAt = computePublicExpiresAt(
        originalDoc?.createdAt ?? new Date().toISOString(),
        data.duration ?? originalDoc?.duration,
      )
    } else {
      data.expiresAt = originalDoc?.expiresAt
    }
  }

  return data
}
