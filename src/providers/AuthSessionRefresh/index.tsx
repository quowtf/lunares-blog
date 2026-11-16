'use client'

import React, { useEffect, useRef } from 'react'

const REFRESH_THROTTLE_MS = 5 * 60 * 1000
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000

/**
 * Keeps the Payload auth cookie alive for signed-in visitors.
 *
 * The token lasts 7 days from login, but Payload can rotate it through
 * `POST /api/users/refresh-token`. Refreshing on mount, focus and tab
 * visibility turns that fixed window into a sliding one for active users.
 *
 * Anonymous visitors are ignored: `/api/users/me` returns 200 with a null
 * user, so no failing requests are sent.
 */
export function AuthSessionRefresh({ children }: { children: React.ReactNode }) {
  const lastAttemptRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    const refreshSession = async () => {
      if (cancelled) return

      const now = Date.now()
      if (now - lastAttemptRef.current < REFRESH_THROTTLE_MS) return
      lastAttemptRef.current = now

      try {
        const meResponse = await fetch('/api/users/me', { credentials: 'include' })
        if (!meResponse.ok) return

        const data: { user?: unknown } = await meResponse.json()
        if (!data.user) return

        await fetch('/api/users/refresh-token', {
          method: 'POST',
          credentials: 'include',
        })
      } catch {
        // Offline or transient network errors: the next focus retries.
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshSession()
    }

    void refreshSession()

    window.addEventListener('focus', refreshSession)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    const interval = window.setInterval(refreshSession, REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      window.removeEventListener('focus', refreshSession)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.clearInterval(interval)
    }
  }, [])

  return <>{children}</>
}
