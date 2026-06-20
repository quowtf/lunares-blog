import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Route handler for Vercel Cron to trigger the cleanup-expired-stories job.
 *
 * - Validates Authorization: Bearer {CRON_SECRET}
 * - Queues and runs the cleanup task via Payload Jobs API
 * - Returns 200 on success, 401 on auth failure
 *
 * Requirements: 8.2, 8.3, 8.4
 */
export async function GET(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET

  // Req 8.4 / 8.5: If CRON_SECRET is not defined or auth header doesn't match → 401
  if (!cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })

    // Queue the cleanup task and run it
    await payload.jobs.queue({
      task: 'cleanup-expired-stories' as 'schedulePublish', // cast: types not yet regenerated
      input: {},
    })

    await payload.jobs.run()

    return NextResponse.json({ success: true, message: 'Cleanup job executed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
