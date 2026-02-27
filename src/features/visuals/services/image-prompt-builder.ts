import { BRAND_STYLE, NEGATIVE_PROMPTS, DEFAULT_STYLE_ANCHORS } from '../constants/brand-rules'
import type { VisualFormat } from '../constants/brand-rules'

interface VisualPromptJson {
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

/**
 * Converts a structured prompt_json into a flat text prompt for generateImage().
 *
 * Strategy:
 * 1. If `prompt_overall` exists, use it as primary prompt (user's curated directive)
 * 2. Otherwise, fall back to concatenating individual fields
 * 3. Always append style anchors + brand identity + negative prompts
 */
export function buildImagePrompt(
  promptJson: Record<string, unknown>,
  format: VisualFormat
): string {
  const p = promptJson as VisualPromptJson

  // --- Primary prompt: prefer prompt_overall if available ---
  if (p.prompt_overall && typeof p.prompt_overall === 'string' && p.prompt_overall.trim().length > 50) {
    return buildFromPromptOverall(p, format)
  }

  // --- Fallback: build from individual fields ---
  return buildFromFields(p, format)
}

/**
 * Uses the user's curated `prompt_overall` as the primary directive.
 * Appends style anchors and negative prompts.
 */
function buildFromPromptOverall(p: VisualPromptJson, format: VisualFormat): string {
  const parts: string[] = []

  // Primary directive
  parts.push(p.prompt_overall!.trim())

  // Style anchors (if not already present in prompt_overall)
  const promptLower = p.prompt_overall!.toLowerCase()
  for (const anchor of DEFAULT_STYLE_ANCHORS) {
    if (!promptLower.includes(anchor.toLowerCase())) {
      parts.push(anchor + '.')
    }
  }

  // Format
  parts.push(`Output format: ${format} aspect ratio for LinkedIn.`)

  // Rules from JSON (if any)
  if (p.rules?.length) {
    parts.push(`Rules: ${p.rules.join(' ')}`)
  }

  // Negative prompts
  const negatives = p.negative_prompts?.length ? p.negative_prompts : [...NEGATIVE_PROMPTS]
  parts.push(`Avoid: ${negatives.join(', ')}.`)

  return parts.join(' ')
}

/**
 * Fallback: builds prompt from individual structured fields.
 */
function buildFromFields(p: VisualPromptJson, format: VisualFormat): string {
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

  // Brand
  parts.push(`Brand: ${BRAND_STYLE.name}, ${BRAND_STYLE.domain}. ${BRAND_STYLE.tone}.`)
  if (p.brand?.logo_placement) parts.push(`Logo: ${p.brand.logo_placement}.`)

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
