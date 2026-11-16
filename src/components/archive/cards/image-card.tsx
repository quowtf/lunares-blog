import type { CardVariant, ImageItem } from '@/types/archive'

import { Card, CardSubtitle, CardTitle, Eyebrow, ImagePanel, Meta } from '@/components/archive/ui'
import { CommentPanel, CommentTrigger } from '@/components/comments'
import { cn } from '@/utilities/ui'

type ImageCardProps = {
  item: ImageItem
  priority?: boolean
}

const imageFadeByVariant: Record<CardVariant, string> = {
  default: 'from-card via-card/70',
  muted: 'from-muted via-muted/70',
  sepia: 'from-secondary via-secondary/70',
}

export function ImageCard({ item, priority = false }: ImageCardProps) {
  return (
    <div>
      <Card className="w-full overflow-hidden p-0" variant={item.variant}>
        <div className="relative">
          <ImagePanel image={item.image} priority={priority} variant="natural" />

          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t via-30% to-card/0',
              imageFadeByVariant[item.variant ?? 'default'],
            )}
          />
        </div>

        <div className="space-y-2 p-4">
          {item.label ? <Eyebrow>{item.label}</Eyebrow> : null}

          {(item.title || item.content) && (
            <div className="space-y-0.5">
              {item.title ? <CardTitle>{item.title}</CardTitle> : null}
              {item.content ? <CardSubtitle>{item.content}</CardSubtitle> : null}
            </div>
          )}

          <footer className="flex items-center justify-between pt-1">
            <Meta>{item.date}</Meta>
            <CommentTrigger postId={item.id} />
          </footer>
        </div>
      </Card>

      <CommentPanel postId={item.id} />
    </div>
  )
}
