import { getMediaId, type MediaValue } from '@/utilities/media/mediaValue'

export type MediaReferenceSource = 'pages' | 'posts' | 'stories'
export type MediaReferenceRelation = 'media' | 'private-media'

export type CollectedMediaReference = {
  fieldPath: string
  mediaId: number
  relationTo: MediaReferenceRelation
}

type AddReference = (
  value: unknown,
  fieldPath: string,
  relationTo?: MediaReferenceRelation,
) => void

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readRelationTo(node: Record<string, unknown>): MediaReferenceRelation {
  return node.relationTo === 'private-media' ? 'private-media' : 'media'
}

/**
 * Walks Lexical JSON and reports every upload node / mediaBlock it finds.
 * The walker is intentionally permissive: content can nest uploads inside
 * banners and other blocks, and populated values can be ids or documents.
 */
function collectFromLexical(value: unknown, path: string, add: AddReference): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectFromLexical(item, `${path}.${index}`, add))
    return
  }

  if (!isObject(value)) return

  if (value.type === 'upload' && 'value' in value) {
    add(value.value, path, readRelationTo(value))
  }

  if (value.type === 'block' && isObject(value.fields)) {
    if (value.fields.blockType === 'mediaBlock') {
      add(value.fields.media, `${path}.fields.media`)
      add(value.fields.privateMedia, `${path}.fields.privateMedia`, 'private-media')
    }
  }

  for (const [key, child] of Object.entries(value)) {
    // Avoid walking into the populated upload document itself.
    if (value.type === 'upload' && key === 'value') continue
    collectFromLexical(child, `${path}.${key}`, add)
  }
}

function collectFromBlocks(value: unknown, path: string, add: AddReference): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectFromBlocks(item, `${path}.${index}`, add))
    return
  }

  if (!isObject(value)) return

  if (value.blockType === 'mediaBlock') {
    add(value.media, `${path}.media`)
    add(value.privateMedia, `${path}.privateMedia`, 'private-media')
  }

  collectFromLexical(value, path, add)
}

export function collectMediaReferences({
  doc,
  sourceCollection,
}: {
  doc: Record<string, unknown>
  sourceCollection: MediaReferenceSource
}): CollectedMediaReference[] {
  const references: CollectedMediaReference[] = []
  const seen = new Set<string>()

  const add: AddReference = (value, fieldPath, relationTo = 'media') => {
    const mediaId = getMediaId(value as MediaValue)
    if (!mediaId) return

    const key = `${relationTo}:${mediaId}:${fieldPath}`
    if (seen.has(key)) return
    seen.add(key)

    references.push({ fieldPath, mediaId, relationTo })
  }

  const addField = (name: string, relationTo: MediaReferenceRelation = 'media') => {
    const value = doc[name]
    if (Array.isArray(value)) {
      value.forEach((item, index) => add(item, `${name}.${index}`, relationTo))
      return
    }
    add(value, name, relationTo)
  }

  if (sourceCollection === 'posts') {
    addField('heroImage')
    addField('privateHeroImage', 'private-media')
    addField('galleryImages')
    addField('privateGalleryImages', 'private-media')

    const meta = isObject(doc.meta) ? doc.meta : null
    if (meta) add(meta.image, 'meta.image')

    collectFromLexical(doc.content, 'content', add)
    return references
  }

  if (sourceCollection === 'pages') {
    const hero = isObject(doc.hero) ? doc.hero : null
    if (hero) add(hero.media, 'hero.media')

    const meta = isObject(doc.meta) ? doc.meta : null
    if (meta) add(meta.image, 'meta.image')

    collectFromBlocks(doc.layout, 'layout', add)
    return references
  }

  addField('image')
  add('privateImage', 'privateImage', 'private-media')
  return references
}

export function hasPrivateMediaReferences(
  doc: Record<string, unknown>,
  sourceCollection: MediaReferenceSource = 'posts',
): boolean {
  return collectMediaReferences({ doc, sourceCollection }).some(
    (reference) => reference.relationTo === 'private-media',
  )
}
