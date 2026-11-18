'use client'

import Image from 'next/image'
import type { KeyboardEvent, PointerEvent, SyntheticEvent } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { ImageAsset } from '@/types/archive'
import { cn } from '@/utilities/ui'

type ImageLightboxProps = {
  images: ImageAsset[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
  /** Card `sizes` so the lightbox reuses the already-downloaded srcset URL. */
  sizes?: string
  /** Post title, or date when post has no title. Constant across the group. */
  caption?: string
}

/** Horizontal drag distance needed to move to the next/previous image. */
const SWIPE_THRESHOLD = 48
/** Vertical drag distance needed to dismiss on touch devices. */
const DISMISS_THRESHOLD = 96
/** Pointer travel above this is treated as a drag, not a tap. */
const TAP_SLOP = 10

function ChevronIcon({
  direction,
  className,
}: {
  direction: 'left' | 'right'
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={direction === 'left' ? 'M14.5 5 7.5 12l7 7' : 'M9.5 5l7 7-7 7'}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
  sizes = '100vw',
  caption,
}: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const suppressClickRef = useRef(false)

  const count = images.length
  const current = images[index]

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return
      onIndexChange(((next % count) + count) % count)
    },
    [count, onIndexChange],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.documentElement
    const previousBodyOverflow = document.body.style.overflow
    const previousRootOverflow = root.style.overflow

    if (dialog && !dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    root.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousBodyOverflow
      root.style.overflow = previousRootOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    onClose()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goTo(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      goTo(index + 1)
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointerStartRef.current = { x: event.clientX, y: event.clientY }
    suppressClickRef.current = false
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start) return

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    if (absX > TAP_SLOP || absY > TAP_SLOP) suppressClickRef.current = true

    if (count > 1 && absX > SWIPE_THRESHOLD && absX > absY) {
      goTo(dx < 0 ? index + 1 : index - 1)
      return
    }

    if (dy > DISMISS_THRESHOLD && absY > absX) onClose()
  }

  function handleSurfaceClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    onClose()
  }

  function stop(event: SyntheticEvent) {
    event.stopPropagation()
  }

  if (!current) return null

  const src = current.src

  if (!src) return null

  const captionText = caption?.trim()

  return createPortal(
    <dialog
      aria-label={`Imagen ${index + 1} de ${count}`}
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden border-0 bg-black p-0 text-white"
      onCancel={handleCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={handleKeyDown}
      ref={dialogRef}
    >
      <div
        className="flex h-[100dvh] w-full flex-col bg-black"
        onClick={handleSurfaceClick}
        onPointerCancel={() => {
          pointerStartRef.current = null
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <header
          className="flex shrink-0 items-center justify-between px-4 pb-2"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <span className="text-xs tabular-nums tracking-wide text-white/60">
            {index + 1} / {count}
          </span>

          <button
            aria-label="Cerrar imagen"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            onClick={(event) => {
              stop(event)
              onClose()
            }}
            ref={closeButtonRef}
            type="button"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="relative min-h-0 flex-1">
          <Image
            alt={current.alt || ''}
            className="object-contain select-none"
            draggable={false}
            fill
            priority
            sizes={sizes}
            src={src}
            unoptimized={current.unoptimized}
          />

          {count > 1 ? (
            <>
              <button
                aria-label="Imagen anterior"
                className="absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/85 transition hover:bg-black/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-4"
                onClick={(event) => {
                  stop(event)
                  goTo(index - 1)
                }}
                type="button"
              >
                <ChevronIcon className="h-6 w-6" direction="left" />
              </button>

              <button
                aria-label="Imagen siguiente"
                className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/85 transition hover:bg-black/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-4"
                onClick={(event) => {
                  stop(event)
                  goTo(index + 1)
                }}
                type="button"
              >
                <ChevronIcon className="h-6 w-6" direction="right" />
              </button>
            </>
          ) : null}
        </div>

        {captionText ? (
          <p
            className={cn(
              'shrink-0 px-6 text-center text-xs leading-5 text-white/60',
              'line-clamp-2',
            )}
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {captionText}
          </p>
        ) : (
          <div aria-hidden="true" style={{ height: 'max(1rem, env(safe-area-inset-bottom))' }} />
        )}
      </div>
    </dialog>,
    document.body,
  )
}
