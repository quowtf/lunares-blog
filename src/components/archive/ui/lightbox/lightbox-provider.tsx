'use client'

import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import type { ImageAsset, LightboxTarget } from '@/types/archive'

import { ImageLightbox } from './image-lightbox'

type LightboxContextValue = {
  /** Open a set of images at the given index. */
  openLightbox: (images: ImageAsset[], index?: number, sizes?: string, caption?: string) => void
}

const LightboxContext = createContext<LightboxContextValue | null>(null)

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<LightboxTarget | null>(null)

  const openLightbox = useCallback(
    (images: ImageAsset[], index = 0, sizes?: string, caption?: string) => {
      const visible = images.filter((image) => Boolean(image.src))
      if (visible.length === 0) return

      setTarget({
        images: visible,
        index: Math.min(Math.max(index, 0), visible.length - 1),
        sizes,
        caption,
      })
    },
    [],
  )

  const closeLightbox = useCallback(() => {
    setTarget(null)
  }, [])

  const setIndex = useCallback((index: number) => {
    setTarget((current) => (current ? { ...current, index } : current))
  }, [])

  const value = useMemo(() => ({ openLightbox }), [openLightbox])

  return (
    <LightboxContext.Provider value={value}>
      {children}
      {target ? (
        <ImageLightbox
          caption={target.caption}
          images={target.images}
          index={target.index}
          onClose={closeLightbox}
          onIndexChange={setIndex}
          sizes={target.sizes}
        />
      ) : null}
    </LightboxContext.Provider>
  )
}

/** Null outside a provider, so cards can degrade to plain images. */
export function useLightbox(): LightboxContextValue | null {
  return useContext(LightboxContext)
}
