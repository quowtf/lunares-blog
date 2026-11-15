import sharp from 'sharp'

const MAX_IMAGE_DIMENSION = 2400
const JPEG_QUALITY = 85

export type ProcessedImage = {
  buffer: Buffer
  filename: string
  mimetype: 'image/jpeg'
  size: number
}

function toJpegFilename(filename: string): string {
  const base = filename.replace(/\.[^./\\]+$/, '').trim()

  return `${base || 'image'}.jpg`
}

/**
 * Normalizes any uploaded image to a stripped, auto-rotated JPEG.
 * Keeps the longest side at 2400px or less.
 */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  const input = Buffer.from(await file.arrayBuffer())

  const output = await sharp(input)
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer()

  return {
    buffer: output,
    filename: toJpegFilename(file.name),
    mimetype: 'image/jpeg',
    size: output.length,
  }
}
