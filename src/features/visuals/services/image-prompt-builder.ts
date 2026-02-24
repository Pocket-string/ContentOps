import { BRAND_STYLE, NEGATIVE_PROMPTS } from '../constants/brand-rules'
import type { VisualFormat } from '../constants/brand-rules'

interface VisualPromptJson {
  scene?: { description?: string; mood?: string; setting?: string }
  composition?: { layout?: string; focal_point?: string; text_placement?: string }
  text_overlay?: { headline?: string; subheadline?: string; cta_text?: string }
  style?: { aesthetic?: string; color_palette?: string[]; photography_style?: string; lighting?: string }
  brand?: { logo_placement?: string; typography_notes?: string }
  technical?: { format?: string; dimensions?: string }
  negative_prompts?: string[]
}

/**
 * Converts a structured prompt_json into a flat text prompt for generateImage().
 * Combines scene, style, composition, text overlay, brand rules, and negatives.
 */
export function buildImagePrompt(
  promptJson: Record<string, unknown>,
  format: VisualFormat
): string {
  const p = promptJson as VisualPromptJson
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

  // Format
  parts.push(`Format: ${format} for LinkedIn.`)

  // Negative prompts
  const negatives = p.negative_prompts?.length ? p.negative_prompts : [...NEGATIVE_PROMPTS]
  parts.push(`Avoid: ${negatives.join(', ')}.`)

  return parts.join(' ')
}
