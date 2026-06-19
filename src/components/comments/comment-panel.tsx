'use client'

import { Lock } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utilities/ui'

import { loginUser, signupUser, submitComment } from './api'
import {
  COMMENT_ERROR_MESSAGE,
  COMMENT_PANEL_EXIT_MS,
  COMMENT_SUCCESS_DISMISS_MS,
  COMMENT_SUCCESS_MESSAGE,
} from './constants'
import { useCommentContext } from './comment-provider'
import type { AuthUser, PanelView } from './types'

type CommentPanelProps = {
  postId: string | number
}

function getInitialView(user: AuthUser | null, isLoadingUser: boolean): PanelView | null {
  if (isLoadingUser) return null
  return user ? 'comment' : 'login'
}

export function CommentPanel({ postId }: CommentPanelProps) {
  const panelId = useId()
  const { activePostId, closeComments, user, isLoadingUser, setUser } = useCommentContext()

  const isActive = activePostId === String(postId)

  const [view, setView] = useState<PanelView | null>(() => getInitialView(user, isLoadingUser))
  const [hasError, setHasError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    if (!isActive) {
      setHasError(false)
      setIsSubmitting(false)
      setIsExiting(false)
      setCommentText('')
      return
    }

    setHasError(false)
    setCommentText('')
    setView(getInitialView(user, isLoadingUser))
  }, [isActive, user, isLoadingUser])

  useEffect(() => {
    if (view !== 'success' || !isActive) return

    const dismissTimer = window.setTimeout(() => {
      setIsExiting(true)
    }, COMMENT_SUCCESS_DISMISS_MS)

    return () => {
      window.clearTimeout(dismissTimer)
    }
  }, [view, isActive])

  useEffect(() => {
    if (!isExiting) return

    const exitTimer = window.setTimeout(() => {
      closeComments()
      setIsExiting(false)
      setView(getInitialView(user, isLoadingUser))
    }, COMMENT_PANEL_EXIT_MS)

    return () => {
      window.clearTimeout(exitTimer)
    }
  }, [isExiting, closeComments, user, isLoadingUser])

  if (!isActive) return null

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasError(false)
    setIsSubmitting(true)

    try {
      const authenticatedUser = await loginUser(loginEmail, loginPassword)
      setUser(authenticatedUser)
      setView('comment')
    } catch {
      setHasError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasError(false)
    setIsSubmitting(true)

    try {
      const authenticatedUser = await signupUser({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
      })
      setUser(authenticatedUser)
      setView('comment')
    } catch {
      setHasError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasError(false)
    setIsSubmitting(true)

    try {
      await submitComment(postId, commentText.trim())
      setView('success')
    } catch {
      setHasError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      aria-labelledby={panelId}
      className={cn(
        'comment-panel mt-3 overflow-hidden rounded-card border border-[#F5F4F2] bg-white p-4 shadow-sm',
        isExiting ? 'comment-panel-exit' : 'comment-panel-enter',
      )}
      role="region"
    >
      {view === 'success' ? (
        <p className="text-sm leading-6 text-stone-600" id={panelId}>
          {COMMENT_SUCCESS_MESSAGE}
        </p>
      ) : (
        <>
          <p
            className="mb-3 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-stone-500"
            id={panelId}
          >
            {view === 'login' && 'Inicia sesión para comentar'}
            {view === 'signup' && 'Crea tu cuenta'}
            {view === 'comment' && 'Tu comentario'}
            {view === null && 'Cargando'}
          </p>

          {hasError ? (
            <p className="mb-3 text-sm text-stone-500">{COMMENT_ERROR_MESSAGE}</p>
          ) : null}

          {view === null ? (
            <p className="text-sm text-stone-500">Verificando sesión…</p>
          ) : null}

          {view === 'login' ? (
            <form className="space-y-3" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <Label className="text-xs text-stone-600" htmlFor={`${panelId}-login-email`}>
                  Correo
                </Label>
                <Input
                  autoComplete="email"
                  id={`${panelId}-login-email`}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  required
                  type="email"
                  value={loginEmail}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-stone-600" htmlFor={`${panelId}-login-password`}>
                  Contraseña
                </Label>
                <Input
                  autoComplete="current-password"
                  id={`${panelId}-login-password`}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                  type="password"
                  value={loginPassword}
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-stone-500">
                  ¿No tienes cuenta?{' '}
                  <button
                    className="text-stone-800 underline-offset-4 transition hover:text-stone-500 hover:underline"
                    onClick={() => {
                      setHasError(false)
                      setView('signup')
                    }}
                    type="button"
                  >
                    Regístrate
                  </button>
                </p>

                <Button disabled={isSubmitting} size="sm" type="submit">
                  {isSubmitting ? 'Entrando…' : 'Entrar'}
                </Button>
              </div>
            </form>
          ) : null}

          {view === 'signup' ? (
            <form className="space-y-3" onSubmit={handleSignup}>
              <div className="space-y-1.5">
                <Label className="text-xs text-stone-600" htmlFor={`${panelId}-signup-name`}>
                  Nombre
                </Label>
                <Input
                  autoComplete="name"
                  id={`${panelId}-signup-name`}
                  onChange={(event) => setSignupName(event.target.value)}
                  required
                  type="text"
                  value={signupName}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-stone-600" htmlFor={`${panelId}-signup-email`}>
                  Correo
                </Label>
                <Input
                  autoComplete="email"
                  id={`${panelId}-signup-email`}
                  onChange={(event) => setSignupEmail(event.target.value)}
                  required
                  type="email"
                  value={signupEmail}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-stone-600" htmlFor={`${panelId}-signup-password`}>
                  Contraseña
                </Label>
                <Input
                  autoComplete="new-password"
                  id={`${panelId}-signup-password`}
                  minLength={8}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  required
                  type="password"
                  value={signupPassword}
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-stone-500">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    className="text-stone-800 underline-offset-4 transition hover:text-stone-500 hover:underline"
                    onClick={() => {
                      setHasError(false)
                      setView('login')
                    }}
                    type="button"
                  >
                    Inicia sesión
                  </button>
                </p>

                <Button disabled={isSubmitting} size="sm" type="submit">
                  {isSubmitting ? 'Creando…' : 'Crear cuenta'}
                </Button>
              </div>
            </form>
          ) : null}

          {view === 'comment' ? (
            <form className="space-y-3" onSubmit={handleComment}>
              <Textarea
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Escribe aquí…"
                required
                rows={3}
                value={commentText}
              />

              <div className="flex justify-end">
                <Button
                  aria-label={isSubmitting ? 'Enviando comentario' : 'Enviar comentario'}
                  disabled={isSubmitting || !commentText.trim()}
                  size="sm"
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <Lock aria-hidden="true" className="size-3.5" />
                      Enviando…
                    </>
                  ) : (
                    'Enviar'
                  )}
                </Button>
              </div>
            </form>
          ) : null}
        </>
      )}
    </div>
  )
}
