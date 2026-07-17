import { getPayload } from 'payload'
import config from '@payload-config'

interface StoryMetric {
  id: number
  views: number
  taps: number
  visible: number
  skips: number
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const metrics: StoryMetric[] = body?.metrics

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return new Response('Invalid payload', { status: 400 })
    }

    // Validate each metric entry
    for (const m of metrics) {
      if (typeof m.id !== 'number') {
        return new Response('Each metric must have a numeric id', { status: 400 })
      }
    }

    const payload = await getPayload({ config })

    // Fetch current values for all story IDs in a single query
    const storyIds = metrics.map((m) => m.id)
    const existing = await payload.find({
      collection: 'stories',
      where: {
        id: { in: storyIds },
      },
      limit: storyIds.length,
      depth: 0,
      overrideAccess: true,
    })

    const existingMap = new Map(existing.docs.map((doc) => [doc.id, doc]))

    // Bulk increment: update each story with accumulated metrics
    const updates = metrics
      .filter((m) => existingMap.has(m.id))
      .map((m) => {
        const doc = existingMap.get(m.id)!
        return payload.update({
          collection: 'stories',
          id: m.id,
          data: {
            views: (doc.views || 0) + (m.views || 0),
            taps: (doc.taps || 0) + (m.taps || 0),
            visible: (doc.visible || 0) + (m.visible || 0),
            skips: (doc.skips || 0) + (m.skips || 0),
          },
          overrideAccess: true,
        })
      })

    await Promise.all(updates)

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('[Telemetry] Error processing story metrics:', error)
    return new Response('Internal error', { status: 500 })
  }
}
