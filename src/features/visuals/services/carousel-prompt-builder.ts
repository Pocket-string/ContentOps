import { BRAND_STYLE, NEGATIVE_PROMPTS, BRAND_LOGO_DESCRIPTION, BRAND_SIGNATURE, CAROUSEL_BRAND_RULES } from '../constants/brand-rules'
import type { CarouselPlanJson } from '../schemas/visual-prompt-schema'

interface SlideInput {
  slide_index: number
  headline?: string
  body_text?: string
  prompt_json: Record<string, unknown>
}

interface CarouselNarrative {
  topic: string
  total_slides: number
  funnel_stage?: string
  tone?: string
}

export interface CarouselPromptOptions {
  authorSignature?: string
  logoDescription?: string
}

/**
 * Builds a text prompt for a single carousel slide.
 *
 * Priority:
 * 1. If prompt_json has `prompt_overall` (from carousel plan), use it directly + append brand/format
 * 2. If prompt_json has V2 fields (meta/content), extract structured data
 * 3. Fallback: V1 fields (scene/composition)
 */
export function buildCarouselSlidePrompt(
  slide: SlideInput,
  narrative: CarouselNarrative,
  options?: CarouselPromptOptions
): string {
  const p = slide.prompt_json as Record<string, unknown>
  const sigText = options?.authorSignature ?? BRAND_SIGNATURE.text
  const logoDesc = options?.logoDescription ?? BRAND_LOGO_DESCRIPTION.reference_description

  // ── Priority 1: carousel plan prompt_overall (richest path) ──
  if (hasCarouselPlanData(p)) {
    return buildFromCarouselPlan(slide, narrative, p, sigText, logoDesc)
  }

  // ── Priority 2/3: V2 or V1 fields (legacy paths) ──
  return buildFromLegacyFields(slide, narrative, p, sigText, logoDesc)
}

// ============================================
// Sanitization
// ============================================

/** Strip literal \n and real newlines that AI models render as visible backslashes */
function cleanText(s: string | undefined): string {
  if (!s) return ''
  return s.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()
}

// ============================================
// Detection helpers
// ============================================

function hasCarouselPlanData(p: Record<string, unknown>): boolean {
  return typeof p.prompt_overall === 'string' && (p.prompt_overall as string).length > 50
}

// ============================================
// Carousel plan path (richest data)
// ============================================

function buildFromCarouselPlan(
  slide: SlideInput,
  narrative: CarouselNarrative,
  p: Record<string, unknown>,
  sigText: string,
  logoDesc: string
): string {
  const parts: string[] = []

  // The AI-generated prompt_overall is the most important piece
  const promptOverall = (p.prompt_overall as string).trim()
  parts.push(promptOverall)

  // Ensure narrative context is present
  const promptLower = promptOverall.toLowerCase()
  if (!promptLower.includes('slide ')) {
    parts.push(
      `Slide ${slide.slide_index + 1} of ${narrative.total_slides} in a LinkedIn carousel about "${narrative.topic}".`
    )
  }

  // Ensure headline is rendered if user edited it after AI generation
  const headline = cleanText(slide.headline)
  if (headline && !promptLower.includes(headline.toLowerCase().slice(0, 20))) {
    parts.push(`The image must contain the text "${headline}" prominently displayed.`)
  }

  // Ensure body text is rendered if user edited it
  const bodyText = cleanText(slide.body_text)
  if (bodyText && !promptLower.includes(bodyText.toLowerCase().slice(0, 20))) {
    parts.push(`Body text: "${bodyText}".`)
  }

  // Logo and signature are composited post-generation by sharp (PRP-011 fix).
  // Do NOT instruct the AI to draw them — it produces inaccurate logos.
  // Instead, reserve the bottom 12% as a clean white band for compositing.
  parts.push('IMPORTANT: Leave the bottom 12% of the image completely clean (solid white or very light background). Do NOT draw any logo, brand mark, or signature text in the image. The real logo will be added automatically after generation.')

  // Format
  if (!promptLower.includes('1080x1350') && !promptLower.includes('4:5')) {
    parts.push('Format: 4:5 vertical (1080x1350) for LinkedIn carousel.')
  }

  // Carousel consistency — critical for harmony across slides
  parts.push('CAROUSEL CONSISTENCY (CRITICAL): This slide is part of a carousel set. ALL slides MUST share: identical background style/texture, same color palette (primary #1E3A5F, accent #F97316, green #10B981), same typography weight and hierarchy, same layout grid. The carousel must look like a cohesive presentation, not unrelated images.')

  // Negative prompts
  const negatives = Array.isArray(p.negative_prompts) && p.negative_prompts.length > 0
    ? (p.negative_prompts as string[])
    : [...NEGATIVE_PROMPTS]
  if (!promptLower.includes('avoid:')) {
    parts.push(`Avoid: ${negatives.join(', ')}.`)
  }

  // Bottom-right empty zone (brand rule)
  if (!promptLower.includes('bottom-right') && !promptLower.includes('inferior derecha')) {
    parts.push('Keep the bottom-right corner completely empty (no text, icons, or shapes).')
  }

  return parts.join(' ')
}

// ============================================
// Legacy path (V1 + V2 structured fields)
// ============================================

function buildFromLegacyFields(
  slide: SlideInput,
  narrative: CarouselNarrative,
  p: Record<string, unknown>,
  sigText: string,
  logoDesc: string
): string {
  const parts: string[] = []

  // Carousel narrative context
  parts.push(
    `Slide ${slide.slide_index + 1} of ${narrative.total_slides} in a LinkedIn carousel about "${narrative.topic}".`
  )

  // Slide role in story arc
  const role = getSlideRole(slide.slide_index, narrative.total_slides)
  parts.push(`This slide serves as the ${role}.`)

  // Detect V2 content fields (meta/layout/content) vs V1 (scene/composition)
  const isV2 = 'meta' in p && 'content' in p

  if (isV2) {
    const content = p.content as Record<string, unknown> | undefined
    const visualElements = content?.visual_elements as Record<string, unknown> | undefined
    if (visualElements?.description) parts.push(`${visualElements.description}.`)
    if (visualElements?.type) parts.push(`Visual type: ${visualElements.type}.`)

    const layout = p.layout as Record<string, unknown> | undefined
    if (layout?.background_style) parts.push(`Background: ${layout.background_style}.`)

    const guidelines = p.style_guidelines
    if (Array.isArray(guidelines) && guidelines.length > 0) {
      parts.push(`Style: ${guidelines.filter((g): g is string => typeof g === 'string').join('. ')}.`)
    }
  } else {
    const scene = p.scene as Record<string, string> | undefined
    if (scene?.description) parts.push(scene.description)
    if (scene?.setting) parts.push(`Setting: ${scene.setting}.`)
    if (scene?.mood) parts.push(`Mood: ${scene.mood}.`)

    const style = p.style as Record<string, unknown> | undefined
    if (style?.aesthetic) parts.push(`Style: ${style.aesthetic}.`)
    if (style?.photography_style) parts.push(`Photography: ${style.photography_style}.`)
    if (style?.lighting) parts.push(`Lighting: ${style.lighting}.`)

    const composition = p.composition as Record<string, string> | undefined
    if (composition?.layout) parts.push(`Layout: ${composition.layout}.`)
  }

  // Text overlay
  const legacyHeadline = cleanText(slide.headline)
  if (legacyHeadline) {
    parts.push(`The image contains the text "${legacyHeadline}" prominently displayed at the top.`)
  }
  const legacyBody = cleanText(slide.body_text)
  if (legacyBody) {
    parts.push(`Body text: "${legacyBody}".`)
  }

  // Brand consistency (logo/signature composited post-generation — do NOT draw them)
  parts.push(`Brand: ${BRAND_STYLE.name}, ${BRAND_STYLE.domain}. ${BRAND_STYLE.tone}.`)
  parts.push(`Colors: primary ${BRAND_STYLE.colors.primary}, accent ${BRAND_STYLE.colors.secondary}.`)
  parts.push('IMPORTANT: Leave the bottom 12% of the image completely clean (solid white or very light background). Do NOT draw any logo, brand mark, or signature text. The real logo will be added automatically after generation.')

  // Format
  parts.push('Format: 4:5 vertical (1080x1350) for LinkedIn carousel.')

  // Visual consistency — critical for carousel harmony
  parts.push('CAROUSEL CONSISTENCY (CRITICAL): This slide is part of a carousel set. ALL slides MUST share: (1) identical background style/texture, (2) same color palette (primary #1E3A5F, accent #F97316, green #10B981), (3) same typography weight and hierarchy, (4) same layout grid system, (5) same visual treatment for icons/graphics. The carousel must look like a cohesive presentation, not a collection of unrelated images.')

  // Bottom-right empty
  parts.push('Keep the bottom-right corner completely empty (no text, icons, or shapes).')

  // Negative prompts
  const negatives = (p.negative_prompts as string[] | undefined) ?? [...NEGATIVE_PROMPTS]
  parts.push(`Avoid: ${negatives.join(', ')}.`)

  return parts.join(' ')
}

/**
 * Returns the narrative role of a slide based on its position.
 */
function getSlideRole(index: number, total: number): string {
  const roleKey = index === 0 ? 'cover'
    : index === total - 1 ? 'cta_close'
    : index === 1 ? 'context'
    : index === total - 2 ? 'method'
    : 'deep_dive'

  const brandRule = CAROUSEL_BRAND_RULES[roleKey]
  const brandSuffix = brandRule ? `\n\nBRAND RULES FOR THIS SLIDE: ${brandRule.promptSuffix}` : ''

  const roleDescription = index === 0 ? 'cover/hook — grab attention with a bold statement or question'
    : index === total - 1 ? 'closing slide — conversational question or reflection that invites comments. NEVER offer a resource, download, free evaluation, or lead magnet'
    : index === 1 ? 'problem setup — establish the challenge or pain point'
    : index === total - 2 ? 'solution summary — key takeaway before the CTA'
    : 'supporting content — evidence, data, or elaboration'

  return roleDescription + brandSuffix
}

/**
 * Generates default slide structures for a new carousel.
 * Returns an array of slide inputs with narrative-driven headlines.
 */
export function generateDefaultSlideStructure(
  topic: string,
  slideCount: number
): Array<{ slide_index: number; headline: string; body_text: string; prompt_json: Record<string, unknown> }> {
  const slides: Array<{ slide_index: number; headline: string; body_text: string; prompt_json: Record<string, unknown> }> = []

  for (let i = 0; i < slideCount; i++) {
    const role = getSlideRole(i, slideCount)
    slides.push({
      slide_index: i,
      headline: i === 0 ? topic : `Slide ${i + 1}`,
      body_text: `[${role}]`,
      prompt_json: {
        scene: { description: '', mood: 'professional' },
        style: { aesthetic: 'clean infographic', lighting: 'bright, even' },
        composition: { layout: 'centered text with supporting visual' },
      },
    })
  }

  return slides
}

/**
 * Creates slide structures from an AI-generated carousel plan.
 * Each slide gets the rich prompt data (prompt_overall, visual_description, etc.)
 * stored in its prompt_json for later use by buildCarouselSlidePrompt.
 */
export function slidesFromCarouselPlan(
  plan: CarouselPlanJson
): Array<{ slide_index: number; headline: string; body_text: string; prompt_json: Record<string, unknown> }> {
  return plan.slides.map((slide) => ({
    slide_index: slide.slide_index,
    headline: slide.headline,
    body_text: slide.body_text,
    prompt_json: {
      // Rich per-slide data from the carousel plan
      prompt_overall: slide.prompt_overall,
      visual_type: slide.visual_type,
      visual_description: slide.visual_description,
      key_elements: slide.key_elements,
      role: slide.role,
      // Global carousel context
      style_guidelines: plan.style_guidelines,
      negative_prompts: plan.negative_prompts,
      global_style: plan.global_style,
    },
  }))
}
