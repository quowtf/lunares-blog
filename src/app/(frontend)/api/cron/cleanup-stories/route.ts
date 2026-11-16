import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const maxDuration = 60

/**
 * Single Vercel Cron entry (Hobby plan allows one daily cron).
 *
 * Runs both background jobs in isolation:
 * - cleanup-expired-stories
 * - sync-archived-post-media
 *
 * Auth: Authorization: Bearer {CRON_SECRET}
 */
export async function GET(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let payload: Awaited<ReturnType<typeof getPayload>>

  try {
    payload = await getPayload({ config })
  } catch (err) {
    console.error('[cron] failed to initialize Payload:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }

  const results: Record<string, unknown> = {}
  let failed = false

  const storyJob = await payload.jobs.queue({
    task: 'cleanup-expired-stories',
    input: {},
  })

  const mediaJob = await payload.jobs.queue({
    task: 'sync-archived-post-media',
    input: { limit: 20 },
  })

  try {
    results.stories = await payload.jobs.runByID({
      id: storyJob.id,
      overrideAccess: true,
    })
  } catch (err) {
    failed = true
    payload.logger.error({ err, msg: '[cron] cleanup-expired-stories failed' })
  }

  try {
    results.media = await payload.jobs.runByID({
      id: mediaJob.id,
      overrideAccess: true,
    })
  } catch (err) {
    failed = true
    payload.logger.error({ err, msg: '[cron] sync-archived-post-media failed' })
  }

  return NextResponse.json(
    { success: !failed, results },
    { status: failed ? 207 : 200 },
  )
}
