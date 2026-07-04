import type { ImageAsset } from '@/types/archive'
import { cn } from '@/utilities/ui'

import { ImagePanel } from './image/image-panel'

type ImageTriptychProps = {
  images: ImageAsset[]
  className?: string
  priority?: boolean
}

export function ImageTriptych({ images, className, priority = false }: ImageTriptychProps) {
  const displayImages = images.slice(0, 3)

  if (displayImages.length === 0) return null

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {displayImages.map((image, index) => (
        <ImagePanel
          className="rounded-xl"
          image={image}
          key={`${image.src ?? image.alt}-${index}`}
          priority={priority && index === 0}
          variant="square"
        />
      ))}
    </div>
  )
}
