import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isAdmin } from '../access/isAdmin'

export const BadgeTags: CollectionConfig = {
  slug: 'badge-tags',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: anyone,
    update: isAdmin,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'color',
      type: 'select',
      required: true,
      options: [
        { label: 'Rojo', value: 'red' },
        { label: 'Naranja', value: 'orange' },
        { label: 'Ámbar', value: 'amber' },
        { label: 'Amarillo', value: 'yellow' },
        { label: 'Verde', value: 'green' },
        { label: 'Esmeralda', value: 'emerald' },
        { label: 'Azul', value: 'blue' },
        { label: 'Violeta', value: 'violet' },
        { label: 'Rosa', value: 'pink' },
        { label: 'Gris', value: 'gray' },
      ],
    },
  ],
}
