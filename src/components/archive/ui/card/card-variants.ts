import type { CardVariant } from '@/types/archive'

export const cardVariants: Record<CardVariant, string> = {
  default: 'bg-card',
  muted: 'bg-muted',
  sepia: 'bg-secondary',
}

export const cardBase = 'rounded-card border border-border'

const rhythmSequence: CardVariant[] = ['default', 'sepia', 'muted', 'sepia', 'default', 'muted']

export function getVariantByIndex(index: number, override?: CardVariant): CardVariant {
  if (override) return override
  return rhythmSequence[index % rhythmSequence.length]
}
