import { VISUAL_TYPE_OPTIONS } from '../schemas/visual-prompt-schema'

const VALID_ROLES = ['cover_hook', 'problem', 'evidence', 'supporting', 'solution', 'cta_close'] as const

/** Map common AI role variations to valid enum values */
export function coerceRole(raw: unknown, slideIndex: number, totalSlides: number): string {
  if (typeof raw !== 'string') return slideIndex === 0 ? 'cover_hook' : 'supporting'
  const lower = raw.toLowerCase().replace(/[\s_-]+/g, '_')
  if ((VALID_ROLES as readonly string[]).includes(lower)) return lower
  if (lower.includes('hook') || lower.includes('cover') || lower.includes('intro')) return 'cover_hook'
  if (lower.includes('cta') || lower.includes('close') || lower.includes('action') || lower.includes('conclusion')) return 'cta_close'
  if (lower.includes('problem') || lower.includes('pain') || lower.includes('challenge')) return 'problem'
  if (lower.includes('evidence') || lower.includes('data') || lower.includes('proof') || lower.includes('stat')) return 'evidence'
  if (lower.includes('solution') || lower.includes('result') || lower.includes('outcome') || lower.includes('takeaway')) return 'solution'
  if (slideIndex === 0) return 'cover_hook'
  if (slideIndex === totalSlides - 1) return 'cta_close'
  if (slideIndex === 1) return 'problem'
  if (slideIndex === totalSlides - 2) return 'solution'
  return 'supporting'
}

/** Map common AI visual_type variations to valid enum values */
export function coerceVisualType(raw: unknown): string {
  if (typeof raw !== 'string') return 'custom'
  const lower = raw.toLowerCase().replace(/[\s_-]+/g, '_')
  if ((VISUAL_TYPE_OPTIONS as readonly string[]).includes(lower)) return lower
  if (lower.includes('infographic') || lower.includes('info_graphic')) return 'infographic'
  if (lower.includes('chart') || lower.includes('graph') || lower.includes('metric')) return 'data_chart'
  if (lower.includes('diagram') || lower.includes('flow') || lower.includes('cycle')) return 'diagram'
  if (lower.includes('photo') || lower.includes('editorial') || lower.includes('image')) return 'editorial_photo'
  if (lower.includes('poster') || lower.includes('text') || lower.includes('quote') || lower.includes('hero')) return 'text_poster'
  if (lower.includes('compar') || lower.includes('versus') || lower.includes('split')) return 'comparison'
  if (lower.includes('timeline') || lower.includes('history') || lower.includes('evolution')) return 'timeline'
  if (lower.includes('process') || lower.includes('step') || lower.includes('workflow')) return 'process_flow'
  if (lower.includes('quote') || lower.includes('testimonial') || lower.includes('cite')) return 'quote_card'
  return 'custom'
}

/** Clamp array length: trim excess, pad with defaults if too few */
export function clampArray(arr: unknown, min: number, max: number, defaultVal = ''): string[] {
  const items = Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
  const trimmed = items.slice(0, max)
  while (trimmed.length < min) trimmed.push(defaultVal || `Item ${trimmed.length + 1}`)
  return trimmed
}

/** Comprehensive normalizer: coerces AI response to match carouselPlanSchema */
export function normalizeCarouselPlan(raw: Record<string, unknown>, requestedSlides: number): Record<string, unknown> {
  const rawMeta = (raw.meta && typeof raw.meta === 'object' ? raw.meta : {}) as Record<string, unknown>
  const slides = Array.isArray(raw.slides) ? raw.slides.slice(0, requestedSlides) : []
  const actualCount = slides.length

  const meta = {
    slides_total: actualCount,
    narrative_arc: typeof rawMeta.narrative_arc === 'string' ? rawMeta.narrative_arc : 'Hook → Content → CTA',
    topic: typeof rawMeta.topic === 'string' ? rawMeta.topic : 'LinkedIn carousel',
    platform: 'linkedin' as const,
    format: '4:5' as const,
    dimensions: '1080x1350' as const,
  }

  const rawGs = (raw.global_style && typeof raw.global_style === 'object' ? raw.global_style : {}) as Record<string, unknown>
  const global_style = {
    background_style: typeof rawGs.background_style === 'string' ? rawGs.background_style : 'Dark navy #0F172A',
    color_usage: typeof rawGs.color_usage === 'string' ? rawGs.color_usage : 'Brand colors for emphasis',
    consistency_rules: clampArray(rawGs.consistency_rules, 2, 5, 'Consistent typography across all slides'),
  }

  const normalizedSlides = slides.map((s: unknown, i: number) => {
    const slide = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>
    return {
      slide_index: typeof slide.slide_index === 'number' ? Math.min(Math.max(slide.slide_index, 0), 9) : i,
      role: coerceRole(slide.role, i, actualCount),
      headline: typeof slide.headline === 'string' ? slide.headline : `Slide ${i + 1}`,
      body_text: typeof slide.body_text === 'string' ? slide.body_text : '',
      visual_type: coerceVisualType(slide.visual_type),
      visual_description: typeof slide.visual_description === 'string' ? slide.visual_description : '',
      key_elements: clampArray(slide.key_elements, 2, 6, 'Visual element'),
      prompt_overall: typeof slide.prompt_overall === 'string' ? slide.prompt_overall : '',
    }
  })

  return {
    meta,
    global_style,
    slides: normalizedSlides,
    style_guidelines: clampArray(raw.style_guidelines, 3, 6, 'Clean, professional design'),
    negative_prompts: clampArray(raw.negative_prompts, 3, 8, 'Low quality imagery'),
  }
}
