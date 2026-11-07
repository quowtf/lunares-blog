import type { Metadata } from 'next'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import config from '@payload-config'
import { ArchiveHero } from '@/components/archive/hero'
import { canViewPrivateStories } from '@/collections/Stories/access/storiesReadAccess'
import type { User } from '@/payload-types'

import { IntroPage } from './IntroPage'
import { StoriesStage, StoryLoginGate } from './StoryLoginGate'
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

type StoryImage = { url?: string; [key: string]: unknown }

interface StoryDoc {
  id: number
  image?: StoryImage | number | null
  privateImage?: StoryImage | number | null
  author: number | { name: string; [key: string]: unknown }
  caption?: string | null
  visibility?: 'public' | 'private' | null
  link?: {
    type?: 'reference' | 'custom' | null
    newTab?: boolean | null
    reference?: { relationTo: string; value: { slug?: string } | number } | null
    url?: string | null
  } | null
  [key: string]: unknown
}

function resolveAuthorName(
  author: StoryDoc['author'],
  authorNames?: Map<number, string>,
): string {
  if (typeof author === 'object' && author !== null) {
    return (author as { name: string }).name
  }
  return authorNames?.get(author) ?? 'Lunares'
}

function resolveStoryImage(doc: StoryDoc): (StoryImage & { url: string }) | null {
  // New private stories use privateImage (private blob store). Legacy private
  // stories may still point to the public media collection; both are served
  // through the access-controlled image route.
  const candidate =
    doc.visibility === 'private' ? (doc.privateImage ?? doc.image) : doc.image

  if (
    candidate &&
    typeof candidate === 'object' &&
    typeof candidate.url === 'string' &&
    candidate.url.length > 0
  ) {
    return candidate as StoryImage & { url: string }
  }

  return null
}

export function toViewerStories(
  docs: StoryDoc[],
  authorNames?: Map<number, string>,
): ViewerStory[] {
  return docs.flatMap((doc) => {
    const image = resolveStoryImage(doc)
    if (!image) return []

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

    return [
      {
        id: doc.id,
        // Private stories stream through the access-controlled image route;
        // their real media URL is never exposed to the client.
        imageUrl: doc.visibility === 'private' ? `/api/stories/${doc.id}/image` : image.url,
        authorName: resolveAuthorName(doc.author, authorNames),
        caption: doc.caption || undefined,
        link,
      },
    ]
  })
}

async function fetchStories(payload: Payload, user: User | null): Promise<ViewerStory[]> {
  try {
    const data = await payload.find({
      collection: 'stories',
      depth: 1,
      limit: 50,
      sort: '-createdAt',
      // Apply storiesReadAccess: anonymous visitors only get public stories.
      // Expiry is filtered by the filterActiveStories beforeOperation hook.
      overrideAccess: false,
      user,
    })

    const docs = data.docs as unknown as StoryDoc[]

    // Author population requires read access on users (session-only), so for
    // visitors without a session the author stays an id. Resolve the names
    // trusted-side — they are public anyway.
    const authorIds = [
      ...new Set(
        docs
          .map((doc) => (typeof doc.author === 'object' && doc.author !== null ? null : doc.author))
          .filter((id): id is number => typeof id === 'number'),
      ),
    ]

    const authorNames = new Map<number, string>()

    if (authorIds.length > 0) {
      const authors = await payload.find({
        collection: 'users',
        depth: 0,
        limit: 0,
        overrideAccess: true,
        select: { name: true },
        where: { id: { in: authorIds } },
      })

      for (const author of authors.docs) {
        authorNames.set(author.id, author.name)
      }
    }

    return toViewerStories(docs, authorNames)
  } catch {
    return []
  }
}

export default async function NiyolPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  const hasPrivateAccess = canViewPrivateStories(user)
  const stories = await fetchStories(payload, user)

  // Number of unexpired private stories hidden from this visitor (count only,
  // content never leaves the server). Expiry handled by filterActiveStories.
  const hiddenCount = hasPrivateAccess
    ? 0
    : (
        await payload.count({
          collection: 'stories',
          where: { visibility: { equals: 'private' } },
          overrideAccess: true,
        })
      ).totalDocs

  const gateUser = user ? { email: user.email, status: user.status } : null

  if (stories.length > 0) {
    if (!hasPrivateAccess && hiddenCount > 0) {
      return <StoriesStage hiddenCount={hiddenCount} stories={stories} user={gateUser} />
    }
    return <StoryViewer stories={stories} />
  }

  if (!hasPrivateAccess && hiddenCount > 0) {
    return <StoryLoginGate hiddenCount={hiddenCount} user={gateUser} variant="fullscreen" />
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
