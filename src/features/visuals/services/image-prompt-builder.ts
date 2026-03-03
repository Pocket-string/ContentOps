import {
  BRAND_STYLE,
  NEGATIVE_PROMPTS,
  DEFAULT_STYLE_ANCHORS,
  BRAND_LOGO_DESCRIPTION,
  BRAND_SIGNATURE,
} from '../constants/brand-rules'
import type { VisualFormat } from '../constants/brand-rules'
import type { VisualPromptJsonV2 } from '../schemas/visual-prompt-schema'

// ============================================
// V1 type (legacy — for backward compat)
// ============================================

interface VisualPromptJsonV1 {
  scene?: { description?: string; mood?: string; setting?: string }
  composition?: { layout?: string; focal_point?: string; text_placement?: string }
  text_overlay?: { headline?: string; subheadline?: string; cta_text?: string }
  style?: { aesthetic?: string; color_palette?: string[]; photography_style?: string; lighting?: string }
  brand?: { logo_placement?: string; typography_notes?: string }
  technical?: { format?: string; dimensions?: string }
  negative_prompts?: string[]
  prompt_overall?: string
  rules?: string[]
}

// ============================================
// Detection helpers
// ============================================

function isV2Schema(json: Record<string, unknown>): boolean {
  return 'meta' in json && 'layout' in json && 'content' in json
}

function hasSubstantialPromptOverall(json: Record<string, unknown>): boolean {
  const po = json.prompt_overall
  return typeof po === 'string' && po.trim().length > 50
}

// ============================================
// Main entry point
// ============================================

/**
 * Converts a structured prompt_json into a flat text prompt for generateImage().
 *
 * Strategy:
 * 1. If `prompt_overall` exists (>50 chars), use it (both V1 and V2)
 * 2. Detect V2 (has meta + layout + content) → buildFromV2Fields()
 * 3. Fallback: V1 (has scene + composition) → buildFromFields()
 * 4. Always append style anchors + brand identity + negative prompts
 */
export interface ImagePromptOptions {
  authorSignature?: string
  logoDescription?: string
}

export function buildImagePrompt(
  promptJson: Record<string, unknown>,
  format: VisualFormat,
  options?: ImagePromptOptions
): string {
  const sigText = options?.authorSignature ?? BRAND_SIGNATURE.text
  const logoDesc = options?.logoDescription ?? BRAND_LOGO_DESCRIPTION.reference_description

  // 1. Prefer prompt_overall if substantial (works for V1 and V2)
  if (hasSubstantialPromptOverall(promptJson)) {
    return buildFromPromptOverall(promptJson, format, sigText, logoDesc)
  }

  // 2. V2 schema detected → richer field extraction
  if (isV2Schema(promptJson)) {
    return buildFromV2Fields(promptJson as unknown as VisualPromptJsonV2, format, logoDesc)
  }

  // 3. V1 fallback
  return buildFromFields(promptJson as VisualPromptJsonV1, format, logoDesc)
}

// ============================================
// prompt_overall path (V1 + V2)
// ============================================

function buildFromPromptOverall(json: Record<string, unknown>, format: VisualFormat, sigText: string, logoDesc: string): string {
  const promptOverall = (json.prompt_overall as string).trim()
  const parts: string[] = [promptOverall]

  // Style anchors (if not already present)
  const promptLower = promptOverall.toLowerCase()
  for (const anchor of DEFAULT_STYLE_ANCHORS) {
    if (!promptLower.includes(anchor.toLowerCase())) {
      parts.push(anchor + '.')
    }
  }

  // ALWAYS inject logo if not already described in prompt_overall
  if (!promptLower.includes('logo') || !promptLower.includes('brand')) {
    parts.push(`MANDATORY LOGO: ${logoDesc} Place the logo at the bottom-left corner on a solid white band (12% of image height). Logo scale: max 20% of image width.`)
  }

  // ALWAYS inject author signature if not mentioned
  const sigLower = sigText.toLowerCase().slice(0, 15)
  if (!promptLower.includes(sigLower) && !promptLower.includes('author signature')) {
    parts.push(`Author signature: "${sigText}" in small muted text near the logo.`)
  }

  // Format
  parts.push(`Output format: ${format} aspect ratio for LinkedIn.`)

  // Rules from V1 JSON (if any)
  const rules = (json as VisualPromptJsonV1).rules
  if (rules?.length) {
    parts.push(`Rules: ${rules.join(' ')}`)
  }

  // Style guidelines from V2 (if present)
  const styleGuidelines = json.style_guidelines
  if (Array.isArray(styleGuidelines) && styleGuidelines.length > 0) {
    const guidelinesStr = styleGuidelines
      .filter((g): g is string => typeof g === 'string')
      .join('. ')
    if (guidelinesStr && !promptLower.includes(guidelinesStr.toLowerCase().slice(0, 30))) {
      parts.push(`Style rules: ${guidelinesStr}.`)
    }
  }

  // Negative prompts
  const negatives = Array.isArray(json.negative_prompts) && json.negative_prompts.length > 0
    ? json.negative_prompts.filter((n): n is string => typeof n === 'string')
    : [...NEGATIVE_PROMPTS]
  parts.push(`Avoid: ${negatives.join(', ')}.`)

  return parts.join(' ')
}

// ============================================
// V2 field extraction
// ============================================

function buildFromV2Fields(p: VisualPromptJsonV2, format: VisualFormat, logoDesc: string): string {
  const parts: string[] = []

  // Visual type context
  parts.push(`Create a ${p.meta.visual_type} visual for LinkedIn (${format}, ${p.meta.dimensions}).`)

  // Title and text content
  parts.push(`The image contains the headline "${p.content.title}" prominently displayed.`)
  if (p.content.subtitle) {
    parts.push(`Subtitle: "${p.content.subtitle}".`)
  }
  if (p.content.body_text) {
    parts.push(`Body text: "${p.content.body_text}".`)
  }

  // CTA
  if (p.content.cta) {
    parts.push(`Call-to-action button: "${p.content.cta.text}" styled as ${p.content.cta.style}, placed at ${p.content.cta.placement}.`)
  }

  // Visual elements
  parts.push(`Main visual element: ${p.content.visual_elements.type} — ${p.content.visual_elements.description}.`)
  if (p.content.visual_elements.key_elements.length > 0) {
    parts.push(`Key elements: ${p.content.visual_elements.key_elements.join(', ')}.`)
  }

  // Layout
  parts.push(`Layout: ${p.layout.grid} grid. Background: ${p.layout.background_style}.`)
  parts.push(`Title area: ${p.layout.title_area.position}, max width ${Math.round(p.layout.title_area.max_width_ratio * 100)}%, margin-top ${p.layout.title_area.margin_top}.`)
  parts.push(`Visual area: ${p.layout.visual_area.position}, ${Math.round(p.layout.visual_area.height_ratio * 100)}% height — ${p.layout.visual_area.description}.`)

  // Brand colors
  parts.push(`Colors: primary ${p.brand.colors.primary}, secondary ${p.brand.colors.secondary}, accent ${p.brand.colors.accent}, text ${p.brand.colors.text_main}, background ${p.brand.colors.background}.`)

  // Typography
  parts.push(`Typography: titles in ${p.brand.typography.title_font} ${p.brand.typography.title_style}, body in ${p.brand.typography.body_font} ${p.brand.typography.body_style}.`)

  // Logo — ALWAYS include (brand requirement)
  parts.push(`MANDATORY LOGO: ${p.brand.logo.reference_description || logoDesc} Placement: ${p.brand.logo.placement}, width ${Math.round(p.brand.logo.scale_relative_width * 100)}% of image.`)
  if (p.brand.logo.background_band.use_band) {
    parts.push(`White band behind logo: ${p.brand.logo.background_band.band_color}, height ${Math.round(p.brand.logo.background_band.band_height_ratio * 100)}% of image.`)
  }

  // Signature
  if (p.content.signature?.use_signature) {
    parts.push(`Author signature: "${p.content.signature.text}" at ${p.content.signature.placement}.`)
  }

  // Style guidelines (positive rules)
  if (p.style_guidelines.length > 0) {
    parts.push(`Style rules: ${p.style_guidelines.join('. ')}.`)
  }

  // Style anchors
  for (const anchor of DEFAULT_STYLE_ANCHORS) {
    parts.push(anchor + '.')
  }

  // Negative prompts
  const negatives = p.negative_prompts.length > 0 ? p.negative_prompts : [...NEGATIVE_PROMPTS]
  parts.push(`Avoid: ${negatives.join(', ')}.`)

  return parts.join(' ')
}

// ============================================
// V1 field extraction (unchanged for backward compat)
// ============================================

function buildFromFields(p: VisualPromptJsonV1, format: VisualFormat, logoDesc: string): string {
  const parts: string[] = []

  // Scene
  if (p.scene?.description) parts.push(p.scene.description)
  if (p.scene?.setting) parts.push(`Setting: ${p.scene.setting}.`)
  if (p.scene?.mood) parts.push(`Mood: ${p.scene.mood}.`)

  // Style
  if (p.style?.aesthetic) parts.push(`Style: ${p.style.aesthetic}.`)
  if (p.style?.photography_style) parts.push(`Photography: ${p.style.photography_style}.`)
  if (p.style?.lighting) parts.push(`Lighting: ${p.style.lighting}.`)
  if (p.style?.color_palette?.length) {
    parts.push(`Color palette: ${p.style.color_palette.join(', ')}.`)
  }

  // Composition
  if (p.composition?.layout) parts.push(`Layout: ${p.composition.layout}.`)
  if (p.composition?.focal_point) parts.push(`Focal point: ${p.composition.focal_point}.`)

  // Text overlay
  if (p.text_overlay?.headline) {
    parts.push(`The image contains the text "${p.text_overlay.headline}" prominently displayed.`)
  }
  if (p.text_overlay?.subheadline) {
    parts.push(`Subheadline text: "${p.text_overlay.subheadline}".`)
  }

  // Brand — ALWAYS include logo
  parts.push(`Brand: ${BRAND_STYLE.name}, ${BRAND_STYLE.domain}. ${BRAND_STYLE.tone}.`)
  parts.push(`MANDATORY LOGO: ${logoDesc} Place the logo at the bottom-left on a solid white band (12% of image height).`)
  if (p.brand?.logo_placement) parts.push(`Logo position: ${p.brand.logo_placement}.`)

  // Style anchors
  for (const anchor of DEFAULT_STYLE_ANCHORS) {
    parts.push(anchor + '.')
  }

  // Format
  parts.push(`Format: ${format} for LinkedIn.`)

  // Negative prompts
  const negatives = p.negative_prompts?.length ? p.negative_prompts : [...NEGATIVE_PROMPTS]
  parts.push(`Avoid: ${negatives.join(', ')}.`)

  return parts.join(' ')
}
