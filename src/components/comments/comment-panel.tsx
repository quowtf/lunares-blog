'use client'

import { Lock, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AUTH_ERROR_MESSAGES } from '@/utilities/authMessages'
import { cn } from '@/utilities/ui'

import { submitComment } from './api'
import {
  COMMENT_ERROR_MESSAGE,
  COMMENT_PANEL_EXIT_MS,
  COMMENT_SUCCESS_DISMISS_MS,
  COMMENT_SUCCESS_MESSAGE,
} from './constants'
import { AuthPanel } from './auth-views'
import { useCommentContext } from './comment-provider'
import type { AuthUser, PanelView } from './types'

type CommentPanelProps = {
  postId: string | number
}

function getInitialView(user: AuthUser | null, isLoadingUser: boolean): PanelView | null {
  if (isLoadingUser) return null
  if (!user) return 'login'
  if (user.status === 'pending') return 'verify'
  if (user.status === 'blocked') return 'blocked'
  return 'comment'
}

export function CommentPanel({ postId }: CommentPanelProps) {
  const panelId = useId()
  const { activePostId, closeComments, user, isLoadingUser, setUser } = useCommentContext()

  const isActive = activePostId === String(postId)

  const [view, setView] = useState<PanelView | null>(() => getInitialView(user, isLoadingUser))
  const [hasError, setHasError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

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
        'comment-panel mt-3 overflow-hidden rounded-card border border-border bg-card p-4 shadow-sm',
        isExiting ? 'comment-panel-exit' : 'comment-panel-enter',
      )}
      role="region"
    >
      {view === 'success' ? (
        <p className="text-sm leading-6 text-muted-foreground" id={panelId}>
          {COMMENT_SUCCESS_MESSAGE}
        </p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p
              className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground"
              id={panelId}
            >
              {view === 'login' && 'Inicia sesión para comentar'}
              {view === 'signup' && 'Crea tu cuenta'}
              {view === 'verify' && 'Verifica tu correo'}
              {view === 'blocked' && 'Cuenta bloqueada'}
              {view === 'comment' && 'Tu comentario'}
              {view === null && 'Cargando'}
            </p>

            <button
              aria-label="Cerrar"
              className="rounded-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={closeComments}
              type="button"
            >
              <X className="h-4 w-4 shrink-0" />
            </button>
          </div>

          {hasError ? (
            <p className="mb-3 text-sm text-muted-foreground">{COMMENT_ERROR_MESSAGE}</p>
          ) : null}

          {view === null ? (
            <p className="text-sm text-muted-foreground">Verificando sesión…</p>
          ) : null}

          {view === 'login' || view === 'signup' || view === 'verify' ? (
            <AuthPanel
              onComplete={() => setView('comment')}
              onUserChange={setUser}
              user={user}
              onViewChange={setView}
              verifyEmailSeed={user?.status === 'pending' ? user.email : undefined}
              view={view}
            />
          ) : null}

          {view === 'blocked' ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {AUTH_ERROR_MESSAGES.blocked}
            </p>
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
