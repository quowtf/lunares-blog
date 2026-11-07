'use client'

import { Lock, X } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { AuthPanel } from '@/components/comments/auth-views'
import type { AuthView } from '@/components/comments/types'

import { StoryViewer, type ViewerStory } from './StoryViewer'

export type GateUser = {
  email: string
  status?: 'active' | 'pending' | 'blocked' | null
} | null

type StoryLoginGateProps = {
  variant: 'fullscreen' | 'banner'
  hiddenCount: number
  user?: GateUser
  /** Banner modal state (owned by StoriesStage so it can pause the viewer). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function gateCopy(view: AuthView): { label: string; body: string } {
  if (view === 'signup') {
    return {
      label: 'Crea tu cuenta',
      body: 'Crea una cuenta para desbloquear las historias privadas.',
    }
  }
  if (view === 'verify') {
    return {
      label: 'Verifica tu correo',
      body: 'Confirma tu correo para activar tu cuenta y ver las historias privadas.',
    }
  }
  return {
    label: 'Historias privadas',
    body: 'Inicia sesión para ver las historias privadas de Lunares.',
  }
}

/**
 * Login CTA for private stories on /momentos.
 * Reuses the shared AuthPanel (login / signup / email verification).
 * On success it refreshes the server render so private stories appear.
 */
export function StoryLoginGate({ variant, hiddenCount, user, open, onOpenChange }: StoryLoginGateProps) {
  const router = useRouter()
  const [view, setView] = useState<AuthView>(() => (user?.status === 'pending' ? 'verify' : 'login'))

  const authProps = {
    onComplete: () => router.refresh(),
    onUserChange: () => {},
    user: null,
    onViewChange: setView,
    verifyEmailSeed: user?.email,
    view,
  }

  if (user?.status === 'blocked') {
    const blocked = (
      <p className="text-sm leading-6 text-muted-foreground">
        Tu cuenta no está activa. Contacta al administrador para desbloquearla.
      </p>
    )

    if (variant === 'fullscreen') {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-4">
          <div className="w-full max-w-sm rounded-card border border-border bg-card p-5 shadow-lg">
            <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Historias privadas
            </p>
            {blocked}
          </div>

          <button
            className="mt-6 text-xs text-white/60 underline-offset-4 transition hover:text-white hover:underline"
            onClick={() => router.push('/')}
            type="button"
          >
            Volver al inicio
          </button>
        </div>
      )
    }

    if (!open) return null
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-card border border-border bg-card p-4 shadow-lg">
          <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Historias privadas
          </p>
          {blocked}
        </div>
      </div>
    )
  }

  const { label, body } = gateCopy(view)

  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm rounded-card border border-border bg-card p-5 shadow-lg">
          <div className="mb-1 flex items-center gap-2">
            <Lock aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </p>
          </div>

          <div className="mb-3">
            <p className="text-sm leading-6 text-muted-foreground">
              {hiddenCount > 0
                ? `${hiddenCount} ${hiddenCount === 1 ? 'historia privada espera' : 'historias privadas esperan'} detrás de este acceso. ${body}`
                : body}
            </p>
          </div>

          <AuthPanel {...authProps} />
        </div>

        <button
          className="mt-6 text-xs text-white/60 underline-offset-4 transition hover:text-white hover:underline"
          onClick={() => router.push('/')}
          type="button"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  // banner variant: pill over the viewer + modal on click
  return (
    <>
      <button
        className="fixed top-16 right-4 z-[60] flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        onClick={() => onOpenChange?.(true)}
        type="button"
      >
        <Lock aria-hidden="true" className="h-3.5 w-3.5" />
        {hiddenCount} {hiddenCount === 1 ? 'historia privada' : 'historias privadas'}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          onClick={() => onOpenChange?.(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-card border border-border bg-card p-4 shadow-lg"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={label}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </p>
              <button
                aria-label="Cerrar"
                className="rounded-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onOpenChange?.(false)}
                type="button"
              >
                <X className="h-4 w-4 shrink-0" />
              </button>
            </div>

            <div className="mb-3">
              <p className="text-sm leading-6 text-muted-foreground">{body}</p>
            </div>

            <AuthPanel {...authProps} />
          </div>
        </div>
      ) : null}
    </>
  )
}

type StoriesStageProps = {
  stories: ViewerStory[]
  hiddenCount: number
  user?: GateUser
}

/**
 * /momentos stage for visitors without private access: plays the visible
 * (public) stories and shows the login gate when private ones exist.
 * Auto-advance pauses only while the gate modal is open.
 */
export function StoriesStage({ stories, hiddenCount, user }: StoriesStageProps) {
  const [gateOpen, setGateOpen] = useState(false)

  return (
    <>
      <StoryViewer paused={gateOpen} stories={stories} />
      <StoryLoginGate
        hiddenCount={hiddenCount}
        onOpenChange={setGateOpen}
        open={gateOpen}
        user={user}
        variant="banner"
      />
    </>
  )
}
