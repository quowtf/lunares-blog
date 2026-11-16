import type { TaskHandler } from 'payload'

import type { Post } from '@/payload-types'
import { getArchiveCutoff } from '@/utilities/archive/archiveWindow'
import { archivePostMedia } from '@/utilities/archive/media/archivePostMedia'
import { promotePostMedia } from '@/utilities/archive/media/promotePostMedia'

const DEFAULT_LIMIT = 20
const TIME_BUDGET_MS = 45_000

type Input = {
  dryRun?: boolean
  limit?: number
}

type Output = {
  archived: number
  errors: number
  promoted: number
  skipped: number
  success: boolean
}

export const syncArchivedPostMedia: TaskHandler<{ input: Input; output: Output }> = async ({
  input,
  req,
}) => {
  const payload = req.payload
  const logger = payload.logger
  const dryRun = Boolean(input?.dryRun)
  const limit = Math.max(1, Math.min(input?.limit ?? DEFAULT_LIMIT, 50))
  const cutoff = getArchiveCutoff()
  const startedAt = Date.now()

  const output: Output = {
    archived: 0,
    errors: 0,
    promoted: 0,
    skipped: 0,
    success: true,
  }

  const outOfTime = () => Date.now() - startedAt > TIME_BUDGET_MS

  // Posts that returned to the public window without going through the hook.
  const needsPromotion = await payload.find({
    collection: 'posts',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { publishedAt: { greater_than_equal: cutoff.toISOString() } },
        { mediaArchiveState: { in: ['needs-promotion', 'archived'] } },
      ],
    },
    limit,
    depth: 0,
    overrideAccess: true,
  })

  for (const post of needsPromotion.docs) {
    if (outOfTime()) break

    try {
      const result = await promotePostMedia({ doc: post, payload })

      if (dryRun) {
        if (result.promoted) output.promoted += 1
        continue
      }

      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          ...result.patch,
          mediaArchiveState: 'none',
        },
        depth: 0,
        overrideAccess: true,
        context: {
          disableRevalidate: true,
          skipMediaArchiveState: true,
          skipMediaPromotion: true,
        },
      })

      if (result.promoted) output.promoted += 1
    } catch (error) {
      output.errors += 1
      output.success = false
      logger.error({ err: error, msg: `[media-archive] promotion failed for post ${post.id}` })
    }
  }

  const pending = await payload.find({
    collection: 'posts',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { publishedAt: { less_than: cutoff.toISOString() } },
        { mediaArchiveState: { not_equals: 'archived' } },
      ],
    },
    limit,
    depth: 0,
    overrideAccess: true,
    sort: 'publishedAt',
  })

  for (const post of pending.docs) {
    if (outOfTime()) break

    try {
      const result = await archivePostMedia({
        dryRun,
        payload,
        post: post as Post,
      })

      if (result.skipped) output.skipped += 1
      else output.archived += 1
    } catch (error) {
      output.errors += 1
      output.success = false
      logger.error({ err: error, msg: `[media-archive] archive failed for post ${post.id}` })
    }
  }

  logger.info({ msg: '[media-archive] finished', output })

  return { output }
}
