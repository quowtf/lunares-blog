import type { CollectionConfig, PayloadRequest } from 'payload'
import { APIError } from 'payload'
import { revalidatePath } from 'next/cache'

import type { Activity } from '@/payload-types'
import { parseStatType } from '@/utilities/stats/config'
import { parseActivityDate } from '@/utilities/stats/date'
import {
  isDecimalValue,
  parseBoulderValue,
  toNonNegativeNumber,
} from '@/utilities/stats/numbers'

type CollectionEndpoint = Exclude<NonNullable<CollectionConfig['endpoints']>, false>[number]

const INGEST_PATH = '/ingest'

type IngestBody = {
  date?: unknown
  type?: unknown
  value?: unknown
}

type IngestData = Pick<Activity, 'day' | 'occurredAt' | 'type'> &
  Partial<Pick<Activity, 'failed' | 'value'>>

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

    const rawType = typeof body.type === 'string' ? body.type.trim() : body.type
    const hasType = rawType !== undefined && rawType !== null && rawType !== ''
    const explicitType = parseStatType(rawType)

    if (hasType && !explicitType) {
      throw new APIError('type inválido. Usa km o gr; omite type para code/boulder.', 400)
    }

    // Integer value means code commits; decimal value means boulder attempts.
    const inferredType = isDecimalValue(body.value) ? 'boulder' : 'code'
    const type = explicitType ?? inferredType

    const date = parseActivityDate(body.date)

    if (!date) {
      throw new APIError('date inválida. Usa YYYY-MM-DD.', 400)
    }

    const boulder = type === 'boulder' ? parseBoulderValue(body.value) : null

    if (type === 'boulder' && !boulder) {
      throw new APIError('Boulder requiere value como tops.fallidos, ej. 11.99.', 422)
    }

    const value = boulder ? boulder.tops : toNonNegativeNumber(body.value)

    if (value === null) {
      throw new APIError('value inválido.', 422)
    }

    if (type === 'code' && !Number.isInteger(value)) {
      throw new APIError('code requiere value entero.', 422)
    }

    const data: IngestData = {
      day: date.day,
      occurredAt: date.occurredAt,
      type,
      value,
      ...(boulder ? { failed: boulder.failed } : {}),
    }

    const activity = await req.payload.create({
      collection: 'activities',
      data,
      overrideAccess: true,
      req,
    })

    revalidatePath('/')

    const storedValue = activity.value ?? 0
    const failed = activity.type === 'boulder' ? (activity.failed ?? 0) : null

    return Response.json(
      {
        ok: true,
        id: activity.id,
        type: activity.type,
        day: activity.day,
        value: storedValue,
        failed,
        total: failed === null ? storedValue : storedValue + failed,
      },
      { status: 201 },
    )
  },
}

function isAuthorized(req: PayloadRequest): boolean {
  if (req.user?.role === 'admin') return true

  const secret = process.env.STORIES_SECRET
  if (!secret) return false

  return req.headers.get('authorization') === `Bearer ${secret}`
}
