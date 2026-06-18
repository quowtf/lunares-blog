import type { SlidesItem } from '@/types/archive'

import {
  Card,
  CardSubtitle,
  CardTitle,
  Eyebrow,
  ImagePanel,
  Meta,
} from '@/components/archive/ui'

type SlidesCardProps = {
  item: SlidesItem
  priority?: boolean
}

export function SlidesCard({ item, priority = false }: SlidesCardProps) {
  return (
    <Card className="space-y-4 p-5" variant={item.variant}>
      <header className="space-y-2">
        {item.label ? <Eyebrow>{item.label}</Eyebrow> : null}
        <div>
          {item.title ? <CardTitle>{item.title}</CardTitle> : null}
          {item.content ? <CardSubtitle>{item.content}</CardSubtitle> : null}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2">
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

      <footer>
        <Meta>{item.date}</Meta>
      </footer>
    </Card>
  )
}
