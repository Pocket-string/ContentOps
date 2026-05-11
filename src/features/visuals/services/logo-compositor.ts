/**
 * Composites the brand logo onto a generated image using sharp.
 *
 * Strategy (PRP-013 Patch #2): glass-morphism pill in the bottom-right corner.
 * A small rounded rectangle with semi-transparent white fill + drop shadow,
 * with the logo PNG centered inside. Preserves the underlying composition
 * (no 12% band that amputates content).
 */
import sharp from 'sharp'

const PILL_HEIGHT_RATIO = 0.055    // pill height = 5.5% of image height
const PILL_HEIGHT_MIN_PX = 48      // floor for small canvases
const PILL_MARGIN_RATIO = 0.035    // distance from right/bottom edges
const PILL_MARGIN_MIN_PX = 24
const PILL_INNER_PADDING_Y_RATIO = 0.18 // vertical padding inside pill (fraction of pillH)
const PILL_INNER_PADDING_X_RATIO = 0.34 // horizontal padding inside pill (fraction of pillH)
const PILL_FILL_OPACITY = 0.92

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
 * Builds the sharp composite operations to draw a glass-morphism brand pill
 * (semi-transparent white rounded rect + drop-shadow + logo) in the bottom-right
 * corner of a canvas of the given dimensions.
 *
 * Caller is responsible for invoking `.composite([...])` on a sharp pipeline
 * already sized to `width × height`.
 */
export async function buildBrandPillComposites(
  width: number,
  height: number,
  logoBuffer: Buffer
): Promise<sharp.OverlayOptions[]> {
  const pillH = Math.max(PILL_HEIGHT_MIN_PX, Math.round(height * PILL_HEIGHT_RATIO))
  const innerPaddingY = Math.round(pillH * PILL_INNER_PADDING_Y_RATIO)
  const innerPaddingX = Math.round(pillH * PILL_INNER_PADDING_X_RATIO)
  const logoTargetH = Math.max(16, pillH - 2 * innerPaddingY)

  const resizedLogo = await sharp(logoBuffer)
    .resize(undefined, logoTargetH, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer()
  const logoMeta = await sharp(resizedLogo).metadata()
  const logoW = logoMeta.width ?? Math.round(logoTargetH * 3)
  const logoH = logoMeta.height ?? logoTargetH

  const pillW = logoW + 2 * innerPaddingX
  const margin = Math.max(PILL_MARGIN_MIN_PX, Math.round(height * PILL_MARGIN_RATIO))
  const pillX = width - pillW - margin
  const pillY = height - pillH - margin

  const pillSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <filter id="pill-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="black" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" ry="${pillH / 2}" fill="white" fill-opacity="${PILL_FILL_OPACITY}" filter="url(#pill-shadow)"/>
</svg>`

  return [
    {
      input: Buffer.from(pillSvg),
      top: 0,
      left: 0,
    },
    {
      input: resizedLogo,
      top: pillY + Math.round((pillH - logoH) / 2),
      left: pillX + innerPaddingX,
    },
  ]
}

/**
 * Composites the logo onto the generated image as a glass-morphism pill.
 *
 * @param imageBase64  Base64-encoded image from the AI image model
 * @param mediaType    MIME type of the generated image (preserved on output as PNG)
 * @param logoUrl      Public URL of the brand logo (PNG recommended, transparent bg)
 * @returns            Composited image as Buffer + mediaType
 */
export async function compositeLogoOnImage(
  imageBase64: string,
  _mediaType: string,
  logoUrl: string
): Promise<CompositeResult> {
  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const logoBuffer = await fetchLogoBuffer(logoUrl)

  const { width = 1080, height = 1080 } = await sharp(imageBuffer).metadata()
  const composites = await buildBrandPillComposites(width, height, logoBuffer)

  const composited = await sharp(imageBuffer)
    .composite(composites)
    .png()
    .toBuffer()

  return { buffer: composited, mediaType: 'image/png' }
}
