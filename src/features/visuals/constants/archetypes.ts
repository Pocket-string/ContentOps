/**
 * PRP-013: Archetype registry (canonical defaults).
 *
 * 9 archetypes with default template content. Brand-specific overrides live
 * in `brand_profiles.visual_templates` (JSONB) and are loaded at request time.
 * This file is the fallback / source of truth for the defaults.
 *
 * See docs/Contenido/visual-strategy.md for the operational guide.
 */

import type { ArchetypeDefinition, ArchetypeSlug } from '@/features/visuals/types/archetype'

export const ARCHETYPE_REGISTRY: Record<ArchetypeSlug, ArchetypeDefinition> = {
  screenshot_annotated: {
    slug: 'screenshot_annotated',
    displayName: 'Screenshot Anotado',
    description: 'Captura real del producto Bitalize (lucvia/mantenimiento) con 2-4 anotaciones overlay. Founder-led proof.',
    thumbnailEmoji: '📷',
    defaultFormat: '1:1',
    funnelTargets: ['MOFU', 'BOFU'],
    annotationsMax: 4,
    generationFlow: 'capture_overlay',
    suggestedSources: [
      'https://lucvia.com/demo/perdidas-priorizadas',
      'https://lucvia.com/demo/dashboard',
      'https://mantenimiento.jonadata.cloud/demo',
    ],
    colorAccentRole: 'loss_only',
    negativePrompts: [
      'mockup pixel-perfect',
      'fake UI elements',
      'fabricated data points',
      'generic SaaS template',
    ],
  },

  dashboard_annotated: {
    slug: 'dashboard_annotated',
    displayName: 'Dashboard Anotado',
    description: 'Vista del dashboard con UN insight clave anotado (pliegue, outlier, gap). Saves alto.',
    thumbnailEmoji: '📊',
    defaultFormat: '1:1',
    funnelTargets: ['MOFU'],
    annotationsMax: 3,
    generationFlow: 'capture_overlay',
    suggestedSources: [
      'https://lucvia.com/demo/curva-potencia',
      'https://lucvia.com/demo/performance-ratio',
      'https://lucvia.com/demo/alarmas',
    ],
    colorAccentRole: 'loss_only',
    negativePrompts: [
      'dashboard limpio sin contexto',
      'todo verde sin destacar lo importante',
      'multiple competing insights',
    ],
  },

  carousel_mini_report: {
    slug: 'carousel_mini_report',
    displayName: 'Carrusel Mini-Informe',
    description: 'PDF estilo mini-informe técnico, 7 slides con narrativa fija. Mezcla AI conceptual + capturas reales lucvia.',
    thumbnailEmoji: '🎠',
    defaultFormat: '4:5',
    funnelTargets: ['TOFU', 'MOFU'],
    annotationsMax: 4,
    generationFlow: 'ai_generate',
    suggestedSources: [
      'https://lucvia.com/demo/cross-plot',
      'https://lucvia.com/demo/framework',
    ],
    colorAccentRole: 'loss_only',
    negativePrompts: [
      'mas de 15 slides',
      'mezcla de aspect ratios',
      'texto largo por slide (>280 chars)',
      'slides repetitivos',
    ],
  },

  data_decision_flow: {
    slug: 'data_decision_flow',
    displayName: 'Dato → Decisión',
    description: 'Diagrama de flujo de 4-6 bloques mostrando cómo Bitalize transforma datos en decisiones operativas.',
    thumbnailEmoji: '🔁',
    defaultFormat: '1:1',
    funnelTargets: ['TOFU', 'MOFU'],
    annotationsMax: 6,
    generationFlow: 'ai_generate',
    colorAccentRole: 'method',
    negativePrompts: [
      'diagrama de consultoría con cajas vacías',
      'más de 6 bloques',
      'flechas sin etiqueta',
      'iconos genéricos sin significado',
    ],
  },

  before_after: {
    slug: 'before_after',
    displayName: 'Antes / Después',
    description: 'Comparativa split-screen entre dos estados (workflow caótico vs priorizado, dashboard v1 vs v2).',
    thumbnailEmoji: '↔️',
    defaultFormat: '1:1',
    funnelTargets: ['MOFU'],
    annotationsMax: 3,
    generationFlow: 'ai_generate',
    colorAccentRole: 'neutral',
    negativePrompts: [
      'exagerar el lado "antes" para vender',
      'más de 3 elementos por lado',
      'before-after de stock photos genéricos',
    ],
  },

  field_photo_overlay: {
    slug: 'field_photo_overlay',
    displayName: 'Foto Campo + Overlay',
    description: 'Foto real de planta solar / sala de control / tracker con overlay textual breve. Founder-led de campo.',
    thumbnailEmoji: '📸',
    defaultFormat: '1:1',
    funnelTargets: ['TOFU'],
    annotationsMax: 2,
    generationFlow: 'ai_generate',
    colorAccentRole: 'loss_only',
    negativePrompts: [
      'stock photo con modelo posando',
      'gente de oficina',
      'render 3D futurista',
      'sunset gradient detrás de paneles',
      'avatares',
    ],
  },

  founder_proof: {
    slug: 'founder_proof',
    displayName: 'Founder Proof',
    description: 'Pizarra, sketch, captura Miro, esquema en cuaderno o decisión de producto descartada. Authenticity > polish.',
    thumbnailEmoji: '✍️',
    defaultFormat: '1:1',
    funnelTargets: ['TOFU', 'MOFU'],
    annotationsMax: 3,
    generationFlow: 'ai_generate',
    colorAccentRole: 'neutral',
    negativePrompts: [
      'pizarra "limpia y posada"',
      'wireframes ultra prolijos',
      'estética startup futurista',
      'renders de productos',
    ],
  },

  technical_report: {
    slug: 'technical_report',
    displayName: 'Engineering Note',
    description: 'Mini-reporte tipo paper: 1 gráfico claro + nota técnica + fuente. Para analistas de performance.',
    thumbnailEmoji: '📋',
    defaultFormat: '4:5',
    funnelTargets: ['MOFU'],
    annotationsMax: 3,
    generationFlow: 'ai_generate',
    colorAccentRole: 'loss_only',
    negativePrompts: [
      'múltiples gráficos en un mismo visual',
      'sin fuente o supuesto explícito',
      'tono académico denso',
    ],
  },

  risk_card: {
    slug: 'risk_card',
    displayName: 'Risk Card (Insurtech)',
    description: 'Ficha de decisión estilo insurtech con causa / impacto / confianza / acción / prioridad. Saves de AMs.',
    thumbnailEmoji: '🛡️',
    defaultFormat: '1:1',
    funnelTargets: ['MOFU', 'TOFU'],
    annotationsMax: 5,
    generationFlow: 'ai_generate',
    colorAccentRole: 'loss_only',
    negativePrompts: [
      'datos fabricados',
      'más de 5 campos',
      'look genérico de tarjeta SaaS',
      'cualquier nombre propio de cliente',
    ],
  },
}

/** Convenience helpers. */

export function getArchetype(slug: ArchetypeSlug): ArchetypeDefinition {
  const def = ARCHETYPE_REGISTRY[slug]
  if (!def) throw new Error(`Unknown archetype: ${slug}`)
  return def
}

export function isCaptureOverlayArchetype(slug: ArchetypeSlug): boolean {
  return ARCHETYPE_REGISTRY[slug].generationFlow === 'capture_overlay'
}

/** Get the recommended archetype for a given editorial structure + funnel pair, or null. */
export function recommendArchetype(structureSlug: string | null | undefined): ArchetypeSlug | null {
  if (!structureSlug) return null
  // STRUCTURE_TO_ARCHETYPE is defined in types/archetype.ts but re-exporting helper here for ergonomics.
  const map: Record<string, ArchetypeSlug> = {
    feature_kill: 'screenshot_annotated',
    aprendizaje_cliente: 'dashboard_annotated',
    nicho_olvidado: 'risk_card',
    demo_pequena: 'carousel_mini_report',
    opinion_contraria_ia: 'field_photo_overlay',
  }
  return map[structureSlug] ?? null
}
