'use client'

import { useCallback, useEffect, useState } from 'react'

import { AUTH_CHANGE_EVENT, fetchCurrentUser, setAuthCache } from '@/components/comments/api'
import type { AuthUser } from '@/components/comments/types'

/**
 * Shared client-side auth state.
 *
 * Reads `/api/users/me` once (deduped by the comments auth cache) and stays in
 * sync when any surface logs a user in or out through `setAuthCache`.
 */
export function useAuthUser() {
  const [user, setUserState] = useState<AuthUser | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    const sync = (nextUser: AuthUser | null) => {
      if (!cancelled) setUserState(nextUser)
    }

    fetchCurrentUser()
      .then(sync)
      .catch(() => sync(null))

    const handleAuthChange = (event: Event) => {
      sync((event as CustomEvent<AuthUser | null>).detail ?? null)
    }

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange)

    return () => {
      cancelled = true
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange)
    }
  }, [])

  const setUser = useCallback((nextUser: AuthUser | null) => {
    setUserState(nextUser)
    setAuthCache(nextUser)
  }, [])

  return {
    user: user ?? null,
    isLoading: user === undefined,
    setUser,
  }
}
