import { cn } from '@/utilities/ui'

import { StatChart } from './comparison-chart'
import { StatIcon } from './icons'
import type { HomeStatCardData, HomeStatsData } from './types'

const numberFormatter = new Intl.NumberFormat('es-MX')

export function HomeStats({ data }: { data: HomeStatsData }) {
  return (
    <section aria-label="Estadísticas" className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {data.cards.map((card) => (
        <StatCard card={card} key={card.id} />
      ))}
    </section>
  )
}

function StatCard({ card }: { card: HomeStatCardData }) {
  const isUp = (card.delta ?? 0) >= 0

  return (
    <article className="relative flex min-h-[14rem] flex-col overflow-hidden rounded-[0.9rem] border border-border bg-background p-4 sm:min-h-[15rem] sm:p-5">
      <div className="relative flex h-full flex-col">
        <div className="flex items-start gap-2 text-foreground">
          <StatIcon className="mt-[0.15rem] h-4 w-4 shrink-0 opacity-70" name={card.icon} />
          <h3 className="font-display text-[1.1rem] leading-[1.15] tracking-tight">{card.title}</h3>
        </div>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-[2.9rem] leading-[0.82] tracking-[-0.03em] text-foreground sm:text-[3.35rem]">
            {numberFormatter.format(card.value)}
          </span>

          {card.unit ? (
            <span className="font-display text-lg leading-none text-muted-foreground">
              {card.unit}
            </span>
          ) : null}

          {typeof card.delta === 'number' ? (
            <span
              className={cn(
                'mb-1 inline-flex items-center gap-1 text-[0.68rem] font-medium',
                isUp ? 'text-[var(--stat-up)]' : 'text-destructive',
              )}
            >
              <svg
                aria-hidden="true"
                className={cn('h-1.5 w-1.5', !isUp && 'rotate-180')}
                viewBox="0 0 8 8"
              >
                <path d="M4 1.2 7.4 6.8H.6L4 1.2Z" fill="currentColor" />
              </svg>
              {isUp ? '+' : ''}
              {card.delta}%
            </span>
          ) : null}
        </div>

        {card.details?.length ? (
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.7rem] leading-4 text-muted-foreground">
            {card.details.map((detail, index) => (
              <span className="inline-flex items-center gap-2" key={detail.label}>
                {index > 0 ? <span aria-hidden="true">·</span> : null}
                {numberFormatter.format(detail.value)} {detail.label}
              </span>
            ))}
          </p>
        ) : null}

        <div className="mt-5 flex-1">
          <StatChart chart={card.chart} tone={card.tone} />
        </div>
      </div>
    </article>
  )
}
