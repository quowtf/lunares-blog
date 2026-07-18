import type { Block } from 'payload'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'size',
          type: 'select',
          defaultValue: 'full',
          options: [
            { label: 'Full', value: 'full' },
            { label: 'Wide (breakout)', value: 'wide' },
            { label: 'Medium (75%)', value: 'medium' },
            { label: 'Small (50%)', value: 'small' },
          ],
          admin: {
            width: '50%',
          },
        },
      ],
    },
  ],
}
