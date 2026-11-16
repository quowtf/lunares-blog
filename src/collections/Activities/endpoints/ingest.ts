import type { CollectionConfig, PayloadRequest } from 'payload'
import { APIError } from 'payload'
import { revalidatePath } from 'next/cache'

import type { Activity } from '@/payload-types'
import { isStatType } from '@/utilities/stats/config'
import { parseActivityDate } from '@/utilities/stats/date'

type CollectionEndpoint = Exclude<NonNullable<CollectionConfig['endpoints']>, false>[number]

const INGEST_PATH = '/ingest'

type IngestBody = {
  attempts?: unknown
  date?: unknown
  failed?: unknown
  type?: unknown
  value?: unknown
}

type IngestData = Pick<Activity, 'day' | 'occurredAt' | 'type'> &
  Partial<Pick<Activity, 'attempts' | 'failed' | 'value'>>

export const ingestActivity: CollectionEndpoint = {
  path: INGEST_PATH,
  method: 'post',
  handler: async (req) => {
    if (!isAuthorized(req)) {
      throw new APIError('Unauthorized', 401)
    }

    let body: IngestBody

    try {
      if (!req.json) throw new Error('No JSON parser')
      body = (await req.json()) as IngestBody
    } catch {
      throw new APIError('JSON inválido.', 400)
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new APIError('Body inválido.', 400)
    }

    if (!isStatType(body.type)) {
      throw new APIError('type inválido.', 400)
    }

    const date = parseActivityDate(body.date)

    if (!date) {
      throw new APIError('date inválida. Usa YYYY-MM-DD.', 400)
    }

    const data: IngestData = {
      day: date.day,
      occurredAt: date.occurredAt,
      type: body.type,
    }

    if (body.type === 'boulder') {
      data.attempts = body.attempts as number
      data.failed = body.failed as number
    } else {
      data.value = body.value as number
    }

    const activity = await req.payload.create({
      collection: 'activities',
      data,
      overrideAccess: true,
      req,
    })

    revalidatePath('/')

    return Response.json(
      {
        ok: true,
        id: activity.id,
        type: activity.type,
        day: activity.day,
        value: activity.value,
        attempts: activity.attempts ?? null,
        failed: activity.failed ?? null,
        completed:
          typeof activity.attempts === 'number' && typeof activity.failed === 'number'
            ? activity.attempts - activity.failed
            : null,
      },
      { status: 201 },
    )
  },
}

function isAuthorized(req: PayloadRequest): boolean {
  if (req.user?.role === 'admin') return true

  const secret = process.env.STATS_INGEST_SECRET
  if (!secret) return false

  return req.headers.get('authorization') === `Bearer ${secret}`
}
