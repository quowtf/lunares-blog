'use client'

import { useAuthUser } from '@/components/auth/use-auth-user'
import { isAdminSession } from '@/utilities/auth/roles'

import { NewEntryButton } from './new-entry-button'

export function NewEntryButtonAuth() {
  const { user, isLoading } = useAuthUser()

  if (isLoading || !isAdminSession(user)) return null

  return <NewEntryButton />
}
