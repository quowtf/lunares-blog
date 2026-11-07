export type AuthUser = {
  id: number
  name: string
  email: string
  role: 'admin' | 'friend'
  status?: 'active' | 'pending' | 'blocked' | null
}

export type AuthView = 'login' | 'signup' | 'verify'

export type PanelView = AuthView | 'comment' | 'success' | 'blocked'
