type SessionUser =
  | {
      role?: string | null
      status?: string | null
    }
  | null
  | undefined

export function isAdminSession(user: SessionUser): boolean {
  return user?.role === 'admin'
}

export function hasValidSession(user: SessionUser): boolean {
  if (!user) return false
  if (isAdminSession(user)) return true

  return user.role === 'friend' && user.status === 'active'
}
