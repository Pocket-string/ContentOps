/**
 * Composites the brand logo onto a generated image using sharp.
 *
 * Strategy: add a white band at the bottom of the image (12% height),
 * then overlay the logo at the bottom-left of that band.
 * This guarantees pixel-perfect logo placement regardless of what the
 * AI model generated in that area.
 */
import sharp from 'sharp'

const BAND_HEIGHT_RATIO = 0.12   // white band = 12% of total image height
const LOGO_MAX_WIDTH_RATIO = 0.22 // logo max width = 22% of image width
const LOGO_PADDING = 16           // px padding from left/bottom edges

export interface CompositeResult {
  buffer: Buffer
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp'
}

/**
 * Fetches a logo from a public URL and returns it as a Buffer.
 */
async function fetchLogoBuffer(logoUrl: string): Promise<Buffer> {
  const res = await fetch(logoUrl)
  if (!res.ok) throw new Error(`Failed to fetch logo: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Composites the logo onto the generated image.
 *
 * @param imageBase64  Base64-encoded image from Imagen 3
 * @param mediaType    MIME type of the generated image
 * @param logoUrl      Public URL of the brand logo (PNG recommended)
 * @returns            Composited image as Buffer + mediaType
 */
export async function compositeLogoOnImage(
  imageBase64: string,
  mediaType: string,
  logoUrl: string
): Promise<CompositeResult> {
  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const logoBuffer = await fetchLogoBuffer(logoUrl)

  // Get generated image dimensions
  const imageSharp = sharp(imageBuffer)
  const { width: imgWidth = 1080, height: imgHeight = 1080 } = await imageSharp.metadata()

  const bandHeight = Math.round(imgHeight * BAND_HEIGHT_RATIO)
  const logoMaxWidth = Math.round(imgWidth * LOGO_MAX_WIDTH_RATIO)

  // Resize logo to fit within the band, preserving aspect ratio
  const resizedLogo = await sharp(logoBuffer)
    .resize({
      width: logoMaxWidth,
      height: bandHeight - LOGO_PADDING * 2,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer()

  const { width: logoW = logoMaxWidth } = await sharp(resizedLogo).metadata()

  // Position: bottom-left, with padding
  const left = LOGO_PADDING
  const top = imgHeight - bandHeight + Math.round((bandHeight - (await sharp(resizedLogo).metadata()).height!) / 2)

  // Build white band rectangle as SVG overlay
  const whiteBand = Buffer.from(
    `<svg width="${imgWidth}" height="${bandHeight}">
      <rect width="${imgWidth}" height="${bandHeight}" fill="white"/>
    </svg>`
  )

  const outputMediaType = 'image/png'

  const composited = await sharp(imageBuffer)
    // 1. Overlay white band at the bottom
    .composite([
      {
        input: whiteBand,
        top: imgHeight - bandHeight,
        left: 0,
      },
      // 2. Overlay logo on top of the white band
      {
        input: resizedLogo,
        top,
        left,
      },
    ])
    .png()
    .toBuffer()

  return { buffer: composited, mediaType: outputMediaType }
}
