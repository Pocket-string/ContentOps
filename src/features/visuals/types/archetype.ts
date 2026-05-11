/**
 * PRP-013: Visual archetype types.
 *
 * 9 archetypes for Bitalize visual strategy. See docs/Contenido/visual-strategy.md
 * for full guideline. Each archetype has a definition + a template that drives
 * prompt building and (when applicable) base-image-overlay pipeline.
 */

import type { VisualFormat } from '@/features/visuals/constants/brand-rules'

export const ARCHETYPE_SLUGS = [
  'screenshot_annotated',
  'dashboard_annotated',
  'carousel_mini_report',
  'data_decision_flow',
  'before_after',
  'field_photo_overlay',
  'founder_proof',
  'technical_report',
  'risk_card',
] as const

export type ArchetypeSlug = (typeof ARCHETYPE_SLUGS)[number]

export type FunnelTarget = 'TOFU' | 'MOFU' | 'BOFU'

/** How the visual is built: from scratch via AI, or capture base + sharp overlay. */
export type GenerationFlow = 'ai_generate' | 'capture_overlay'

export type BaseImageSource = 'playwright_capture' | 'manual_upload' | 'ai_generated'

/**
 * Definition of one archetype. Used by ArchetypeSelector (UI),
 * archetype-prompt-builder (prompt construction), and visual-type-router
 * (flow decision).
 */
export interface ArchetypeDefinition {
  slug: ArchetypeSlug
  /** Display name in UI (Spanish). */
  displayName: string
  /** 1-line description in UI card. */
  description: string
  /** Emoji used as thumbnail in the selector. */
  thumbnailEmoji: string
  /** Default LinkedIn format. */
  defaultFormat: VisualFormat
  /** Funnel stages where this archetype shines. */
  funnelTargets: readonly FunnelTarget[]
  /** Recommended max number of annotations / textual callouts in the visual. */
  annotationsMax: number
  /** Pipeline flow. */
  generationFlow: GenerationFlow
  /**
   * Suggested base-image source URLs (only relevant if generationFlow='capture_overlay').
   * UI shows these as quick-pick options.
   */
  suggestedSources?: readonly string[]
  /**
   * Color role for the accent: where the red/orange "loss" color should appear.
   * "loss_only" = only on losses/risks. "neutral" = no accent. "method" = accent on the framework step.
   */
  colorAccentRole: 'loss_only' | 'neutral' | 'method'
  /** Archetype-specific negative prompts (in addition to NEGATIVE_PROMPTS). */
  negativePrompts: readonly string[]
}

/**
 * Per-archetype configuration stored in brand_profiles.visual_templates JSONB.
 * Mutable per-workspace; archetype-prompt-builder uses this when the brand has
 * customized templates, falling back to ARCHETYPE_REGISTRY defaults otherwise.
 */
export interface ArchetypeTemplate {
  prompt_overall: string
  layout: string
  annotations_max: number
  style: string
  negative_prompts: string[]
  color_accent_role: 'loss_only' | 'neutral' | 'method'
}

/** Mapping from PRP-012 editorial structure → recommended archetype. */
export const STRUCTURE_TO_ARCHETYPE: Record<string, ArchetypeSlug> = {
  feature_kill: 'screenshot_annotated',
  aprendizaje_cliente: 'dashboard_annotated',
  nicho_olvidado: 'risk_card',
  demo_pequena: 'carousel_mini_report',
  opinion_contraria_ia: 'field_photo_overlay',
}

/** Auditor verdict from critic-visual (PRP-013 Fase 4). */
export type AuditorVerdict = 'publishable' | 'retry_recommended' | 'regenerate'

export interface AuditorCheck {
  /** Check id, e.g. '3_second_clarity', 'anti_stock', 'quantified_data'. */
  id: string
  /** Short label for UI. */
  label: string
  /** Pass/fail. */
  passed: boolean
  /** Optional reason when failed. */
  reason?: string
}

export interface AuditorResult {
  /** Sum of passed checks × 5 (0-50). */
  score: number
  /** 10 binary checks. */
  checks: AuditorCheck[]
  /** Verdict derived from score. */
  verdict: AuditorVerdict
  /** Actionable findings the user can paste into "Regenerate with feedback". */
  findings: string[]
}
