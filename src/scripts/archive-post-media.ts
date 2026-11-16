import 'dotenv/config'

import { getPayload } from 'payload'
import config from '@payload-config'

import type { Post } from '@/payload-types'
import { getArchiveCutoff } from '@/utilities/archive/archiveWindow'
import { archivePostMedia } from '@/utilities/archive/media/archivePostMedia'
import { promotePostMedia } from '@/utilities/archive/media/promotePostMedia'
function readFlag(name: string): boolean {
  return process.argv.includes(name)
}

function readNumberFlag(name: string): number | undefined {
  const index = process.argv.indexOf(name)
  if (index < 0) return undefined
  const value = Number(process.argv[index + 1])
  return Number.isFinite(value) ? value : undefined
}

async function run() {
  const dryRun = readFlag('--dry-run')
  const verify = readFlag('--verify')
  const restore = readFlag('--restore')
  const limit = readNumberFlag('--limit')
  const postId = readNumberFlag('--post-id')

  const payload = await getPayload({ config })
  const cutoff = getArchiveCutoff()

  if (verify) {
    const pending = await payload.find({
      collection: 'posts',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { publishedAt: { less_than: cutoff.toISOString() } },
          { mediaArchiveState: { not_equals: 'archived' } },
        ],
      },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    })

    payload.logger.info({
      msg: '[archive-post-media] verify',
      pending: pending.totalDocs,
      ids: pending.docs.map((post) => post.id),
    })
    process.exit(pending.totalDocs === 0 ? 0 : 1)
  }

  if (restore) {
    const archived = await payload.find({
      collection: 'posts',
      where: { mediaArchiveState: { equals: 'archived' } },
      limit: limit ?? 0,
      depth: 0,
      overrideAccess: true,
    })

    for (const post of archived.docs) {
      const result = await promotePostMedia({ doc: post, payload })

      if (dryRun) {
        payload.logger.info({ msg: 'restore (dry-run)', post: post.id, patch: result.patch })
        continue
      }

      await payload.update({
        collection: 'posts',
        id: post.id,
        data: { ...result.patch, mediaArchiveState: 'none' },
        depth: 0,
        overrideAccess: true,
        context: {
          disableRevalidate: true,
          skipMediaArchiveState: true,
          skipMediaPromotion: true,
        },
      })
    }

    payload.logger.info({ msg: '[archive-post-media] restore finished', posts: archived.totalDocs })
    process.exit(0)
  }

  const posts = postId
    ? await payload.find({
        collection: 'posts',
        where: { id: { equals: postId } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
    : await payload.find({
        collection: 'posts',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { publishedAt: { less_than: cutoff.toISOString() } },
            { mediaArchiveState: { not_equals: 'archived' } },
          ],
        },
        limit: limit ?? 0,
        depth: 0,
        overrideAccess: true,
        sort: 'publishedAt',
      })

  let archived = 0
  let skipped = 0
  let errors = 0

  for (const post of posts.docs) {
    try {
      const result = await archivePostMedia({
        dryRun,
        payload,
        post: post as Post,
      })

      if (result.skipped) skipped += 1
      else archived += 1

      payload.logger.info({
        msg: dryRun ? 'archive (dry-run)' : 'archived',
        post: post.id,
        slug: post.slug,
        mediaIds: result.mediaIds,
        copied: result.copied,
      })
    } catch (error) {
      errors += 1
      payload.logger.error({ err: error, msg: `archive failed for post ${post.id}` })
    }
  }

  payload.logger.info({
    msg: '[archive-post-media] finished',
    dryRun,
    archived,
    skipped,
    errors,
  })

  process.exit(errors > 0 ? 1 : 0)
}

run().catch((error) => {
  console.error('[archive-post-media] failed')
  console.error(error)
  process.exit(1)
})
