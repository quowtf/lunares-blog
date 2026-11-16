import type { Metadata } from 'next'

import { ArchiveFeed } from '@/components/archive/archive-feed'
import type { ArchivePostData } from '@/components/archive/archive-post-card'
import { ArchiveHero } from '@/components/archive/hero'
import { HomeStats } from '@/components/archive/stats/home-stats'
import type { HomeStatsData } from '@/components/archive/stats/types'
import { CommentLayout } from '@/components/comments'
import mockStatsData from '@/data/home-stats.mock.json'
import type { ArchiveCursor } from '@/utilities/archive/archiveCursor'
import { getArchiveCutoff } from '@/utilities/archive/archiveWindow'
import { archivePostSelect } from '@/utilities/archive/postSelect'
import { getHomeStats } from '@/utilities/stats/aggregate'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function HomePage() {
  const [posts, stats] = await Promise.all([queryPosts(), queryHomeStats()])
  const lastPost = posts.at(-1)
  const initialCursor: ArchiveCursor | null =
    lastPost?.id != null && lastPost.publishedAt
      ? { id: lastPost.id, publishedAt: lastPost.publishedAt }
      : null

  return (
    <CommentLayout>
      <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <ArchiveHero />
          <HomeStats data={stats} />
          <ArchiveFeed initialCursor={initialCursor} initialPosts={posts} />
        </div>
      </main>
    </CommentLayout>
  )
}

async function queryHomeStats(): Promise<HomeStatsData> {
  const stats = await getHomeStats()

  if (process.env.NODE_ENV !== 'production' && !hasChartData(stats)) {
    return mockStatsData as HomeStatsData
  }

  return stats
}

function hasChartData(stats: HomeStatsData): boolean {
  return stats.cards.some((card) => {
    if (card.chart.type === 'bars') {
      return card.chart.current.completed.length > 0 || Boolean(card.chart.previous?.length)
    }

    return card.chart.current.length > 0 || Boolean(card.chart.previous?.length)
  })
}

async function queryPosts(): Promise<ArchivePostData[]> {
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    draft: false,
    overrideAccess: false,
    pagination: false,
    sort: ['-publishedAt', '-id'],
    select: archivePostSelect,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          publishedAt: {
            exists: true,
          },
        },
        {
          publishedAt: {
            greater_than_equal: getArchiveCutoff().toISOString(),
          },
        },
      ],
    },
  })

  return posts.docs as ArchivePostData[]
}

export function generateMetadata(): Metadata {
  return {
    title: 'Lunares',
    description: 'A collection of thoughts, photographs, stories and moments.',
  }
}
