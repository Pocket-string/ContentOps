import { createClient } from '@/lib/supabase/server'
import { WEEKLY_PLAN } from '@/shared/types/content-ops'

// ============================================
// Types
// ============================================

export interface ServiceResult<T> {
  data?: T
  error?: string
}

export interface ExportPackData {
  campaignName: string
  weekStart: string
  topicTitle: string | null
  keyword: string | null
  resource: { type: string; url: string; name: string; description: string } | null
  templates: { name: string; content: string }[]
  posts: ExportPost[]
  checklist: ChecklistItem[]
  weeklyBrief: {
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
  } | null
  publishingPlan: Record<string, { suggested_time?: string; notes?: string }> | null
}

export interface ExportPost {
  dayOfWeek: number
  dayLabel: string
  funnelStage: string
  status: string
  currentVersion: { variant: string; content: string; score_total: number | null } | null
  visualPrompts: { version: number; format: string; promptJson: Record<string, unknown> }[]
  hasApprovedVisual: boolean
}

export interface ChecklistItem {
  id: string
  label: string
  checked: boolean
  severity: 'required' | 'recommended'
}

// ============================================
// Internal types for raw DB rows
// ============================================

interface RawCampaignRow {
  id: string
  week_start: string
  keyword: string | null
  resource_json: Record<string, unknown> | null
  weekly_brief: Record<string, unknown> | null
  publishing_plan: Record<string, unknown> | null
  topics: { title: string } | null
}

interface RawPostVersionRow {
  id: string
  post_id: string
  variant: string
  content: string
  is_current: boolean
  score_json: { total?: number } | null
}

interface RawPostRow {
  id: string
  day_of_week: number
  funnel_stage: string
  status: string
  post_versions: RawPostVersionRow[]
}

interface RawVisualVersionRow {
  post_id: string
  version: number
  format: string
  prompt_json: Record<string, unknown>
  status: string
}

interface ConversionResource {
  type: string
  url: string
  name: string
  description: string
}

interface ConversionTemplate {
  name: string
  content: string
}

interface ConversionConfig {
  resource?: ConversionResource
  templates?: ConversionTemplate[]
}

// ============================================
// Internal helpers
// ============================================

/**
 * Safely cast unknown to Record<string, unknown>.
 * Returns null if the value is not a plain object.
 */
function toRecord(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

/**
 * Parse the resource_json column into a typed ConversionConfig.
 * Returns an empty config rather than throwing on malformed data.
 */
function parseConversionConfig(resourceJson: Record<string, unknown> | null): ConversionConfig {
  if (!resourceJson) {
    return {}
  }

  const resource = toRecord(resourceJson.resource)
  const parsedResource: ConversionResource | undefined =
    resource &&
    typeof resource.type === 'string' &&
    typeof resource.url === 'string' &&
    typeof resource.name === 'string' &&
    typeof resource.description === 'string'
      ? {
          type: resource.type,
          url: resource.url,
          name: resource.name,
          description: resource.description,
        }
      : undefined

  const rawTemplates = resourceJson.templates
  let parsedTemplates: ConversionTemplate[] | undefined

  if (Array.isArray(rawTemplates)) {
    parsedTemplates = rawTemplates.reduce<ConversionTemplate[]>((acc, item: unknown) => {
      const obj = toRecord(item)
      if (obj && typeof obj.name === 'string' && typeof obj.content === 'string') {
        acc.push({ name: obj.name, content: obj.content })
      }
      return acc
    }, [])
  }

  return {
    resource: parsedResource,
    templates: parsedTemplates,
  }
}

/**
 * Build a human-readable campaign name from week_start and topic title.
 * Format: "Semana [DD/MM/YYYY]" or "Semana [DD/MM/YYYY] — [Topic Title]"
 */
function buildCampaignName(weekStart: string, topicTitle: string | null): string {
  // weekStart is stored as YYYY-MM-DD (UTC). Parse components directly to avoid
  // timezone shifts that would change the displayed date.
  const parts = weekStart.split('-')
  const year = parts[0] ?? ''
  const month = parts[1] ?? ''
  const day = parts[2] ?? ''
  const formatted = `${day}/${month}/${year}`

  const base = `Semana ${formatted}`
  return topicTitle ? `${base} — ${topicTitle}` : base
}

/**
 * Derive the current version for a post from its post_versions array.
 * Returns the version where is_current = true, or null if none exists.
 */
function extractCurrentVersion(
  versions: RawPostVersionRow[]
): ExportPost['currentVersion'] {
  const current = versions.find((v) => v.is_current)

  if (!current) {
    return null
  }

  return {
    variant: current.variant,
    content: current.content,
    score_total: current.score_json?.total ?? null,
  }
}

// ============================================
// Public functions
// ============================================

/**
 * Sanitize a string for use as a filename.
 * Applies the Soiling Calculator security rule:
 * lowercase, alphanumeric + hyphens only, no leading/trailing hyphens.
 *
 * Exported because the client-side ZIP component also uses it.
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Fetch all campaign data and assemble an ExportPackData object.
 *
 * Execution order:
 *   1. Fetch campaign row with topic join.
 *   2. Fetch all posts for the campaign, each with their post_versions.
 *   3. Fetch all visual_versions for every post in a single query.
 *   4. Build ExportPost array for days 1-5 using WEEKLY_PLAN.
 *   5. Build checklist from derived state.
 */
export async function getExportPackData(
  campaignId: string
): Promise<ServiceResult<ExportPackData>> {
  try {
    const supabase = await createClient()

    // Step 1: Fetch campaign with topic title
    const { data: campaignRow, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, week_start, keyword, resource_json, weekly_brief, publishing_plan, topics(title)')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaignRow) {
      return { error: campaignError?.message ?? 'Campana no encontrada' }
    }

    const campaign = campaignRow as unknown as RawCampaignRow

    // Step 2: Fetch all posts with their versions, ordered by day
    const { data: postRows, error: postsError } = await supabase
      .from('posts')
      .select('id, day_of_week, funnel_stage, status, post_versions(*)')
      .eq('campaign_id', campaignId)
      .order('day_of_week', { ascending: true })
      .order('version', { referencedTable: 'post_versions', ascending: false })

    if (postsError) {
      return { error: postsError.message }
    }

    const posts = (postRows ?? []) as unknown as RawPostRow[]

    // Step 3: Fetch all visual_versions for this campaign's posts in one query
    const postIds = posts.map((p) => p.id)

    let visuals: RawVisualVersionRow[] = []

    if (postIds.length > 0) {
      const { data: visualRows, error: visualsError } = await supabase
        .from('visual_versions')
        .select('post_id, version, format, prompt_json, status')
        .in('post_id', postIds)
        .order('version', { ascending: false })

      if (visualsError) {
        // Non-fatal: log and continue with empty visuals
        console.error('[export-service] getExportPackData visuals fetch error', visualsError)
      } else {
        visuals = (visualRows ?? []) as unknown as RawVisualVersionRow[]
      }
    }

    // Index visuals by post_id for O(1) lookup
    const visualsByPostId = visuals.reduce<Record<string, RawVisualVersionRow[]>>(
      (acc, visual) => {
        const existing = acc[visual.post_id] ?? []
        acc[visual.post_id] = [...existing, visual]
        return acc
      },
      {}
    )

    // Step 4: Parse resource_json into ConversionConfig
    const conversionConfig = parseConversionConfig(
      campaign.resource_json ? toRecord(campaign.resource_json) : null
    )

    // Step 5: Build ExportPost array, one per WEEKLY_PLAN day
    const exportPosts: ExportPost[] = Object.entries(WEEKLY_PLAN).map(([dayStr, plan]) => {
      const day = Number(dayStr)
      const post = posts.find((p) => p.day_of_week === day)

      if (!post) {
        // Day exists in plan but has no DB row — return a stub
        return {
          dayOfWeek: day,
          dayLabel: plan.label,
          funnelStage: plan.stage,
          status: 'draft',
          currentVersion: null,
          visualPrompts: [],
          hasApprovedVisual: false,
        }
      }

      const postVisuals = visualsByPostId[post.id] ?? []

      return {
        dayOfWeek: day,
        dayLabel: plan.label,
        funnelStage: post.funnel_stage,
        status: post.status,
        currentVersion: extractCurrentVersion(post.post_versions),
        visualPrompts: postVisuals.map((v) => ({
          version: v.version,
          format: v.format,
          promptJson: v.prompt_json,
        })),
        hasApprovedVisual: postVisuals.some((v) => v.status === 'approved'),
      }
    })

    // Step 6: Build checklist from derived state
    const allPostsApproved = exportPosts.every(
      (p) =>
        p.currentVersion !== null &&
        (p.status === 'approved' || p.status === 'published')
    )

    const allPostsHaveApprovedVisual = exportPosts.every((p) => p.hasApprovedVisual)

    const checklist: ChecklistItem[] = [
      {
        id: 'all_posts_approved',
        label: 'Todos los posts tienen contenido aprobado',
        checked: allPostsApproved,
        severity: 'required',
      },
      {
        id: 'keyword_defined',
        label: 'Keyword definida',
        checked: campaign.keyword !== null && campaign.keyword.trim().length > 0,
        severity: 'recommended',
      },
      {
        id: 'resource_registered',
        label: 'Recurso de conversion registrado',
        checked: conversionConfig.resource !== undefined,
        severity: 'recommended',
      },
      {
        id: 'templates_configured',
        label: 'Templates de respuesta configurados',
        checked:
          conversionConfig.templates !== undefined &&
          conversionConfig.templates.length > 0,
        severity: 'recommended',
      },
      {
        id: 'visuals_qa_approved',
        label: 'Imagenes con QA aprobado',
        checked: allPostsHaveApprovedVisual,
        severity: 'recommended',
      },
    ]

    const topicTitle = campaign.topics?.title ?? null
    const campaignName = buildCampaignName(campaign.week_start, topicTitle)

    const exportPackData: ExportPackData = {
      campaignName,
      weekStart: campaign.week_start,
      topicTitle,
      keyword: campaign.keyword,
      resource: conversionConfig.resource ?? null,
      templates: conversionConfig.templates ?? [],
      posts: exportPosts,
      checklist,
      weeklyBrief: parseWeeklyBrief(campaign.weekly_brief),
      publishingPlan: parsePublishingPlan(campaign.publishing_plan),
    }

    return { data: exportPackData }
  } catch (err) {
    console.error('[export-service] getExportPackData unexpected error', err)
    return { error: 'Error inesperado al obtener los datos del pack de exportacion' }
  }
}

/**
 * Generate the markdown copy file for all posts in the campaign.
 *
 * Each day section shows the approved/current post content.
 * Days without approved content show a "[Pendiente de aprobacion]" placeholder.
 */
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

/**
 * Generate the markdown checklist file for pre-publication review.
 */
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

/**
 * Generate the markdown links and conversion info file.
 */
export function generateLinksMarkdown(
  resource: ExportPackData['resource'],
  keyword: string | null,
  templates: ExportPackData['templates']
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

/**
 * Generate weekly_brief.md with structured brief data.
 */
export function generateBriefMarkdown(brief: ExportPackData['weeklyBrief'], weekStart: string): string {
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

/**
 * Generate publishing_plan.md with daily schedule.
 */
export function generatePlanMarkdown(plan: ExportPackData['publishingPlan']): string {
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

/**
 * Generate dm_templates.md with both raw and rendered versions.
 * Variable placeholders in content use the {{varName}} syntax.
 */
export function generateDMTemplatesMarkdown(
  templates: ExportPackData['templates'],
  keyword: string | null,
  resource: ExportPackData['resource'],
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

// ============================================
// Internal pure helpers
// ============================================

/**
 * Parse a raw DB weekly_brief object into the typed shape.
 * Returns null if the value is absent or malformed (missing required `tema`).
 */
function parseWeeklyBrief(raw: Record<string, unknown> | null): ExportPackData['weeklyBrief'] {
  if (!raw || typeof raw.tema !== 'string') return null

  const senal = raw.senales_mercado
  const senales_mercado: string[] | undefined = Array.isArray(senal)
    ? senal.filter((s): s is string => typeof s === 'string')
    : undefined

  return {
    tema: raw.tema,
    enemigo_silencioso:
      typeof raw.enemigo_silencioso === 'string' ? raw.enemigo_silencioso : undefined,
    evidencia_clave:
      typeof raw.evidencia_clave === 'string' ? raw.evidencia_clave : undefined,
    senales_mercado,
    anti_mito: typeof raw.anti_mito === 'string' ? raw.anti_mito : undefined,
    buyer_persona: typeof raw.buyer_persona === 'string' ? raw.buyer_persona : undefined,
    keyword: typeof raw.keyword === 'string' ? raw.keyword : undefined,
    recurso: typeof raw.recurso === 'string' ? raw.recurso : undefined,
    restriccion_links:
      typeof raw.restriccion_links === 'boolean' ? raw.restriccion_links : undefined,
    tone_rules: typeof raw.tone_rules === 'string' ? raw.tone_rules : undefined,
  }
}

/**
 * Parse a raw DB publishing_plan object into the typed shape.
 * Returns null if the value is absent or not a plain object.
 */
function parsePublishingPlan(
  raw: Record<string, unknown> | null,
): ExportPackData['publishingPlan'] {
  if (!raw) return null

  const result: Record<string, { suggested_time?: string; notes?: string }> = {}

  for (const [key, value] of Object.entries(raw)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const entry = value as Record<string, unknown>
      result[key] = {
        suggested_time:
          typeof entry.suggested_time === 'string' ? entry.suggested_time : undefined,
        notes: typeof entry.notes === 'string' ? entry.notes : undefined,
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

/**
 * Convert a funnel_stage DB value to a human-readable Spanish label.
 */
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
