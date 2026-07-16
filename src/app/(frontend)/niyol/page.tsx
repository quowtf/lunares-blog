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

export interface ViewerStory {
  id: number
  imageUrl: string
  authorName: string
  caption?: string
}

interface StoryDoc {
  id: number
  image?: { url?: string; [key: string]: unknown } | number | null
  author: number | { name: string; [key: string]: unknown }
  caption?: string | null
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
    .map((doc) => ({
      id: doc.id,
      imageUrl: doc.image.url,
      authorName:
        typeof doc.author === 'object' && doc.author !== null
          ? (doc.author as { name: string }).name
          : 'Lunares',
      caption: doc.caption || undefined,
    }))
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
