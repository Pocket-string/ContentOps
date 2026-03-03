import { z } from 'zod'

/**
 * V2 Visual Prompt Schema — structured to force precise, high-quality prompts.
 *
 * Design principles:
 * 1. Each section forces the AI to think about a specific visual dimension
 * 2. Numeric ratios enforce spatial precision instead of vague text
 * 3. prompt_overall remains the most important field — this schema helps the AI PRODUCE a better one
 * 4. Backward-compatible: image-prompt-builder handles both V1 (scene/composition) and V2 (meta/layout/content)
 */

export const VISUAL_TYPE_OPTIONS = [
  'infographic',
  'data_chart',
  'diagram',
  'editorial_photo',
  'text_poster',
  'comparison',
  'timeline',
  'process_flow',
  'quote_card',
  'custom',
] as const

export type VisualType = (typeof VISUAL_TYPE_OPTIONS)[number]

export const visualPromptSchemaV2 = z.object({
  meta: z.object({
    visual_type: z.enum(VISUAL_TYPE_OPTIONS)
      .describe('Classification of the visual — helps choose the right composition approach'),
    platform: z.literal('linkedin').default('linkedin'),
    format: z.string().describe('Aspect ratio: 1:1, 4:5, 16:9, or 9:16'),
    dimensions: z.string().describe('Pixel dimensions: e.g. 1080x1080'),
  }),

  brand: z.object({
    logo: z.object({
      use_logo: z.boolean().describe('Whether to include the logo'),
      placement: z.string().describe('Precise placement: e.g. "bottom_left_on_white_band"'),
      background_band: z.object({
        use_band: z.boolean().describe('Whether to use a solid band behind the logo'),
        band_color: z.string().describe('Hex color of the band'),
        band_height_ratio: z.number().min(0).max(0.5)
          .describe('Height of band as ratio of total image height (0-0.5)'),
      }),
      scale_relative_width: z.number().min(0.05).max(0.4)
        .describe('Logo width as ratio of image width (0.05-0.4)'),
      reference_description: z.string()
        .describe('Exact textual description of what the logo looks like — critical for AI image generation'),
    }),
    colors: z.object({
      primary: z.string().describe('Main brand color hex'),
      secondary: z.string().describe('Secondary brand color hex'),
      accent: z.string().describe('Accent color hex'),
      text_main: z.string().describe('Primary text color hex'),
      text_secondary: z.string().describe('Secondary/muted text color hex'),
      background: z.string().describe('Background color hex'),
    }),
    typography: z.object({
      title_font: z.string(),
      body_font: z.string(),
      title_style: z.string().describe('e.g. "bold uppercase 48px"'),
      body_style: z.string().describe('e.g. "regular 16px"'),
    }),
  }),

  layout: z.object({
    grid: z.string().describe('Grid system: "12_col", "rule_of_thirds", "centered"'),
    background_style: z.string()
      .describe('e.g. "solid navy #1E3A5F", "paper-white #F8FAFC with subtle grid"'),
    title_area: z.object({
      position: z.string().describe('e.g. "top-left", "center-top"'),
      max_width_ratio: z.number().min(0.3).max(1.0)
        .describe('Max width of title area as ratio of image width'),
      margin_top: z.string().describe('e.g. "8%", "60px"'),
    }),
    visual_area: z.object({
      position: z.string().describe('e.g. "center", "right-half", "below-title"'),
      height_ratio: z.number().min(0.2).max(0.8)
        .describe('Height of visual area as ratio of image height'),
      description: z.string().describe('What occupies this area: chart, diagram, icon grid, etc.'),
    }),
  }),

  content: z.object({
    title: z.string().describe('Main headline text to render in the image'),
    subtitle: z.string().optional().describe('Secondary text below the title'),
    body_text: z.string().optional().describe('Supporting body text if applicable'),
    cta: z.object({
      text: z.string().describe('Call-to-action text'),
      style: z.string().describe('e.g. "rounded pill orange #F97316 with white text"'),
      placement: z.string().describe('e.g. "bottom-center", "below-subtitle"'),
      note: z.string().optional().describe('Placement constraints or notes'),
    }).optional(),
    visual_elements: z.object({
      type: z.string().describe('e.g. "bar chart", "process flow diagram", "icon grid", "data callout"'),
      key_elements: z.array(z.string())
        .describe('List of specific visual elements to include — be precise'),
      description: z.string().describe('Detailed description of the visual/infographic content'),
    }),
    signature: z.object({
      use_signature: z.boolean().describe('Whether to include author signature'),
      text: z.string().describe('e.g. "Jonathan Navarrete — Bitalize"'),
      placement: z.string().describe('e.g. "bottom-left, small, muted"'),
    }).optional(),
  }),

  style_guidelines: z.array(z.string())
    .describe('Explicit positive style rules — e.g. "Flat color icons, no gradients", "Hairline dividers"'),

  negative_prompts: z.array(z.string())
    .describe('Things to explicitly avoid in the image'),

  prompt_overall: z.string()
    .describe(
      'Complete, self-contained flat-text prompt for the image generation model. ' +
      'This is the MOST IMPORTANT field. It must incorporate ALL information from the structured fields: ' +
      'exact text to render, spatial layout with ratios, hex colors, logo description, style rules, and negatives.'
    ),
})

export type VisualPromptJsonV2 = z.infer<typeof visualPromptSchemaV2>

// ============================================
// Carousel Plan Schema — multi-slide generation
// ============================================

/**
 * Carousel Plan Schema — generates a complete narrative plan for all slides.
 *
 * Design: lightweight enough for generateObject (~3-4K output for 5 slides),
 * but rich enough to feed buildCarouselSlidePrompt with real content per slide
 * instead of boilerplate defaults.
 *
 * Each slide gets its own prompt_overall — the most critical field for image generation.
 */

const CAROUSEL_SLIDE_ROLES = [
  'cover_hook',
  'problem',
  'evidence',
  'supporting',
  'solution',
  'cta_close',
] as const

export type CarouselSlideRole = (typeof CAROUSEL_SLIDE_ROLES)[number]

export const carouselSlidePromptSchema = z.object({
  slide_index: z.number().min(0).max(9),
  role: z.enum(CAROUSEL_SLIDE_ROLES)
    .describe('Narrative role: cover_hook (slide 1), problem, evidence, supporting, solution, or cta_close (last slide)'),
  headline: z.string()
    .describe('Bold headline text for this slide — short, impactful, 5-10 words max'),
  body_text: z.string()
    .describe('Supporting body text — 1-2 sentences max'),
  visual_type: z.enum(VISUAL_TYPE_OPTIONS)
    .describe('Visual classification for this specific slide'),
  visual_description: z.string()
    .describe('Detailed description of what this slide should visually contain — specific elements, charts, icons, data'),
  key_elements: z.array(z.string()).min(2).max(6)
    .describe('Specific visual elements to include in this slide — be precise'),
  prompt_overall: z.string()
    .describe(
      'Complete, self-contained prompt for THIS slide. Must include: exact text to render, ' +
      'spatial layout, hex colors, logo description, visual elements, background, and style. ' +
      'This is what generates the image — be EXHAUSTIVE.'
    ),
})

export const carouselPlanSchema = z.object({
  meta: z.object({
    slides_total: z.number().min(3).max(10)
      .describe('Total number of slides in the carousel'),
    narrative_arc: z.string()
      .describe('Brief description of the story arc: e.g. "Hook → Problem → 3 Evidence Points → Solution → CTA"'),
    topic: z.string()
      .describe('Main topic of the carousel'),
    platform: z.literal('linkedin').default('linkedin'),
    format: z.literal('4:5').default('4:5'),
    dimensions: z.literal('1080x1350').default('1080x1350'),
  }),
  global_style: z.object({
    background_style: z.string()
      .describe('Consistent background across all slides: e.g. "solid dark navy #020F3A with subtle tech pattern"'),
    color_usage: z.string()
      .describe('How to use the color palette consistently: e.g. "Navy for structure, orange for alerts, green for positive metrics"'),
    consistency_rules: z.array(z.string()).min(2).max(5)
      .describe('Rules for visual consistency across slides — same grid, same icon style, same font sizes'),
  }),
  slides: z.array(carouselSlidePromptSchema).min(3).max(10),
  style_guidelines: z.array(z.string()).min(3).max(6)
    .describe('Positive style rules applied to ALL slides'),
  negative_prompts: z.array(z.string()).min(3).max(8)
    .describe('Things to avoid in ALL slides'),
})

export type CarouselPlanJson = z.infer<typeof carouselPlanSchema>
export type CarouselSlidePromptJson = z.infer<typeof carouselSlidePromptSchema>
