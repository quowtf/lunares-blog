'use client'

import Image from 'next/image'

import type { ImageAsset, ImageTone, LightboxTarget } from '@/types/archive'
import { cn } from '@/utilities/ui'

import { useLightbox } from '../lightbox/lightbox-provider'

type ImagePanelVariant = 'thumb' | 'square' | 'landscape' | 'portrait' | 'wide' | 'natural'

type ImagePanelProps = {
  image: ImageAsset
  variant?: ImagePanelVariant
  className?: string
  priority?: boolean
  /** How the image fills its frame. Ignored by the `natural` variant. */
  fit?: 'cover' | 'contain'
  /** When set, tapping/clicking opens the fullscreen lightbox. */
  lightbox?: LightboxTarget
}

const aspectMap: Record<Exclude<ImagePanelVariant, 'natural'>, string> = {
  thumb: 'aspect-square',
  square: 'aspect-square',
  landscape: 'aspect-[4/3]',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[16/9]',
}

const toneMap: Record<ImageTone, string> = {
  paper: 'from-muted via-card to-muted',
  warm: 'from-amber-200/60 via-muted to-muted',
  cool: 'from-slate-300/60 via-muted to-muted',
  mist: 'from-muted via-card to-secondary',
  forest: 'from-muted via-card to-secondary',
}

function ImagePlaceholder() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-card to-muted" />
      <div className="absolute inset-x-4 bottom-4 h-px bg-foreground/10" />
    </>
  )
}

export function ImagePanel({
  image,
  variant = 'landscape',
  className,
  priority = false,
  fit = 'cover',
  lightbox,
}: ImagePanelProps) {
  const lightboxContext = useLightbox()
  const tone = image.tone ?? 'paper'
  const isNatural = variant === 'natural'
  const canOpen = Boolean(image.src && lightboxContext && lightbox && lightbox.images.length > 0)
  const sizes = isNatural ? '(min-width: 1024px) 320px, 100vw' : '(min-width: 1024px) 420px, 100vw'

  const panel = isNatural ? (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', toneMap[tone], className)}>
      {image.src ? (
        <Image
          alt={image.alt}
          className="h-auto w-full"
          height={0}
          priority={priority}
          sizes={sizes}
          src={image.src}
          style={{ width: '100%', height: 'auto' }}
          unoptimized={image.unoptimized}
          width={0}
        />
      ) : (
        <div className="relative aspect-[4/3]">
          <ImagePlaceholder />
        </div>
      )}
    </div>
  ) : (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br',
        aspectMap[variant],
        toneMap[tone],
        className,
      )}
    >
      {image.src ? (
        <Image
          alt={image.alt}
          className={fit === 'contain' ? 'object-contain p-3' : 'object-cover'}
          fill
          priority={priority}
          sizes={sizes}
          src={image.src}
          unoptimized={image.unoptimized}
        />
      ) : (
        <ImagePlaceholder />
      )}
    </div>
  )

  if (!canOpen || !lightbox) return panel

  return (
    <button
      aria-label={image.alt ? `Ver imagen completa: ${image.alt}` : 'Ver imagen completa'}
      className="relative block w-full appearance-none border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      onClick={() =>
        lightboxContext?.openLightbox(lightbox.images, lightbox.index, sizes, lightbox.caption)
      }
      type="button"
    >
      {panel}
    </button>
  )
}
