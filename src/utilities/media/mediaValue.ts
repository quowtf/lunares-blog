import type { Media, PrivateMedia } from '@/payload-types'

export type MediaDoc = Media | PrivateMedia

/**
 * Payload can return upload values as an id, a populated document, or a
 * polymorphic wrapper (`{ relationTo, value }`). Keep the unwrapping in one
 * place so access checks, rendering and archive tasks agree on the shape.
 */
export type MediaValue =
  | MediaDoc
  | number
  | {
      relationTo?: 'media' | 'private-media' | string | null
      value?: MediaDoc | number | null
    }
  | null
  | undefined

function isMediaWrapper(value: unknown): value is { relationTo?: string; value?: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    ('relationTo' in value || !('id' in value))
  )
}

export function unwrapMediaValue(value: MediaValue): MediaDoc | number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value

  if (isMediaWrapper(value)) {
    return (value.value as MediaDoc | number | null | undefined) ?? null
  }

  return value as MediaDoc
}

export function getMediaId(value: MediaValue): number | null {
  const unwrapped = unwrapMediaValue(value)
  if (unwrapped === null) return null
  if (typeof unwrapped === 'number') return unwrapped
  return unwrapped.id
}

export function getMediaDoc(value: MediaValue): MediaDoc | null {
  const unwrapped = unwrapMediaValue(value)
  if (!unwrapped || typeof unwrapped !== 'object') return null
  return unwrapped
}

export function isPrivateMediaDoc(media: MediaDoc): media is PrivateMedia {
  return !('visibility' in media)
}
