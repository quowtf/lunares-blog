import type { CardVariant } from '@/types/archive'

import { getVariantByIndex } from '@/components/archive/ui/card/card-variants'
import { cn } from '@/utilities/ui'
import { DotsIcon } from '../ui/icons'
import { Meta } from '../ui/typography'

export type ThoughtQuoteCardProps = {
  label: string
  date: string
  body: string
  title?: string | null
  index?: number
  priority?: boolean
  variant?: CardVariant
}

const variantClasses = {
  default: 'bg-white',
  muted: 'bg-[#F0F0F0]',
  sepia: 'bg-[#F6F2ED]',
} as const

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 4.75h10v14.5l-5-3.2-5 3.2V4.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function ThoughtQuoteCard({
  label,
  date,
  body,
  title,
  index = 0,
  priority = false,
  variant,
}: ThoughtQuoteCardProps) {
  const cardVariant = variant ?? getVariantByIndex(index)

  return (
    <article
      className={cn(
        'overflow-hidden rounded-card border border-[#F5F4F2]',
        variantClasses[cardVariant],
      )}
    >
      <div className="flex min-h-48 flex-col justify-between gap-8 p-5">
        <header className="flex items-start justify-between gap-6">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-stone-500">
            {label}
          </p>
        </header>

        <div className="space-y-1">
          <div className="space-y-3">
            <blockquote className="max-w-72 font-serif text-base leading-relaxed text-stone-900">
              {title}
            </blockquote>
          </div>

          {body ? <p className="max-w-72 text-sm leading-6 text-stone-500">{body}</p> : null}

        </div>
          <footer className="flex items-center justify-between">
        <Meta>{date}</Meta>
        <DotsIcon className="h-5 w-5 shrink-0 text-stone-400" />
      </footer>
      </div>
    </article>
  )
}
