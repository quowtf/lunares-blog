import type { ImageItem } from '@/types/archive'

import {
  Card,
  CardSubtitle,
  CardTitle,
  Eyebrow,
  ImagePanel,
  Meta,
} from '@/components/archive/ui'
import { CommentPanel, CommentTrigger } from '@/components/comments'

type ImageCardProps = {
  item: ImageItem
  priority?: boolean
}

export function ImageCard({ item, priority = false }: ImageCardProps) {
  return (
    <div>
      <Card className="w-full overflow-hidden p-0" variant={item.variant}>
        <ImagePanel image={item.image} priority={priority} variant="natural" />

        <div className="space-y-2 p-4">
          {item.label ? <Eyebrow>{item.label}</Eyebrow> : null}

          {(item.title || item.subtitle) && (
            <div className="space-y-0.5">
              {item.title ? <CardTitle>{item.title}</CardTitle> : null}
              {item.subtitle ? <CardSubtitle>{item.subtitle}</CardSubtitle> : null}
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
