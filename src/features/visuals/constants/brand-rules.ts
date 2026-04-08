/**
 * Bitalize brand rules for visual generation.
 * Used as context for AI-generated visual prompts (Nano Banana Pro).
 */

// ============================================
// Format
// ============================================

export const VISUAL_FORMATS = ['1:1', '4:5', '16:9', '9:16'] as const
export type VisualFormat = (typeof VISUAL_FORMATS)[number]

export const DEFAULT_FORMAT: VisualFormat = '1:1'

export const FORMAT_LABELS: Record<VisualFormat, string> = {
  '1:1': 'Cuadrado (1:1) — Feed',
  '4:5': 'Vertical (4:5) — Feed',
  '16:9': 'Horizontal (16:9) — Articulo',
  '9:16': 'Story (9:16) — Vertical',
}

export const FORMAT_DIMENSIONS: Record<VisualFormat, { width: number; height: number }> = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '16:9': { width: 1200, height: 675 },
  '9:16': { width: 1080, height: 1920 },
}

// ============================================
// Brand Style
// ============================================

export const BRAND_STYLE = {
  name: 'Bitalize',
  domain: 'O&M Fotovoltaico',
  tone: 'profesional, tecnico pero accesible, confiable',
  colors: {
    primary: '#1E3A5F',      // Azul oscuro — confianza
    secondary: '#F97316',    // Naranja — energia solar
    accent: '#10B981',       // Verde — sostenibilidad
    background: '#FFFFFF',   // Blanco limpio
    text: '#1F2937',         // Gris oscuro
  },
  typography: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
    style: 'moderno, limpio, sin serif',
  },
  logo: {
    placement: 'esquina inferior derecha',
    size: 'discreto, no dominante',
    includeAlways: true,
  },
  imagery: {
    style: 'Infografia educativa estilo NotebookLM con estetica de periodico nuevo. Siempre full color. Composicion limpia tipo revista cientifica moderna con graficos de datos y tipografia prominente legible.',
    subjects: [
      'plantas solares',
      'paneles fotovoltaicos',
      'equipos de mantenimiento',
      'datos y graficos de rendimiento',
      'tecnologia de monitoreo',
    ],
    mood: 'profesional, innovador, sostenible',
  },
} as const

// ============================================
// Default Style Anchors
// ============================================

export const DEFAULT_STYLE_ANCHORS = [
  'Educational infographic style inspired by NotebookLM',
  'Modern newspaper editorial aesthetic with full vivid color',
  'Clean data visualization with bold readable typography',
  'Professional magazine layout with clear visual hierarchy',
] as const

// ============================================
// Negative Prompts
// ============================================

export const NEGATIVE_PROMPTS = [
  'texto borroso o ilegible',
  'logos de competidores',
  'imagenes de baja calidad o pixeladas',
  'colores neon o saturados en exceso',
  'elementos infantiles o caricaturescos',
  'contenido no relacionado con energia solar',
  'marcas de agua visibles',
  'manos o rostros deformados',
] as const

// ============================================
// V2: Extended Brand Constants
// ============================================

/** Exact textual description of the Bitalize logo for AI image models. */
export const BRAND_LOGO_DESCRIPTION = {
  reference_description:
    'The Bitalize logo consists of the word "Bitalize" in a clean sans-serif font (Inter Bold), ' +
    'with a geometric icon to the left made of four vertical bars of increasing height in brand blue (#1E3A5F), ' +
    'resembling a bar chart or data growth icon. Below the name is the tagline "DATA-DRIVEN GROWTH, REVITALIZED" ' +
    'in small uppercase letters. The text is dark navy (#1E3A5F) on light backgrounds or white on dark backgrounds.',
  default_placement: 'bottom_left_on_white_band',
  default_scale: 0.2,
  default_band: {
    use_band: true,
    band_color: '#FFFFFF',
    band_height_ratio: 0.12,
  },
} as const

/** Author signature defaults. */
export const BRAND_SIGNATURE = {
  text: 'Jonathan Navarrete — Bitalize',
  default_placement: 'bottom-left, small 10px, text color #94A3B8',
} as const

/** Extended semantic color map for V2 prompts. */
export const BRAND_COLORS_SEMANTIC = {
  primary: '#1E3A5F',         // brand_blue_dark — trust, depth
  secondary: '#F97316',       // accent_energy — solar energy, action
  accent: '#10B981',          // accent_growth — sustainability
  text_main: '#1F2937',       // gray-800
  text_secondary: '#94A3B8',  // gray-400, muted
  background: '#FFFFFF',      // paper-white
  background_dark: '#0F172A', // navy dark alternative
  accent_warning: '#EAB308',  // yellow for data highlights
  accent_danger: '#EF4444',   // red for critical metrics
} as const

// ============================================
// QA Checklist
// ============================================

export interface QACheckItem {
  id: string
  label: string
  category: 'formato' | 'estilo' | 'texto' | 'marca'
}

export const QA_CHECKLIST: QACheckItem[] = [
  { id: 'format_correct', label: 'Formato correcto (dimensiones)', category: 'formato' },
  { id: 'format_resolution', label: 'Resolucion adecuada (min 1080px)', category: 'formato' },
  { id: 'style_editorial', label: 'Estilo editorial profesional', category: 'estilo' },
  { id: 'style_colors', label: 'Colores de marca aplicados', category: 'estilo' },
  { id: 'style_mood', label: 'Tono visual coherente con la marca', category: 'estilo' },
  { id: 'text_legible', label: 'Texto legible y sin errores', category: 'texto' },
  { id: 'text_hierarchy', label: 'Jerarquia visual clara', category: 'texto' },
  { id: 'brand_logo', label: 'Logo presente y bien ubicado', category: 'marca' },
  { id: 'brand_negative', label: 'Sin elementos de negative prompts', category: 'marca' },
]

// ============================================
// Carousel Configuration
// ============================================

export const CAROUSEL_CONFIG = {
  minSlides: 2,
  maxSlides: 10,
  defaultSlides: 5,
  format: '4:5' as VisualFormat,
  dimensions: { width: 1080, height: 1350 },
} as const

export const CAROUSEL_QA_CHECKLIST: QACheckItem[] = [
  { id: 'carousel_consistency', label: 'Consistencia visual entre slides', category: 'estilo' },
  { id: 'carousel_narrative', label: 'Narrativa coherente (hook → contenido → CTA)', category: 'texto' },
  { id: 'carousel_cover', label: 'Cover slide atractivo y claro', category: 'texto' },
  { id: 'carousel_cta', label: 'Ultimo slide con CTA efectivo', category: 'texto' },
]

// PRP-011 Phase 9: Per-role brand rules for carousel slides
export interface CarouselSlideRuleset {
  logoPlacement: 'center-bottom' | 'bottom-right-small' | 'none'
  signatureVisible: boolean
  accentColorProminent: boolean
  maxTextDensity: 'low' | 'medium' | 'high'
  promptSuffix: string
}

export const CAROUSEL_BRAND_RULES: Record<string, CarouselSlideRuleset> = {
  cover: {
    logoPlacement: 'center-bottom',
    signatureVisible: true,
    accentColorProminent: true,
    maxTextDensity: 'low',
    promptSuffix: 'Cover slide: bold headline, high visual impact, logo prominent at bottom center, signature visible. Accent color (#F97316) used for emphasis.',
  },
  context: {
    logoPlacement: 'bottom-right-small',
    signatureVisible: false,
    accentColorProminent: false,
    maxTextDensity: 'medium',
    promptSuffix: 'Context slide: data overview, clean layout, small logo bottom-right. Primary color (#1E3A5F) dominant.',
  },
  deep_dive: {
    logoPlacement: 'bottom-right-small',
    signatureVisible: false,
    accentColorProminent: false,
    maxTextDensity: 'high',
    promptSuffix: 'Deep dive slide: detailed technical content, charts or diagrams allowed, small logo bottom-right.',
  },
  evidence: {
    logoPlacement: 'bottom-right-small',
    signatureVisible: false,
    accentColorProminent: false,
    maxTextDensity: 'medium',
    promptSuffix: 'Evidence slide: key statistic or data point prominent, source citation visible, small logo bottom-right.',
  },
  method: {
    logoPlacement: 'bottom-right-small',
    signatureVisible: false,
    accentColorProminent: false,
    maxTextDensity: 'medium',
    promptSuffix: 'Method slide: framework or step-by-step layout, numbered items, clean structure, small logo bottom-right.',
  },
  cta_close: {
    logoPlacement: 'center-bottom',
    signatureVisible: true,
    accentColorProminent: true,
    maxTextDensity: 'low',
    promptSuffix: 'CTA closing slide: clear call-to-action, logo prominent at bottom center, signature visible. Accent color (#F97316) for CTA button/text.',
  },
}
