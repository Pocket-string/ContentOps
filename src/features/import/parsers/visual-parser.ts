export interface VisualParseResult {
  data: Record<string, unknown> | null
  errors: string[]
}

// V1 required keys
const V1_REQUIRED_KEYS = ['scene', 'composition', 'text_overlay', 'style', 'brand', 'technical']
const SCENE_KEYS = ['description', 'mood', 'setting']
const COMPOSITION_KEYS = ['layout', 'focal_point', 'text_placement']
const STYLE_KEYS = ['aesthetic', 'color_palette', 'photography_style', 'lighting']
const BRAND_KEYS = ['logo_placement', 'brand_colors_used', 'typography_notes']

// V2 required keys
const V2_REQUIRED_KEYS = ['meta', 'brand', 'layout', 'content', 'style_guidelines', 'negative_prompts', 'prompt_overall']

/**
 * Parses and validates visual prompt JSON.
 * Accepts raw text (may include markdown code blocks) and validates structure.
 * Supports both V1 (scene/composition) and V2 (meta/layout/content) schemas.
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

  // Detect schema version
  const isV2 = 'meta' in obj && 'layout' in obj && 'content' in obj
  const isV1 = 'scene' in obj && 'composition' in obj

  if (!isV1 && !isV2 && !('prompt_overall' in obj)) {
    return { data: null, errors: ['El JSON debe seguir el schema V1 (scene/composition) o V2 (meta/layout/content), o incluir prompt_overall'] }
  }

  // Validate based on detected version
  if (isV2) {
    validateV2(obj, errors)
  } else if (isV1) {
    validateV1(obj, errors)
  }
  // If only prompt_overall exists, that's valid — no further validation needed

  // Validate shared fields
  if (obj['negative_prompts'] && !Array.isArray(obj['negative_prompts'])) {
    errors.push('negative_prompts debe ser un array')
  }

  // Return data even with warnings if we have a valid base structure
  const hasCriticalErrors = (!isV1 && !isV2 && !('prompt_overall' in obj))
  if (hasCriticalErrors) {
    return { data: null, errors }
  }

  return { data: obj, errors }
}

// ============================================
// V1 validation
// ============================================

function validateV1(obj: Record<string, unknown>, errors: string[]): void {
  const missingKeys = V1_REQUIRED_KEYS.filter(key => !(key in obj))
  if (missingKeys.length > 0) {
    errors.push(`Faltan secciones V1 requeridas: ${missingKeys.join(', ')}`)
  }

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
}

// ============================================
// V2 validation
// ============================================

function validateV2(obj: Record<string, unknown>, errors: string[]): void {
  const missingKeys = V2_REQUIRED_KEYS.filter(key => !(key in obj))
  if (missingKeys.length > 0) {
    errors.push(`Faltan secciones V2 requeridas: ${missingKeys.join(', ')}`)
  }

  // meta
  if (obj['meta'] && typeof obj['meta'] === 'object') {
    const meta = obj['meta'] as Record<string, unknown>
    if (!meta['visual_type']) errors.push('meta: falta visual_type')
    if (!meta['format']) errors.push('meta: falta format')
  }

  // layout
  if (obj['layout'] && typeof obj['layout'] === 'object') {
    const layout = obj['layout'] as Record<string, unknown>
    if (!layout['grid']) errors.push('layout: falta grid')
    if (!layout['title_area']) errors.push('layout: falta title_area')
    if (!layout['visual_area']) errors.push('layout: falta visual_area')
  }

  // content
  if (obj['content'] && typeof obj['content'] === 'object') {
    const content = obj['content'] as Record<string, unknown>
    if (!content['title']) errors.push('content: falta title')
    if (!content['visual_elements']) errors.push('content: falta visual_elements')
  }

  // brand
  if (obj['brand'] && typeof obj['brand'] === 'object') {
    const brand = obj['brand'] as Record<string, unknown>
    if (!brand['logo']) errors.push('brand: falta logo')
    if (!brand['colors']) errors.push('brand: falta colors')
  }

  // style_guidelines
  if (obj['style_guidelines'] && !Array.isArray(obj['style_guidelines'])) {
    errors.push('style_guidelines debe ser un array')
  }

  // prompt_overall
  if (!obj['prompt_overall'] || typeof obj['prompt_overall'] !== 'string') {
    errors.push('prompt_overall es requerido y debe ser string')
  }
}
