import 'dotenv/config'

import { getPayload } from 'payload'
import config from '@payload-config'

import type { Post } from '@/payload-types'
import { getArchiveCutoff } from '@/utilities/archive/archiveWindow'
import {
  refreshMediaVisibility,
  reindexSource,
} from '@/utilities/archive/media/reindexMediaReferences'

type SourceCollection = 'pages' | 'posts' | 'stories'

function readFlag(name: string): boolean {
  return process.argv.includes(name)
}

async function run() {
  const dryRun = readFlag('--dry-run')
  const payload = await getPayload({ config })
  const cutoff = getArchiveCutoff()

  const counts: Record<SourceCollection, number> = { pages: 0, posts: 0, stories: 0 }
  const affected = new Set<number>()

  for (const collection of ['posts', 'pages', 'stories'] as SourceCollection[]) {
    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      const result = await payload.find({
        collection,
        limit: 100,
        page,
        depth: 0,
        overrideAccess: true,
        context: { skipExpirationFilter: true },
      })

      for (const doc of result.docs) {
        counts[collection] += 1

        if (dryRun) continue

        if (collection === 'posts') {
          const post = doc as Post
          const oldPublished =
            post._status === 'published' &&
            post.publishedAt &&
            new Date(post.publishedAt) < cutoff

          if (post._status !== 'published' || !oldPublished) {
            if (post.mediaArchiveState !== 'none' && post.mediaArchiveState !== 'archived') {
              await payload.update({
                collection: 'posts',
                id: post.id,
                data: { mediaArchiveState: 'none' },
                depth: 0,
                overrideAccess: true,
                context: {
                  disableRevalidate: true,
                  skipMediaArchiveState: true,
                  skipMediaReferenceSync: true,
                },
              })
            }
          } else if (post.mediaArchiveState === 'none' || !post.mediaArchiveState) {
            await payload.update({
              collection: 'posts',
              id: post.id,
              data: { mediaArchiveState: 'pending' },
              depth: 0,
              overrideAccess: true,
              context: {
                disableRevalidate: true,
                skipMediaArchiveState: true,
                skipMediaReferenceSync: true,
              },
            })
          }
        }

        const ids = await reindexSource({
          payload,
          sourceCollection: collection,
          doc: doc as unknown as Record<string, unknown> & { id: number | string },
        })
        ids.forEach((id) => affected.add(id))
      }

      hasNextPage = result.hasNextPage
      page += 1
    }
  }

  if (!dryRun) {
    // Also recompute media that has no references at all.
    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      const result = await payload.find({
        collection: 'media',
        limit: 100,
        page,
        depth: 0,
        overrideAccess: true,
      })
      result.docs.forEach((media) => affected.add(media.id))
      hasNextPage = result.hasNextPage
      page += 1
    }

    await refreshMediaVisibility(payload, Array.from(affected))
  }

  const media = await payload.find({
    collection: 'media',
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  const visibility = media.docs.reduce<Record<string, number>>((acc, item) => {
    const key = item.visibility ?? 'null'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const references = await payload.find({
    collection: 'media-references',
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  payload.logger.info({
    msg: '[backfill-media-references] finished',
    dryRun,
    documents: counts,
    media: media.totalDocs,
    visibility,
    references: references.totalDocs,
  })

  process.exit(0)
}

run().catch((error) => {
  console.error('[backfill-media-references] failed')
  console.error(error)
  process.exit(1)
})
