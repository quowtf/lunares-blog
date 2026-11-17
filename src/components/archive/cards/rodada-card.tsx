import Image from 'next/image'

import type { CardVariant, ImageAsset, RodadaItem } from '@/types/archive'

import { Card, CardSubtitle, CardTitle, ImagePanel, Meta } from '@/components/archive/ui'
import { CommentPanel, CommentTrigger } from '@/components/comments'

type RodadaCardProps = {
  item: RodadaItem
  priority?: boolean
}

const imageFadeByVariant: Record<CardVariant, string> = {
  default: 'from-card via-card/70',
  muted: 'from-muted via-muted/70',
  sepia: 'from-secondary via-secondary/70',
}

function RodadaHero({
  image,
  priority,
  variant,
}: {
  image: ImageAsset
  priority: boolean
  variant: CardVariant
}) {
  // Route maps are wide and transparent, so they are contained to keep the
  // whole trace visible. Portrait/square photos fill the same frame instead of
  // shrinking to a thin strip in the middle.
  const isPortrait =
    image.width != null && image.height != null && image.height > image.width

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/30">
      {image.src ? (
        <Image
          alt={image.alt}
          className={isPortrait ? 'object-cover' : 'object-contain p-3'}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 320px, 100vw"
          src={image.src}
          unoptimized={image.unoptimized}
        />
      ) : null}

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b via-30% to-card/0 ${imageFadeByVariant[variant]}`}
      />

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t via-30% to-card/0 ${imageFadeByVariant[variant]}`}
      />
    </div>
  )
}

export function RodadaCard({ item, priority = false }: RodadaCardProps) {
  return (
    <div>
      <Card className="space-y-4 overflow-hidden p-0" variant={item.variant}>
        {/* Title */}
        <div className="px-4 pt-4">
          <CardTitle>{item.title}</CardTitle>
        </div>

        {/* Hero: route silhouette or photo banner, always inside the same frame */}
        <RodadaHero
          image={item.heroImage}
          priority={priority}
          variant={item.variant ?? 'default'}
        />

        {/* Stats (single line content) */}
        {item.content ? (
          <div className="px-4">
            <CardSubtitle>{item.content}</CardSubtitle>
          </div>
        ) : null}

        {/* Gallery — up to 3 square thumbnails, optional */}
        {item.images.length > 0 ? (
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
        ) : null}

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
