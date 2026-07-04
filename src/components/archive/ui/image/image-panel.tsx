import Image from 'next/image'

import type { ImageAsset, ImageTone } from '@/types/archive'
import { cn } from '@/utilities/ui'

type ImagePanelVariant = 'thumb' | 'square' | 'landscape' | 'portrait' | 'wide' | 'natural'

type ImagePanelProps = {
  image: ImageAsset
  variant?: ImagePanelVariant
  className?: string
  priority?: boolean
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
}: ImagePanelProps) {
  const tone = image.tone ?? 'paper'
  const isNatural = variant === 'natural'

  if (isNatural) {
    return (
      <div className={cn('relative overflow-hidden bg-gradient-to-br', toneMap[tone], className)}>
        {image.src ? (
          <Image
            alt={image.alt}
            className="h-auto w-full"
            height={0}
            priority={priority}
            sizes="(min-width: 1024px) 320px, 100vw"
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
    )
  }

  return (
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
          className="object-cover"
          fill
          priority={priority}
          sizes="(min-width: 1024px) 420px, 100vw"
          src={image.src}
          unoptimized={image.unoptimized}
        />
      ) : (
        <ImagePlaceholder />
      )}
    </div>
  )
}
