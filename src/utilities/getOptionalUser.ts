import { cookies } from 'next/headers'

import type { User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

export async function getOptionalUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) return null

  try {
    const response = await fetch(`${getServerSideURL()}/api/users/me`, {
      headers: {
        Authorization: `JWT ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) return null

    const data: { user?: User | null } = await response.json()
    return data.user?.id ? data.user : null
  } catch {
    return null
  }
}
