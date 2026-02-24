/**
 * Pure markdown generators for export pack files.
 * These functions have NO database dependencies and are safe to import in client components.
 */

// ============================================
// Types (duplicated to avoid importing from server-only module)
// ============================================

interface ExportPost {
  dayOfWeek: number
  dayLabel: string
  funnelStage: string
  status: string
  currentVersion: { variant: string; content: string; score_total: number | null } | null
  visualPrompts: { version: number; format: string; promptJson: Record<string, unknown> }[]
  hasApprovedVisual: boolean
}

interface ChecklistItem {
  id: string
  label: string
  checked: boolean
  severity: 'required' | 'recommended'
}

interface ResourceData {
  type: string
  url: string
  name: string
  description: string
}

interface TemplateData {
  name: string
  content: string
}

interface WeeklyBrief {
  tema: string
  enemigo_silencioso?: string
  evidencia_clave?: string
  senales_mercado?: string[]
  anti_mito?: string
  buyer_persona?: string
  keyword?: string
  recurso?: string
  restriccion_links?: boolean
  tone_rules?: string
}

type PublishingPlan = Record<string, { suggested_time?: string; notes?: string }>

// ============================================
// Sanitize helper (also used by ExportPanel for ZIP filename)
// ============================================

export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ============================================
// Markdown generators
// ============================================

function formatFunnelStage(stage: string): string {
  const labels: Record<string, string> = {
    tofu_problem: 'TOFU Problema',
    mofu_problem: 'MOFU Problema',
    tofu_solution: 'TOFU Solucion',
    mofu_solution: 'MOFU Solucion',
    bofu_conversion: 'BOFU Conversion',
  }
  return labels[stage] ?? stage
}

export function generateCopyMarkdown(posts: ExportPost[], keyword: string | null): string {
  const keywordLine =
    keyword !== null && keyword.trim().length > 0
      ? `**Keyword CTA:** ${keyword}\n\n---\n\n`
      : ''

  const sections = posts.map((post) => {
    const heading = `## ${post.dayLabel} — ${formatFunnelStage(post.funnelStage)}`
    const content =
      post.currentVersion !== null
        ? post.currentVersion.content
        : '[Pendiente de aprobacion]'

    const scoreLine =
      post.currentVersion?.score_total !== null &&
      post.currentVersion?.score_total !== undefined
        ? `\n\n_Score D/G/P/I: ${post.currentVersion.score_total}/20_`
        : ''

    return `${heading}\n\n${content}${scoreLine}`
  })

  return `# Campaign Copy\n\n${keywordLine}${sections.join('\n\n---\n\n')}\n`
}

export function generateChecklistMarkdown(checklist: ChecklistItem[]): string {
  const required = checklist.filter((item) => item.severity === 'required')
  const recommended = checklist.filter((item) => item.severity === 'recommended')

  const formatItem = (item: ChecklistItem): string => {
    const box = item.checked ? '[x]' : '[ ]'
    return `- ${box} ${item.label}`
  }

  const requiredSection =
    required.length > 0
      ? `## Requeridos\n\n${required.map(formatItem).join('\n')}`
      : ''

  const recommendedSection =
    recommended.length > 0
      ? `## Recomendados\n\n${recommended.map(formatItem).join('\n')}`
      : ''

  const sections = [requiredSection, recommendedSection].filter(Boolean).join('\n\n')

  return `# Checklist Pre-Publicacion\n\n${sections}\n`
}

export function generateLinksMarkdown(
  resource: ResourceData | null,
  keyword: string | null,
  templates: TemplateData[]
): string {
  const keywordSection =
    keyword !== null && keyword.trim().length > 0
      ? `## Keyword CTA\n\n**KEYWORD**: ${keyword}`
      : `## Keyword CTA\n\n_No definida_`

  const resourceSection =
    resource !== null
      ? [
          '## Recurso',
          '',
          `- **Tipo**: ${resource.type}`,
          `- **Nombre**: ${resource.name}`,
          `- **URL**: ${resource.url}`,
          `- **Descripcion**: ${resource.description}`,
        ].join('\n')
      : '## Recurso\n\n_No registrado_'

  const templatesSection =
    templates.length > 0
      ? [
          '## Templates de Respuesta',
          '',
          ...templates.map((t) => `### ${t.name}\n\n${t.content}`),
        ].join('\n')
      : '## Templates de Respuesta\n\n_No configurados_'

  return `# Links y Conversion\n\n${keywordSection}\n\n${resourceSection}\n\n${templatesSection}\n`
}

export function generateBriefMarkdown(brief: WeeklyBrief | null, weekStart: string): string {
  if (!brief) return '# Brief Semanal\n\n_No hay brief definido para esta campana._\n'

  const parts = weekStart.split('-')
  const dateFormatted = `${parts[2] ?? ''}/${parts[1] ?? ''}/${parts[0] ?? ''}`

  const sections: string[] = [
    `# Brief Semanal — Semana ${dateFormatted}`,
    '',
    `## Tema Central`,
    brief.tema,
  ]

  if (brief.enemigo_silencioso) {
    sections.push('', '## Enemigo Silencioso', brief.enemigo_silencioso)
  }
  if (brief.evidencia_clave) {
    sections.push('', '## Evidencia Clave', brief.evidencia_clave)
  }
  if (brief.senales_mercado && brief.senales_mercado.length > 0) {
    sections.push('', '## Senales de Mercado', ...brief.senales_mercado.map((s) => `- ${s}`))
  }
  if (brief.anti_mito) {
    sections.push('', '## Anti-Mito', brief.anti_mito)
  }
  if (brief.buyer_persona) {
    sections.push('', '## Buyer Persona', brief.buyer_persona)
  }
  if (brief.keyword) {
    sections.push('', '## Keyword CTA', `#${brief.keyword}`)
  }
  if (brief.recurso) {
    sections.push('', '## Recurso', brief.recurso)
  }
  if (brief.tone_rules) {
    sections.push('', '## Reglas de Tono', brief.tone_rules)
  }
  sections.push(
    '',
    '## Restriccion de Links',
    brief.restriccion_links !== false
      ? 'NO incluir links en los posts'
      : 'Links permitidos',
  )

  return sections.join('\n') + '\n'
}

export function generatePlanMarkdown(plan: PublishingPlan | null): string {
  if (!plan || Object.keys(plan).length === 0) {
    return '# Plan de Publicacion\n\n_No hay plan de publicacion definido._\n'
  }

  const dayLabels: Record<string, string> = {
    '1': 'Lunes',
    '2': 'Martes',
    '3': 'Miercoles',
    '4': 'Jueves',
    '5': 'Viernes',
  }

  const sections = ['# Plan de Publicacion', '']

  for (const [day, entry] of Object.entries(plan)) {
    const label = dayLabels[day] ?? `Dia ${day}`
    sections.push(`## ${label}`)
    if (entry.suggested_time) sections.push(`- **Hora sugerida**: ${entry.suggested_time}`)
    if (entry.notes) sections.push(`- **Notas**: ${entry.notes}`)
    sections.push('')
  }

  return sections.join('\n') + '\n'
}

export function generateDMTemplatesMarkdown(
  templates: TemplateData[],
  keyword: string | null,
  resource: ResourceData | null,
): string {
  if (templates.length === 0) {
    return '# Templates DM/Comentario\n\n_No hay templates configurados._\n'
  }

  const vars: Record<string, string> = {
    keyword: keyword ?? '[KEYWORD]',
    recurso_nombre: resource?.name ?? '[RECURSO]',
    recurso_url: resource?.url ?? '[URL]',
    nombre: '[Nombre del contacto]',
  }

  const sections = ['# Templates DM/Comentario', '']

  for (const template of templates) {
    const rendered = template.content.replace(
      /\{\{(\w+)\}\}/g,
      (_, key: string) => vars[key] ?? `{{${key}}}`,
    )
    sections.push(
      `## ${template.name}`,
      '',
      '### Version con variables',
      '```',
      template.content,
      '```',
      '',
      '### Version copy/paste',
      rendered,
      '',
    )
  }

  return sections.join('\n') + '\n'
}
