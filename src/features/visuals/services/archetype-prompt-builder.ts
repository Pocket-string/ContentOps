/**
 * PRP-013: Archetype-aware visual prompt builder.
 *
 * Deterministically constructs a VisualPromptJsonV2 from (archetype, post, brand).
 * NO AI call here — this builder is fast, testable, and avoids inflating tokens.
 *
 * The resulting prompt_json flows through buildImagePrompt() (image-prompt-builder.ts)
 * which converts it to flat text for the image generation model.
 *
 * For `screenshot_annotated` and `dashboard_annotated`, this builder is NOT used
 * for image generation (the overlay-composer is). It IS used to populate the
 * `annotations_json` proposal that Vision AI will refine.
 */

import { z } from 'zod'

import {
  BRAND_LOGO_DESCRIPTION,
  BRAND_SIGNATURE,
  BRAND_COLORS_SEMANTIC,
  BRAND_STYLE,
  NEGATIVE_PROMPTS,
  FORMAT_DIMENSIONS,
} from '@/features/visuals/constants/brand-rules'
import type { VisualFormat } from '@/features/visuals/constants/brand-rules'

import { ARCHETYPE_REGISTRY } from '@/features/visuals/constants/archetypes'
import type {
  ArchetypeSlug,
  ArchetypeTemplate,
} from '@/features/visuals/types/archetype'
import type { VisualPromptJsonV2 } from '@/features/visuals/schemas/visual-prompt-schema'

// ============================================
// Public API
// ============================================

export interface BuildArchetypePromptInput {
  archetype: ArchetypeSlug
  /** Post content / hook / data points. */
  post: {
    content: string
    funnel_stage?: string
    topic?: string
    keyword?: string
    editorial_structure_slug?: string
  }
  /** Brand template override from brand_profiles.visual_templates (optional). */
  brandTemplate?: ArchetypeTemplate
  /** Optional explicit format override (defaults to archetype.defaultFormat). */
  format?: VisualFormat
  /** Optional author signature override. */
  authorSignature?: string
}

/**
 * Build a complete VisualPromptJsonV2 specialized for the given archetype.
 *
 * The builder fills sensible defaults from BRAND constants + archetype rules.
 * The `prompt_overall` field is the meat — composed via per-archetype text builders.
 */
export function buildArchetypePromptJson(input: BuildArchetypePromptInput): VisualPromptJsonV2 {
  const { archetype, post, brandTemplate, authorSignature } = input
  const definition = ARCHETYPE_REGISTRY[archetype]
  const format = input.format ?? definition.defaultFormat
  const dimensions = FORMAT_DIMENSIONS[format]
  const sigText = authorSignature ?? BRAND_SIGNATURE.text

  const visualType = mapArchetypeToVisualType(archetype)
  const promptOverall = buildPromptOverall(archetype, post, brandTemplate, format)
  const titleAndElements = deriveTitleAndElements(archetype, post)

  return {
    meta: {
      visual_type: visualType,
      platform: 'linkedin',
      format,
      dimensions: `${dimensions.width}x${dimensions.height}`,
    },
    brand: {
      logo: {
        use_logo: true,
        placement: 'bottom_left_on_white_band',
        background_band: {
          use_band: true,
          band_color: BRAND_LOGO_DESCRIPTION.default_band.band_color,
          band_height_ratio: BRAND_LOGO_DESCRIPTION.default_band.band_height_ratio,
        },
        scale_relative_width: BRAND_LOGO_DESCRIPTION.default_scale,
        reference_description: BRAND_LOGO_DESCRIPTION.reference_description,
      },
      colors: {
        primary: BRAND_COLORS_SEMANTIC.primary,
        secondary: BRAND_COLORS_SEMANTIC.secondary,
        accent: BRAND_COLORS_SEMANTIC.accent,
        text_main: BRAND_COLORS_SEMANTIC.text_main,
        text_secondary: BRAND_COLORS_SEMANTIC.text_secondary,
        background: BRAND_COLORS_SEMANTIC.background,
      },
      typography: {
        title_font: 'Inter',
        body_font: 'Inter',
        title_style: 'bold large',
        body_style: 'regular medium',
      },
    },
    layout: deriveLayout(archetype, format),
    content: {
      title: titleAndElements.title,
      subtitle: titleAndElements.subtitle,
      visual_elements: {
        type: visualType,
        key_elements: titleAndElements.keyElements,
        description: titleAndElements.elementsDescription,
      },
      signature: {
        use_signature: true,
        text: sigText,
        placement: 'bottom-left, small 10px, text color #94A3B8',
      },
    },
    style_guidelines: buildStyleGuidelines(archetype, brandTemplate),
    negative_prompts: buildNegativePrompts(archetype, brandTemplate),
    prompt_overall: promptOverall,
  }
}

// ============================================
// Archetype → V2 visual_type
// ============================================

function mapArchetypeToVisualType(archetype: ArchetypeSlug): VisualPromptJsonV2['meta']['visual_type'] {
  const map: Record<ArchetypeSlug, VisualPromptJsonV2['meta']['visual_type']> = {
    screenshot_annotated: 'custom',
    dashboard_annotated: 'data_chart',
    carousel_mini_report: 'infographic',
    data_decision_flow: 'process_flow',
    before_after: 'comparison',
    field_photo_overlay: 'editorial_photo',
    founder_proof: 'custom',
    technical_report: 'data_chart',
    risk_card: 'text_poster',
  }
  return map[archetype]
}

// ============================================
// Layout per archetype
// ============================================

function deriveLayout(archetype: ArchetypeSlug, format: VisualFormat): VisualPromptJsonV2['layout'] {
  // Sensible defaults. Per-archetype tweaks below.
  const base: VisualPromptJsonV2['layout'] = {
    grid: '12_col',
    background_style: `solid white background ${BRAND_COLORS_SEMANTIC.background}`,
    title_area: { position: 'top-left', max_width_ratio: 0.88, margin_top: '8%' },
    visual_area: { position: 'center', height_ratio: 0.6, description: 'main visual element' },
  }

  switch (archetype) {
    case 'screenshot_annotated':
    case 'dashboard_annotated':
      return {
        ...base,
        background_style: 'editorial paper-white with subtle grid lines, sober technical look',
        title_area: { position: 'top-left', max_width_ratio: 0.85, margin_top: '6%' },
        visual_area: { position: 'center', height_ratio: 0.7, description: 'real Bitalize product screenshot with annotation callouts' },
      }
    case 'carousel_mini_report':
      return {
        ...base,
        grid: 'rule_of_thirds',
        background_style: 'mini-report editorial: paper-white with subtle technical accents',
        title_area: { position: 'top-center', max_width_ratio: 0.9, margin_top: '8%' },
        visual_area: { position: 'center', height_ratio: 0.65, description: 'slide-specific role content (cover/problem/why/breakdown/example/framework/cta)' },
      }
    case 'data_decision_flow':
      return {
        ...base,
        grid: '12_col',
        background_style: 'clean white background with light grid overlay',
        title_area: { position: 'top-left', max_width_ratio: 0.85, margin_top: '8%' },
        visual_area: { position: 'center', height_ratio: 0.7, description: 'horizontal or circular flow of 4-6 labeled blocks with arrows' },
      }
    case 'before_after':
      return {
        ...base,
        grid: '2_col_split',
        background_style: 'split-screen: left desaturated gray, right clean white',
        title_area: { position: 'top-center', max_width_ratio: 0.9, margin_top: '6%' },
        visual_area: { position: 'center', height_ratio: 0.75, description: 'two stacked or side-by-side panels: chaotic before vs prioritized after' },
      }
    case 'field_photo_overlay':
      return {
        ...base,
        grid: 'centered',
        background_style: 'real field photo of solar plant, tracker, or control room (NEVER stock photo)',
        title_area: { position: 'center-bottom', max_width_ratio: 0.7, margin_top: '60%' },
        visual_area: { position: 'center', height_ratio: 0.75, description: 'authentic field photograph filling 70-80% of frame' },
      }
    case 'founder_proof':
      return {
        ...base,
        grid: 'centered',
        background_style: 'authentic artifact (whiteboard, sketch, Miro board) - intentionally imperfect',
        title_area: { position: 'top-center', max_width_ratio: 0.85, margin_top: '6%' },
        visual_area: { position: 'center', height_ratio: 0.7, description: 'whiteboard sketch / Miro capture / notebook diagram - founder-led artifact' },
      }
    case 'technical_report':
      return {
        ...base,
        grid: 'centered',
        background_style: 'paper-white, engineering note style with thin black border',
        title_area: { position: 'top-center', max_width_ratio: 0.9, margin_top: '6%' },
        visual_area: { position: 'center', height_ratio: 0.55, description: 'ONE simple central chart + brief technical caption + source footer' },
      }
    case 'risk_card':
      return {
        ...base,
        grid: 'centered',
        background_style: 'card layout: subtle paper texture, fine border, insurtech-inspired',
        title_area: { position: 'top-center', max_width_ratio: 0.9, margin_top: '5%' },
        visual_area: { position: 'center', height_ratio: 0.75, description: 'insurance-style risk card with 5 fields: cause, impact, confidence, action, priority' },
      }
    default:
      return base
  }
}

// ============================================
// Title + key elements derived from post
// ============================================

function deriveTitleAndElements(
  archetype: ArchetypeSlug,
  post: BuildArchetypePromptInput['post']
): {
  title: string
  subtitle?: string
  keyElements: string[]
  elementsDescription: string
} {
  // Cheap hook extraction: first sentence up to 55 chars.
  const firstSentence = (post.content.split(/[.!?]\s/)[0] ?? '').slice(0, 55).trim()
  const fallbackTitle = firstSentence || (post.topic ?? 'Bitalize — Visual')

  switch (archetype) {
    case 'screenshot_annotated':
      return {
        title: fallbackTitle,
        keyElements: ['real UI screenshot', 'annotation callouts', 'loss indicator'],
        elementsDescription: 'Real Bitalize product UI capture with 2-4 annotation overlays highlighting the key insight (price tag in red/orange, before/after marker, focal point ring).',
      }
    case 'dashboard_annotated':
      return {
        title: fallbackTitle,
        keyElements: ['dashboard zoom', 'pinpoint annotation', 'metric callout'],
        elementsDescription: 'Zoom into ONE Bitalize dashboard view with 2-3 annotations pointing to the single insight (anomaly, outlier, gap).',
      }
    case 'carousel_mini_report':
      return {
        title: fallbackTitle,
        keyElements: ['cover hook', '7-slide narrative', 'CTA close'],
        elementsDescription: '7-slide PDF carousel mini-report. Slide-specific role drives content per slide: cover, problem, why matters, breakdown, example, framework, cta_close.',
      }
    case 'data_decision_flow':
      return {
        title: fallbackTitle,
        keyElements: ['flow diagram', '4-6 blocks', 'labeled arrows'],
        elementsDescription: 'Horizontal or circular flow with 4-6 blocks. Each block: short verb + micro-icon. Arrows labeled with transformations.',
      }
    case 'before_after':
      return {
        title: 'Antes / Después',
        keyElements: ['chaotic before', 'prioritized after', 'metric delta'],
        elementsDescription: 'Split-screen 50/50: left gray chaotic state vs right clean prioritized state. Max 2-3 elements per side.',
      }
    case 'field_photo_overlay':
      return {
        title: fallbackTitle,
        keyElements: ['field photo', 'overlay text', 'stat callout'],
        elementsDescription: 'Authentic field photograph (NEVER stock) with brief overlay text (1 sentence + optional stat).',
      }
    case 'founder_proof':
      return {
        title: fallbackTitle,
        keyElements: ['authentic artifact', 'imperfect aesthetic', 'minimal overlay'],
        elementsDescription: 'Whiteboard sketch, Miro capture, or notebook diagram. Imperfect is the proof.',
      }
    case 'technical_report':
      return {
        title: fallbackTitle,
        keyElements: ['single chart', 'technical caption', 'source footer'],
        elementsDescription: 'Engineering-note style: ONE chart + brief caption + source.',
      }
    case 'risk_card':
      return {
        title: fallbackTitle,
        keyElements: ['cause', 'impact $/year', 'priority traffic light'],
        elementsDescription: 'Insurance-style risk card with 5 visible fields and priority indicator.',
      }
  }
}

// ============================================
// Style guidelines per archetype
// ============================================

function buildStyleGuidelines(archetype: ArchetypeSlug, override?: ArchetypeTemplate): string[] {
  if (override?.style) {
    return [override.style]
  }
  switch (archetype) {
    case 'screenshot_annotated':
      return [
        'Use real UI elements - never invent fake dashboards',
        'Annotations: callout boxes with thin arrows',
        '2-4 annotations max - no clutter',
        'Red/orange ONLY for losses or critical metrics',
      ]
    case 'dashboard_annotated':
      return [
        'Zoom into ONE insight - not the full dashboard',
        '2-3 annotations max',
        'One color accent on the outlier or loss',
        'Mobile readable at 25% size',
      ]
    case 'carousel_mini_report':
      return [
        'Same aspect ratio across all slides',
        'Consistent palette and typography across slides',
        'One key idea per slide',
        'Cover slide must stop scroll in 2 sec',
      ]
    case 'data_decision_flow':
      return [
        'Flat color icons, no gradients',
        'Hairline dividers between blocks',
        'Labels on arrows, not generic',
        'Max 6 blocks',
      ]
    case 'before_after':
      return [
        'Left side desaturated and chaotic',
        'Right side clean and prioritized',
        'No exaggerated antes state',
        'Same scale of elements both sides',
      ]
    case 'field_photo_overlay':
      return [
        'Documentary aesthetic, not stock',
        'Minimal overlay text - 1 sentence max',
        'High contrast text for readability',
        'No staged poses or fake scenes',
      ]
    case 'founder_proof':
      return [
        'Intentionally imperfect - artifact looks real',
        'Hand-drawn elements OK',
        'No polished product renders',
        'Minimal post-overlay',
      ]
    case 'technical_report':
      return [
        'Paper-white background',
        'ONE central chart maximum',
        'Source citation visible at footer',
        'Technical but accessible tone',
      ]
    case 'risk_card':
      return [
        'Card layout with subtle border',
        'Five fields visible at once',
        'Priority indicator: traffic light (red/orange/yellow)',
        'No fabricated client names or data',
      ]
  }
}

// ============================================
// Negative prompts per archetype
// ============================================

function buildNegativePrompts(archetype: ArchetypeSlug, override?: ArchetypeTemplate): string[] {
  const archetypeSpecific = ARCHETYPE_REGISTRY[archetype].negativePrompts
  const fromTemplate = override?.negative_prompts ?? []
  const combined = new Set<string>([...NEGATIVE_PROMPTS, ...archetypeSpecific, ...fromTemplate])
  return Array.from(combined)
}

// ============================================
// prompt_overall builders (one per archetype)
// ============================================

function buildPromptOverall(
  archetype: ArchetypeSlug,
  post: BuildArchetypePromptInput['post'],
  brandTemplate: ArchetypeTemplate | undefined,
  format: VisualFormat
): string {
  const dimensions = FORMAT_DIMENSIONS[format]
  const dims = `${dimensions.width}x${dimensions.height}`
  const postHook = (post.content.split(/[.!?]\s/)[0] ?? '').slice(0, 100).trim()
  const definition = ARCHETYPE_REGISTRY[archetype]

  const sharedSuffix = [
    `Output format: ${format} (${dims}) for LinkedIn.`,
    'DO NOT draw any logo, brand mark, or text signature anywhere — the real Bitalize logo is composited automatically in post-processing as a small glass-morphism pill in the bottom-right corner.',
    'Keep the bottom-right corner (roughly the last 22% width × 10% height) relatively quiet — no critical content, no dense text, no key chart elements there.',
    `Brand colors: primary ${BRAND_COLORS_SEMANTIC.primary} navy, accent ${BRAND_COLORS_SEMANTIC.secondary} orange. Use ${BRAND_COLORS_SEMANTIC.accent_danger} red ONLY for losses/critical metrics.`,
    'Bitalize aesthetic: editorial sober, technical, no startup-futurism, no AI-template look.',
  ].join(' ')

  switch (archetype) {
    case 'screenshot_annotated':
      return [
        `Annotated product proof visual for Bitalize O&M FV (1:1, ${dims}).`,
        'Foundation: a real screenshot of the Bitalize product (lucvia.com or mantenimiento.jonadata.cloud).',
        'CRITICAL: DO NOT regenerate or imagine the underlying UI — this archetype uses a real base image (captured via Playwright) and only adds annotation overlays.',
        `Annotations layer: 2-4 callout boxes with thin arrows, highlighting the post insight: "${postHook}".`,
        'Annotation styles: clean rectangles with thin border, 1 short label per callout (max 8 words), arrow pointing to the relevant UI element.',
        `Color rule: red ${BRAND_COLORS_SEMANTIC.accent_danger} ONLY for the loss/critical annotation. Other annotations in neutral navy ${BRAND_COLORS_SEMANTIC.primary}.`,
        'One annotation should be the "headline insight" — slightly larger, bolder.',
        sharedSuffix,
      ].join(' ')

    case 'dashboard_annotated':
      return [
        `Annotated dashboard insight visual for Bitalize (1:1 or 4:5, ${dims}).`,
        'Foundation: a real captured zoom of ONE Bitalize dashboard view (curva de potencia, performance ratio, alarmas — captured from lucvia.com).',
        'CRITICAL: DO NOT regenerate the dashboard UI — overlay annotations only.',
        `The insight from the post: "${postHook}".`,
        'Annotations: 2-3 only. ONE arrow + label points to the key anomaly/outlier/gap. ONE secondary annotation provides context. ONE optional headline annotation states the takeaway.',
        `Use ${BRAND_COLORS_SEMANTIC.accent_danger} red for the loss/outlier annotation only.`,
        'Mobile readability is critical — text must be legible at 25% size.',
        sharedSuffix,
      ].join(' ')

    case 'carousel_mini_report':
      return [
        `7-slide PDF carousel mini-report for Bitalize (4:5 each, ${dims}).`,
        `Topic: "${postHook}".`,
        'Slide roles fixed: 1) Cover (hook + 1 stat); 2) Problem (the FV pain); 3) Why_matters (technical→$ translation); 4) Breakdown (technical mechanism); 5) Example (concrete case or chart); 6) Framework (3-5 step method); 7) CTA_close (3-bullet checklist + conversational question).',
        'CRITICAL: same aspect ratio, same palette, same typography across all 7 slides. Cover slide must stop scroll in 2 sec.',
        'Slides 4 (breakdown) and 5 (example) may use real Bitalize product captures (from lucvia.com cross-plot demo) — these will be supplied separately during slide-by-slide generation.',
        'Bullets in slide 7: max 4. Saveability is critical (saves > likes in LinkedIn Feed-SR).',
        sharedSuffix,
      ].join(' ')

    case 'data_decision_flow':
      return [
        `Data → Decision flow diagram for Bitalize (1:1, ${dims}).`,
        `Show the methodology of transforming a signal into an O&M decision. Topic: "${postHook}".`,
        'Layout: horizontal flow of 4-6 blocks, left to right. Each block: 1 verb + 1 micro-icon + thin border.',
        'Arrows between blocks are labeled with the transformation (e.g., "validation", "$/day estimation", "priority sort").',
        'Use a single accent color (Bitalize orange) for the "decision" block to highlight where the value emerges.',
        'No empty consulting boxes, no generic icons, no more than 6 blocks total.',
        sharedSuffix,
      ].join(' ')

    case 'before_after':
      return [
        `Before/After comparison visual for Bitalize (1:1, ${dims}).`,
        `Show the transformation: "${postHook}".`,
        'Split-screen 50/50 vertical. Left (Antes): desaturated gray, chaotic, dense — short title and 2-3 elements representing the problem state. Right (Después): clean white, prioritized, accionable — title and 2-3 elements representing the new state.',
        'Center divider: thin vertical line. Headers above each side: "Antes" / "Después".',
        'Same scale of elements both sides. NO exaggeration of the antes state — must feel real, not advertising.',
        sharedSuffix,
      ].join(' ')

    case 'field_photo_overlay':
      return [
        `Field photo with text overlay for Bitalize (1:1, ${dims}).`,
        'Foundation: a real field photograph of a solar plant, tracker, or control room (NEVER stock photo, NEVER staged with models, NEVER sunset gradient render).',
        'Photo fills 70-80% of the frame.',
        `Overlay (centered or lower third): 1 short sentence in white with subtle shadow + optional stat callout. Sentence: "${postHook}".`,
        `Optional stat in ${BRAND_COLORS_SEMANTIC.accent_danger} red if a loss number is in the post.`,
        'Documentary aesthetic. The photo is the proof; the text is the highlight.',
        sharedSuffix,
      ].join(' ')

    case 'founder_proof':
      return [
        `Founder-proof artifact visual for Bitalize (1:1, ${dims}).`,
        'Foundation: an authentic founder artifact — whiteboard sketch, Miro board capture, notebook diagram, or product decision (e.g., v1 crossed out → v2 simplified).',
        `Topic: "${postHook}".`,
        'Intentionally imperfect aesthetic — hand-drawn elements, real handwriting OK, no polished startup futurism.',
        'Minimal post-overlay: title + 1 sentence. Subtle Bitalize logo bottom-left.',
        'NO product renders, NO wireframe perfection, NO polished UI.',
        sharedSuffix,
      ].join(' ')

    case 'technical_report':
      return [
        `Engineering-note visual for Bitalize (4:5, ${dims}).`,
        'Paper-white background, thin black border, technical report aesthetic.',
        `Title at top in serious uppercase: "${postHook}".`,
        'ONE central chart (bar chart, scatter, or simple line). No multi-panel dashboards.',
        'Short technical caption below the chart (2-3 lines).',
        'Source citation at the footer in small muted text (e.g., "Source: EPJ Photovoltaics 2026, 2 GW dataset").',
        'NO multiple charts. NO academic density. Be precise but readable.',
        sharedSuffix,
      ].join(' ')

    case 'risk_card':
      return [
        `Insurance-style risk card for Bitalize O&M FV (1:1, ${dims}).`,
        `Topic: "${postHook}".`,
        'Card layout: title bar at top ("⚠️ RIESGO IDENTIFICADO" or similar), 5 visible fields in a clean stack:',
        '1) RIESGO (the loss mechanism name)',
        '2) CAUSA PROBABLE (1 line)',
        '3) IMPACTO ESTIMADO (in $/year or $/MW/year)',
        '4) CONFIANZA DEL DIAGNÓSTICO (high/med/low + source)',
        '5) ACCIÓN SUGERIDA (1 line)',
        `Priority indicator: traffic light icon (red ${BRAND_COLORS_SEMANTIC.accent_danger}, orange ${BRAND_COLORS_SEMANTIC.secondary}, or yellow ${BRAND_COLORS_SEMANTIC.accent_warning}).`,
        'NO fabricated client names. NO generic SaaS card look. Insurtech-inspired but warm.',
        sharedSuffix,
      ].join(' ')

    default:
      return [`Visual for Bitalize about: "${postHook}".`, sharedSuffix].join(' ')
  }
}

// ============================================
// Backward-compat helper (for tests)
// ============================================

/** Quick validator using the V2 schema. Useful in tests. */
export function isValidArchetypeOutput(json: unknown): boolean {
  // Re-import to avoid circular: use a minimal check that the top-level keys exist
  if (typeof json !== 'object' || json === null) return false
  const keys = ['meta', 'brand', 'layout', 'content', 'style_guidelines', 'negative_prompts', 'prompt_overall']
  return keys.every((k) => k in (json as Record<string, unknown>))
}
