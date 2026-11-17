import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { STAT_TYPES, type StatType } from '@/utilities/stats/config'

import { ingestActivity } from './endpoints/ingest'
import { normalizeActivity } from './hooks/normalizeActivity'

const typeLabels: Record<StatType, string> = {
  bike: 'Bici',
  coffee: 'Café',
  boulder: 'Boulder',
  code: 'Código',
}

export const Activities: CollectionConfig = {
  slug: 'activities',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ['type', 'day', 'value', 'failed'],
    group: 'Stats',
    useAsTitle: 'type',
  },
  endpoints: [ingestActivity],
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: STAT_TYPES.map((value) => ({
        label: typeLabels[value],
        value,
      })),
    },
    {
      name: 'occurredAt',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'day',
      type: 'text',
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'value',
      type: 'number',
      min: 0,
      admin: {
        description: 'Boulder: tops. El endpoint acepta tops.fallidos, ej. 11.99.',
        step: 0.01,
      },
    },
    {
      name: 'failed',
      type: 'number',
      min: 0,
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'boulder',
        description: 'Intentos fallidos de boulder.',
        step: 1,
      },
    },
  ],
  hooks: {
    beforeValidate: [normalizeActivity],
  },
  labels: {
    plural: 'Actividades',
    singular: 'Actividad',
  },
  timestamps: true,
}
