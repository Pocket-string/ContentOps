export interface VisualParseResult {
  data: Record<string, unknown> | null
  errors: string[]
}

const REQUIRED_KEYS = ['scene', 'composition', 'text_overlay', 'style', 'brand', 'technical']
const SCENE_KEYS = ['description', 'mood', 'setting']
const COMPOSITION_KEYS = ['layout', 'focal_point', 'text_placement']
const STYLE_KEYS = ['aesthetic', 'color_palette', 'photography_style', 'lighting']
const BRAND_KEYS = ['logo_placement', 'brand_colors_used', 'typography_notes']

/**
 * Parses and validates visual prompt JSON.
 * Accepts raw text (may include markdown code blocks) and validates structure.
 */
export function parseVisualJson(text: string): VisualParseResult {
  const errors: string[] = []
  const trimmed = text.trim()

  if (!trimmed) {
    return { data: null, errors: ['El texto esta vacio'] }
  }

  // Extract JSON from markdown code blocks if present
  let jsonStr = trimmed
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim()
  }

  // Try to parse JSON
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    return { data: null, errors: [`JSON invalido: ${e instanceof Error ? e.message : 'Error de parseo'}`] }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { data: null, errors: ['El JSON debe ser un objeto, no un array o valor primitivo'] }
  }

  const obj = parsed as Record<string, unknown>

  // Validate required top-level keys
  const missingKeys = REQUIRED_KEYS.filter(key => !(key in obj))
  if (missingKeys.length > 0) {
    errors.push(`Faltan secciones requeridas: ${missingKeys.join(', ')}`)
  }

  // Validate nested structures
  if (obj['scene'] && typeof obj['scene'] === 'object') {
    const scene = obj['scene'] as Record<string, unknown>
    const missingScene = SCENE_KEYS.filter(k => !(k in scene))
    if (missingScene.length > 0) errors.push(`scene: faltan campos ${missingScene.join(', ')}`)
  }

  if (obj['composition'] && typeof obj['composition'] === 'object') {
    const comp = obj['composition'] as Record<string, unknown>
    const missingComp = COMPOSITION_KEYS.filter(k => !(k in comp))
    if (missingComp.length > 0) errors.push(`composition: faltan campos ${missingComp.join(', ')}`)
  }

  if (obj['style'] && typeof obj['style'] === 'object') {
    const style = obj['style'] as Record<string, unknown>
    const missingStyle = STYLE_KEYS.filter(k => !(k in style))
    if (missingStyle.length > 0) errors.push(`style: faltan campos ${missingStyle.join(', ')}`)
    if (style['color_palette'] && !Array.isArray(style['color_palette'])) {
      errors.push('style.color_palette debe ser un array')
    }
  }

  if (obj['brand'] && typeof obj['brand'] === 'object') {
    const brand = obj['brand'] as Record<string, unknown>
    const missingBrand = BRAND_KEYS.filter(k => !(k in brand))
    if (missingBrand.length > 0) errors.push(`brand: faltan campos ${missingBrand.join(', ')}`)
  }

  if (obj['negative_prompts'] && !Array.isArray(obj['negative_prompts'])) {
    errors.push('negative_prompts debe ser un array')
  }

  // Return data even with warnings (non-blocking)
  if (missingKeys.length > 0) {
    return { data: null, errors }
  }

  return { data: obj, errors }
}
