import type { CollectionBeforeValidateHook } from 'payload'
import sharp from 'sharp'

/**
 * Strips EXIF, GPS, and other metadata from uploaded images before they are
 * saved. This protects user privacy (no GPS coordinates leak) and slightly
 * reduces file size.
 *
 * Runs on the original buffer before Payload generates imageSizes variants,
 * so all derived sizes also inherit the clean metadata.
 */
export const stripMetadata: CollectionBeforeValidateHook = async ({ data, req }) => {
  const file = req.file

  if (!file?.data || !file.mimetype?.startsWith('image/')) {
    return data
  }

  // SVGs don't have EXIF
  if (file.mimetype === 'image/svg+xml') {
    return data
  }

  try {
    const processed = await sharp(file.data)
      .rotate() // Auto-rotate based on EXIF orientation before stripping
      .withMetadata({}) // Strip all metadata (EXIF, GPS, ICC, XMP)
      .toBuffer()

    // Mutate the file buffer in place so Payload uses the clean version
    file.data = processed
    file.size = processed.length
  } catch (err) {
    req.payload.logger.warn({ err, msg: 'stripMetadata: failed to process image, skipping' })
  }

  return data
}
