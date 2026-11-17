import sharp from 'sharp'

const MAX_IMAGE_DIMENSION = 2400
const JPEG_QUALITY = 85

type ProcessImageOptions = {
  /** Keep PNG output when the source has an alpha channel (e.g. route maps). */
  preserveAlpha?: boolean
}

export type ProcessedImage = {
  buffer: Buffer
  filename: string
  mimetype: 'image/jpeg' | 'image/png'
  size: number
}

function toFilename(filename: string, extension: 'jpg' | 'png'): string {
  const base = filename.replace(/\.[^./\\]+$/, '').trim()

  return `${base || 'image'}.${extension}`
}

/**
 * Normalizes an uploaded image: strips metadata, auto-rotates and keeps the
 * longest side at 2400px or less. Converts to JPEG unless `preserveAlpha` is
 * enabled and the source has transparency.
 */
export async function processImageFile(
  file: File,
  { preserveAlpha = false }: ProcessImageOptions = {},
): Promise<ProcessedImage> {
  const input = Buffer.from(await file.arrayBuffer())
  const metadata = preserveAlpha ? await sharp(input).metadata() : null
  const keepAlpha = Boolean(metadata?.hasAlpha)

  const pipeline = () =>
    sharp(input).rotate().resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })

  const output = keepAlpha
    ? await pipeline().png({ compressionLevel: 9 }).toBuffer()
    : await pipeline().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer()

  return {
    buffer: output,
    filename: toFilename(file.name, keepAlpha ? 'png' : 'jpg'),
    mimetype: keepAlpha ? 'image/png' : 'image/jpeg',
    size: output.length,
  }
}
