/**
 * PRP-011: Aesthetic presets for visual generation.
 * Based on styles proven in the ContentOps project.
 */

export interface AestheticPreset {
  id: string
  name: string
  description: string
  background: string
  textColors: string
  layout: string
  mood: string
  fontRules: string
  promptFragment: string
}

export const AESTHETIC_PRESETS: AestheticPreset[] = [
  {
    id: 'notebook_editorial',
    name: 'Notebook Editorial',
    description: 'NotebookLM educativo + periodico. Fondo papel, tipografia limpia.',
    background: 'warm off-white paper texture, subtle grain, newspaper-inspired layout',
    textColors: 'dark grey (#1F2937) headlines, medium grey body text, orange (#F97316) accents',
    layout: 'clean editorial grid, generous whitespace, single focal point',
    mood: 'educational, authoritative, accessible',
    fontRules: 'bold serif-style headlines, clean sans-serif body, minimal ornamentation',
    promptFragment: 'Educational infographic with NotebookLM aesthetic, warm paper texture background, newspaper-style editorial layout, clean typography hierarchy, minimal ornamentation, full color',
  },
  {
    id: 'dark_dashboard',
    name: 'Dashboard Oscuro',
    description: 'Dashboard SaaS oscuro. Datos en primer plano, graficos sutiles.',
    background: 'dark navy (#0F172A) to charcoal gradient, subtle grid lines',
    textColors: 'white headlines, light grey body, green (#10B981) data accents, orange (#F97316) alerts',
    layout: 'data-forward, key metric prominent, supporting charts subtle',
    mood: 'technical, modern, data-driven',
    fontRules: 'monospace numbers, bold sans headlines, tabular data alignment',
    promptFragment: 'Dark SaaS dashboard aesthetic, navy-to-charcoal gradient background, data visualization forward, monospace numbers, green accent metrics, modern technical feel',
  },
  {
    id: 'clean_corporate',
    name: 'Corporativo Limpio',
    description: 'B2B corporativo. Fondo blanco, estructura clara, profesional.',
    background: 'clean white with subtle light grey sections, thin separator lines',
    textColors: 'navy (#1E3A5F) headlines, dark grey body, orange (#F97316) CTAs',
    layout: 'structured two-column or centered, clear hierarchy, professional spacing',
    mood: 'professional, trustworthy, clean',
    fontRules: 'bold sans headlines (Inter), regular body, generous line height',
    promptFragment: 'Clean corporate B2B infographic, white background, navy and orange brand colors, structured professional layout, Inter font family, clear hierarchy',
  },
  {
    id: 'data_infographic',
    name: 'Infografia de Datos',
    description: 'Charts, metricas y comparaciones visuales. Datos como protagonistas.',
    background: 'light grey (#F8FAFC) with white card sections, thin borders',
    textColors: 'dark text, colored data labels, traffic-light severity coding',
    layout: 'metric cards, comparison tables, before/after panels, icon-led sections',
    mood: 'analytical, evidence-based, scannable',
    fontRules: 'large bold numbers, small labels, tabular alignment, icon indicators',
    promptFragment: 'Data-centric infographic, light background with white metric cards, large bold numbers, comparison panels, traffic-light severity colors, analytical and scannable',
  },
  {
    id: 'field_report',
    name: 'Reporte de Campo',
    description: 'Foto de planta solar + overlay oscuro + texto claro. Terreno real.',
    background: 'aerial photo of solar plant with semi-transparent dark overlay (60% opacity)',
    textColors: 'white headlines, light grey body, orange (#F97316) highlights',
    layout: 'full-bleed photo background, text overlay with breathing room, bottom brand band',
    mood: 'real-world, urgent, field-level credibility',
    fontRules: 'bold white headlines for contrast, readable body over dark overlay, no small text',
    promptFragment: 'Field report style, aerial solar plant photograph background, dark semi-transparent overlay, white bold text overlay, orange accent highlights, real-world credibility feel',
  },
]

export const DEFAULT_PRESET_ID = 'notebook_editorial'

export function getPresetById(id: string): AestheticPreset | undefined {
  return AESTHETIC_PRESETS.find(p => p.id === id)
}

export function getPresetPromptFragment(id: string): string {
  return getPresetById(id)?.promptFragment ?? AESTHETIC_PRESETS[0].promptFragment
}
