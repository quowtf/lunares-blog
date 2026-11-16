'use client'

import { LogIn, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { useAuthUser } from '@/components/auth/use-auth-user'
import { AuthPanel } from '@/components/comments/auth-views'
import type { AuthView } from '@/components/comments/types'
import { hasValidSession } from '@/utilities/auth/roles'
import { cn } from '@/utilities/ui'

type LoginButtonProps = {
  className?: string
  label?: string
  panelAlign?: 'end' | 'start'
  panelPlacement?: 'bottom' | 'top'
  panelTitle?: string
}

export function LoginButton({
  className,
  label = 'Iniciar sesión',
  panelAlign = 'start',
  panelPlacement = 'bottom',
  panelTitle = 'Inicia sesión',
}: LoginButtonProps = {}) {
  const { user, isLoading, setUser } = useAuthUser()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<AuthView>('login')
  const panelId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (isLoading || hasValidSession(user)) return null

  function togglePanel() {
    setView('login')
    setIsOpen((current) => !current)
  }

  function closePanel() {
    setView('login')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        className={cn(
          'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-input bg-background px-5 text-sm font-medium text-foreground transition hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        onClick={togglePanel}
        type="button"
      >
        <LogIn aria-hidden="true" className="h-4 w-4" />
        {label}
      </button>

      {isOpen ? (
        <div
          aria-label={panelTitle}
          className={cn(
            'comment-panel-enter absolute z-50 w-[min(20rem,calc(100vw-3rem))] rounded-card border border-border bg-card p-4 shadow-lg',
            panelAlign === 'end'
              ? 'left-0 right-auto sm:left-auto sm:right-0'
              : 'left-0 right-auto',
            panelPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
          id={panelId}
          role="dialog"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {panelTitle}
            </p>

            <button
              aria-label="Cerrar"
              className="rounded-sm text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={closePanel}
              type="button"
            >
              <X className="h-4 w-4 shrink-0" />
            </button>
          </div>

          <AuthPanel
            onComplete={closePanel}
            onUserChange={setUser}
            onViewChange={setView}
            user={user}
            view={view}
          />
        </div>
      ) : null}
    </div>
  )
}
