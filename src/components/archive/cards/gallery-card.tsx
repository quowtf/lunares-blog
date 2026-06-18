import type { GalleryItem } from '@/types/archive'

import { ImageTriptych } from '@/components/archive/ui'

type GalleryCardProps = {
  item: GalleryItem
  priority?: boolean
}

export function GalleryCard({ item, priority = false }: GalleryCardProps) {
  if (!item.images.length) return null

  return <ImageTriptych images={item.images} priority={priority} />
}
