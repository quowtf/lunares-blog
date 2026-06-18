'use client'

import { useEffect, useState } from 'react'

import { NewEntryButton } from './new-entry-button'

export function NewEntryButtonAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch('/api/users/me', { credentials: 'include' })
      .then((response) => response.json())
      .then((data: { user?: { id?: number } | null }) => {
        if (!cancelled) setIsAuthenticated(Boolean(data?.user?.id))
      })
      .catch(() => {
        if (!cancelled) setIsAuthenticated(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!isAuthenticated) return null

  return <NewEntryButton />
}
