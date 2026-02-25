import { BRAND_STYLE, NEGATIVE_PROMPTS } from '../constants/brand-rules'

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

/**
 * Builds a text prompt for a single carousel slide.
 * Includes narrative context (slide position, storyline flow) so the AI
 * generates images that feel cohesive across the full carousel.
 */
export function buildCarouselSlidePrompt(
  slide: SlideInput,
  narrative: CarouselNarrative
): string {
  const parts: string[] = []
  const p = slide.prompt_json as Record<string, unknown>

  // Carousel narrative context
  parts.push(
    `Slide ${slide.slide_index + 1} of ${narrative.total_slides} in a LinkedIn carousel about "${narrative.topic}".`
  )

  // Slide role in story arc
  const role = getSlideRole(slide.slide_index, narrative.total_slides)
  parts.push(`This slide serves as the ${role}.`)

  // Scene description from prompt_json
  const scene = p.scene as Record<string, string> | undefined
  if (scene?.description) parts.push(scene.description)
  if (scene?.setting) parts.push(`Setting: ${scene.setting}.`)
  if (scene?.mood) parts.push(`Mood: ${scene.mood}.`)

  // Style
  const style = p.style as Record<string, unknown> | undefined
  if (style?.aesthetic) parts.push(`Style: ${style.aesthetic}.`)
  if (style?.photography_style) parts.push(`Photography: ${style.photography_style}.`)
  if (style?.lighting) parts.push(`Lighting: ${style.lighting}.`)

  // Composition
  const composition = p.composition as Record<string, string> | undefined
  if (composition?.layout) parts.push(`Layout: ${composition.layout}.`)

  // Text overlay — headline and body
  if (slide.headline) {
    parts.push(`The image contains the text "${slide.headline}" prominently displayed at the top.`)
  }
  if (slide.body_text) {
    parts.push(`Body text: "${slide.body_text}".`)
  }

  // Brand consistency
  parts.push(`Brand: ${BRAND_STYLE.name}, ${BRAND_STYLE.domain}. ${BRAND_STYLE.tone}.`)
  parts.push(`Colors: primary ${BRAND_STYLE.colors.primary}, accent ${BRAND_STYLE.colors.secondary}.`)

  // Format — all carousel slides are 4:5 (1080x1350)
  parts.push('Format: 4:5 vertical (1080x1350) for LinkedIn carousel.')

  // Visual consistency instruction
  parts.push('Maintain consistent color palette, typography style, and visual language across all slides.')

  // Negative prompts
  const negatives = (p.negative_prompts as string[] | undefined) ?? [...NEGATIVE_PROMPTS]
  parts.push(`Avoid: ${negatives.join(', ')}.`)

  return parts.join(' ')
}

/**
 * Returns the narrative role of a slide based on its position.
 */
function getSlideRole(index: number, total: number): string {
  if (index === 0) return 'cover/hook — grab attention with a bold statement or question'
  if (index === total - 1) return 'closing CTA — call to action with clear next step'
  if (index === 1) return 'problem setup — establish the challenge or pain point'
  if (index === total - 2) return 'solution summary — key takeaway before the CTA'
  return 'supporting content — evidence, data, or elaboration'
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
