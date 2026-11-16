import { getMediaId, type MediaValue } from '@/utilities/media/mediaValue'

type IdMap = Map<number, number>

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function cloneJSON<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T)
}

function idFromValue(value: unknown): number | null {
  return getMediaId(value as MediaValue)
}

function archiveContent(value: unknown, mapping: IdMap): unknown {
  if (Array.isArray(value)) return value.map((item) => archiveContent(item, mapping))
  if (!isObject(value)) return value

  if (value.type === 'upload' && value.relationTo !== 'private-media') {
    const id = idFromValue(value.value)
    const privateId = id ? mapping.get(id) : null
    if (privateId) {
      return { ...value, relationTo: 'private-media', value: privateId }
    }
  }

  if (value.type === 'block' && isObject(value.fields) && value.fields.blockType === 'mediaBlock') {
    const id = idFromValue(value.fields.media)
    const privateId = id ? mapping.get(id) : null
    if (privateId) {
      return {
        ...value,
        fields: { ...value.fields, media: null, privateMedia: privateId },
      }
    }
  }

  const next: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    next[key] = archiveContent(child, mapping)
  }
  return next
}

function promoteContent(value: unknown, mapping: IdMap): unknown {
  if (Array.isArray(value)) return value.map((item) => promoteContent(item, mapping))
  if (!isObject(value)) return value

  if (value.type === 'upload' && value.relationTo === 'private-media') {
    const privateId = idFromValue(value.value)
    const publicId = privateId ? mapping.get(privateId) : null
    if (publicId) {
      return { ...value, relationTo: 'media', value: publicId }
    }
  }

  if (value.type === 'block' && isObject(value.fields) && value.fields.blockType === 'mediaBlock') {
    const privateId = idFromValue(value.fields.privateMedia)
    const publicId = privateId ? mapping.get(privateId) : null
    if (publicId) {
      return {
        ...value,
        fields: { ...value.fields, media: publicId, privateMedia: null },
      }
    }
  }

  const next: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    next[key] = promoteContent(child, mapping)
  }
  return next
}

export function archivePostMediaRefs(
  doc: Record<string, unknown>,
  mapping: IdMap,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}

  const heroId = idFromValue(doc.heroImage)
  const privateHeroId = heroId ? mapping.get(heroId) : null
  if (privateHeroId) {
    patch.heroImage = null
    patch.privateHeroImage = privateHeroId
  }

  const gallery = Array.isArray(doc.galleryImages) ? doc.galleryImages : []
  const privateGallery = gallery
    .map((image) => idFromValue(image))
    .filter((id): id is number => Boolean(id))
    .map((id) => mapping.get(id))
    .filter((id): id is number => Boolean(id))

  if (privateGallery.length > 0) {
    patch.galleryImages = []
    patch.privateGalleryImages = privateGallery
  }

  if (doc.content) {
    patch.content = archiveContent(cloneJSON(doc.content), mapping)
  }

  return patch
}

export function promotePostMediaRefs(
  doc: Record<string, unknown>,
  mapping: IdMap,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}

  const privateHeroId = idFromValue(doc.privateHeroImage)
  const heroId = privateHeroId ? mapping.get(privateHeroId) : null
  if (heroId) {
    patch.heroImage = heroId
    patch.privateHeroImage = null
  }

  const privateGallery = Array.isArray(doc.privateGalleryImages) ? doc.privateGalleryImages : []
  const gallery = privateGallery
    .map((image) => idFromValue(image))
    .filter((id): id is number => Boolean(id))
    .map((id) => mapping.get(id))
    .filter((id): id is number => Boolean(id))

  if (gallery.length > 0) {
    patch.galleryImages = gallery
    patch.privateGalleryImages = []
  }

  if (doc.content) {
    patch.content = promoteContent(cloneJSON(doc.content), mapping)
  }

  return patch
}
