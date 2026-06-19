import type { Access } from 'payload'

export const isActiveFriend: Access = ({ req: { user } }) => {
  if (!user) return false

  return user.role === 'friend' && user.status === 'active'
}