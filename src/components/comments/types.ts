export type AuthUser = {
  id: number
  name: string
  email: string
  role: 'admin' | 'friend'
  status?: 'active' | 'pending' | 'blocked' | null
}

export type PanelView = 'login' | 'signup' | 'verify' | 'comment' | 'success'
