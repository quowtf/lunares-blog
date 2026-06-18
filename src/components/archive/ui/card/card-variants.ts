import type { CardVariant } from '@/types/archive'

export const cardVariants: Record<CardVariant, string> = {
  default: 'bg-white',
  muted: 'bg-[#F0F0F0]',
  sepia: 'bg-[#F6F2ED]',
}

export const cardBase = 'rounded-card border border-[#F5F4F2]'

const rhythmSequence: CardVariant[] = ['default', 'sepia', 'muted', 'sepia', 'default', 'muted']

export function getVariantByIndex(index: number, override?: CardVariant): CardVariant {
  if (override) return override
  return rhythmSequence[index % rhythmSequence.length]
}
