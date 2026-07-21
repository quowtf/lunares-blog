import type { CafeBadge, CafeItem } from '@/types/archive'

import { Card, CardSubtitle, CardTitle, Eyebrow, ImagePanel } from '@/components/archive/ui'
import { CommentPanel, CommentTrigger } from '@/components/comments'
import { cn } from '@/utilities/ui'

type CafeCardProps = {
  item: CafeItem
  priority?: boolean
}

const badgeColorMap: Record<string, string> = {
  red: 'bg-red-500 text-white',
  orange: 'bg-orange-500 text-white',
  amber: 'bg-amber-500 text-white',
  yellow: 'bg-yellow-400 text-yellow-950',
  green: 'bg-green-700 text-white',
  emerald: 'bg-emerald-600 text-white',
  blue: 'bg-blue-600 text-white',
  violet: 'bg-violet-600 text-white',
  pink: 'bg-pink-500 text-white',
  gray: 'bg-gray-600 text-white',
}

function Badge({ badge }: { badge: CafeBadge }) {
  const colorClass = badgeColorMap[badge.color] ?? badgeColorMap.gray

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide leading-tight',
        colorClass,
      )}
    >
      {badge.name}
    </span>
  )
}

export function CafeCard({ item, priority = false }: CafeCardProps) {
  return (
    <div>
      <Card className="w-full overflow-hidden p-0" variant={item.variant}>
        {item.image ? (
          <ImagePanel image={item.image} priority={priority} variant="square" />
        ) : null}

        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow>Café</Eyebrow>
            {item.badges.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {item.badges.map((badge) => (
                  <Badge badge={badge} key={badge.name} />
                ))}
              </div>
            ) : null}
          </div>

          <CardTitle>{item.title}</CardTitle>


          <footer className="flex items-center justify-between">
            <CardSubtitle>{item.origin} &bull; {item.process}</CardSubtitle>
            <CommentTrigger postId={item.id} />
          </footer>
        </div>
      </Card>

      <CommentPanel postId={item.id} />
    </div>
  )
}
