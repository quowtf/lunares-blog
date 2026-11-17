import type { StatIconName, StatTone } from '@/components/archive/stats/types'

export const STAT_TYPES = ['bike', 'coffee', 'boulder', 'code'] as const

export type StatType = (typeof STAT_TYPES)[number]

/**
 * Aliases accepted by the ingest endpoint. `km` and `gr` carry the unit, so
 * those two activities need an explicit type. Code and boulder omit type and
 * are inferred from value: integers are commits, decimals are boulder.
 */
const STAT_TYPE_ALIASES: Record<string, StatType> = {
  bi: 'bike',
  bici: 'bike',
  bike: 'bike',
  km: 'bike',
  ca: 'coffee',
  cafe: 'coffee',
  coffee: 'coffee',
  gr: 'coffee',
  bo: 'boulder',
  boulder: 'boulder',
  co: 'code',
  codigo: 'code',
  code: 'code',
}

export type StatDetailType = 'completed' | 'failed' | 'average' | 'activeDays'

export type StatDefinition = {
  chartType: 'ridgeline' | 'line' | 'bars' | 'calendar'
  details?: Array<{
    label: string
    precision?: number
    type: StatDetailType
  }>
  featured?: boolean
  icon: StatIconName
  inputMode: 'value' | 'boulder'
  order: number
  title: string
  tone: StatTone
  unit?: string
}

export const STAT_DEFINITIONS: Record<StatType, StatDefinition> = {
  bike: {
    chartType: 'ridgeline',
    featured: true,
    icon: 'bike',
    inputMode: 'value',
    order: 1,
    title: 'Kilómetros rodados',
    tone: 'sage',
    unit: 'km',
  },
  coffee: {
    chartType: 'line',
    icon: 'coffee',
    inputMode: 'value',
    order: 2,
    title: 'Gramos de café molidos',
    tone: 'clay',
    unit: 'g',
  },
  boulder: {
    chartType: 'bars',
    details: [
      { label: 'tops', type: 'completed' },
      { label: 'fallidos', type: 'failed' },
    ],
    icon: 'boulder',
    inputMode: 'boulder',
    order: 3,
    title: 'Intentos de boulder',
    tone: 'slate',
  },
  code: {
    chartType: 'calendar',
    details: [
      { label: 'promedio/día', precision: 1, type: 'average' },
      { label: 'días activos', type: 'activeDays' },
    ],
    icon: 'git',
    inputMode: 'value',
    order: 4,
    title: 'Frecuencia de código publicado',
    tone: 'gold',
  },
}

export const STAT_ORDER: StatType[] = [...STAT_TYPES].sort(
  (a, b) => STAT_DEFINITIONS[a].order - STAT_DEFINITIONS[b].order,
)

export function isStatType(value: unknown): value is StatType {
  return typeof value === 'string' && (STAT_TYPES as readonly string[]).includes(value)
}

export function parseStatType(value: unknown): StatType | null {
  if (typeof value !== 'string') return null

  const key = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return STAT_TYPE_ALIASES[key] ?? null
}
