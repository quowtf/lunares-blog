import type { Metadata } from 'next'

import { getPayload } from 'payload'
import config from '@payload-config'
import { ArchiveHero } from '@/components/archive/hero'

import { IntroPage } from './IntroPage'
import { StoryViewer } from './StoryViewer'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export interface ViewerStoryLink {
  url: string
  newTab: boolean
}

export interface ViewerStory {
  id: number
  imageUrl: string
  authorName: string
  caption?: string
  link?: ViewerStoryLink
}

interface StoryDoc {
  id: number
  image?: { url?: string; [key: string]: unknown } | number | null
  author: number | { name: string; [key: string]: unknown }
  caption?: string | null
  link?: {
    type?: 'reference' | 'custom' | null
    newTab?: boolean | null
    reference?: { relationTo: string; value: { slug?: string } | number } | null
    url?: string | null
  } | null
  [key: string]: unknown
}

export function toViewerStories(docs: StoryDoc[]): ViewerStory[] {
  return docs
    .filter((doc): doc is typeof doc & { image: { url: string } } => {
      const image = doc.image
      return (
        image !== null &&
        image !== undefined &&
        typeof image === 'object' &&
        typeof image.url === 'string' &&
        image.url.length > 0
      )
    })
    .map((doc) => {
      let link: ViewerStoryLink | undefined

      if (doc.link) {
        const newTab = doc.link.newTab ?? false

        if (doc.link.type === 'reference' && doc.link.reference) {
          const ref = doc.link.reference
          const value = ref.value
          if (typeof value === 'object' && value.slug) {
            const prefix = ref.relationTo === 'posts' ? '/posts' : ''
            link = { url: `${prefix}/${value.slug}`, newTab }
          }
        } else if (doc.link.type === 'custom' && doc.link.url) {
          link = { url: doc.link.url, newTab }
        }
      }

      return {
        id: doc.id,
        imageUrl: doc.image.url,
        authorName:
          typeof doc.author === 'object' && doc.author !== null
            ? (doc.author as { name: string }).name
            : 'Lunares',
        caption: doc.caption || undefined,
        link,
      }
    })
}

async function fetchStories(): Promise<ViewerStory[]> {
  try {
    const payload = await getPayload({ config })

    const data = await payload.find({
      collection: 'stories' as 'posts', // cast: types may not be regenerated yet
      depth: 1,
      limit: 50,
      overrideAccess: true,
      where: {
        expiresAt: {
          greater_than: new Date().toISOString(),
        },
      },
    })

    return toViewerStories(data.docs as unknown as StoryDoc[])
  } catch {
    return []
  }
}

export default async function NiyolPage() {
  const stories = await fetchStories()

  if (stories.length > 0) {
    return <StoryViewer stories={stories} />
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <ArchiveHero />
        <IntroPage />
      </div>
    </main>
  )
}
