'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { fetchCurrentUser, setAuthCache } from './api'
import type { AuthUser } from './types'

type CommentContextValue = {
  activePostId: string | null
  toggleComments: (postId: string | number) => void
  closeComments: () => void
  user: AuthUser | null
  isLoadingUser: boolean
  setUser: (user: AuthUser | null) => void
}

const CommentContext = createContext<CommentContextValue | null>(null)

export function CommentProvider({ children }: { children: React.ReactNode }) {
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [user, setUserState] = useState<AuthUser | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchCurrentUser()
      .then((currentUser) => {
        if (!cancelled) setUserState(currentUser)
      })
      .catch(() => {
        if (!cancelled) setUserState(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUser(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const setUser = useCallback((nextUser: AuthUser | null) => {
    setAuthCache(nextUser)
    setUserState(nextUser)
  }, [])

  const closeComments = useCallback(() => {
    setActivePostId(null)
  }, [])

  const toggleComments = useCallback((postId: string | number) => {
    const id = String(postId)
    setActivePostId((current) => (current === id ? null : id))
  }, [])

  const value = useMemo(
    () => ({
      activePostId,
      toggleComments,
      closeComments,
      user,
      isLoadingUser,
      setUser,
    }),
    [activePostId, toggleComments, closeComments, user, isLoadingUser, setUser],
  )

  return <CommentContext.Provider value={value}>{children}</CommentContext.Provider>
}

export function useCommentContext() {
  const context = useContext(CommentContext)

  if (!context) {
    throw new Error('useCommentContext must be used within a CommentProvider')
  }

  return context
}
