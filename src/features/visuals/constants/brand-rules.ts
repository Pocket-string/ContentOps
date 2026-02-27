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
