'use client'

import { useAuthUser } from '@/components/auth/use-auth-user'
import { hasValidSession, isAdminSession } from '@/utilities/auth/roles'

import { ArchiveSearch } from './archive-search'
import { LoginButton } from './login-button'
import { NewEntryButtonAuth } from './new-entry-button-auth'

export function HeroActions() {
  const { user, isLoading } = useAuthUser()

  if (isLoading) return null

  if (isAdminSession(user)) {
    return (
      <nav className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center md:items-end">
        <ArchiveSearch />
        <NewEntryButtonAuth />
      </nav>
    )
  }

  if (hasValidSession(user)) return null

  return (
    <div className="absolute right-0 top-2.5 md:static md:justify-self-end">
      <LoginButton
        compact
        panelAlign="end"
        panelClassName="max-md:left-auto max-md:right-0"
        panelTitle="Inicia sesión"
      />
    </div>
  )
}
