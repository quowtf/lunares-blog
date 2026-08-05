import type { RodadaItem } from '@/types/archive'

import {
  Card,
  CardSubtitle,
  CardTitle,
  ImagePanel,
  Meta,
} from '@/components/archive/ui'
import { CommentPanel, CommentTrigger } from '@/components/comments'

type RodadaCardProps = {
  item: RodadaItem
  priority?: boolean
}

export function RodadaCard({ item, priority = false }: RodadaCardProps) {
  return (
    <div>
      <Card className="space-y-4 overflow-hidden p-0" variant={item.variant}>
        {/* Title */}
        <div className="px-4 pt-4">
          <CardTitle>{item.title}</CardTitle>
        </div>

        {/* Hero silhouette — transparent PNG, contained within max height */}
        <div className="relative mx-4 flex h-[95px] items-center justify-center overflow-hidden">
          {item.heroImage.src ? (
            <img
              alt={item.heroImage.alt}
              className="h-full w-auto object-contain"
              src={item.heroImage.src}
            />
          ) : null}
        </div>

        {/* Stats (single line content) */}
        {item.content ? (
          <div className="px-4">
            <CardSubtitle>{item.content}</CardSubtitle>
          </div>
        ) : null}

        {/* Gallery — 3 square thumbnails like slides */}
        <div className="grid grid-cols-3 gap-2 px-4">
          {item.images.slice(0, 3).map((image, index) => (
            <ImagePanel
              className="rounded-xl"
              image={image}
              key={`${image.src ?? image.alt}-${index}`}
              priority={priority && index === 0}
              variant="thumb"
            />
          ))}
        </div>

        {/* Footer: date + comments */}
        <footer className="flex items-center justify-between px-4 pb-4">
          <Meta>{item.date}</Meta>
          <CommentTrigger postId={item.id} />
        </footer>
      </Card>

      <CommentPanel postId={item.id} />
    </div>
  )
}
