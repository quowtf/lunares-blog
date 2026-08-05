import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { createStoriesFromGallery } from './hooks/createStoriesFromGallery'
import { deleteRelatedComments } from './hooks/deleteRelatedComments'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a post is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'posts',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'posts',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      validate: (
        value: string | null | undefined,
        { siblingData }: { siblingData: Record<string, unknown> },
      ) => {
        if (siblingData?.PostType === 'image' || siblingData?.PostType === 'gallery') return true
        if (!value) return 'El título es obligatorio'
        return true
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'content',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                    UploadFeature(),
                  ]
                },
              }),
              label: false,
              validate: (
                value: unknown,
                { siblingData }: { siblingData: Record<string, unknown> },
              ) => {
                if (
                  siblingData?.PostType === 'image' ||
                  siblingData?.PostType === 'gallery' ||
                  siblingData?.PostType === 'cafe'
                )
                  return true
                if (!value) return 'El contenido es obligatorio'
                return true
              },
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'relatedPosts',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
            },
          ],
          label: 'Meta',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'PostType',
      type: 'select',
      hasMany: false,
      admin: {
        position: 'sidebar',
        isClearable: true,
        isSortable: false, // use mouse to drag and drop different values, and sort them according to your choice
      },
      options: [
        {
          label: 'Post',
          value: 'post',
        },
        {
          label: 'Image',
          value: 'image',
        },
        {
          label: 'Thought',
          value: 'thought',
        },
        {
          label: 'Quote',
          value: 'quote',
        },
        {
          label: 'Link',
          value: 'link',
        },
        {
          label: 'Video',
          value: 'video',
        },
        {
          label: 'Audio',
          value: 'audio',
        },
        {
          label: 'Gallery',
          value: 'gallery',
        },
        {
          label: 'Slides',
          value: 'slides',
        },
        {
          label: 'Café',
          value: 'cafe',
        },
        {
          label: 'Rodada',
          value: 'rodada',
        },
      ],
    },
    {
      name: 'galleryImages',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Gallery: solo imágenes. Slides: imágenes con título y descripción. Hasta 3.',
        condition: (_, siblingData) =>
          siblingData?.PostType === 'gallery' ||
          siblingData?.PostType === 'slides' ||
          siblingData?.PostType === 'rodada',
      },
    },
    {
      name: 'postToStories',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Crear Stories (12 hrs) a partir de las imágenes al publicar.',
        condition: (_, siblingData) =>
          siblingData?.PostType === 'gallery' || siblingData?.PostType === 'image',
      },
    },
    // ── Café fields (visible only when PostType === 'cafe') ──────────────
    {
      name: 'coffeeOrigin',
      type: 'text',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.PostType === 'cafe',
        description: 'País o región de origen',
      },
    },
    {
      name: 'coffeeProcess',
      type: 'text',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.PostType === 'cafe',
        description: 'Proceso (lavado, natural, honey, etc.)',
      },
    },
    {
      name: 'coffeeRoast',
      type: 'select',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.PostType === 'cafe',
        description: 'Nivel de tueste',
      },
      options: [
        { label: 'Claro', value: 'light' },
        { label: 'Medio', value: 'medium' },
        { label: 'Oscuro', value: 'dark' },
      ],
    },
    {
      name: 'coffeeAltitude',
      type: 'text',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.PostType === 'cafe',
        description: 'Altura (msnm)',
      },
    },
    {
      name: 'coffeeScore',
      type: 'number',
      min: 1,
      max: 10,
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.PostType === 'cafe',
        description: 'Puntuación personal (1-10)',
      },
    },
    {
      name: 'coffeeFinca',
      type: 'text',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.PostType === 'cafe',
        description: 'Nombre de la finca',
      },
    },
    {
      name: 'coffeeTostador',
      type: 'text',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.PostType === 'cafe',
        description: 'Tostador',
      },
    },
    {
      name: 'coffeeTienda',
      type: 'text',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.PostType === 'cafe',
        description: 'Tienda donde se compró',
      },
    },
    {
      name: 'coffeeTags',
      type: 'relationship',
      relationTo: 'badge-tags',
      hasMany: true,
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.PostType === 'cafe',
        description: 'Tags/galardones del café',
      },
    },
    // ── End café fields ──────────────────────────────────────────────────
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
      hooks: {
        beforeChange: [
          ({ value, req }) => {
            // Auto-assign current user if no authors set
            if ((!value || (Array.isArray(value) && value.length === 0)) && req.user) {
              return [req.user.id]
            }
            return value
          },
        ],
      },
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost, createStoriesFromGallery],
    afterRead: [populateAuthors],
    beforeDelete: [deleteRelatedComments],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
