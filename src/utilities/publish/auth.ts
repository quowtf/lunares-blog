import { timingSafeEqual } from 'node:crypto'

export type PublishAuthResult = { ok: true } | { ok: false; status: 401 | 500; error: string }

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) return false

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function checkPublishAuth(req: Request): PublishAuthResult {
  const secret = process.env.STORIES_SECRET

  if (!secret) {
    return { ok: false, status: 500, error: 'STORIES_SECRET not configured' }
  }

  const authorization = req.headers.get('authorization') ?? ''

  if (!safeEqual(authorization, `Bearer ${secret}`)) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  return { ok: true }
}
