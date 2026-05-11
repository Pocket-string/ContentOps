/**
 * PRP-013: Screenshot overlay composer.
 *
 * Takes a base image (real product screenshot from lucvia/mantenimiento) +
 * an array of annotations + brand strip config, and composes the final image
 * via sharp (no AI regeneration of underlying UI — that's the whole point).
 *
 * Uses the same primitives as `logo-compositor.ts` (sharp).
 */

import sharp from 'sharp'

import {
  BRAND_COLORS_SEMANTIC,
  BRAND_LOGO_DESCRIPTION,
} from '@/features/visuals/constants/brand-rules'

export type AnnotationStyle = 'callout' | 'highlight' | 'headline' | 'arrow'
export type AnnotationColor = 'neutral' | 'loss' | 'accent' | 'success' | 'warning'

export interface Annotation {
  /** X coordinate (pixels, top-left origin). */
  x: number
  /** Y coordinate. */
  y: number
  /** Width hint (auto-fit if absent). */
  width?: number
  /** Height hint (auto-fit if absent). */
  height?: number
  /** Annotation text (max ~8 words recommended). */
  text: string
  /** Optional arrow direction. */
  arrow?: 'none' | 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right'
  /** Visual style. */
  style?: AnnotationStyle
  /** Color role. */
  color?: AnnotationColor
}

export interface OverlayInput {
  /** Buffer or path of the base image. */
  baseImage: Buffer
  /** Annotations to draw on top of the base. */
  annotations: Annotation[]
  /** Whether to add the 12% white band + logo at bottom-left. */
  addBrandStrip?: boolean
  /** Optional logo PNG buffer for compositing. If absent and addBrandStrip=true, only white band is drawn (no actual logo). */
  logoBuffer?: Buffer
  /** Optional target output dimensions. If not provided, uses base image dims. */
  targetWidth?: number
  targetHeight?: number
}

/** Hex color per annotation role. */
function colorFor(role: AnnotationColor): string {
  switch (role) {
    case 'loss':
      return BRAND_COLORS_SEMANTIC.accent_danger // red
    case 'accent':
      return BRAND_COLORS_SEMANTIC.secondary // orange
    case 'success':
      return BRAND_COLORS_SEMANTIC.accent // green
    case 'warning':
      return BRAND_COLORS_SEMANTIC.accent_warning // yellow
    case 'neutral':
    default:
      return BRAND_COLORS_SEMANTIC.primary // navy
  }
}

/** Escape XML special chars for SVG text. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Estimate label width from text length (rough). */
function estimateLabelWidth(text: string, fontSizePx: number): number {
  // Average char width ~0.55 of font size
  return Math.ceil(text.length * fontSizePx * 0.55) + 24 // padding
}

/** Render a single annotation as an SVG fragment. */
function renderAnnotationSvg(a: Annotation, fontSizePx: number): string {
  const color = colorFor(a.color ?? 'neutral')
  const labelW = a.width ?? estimateLabelWidth(a.text, fontSizePx)
  const labelH = a.height ?? fontSizePx + 16
  const textXml = escapeXml(a.text)
  const style = a.style ?? 'callout'

  // Callout box with optional arrow
  if (style === 'headline') {
    // Large headline, no box, just text with subtle shadow
    return `
      <g transform="translate(${a.x},${a.y})">
        <text x="0" y="0" font-family="Inter, sans-serif" font-size="${Math.ceil(fontSizePx * 1.3)}" font-weight="bold" fill="${color}" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.15))">${textXml}</text>
      </g>
    `
  }
  if (style === 'highlight') {
    // Pill highlight
    return `
      <g transform="translate(${a.x},${a.y})">
        <rect x="0" y="0" width="${labelW}" height="${labelH}" rx="${labelH / 2}" fill="${color}" opacity="0.92"/>
        <text x="${labelW / 2}" y="${labelH / 2 + fontSizePx / 3}" text-anchor="middle" font-family="Inter, sans-serif" font-size="${fontSizePx}" font-weight="600" fill="#FFFFFF">${textXml}</text>
      </g>
    `
  }
  // default 'callout' or 'arrow'
  return `
    <g transform="translate(${a.x},${a.y})">
      <rect x="0" y="0" width="${labelW}" height="${labelH}" rx="6" fill="#FFFFFF" stroke="${color}" stroke-width="2" opacity="0.97"/>
      <text x="12" y="${labelH / 2 + fontSizePx / 3}" font-family="Inter, sans-serif" font-size="${fontSizePx}" fill="${color}" font-weight="600">${textXml}</text>
    </g>
  `
}

/** Compose the full SVG overlay. */
function buildOverlaySvg(width: number, height: number, annotations: Annotation[]): string {
  // Font size: ~3.2% of image height (e.g. 35px for 1080)
  const fontSizePx = Math.max(18, Math.round(height * 0.032))
  const parts = annotations.map((a) => renderAnnotationSvg(a, fontSizePx)).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${parts}</svg>`
}

/**
 * Compose base image + annotations + (optional) brand strip into a final image.
 * Returns a Buffer (PNG by default).
 */
export async function composeOverlay(input: OverlayInput): Promise<Buffer> {
  const { baseImage, annotations, addBrandStrip = true, logoBuffer, targetWidth, targetHeight } = input

  // Load base + extract metadata
  let pipeline = sharp(baseImage)
  const metadata = await pipeline.metadata()
  const width = targetWidth ?? metadata.width ?? 1080
  const height = targetHeight ?? metadata.height ?? 1080

  // Resize if target dims provided and differ
  if (targetWidth && targetHeight && (metadata.width !== targetWidth || metadata.height !== targetHeight)) {
    pipeline = pipeline.resize(targetWidth, targetHeight, { fit: 'cover', position: 'top' })
  }

  // Compose overlays
  const composites: sharp.OverlayOptions[] = []

  // 1. Annotations layer
  if (annotations.length > 0) {
    const overlaySvg = buildOverlaySvg(width, height, annotations)
    composites.push({
      input: Buffer.from(overlaySvg),
      top: 0,
      left: 0,
    })
  }

  // 2. White brand strip + logo (12% bottom band)
  if (addBrandStrip) {
    const bandHeight = Math.round(height * BRAND_LOGO_DESCRIPTION.default_band.band_height_ratio)
    const bandSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${bandHeight}">
      <rect x="0" y="0" width="${width}" height="${bandHeight}" fill="#FFFFFF"/>
    </svg>`
    composites.push({
      input: Buffer.from(bandSvg),
      top: height - bandHeight,
      left: 0,
    })

    // Logo on the band (bottom-left)
    if (logoBuffer) {
      const logoTargetWidth = Math.round(width * BRAND_LOGO_DESCRIPTION.default_scale)
      const resizedLogo = await sharp(logoBuffer)
        .resize(logoTargetWidth, undefined, { fit: 'inside' })
        .png()
        .toBuffer()
      const logoMeta = await sharp(resizedLogo).metadata()
      const logoH = logoMeta.height ?? Math.round(bandHeight * 0.6)
      composites.push({
        input: resizedLogo,
        top: height - bandHeight + Math.round((bandHeight - logoH) / 2),
        left: Math.round(width * 0.04),
      })
    }
  }

  return pipeline.composite(composites).png().toBuffer()
}

/**
 * Validate annotation positions are within bounds.
 * Returns warnings (does not mutate).
 */
export function validateAnnotations(
  annotations: Annotation[],
  imageWidth: number,
  imageHeight: number
): string[] {
  const warnings: string[] = []
  for (const [i, a] of annotations.entries()) {
    if (a.x < 0 || a.x > imageWidth) warnings.push(`Annotation #${i + 1} x=${a.x} out of bounds (image width ${imageWidth})`)
    if (a.y < 0 || a.y > imageHeight) warnings.push(`Annotation #${i + 1} y=${a.y} out of bounds (image height ${imageHeight})`)
    if (a.text.length > 80) warnings.push(`Annotation #${i + 1} text too long (${a.text.length} chars, recommended <80)`)
  }
  if (annotations.length > 4) warnings.push(`Too many annotations (${annotations.length}, recommended max 4)`)
  return warnings
}
