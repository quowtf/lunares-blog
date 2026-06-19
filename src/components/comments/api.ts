import type { AuthUser } from './types'

type ApiError = {
  message?: string
  errors?: Array<{ message?: string }>
}

let cachedUser: AuthUser | null | undefined
let currentUserPromise: Promise<AuthUser | null> | null = null

function getErrorMessage(data: ApiError, fallback: string): string {
  if (data.message) return data.message
  if (data.errors?.[0]?.message) return data.errors[0].message
  return fallback
}

export function clearAuthCache() {
  cachedUser = undefined
  currentUserPromise = null
}

export function setAuthCache(user: AuthUser | null) {
  cachedUser = user
  currentUserPromise = Promise.resolve(user)
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (cachedUser !== undefined) return cachedUser

  if (!currentUserPromise) {
    currentUserPromise = fetch('/api/users/me', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return null
        const data: { user?: AuthUser | null } = await response.json()
        return data.user?.id ? data.user : null
      })
      .then((user) => {
        cachedUser = user
        return user
      })
      .catch(() => {
        cachedUser = null
        return null
      })
  }

  return currentUserPromise
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'No se pudo iniciar sesión'))
  }

  setAuthCache(data.user)
  return data.user
}

type SignupInput = {
  name: string
  email: string
  password: string
}

export async function signupUser(input: SignupInput): Promise<AuthUser> {
  const response = await fetch('/api/users', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      password: input.password,
      role: 'friend',
      status: 'active',
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'No se pudo crear la cuenta'))
  }

  return loginUser(input.email, input.password)
}

export async function submitComment(postId: string | number, text: string): Promise<void> {
  const response = await fetch('/api/comments', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      post: Number(postId),
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'No se pudo enviar el comentario'))
  }
}
