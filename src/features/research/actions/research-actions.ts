'use server'

import { revalidatePath } from 'next/cache'
import { createResearchSchema } from '@/shared/types/content-ops'
import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { track } from '@/lib/tracking'
import {
  createResearch,
  updateResearch,
  deleteResearch,
} from '@/features/research/services/research-service'

// ============================================
// Result types
// ============================================

interface ActionSuccess {
  success: true
}

interface ActionError {
  error: string
}

type ActionResult = ActionSuccess | ActionError

// ============================================
// Helpers
// ============================================

/**
 * Parse a JSON-array-or-comma-separated FormData field into string[].
 */
function parseJsonArrayField(formData: FormData, field: string): string[] {
  const raw = formData.get(field)
  if (typeof raw !== 'string' || raw.trim().length === 0) return []
  if (raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter((t): t is string => typeof t === 'string')
      }
    } catch {
      return []
    }
  }
  return raw.split(',').map((t) => t.trim()).filter(Boolean)
}

/**
 * Parse FormData into a plain object for Zod validation.
 * tags_json, evidence_links, key_takeaways, recommended_angles are expected as
 * a comma-separated string or JSON array string.
 * trend_score and fit_score are expected as numeric strings.
 */
function parseResearchFormData(formData: FormData): Record<string, unknown> {
  // Numeric fields
  const rawTrendScore = formData.get('trend_score')
  const trendScoreNum = typeof rawTrendScore === 'string' ? Number(rawTrendScore) : NaN
  const trendScore =
    typeof rawTrendScore === 'string' && rawTrendScore.trim().length > 0 && !isNaN(trendScoreNum)
      ? trendScoreNum
      : undefined

  const rawFitScore = formData.get('fit_score')
  const fitScoreNum = typeof rawFitScore === 'string' ? Number(rawFitScore) : NaN
  const fitScore =
    typeof rawFitScore === 'string' && rawFitScore.trim().length > 0 && !isNaN(fitScoreNum)
      ? fitScoreNum
      : undefined

  // String fields (empty string → undefined)
  const rawRecencyDate = formData.get('recency_date')
  const recencyDate =
    typeof rawRecencyDate === 'string' && rawRecencyDate.trim().length > 0
      ? rawRecencyDate.trim()
      : undefined

  const rawMarketRegion = formData.get('market_region')
  const marketRegion =
    typeof rawMarketRegion === 'string' && rawMarketRegion.trim().length > 0
      ? rawMarketRegion.trim()
      : undefined

  const rawBuyerPersona = formData.get('buyer_persona')
  const buyerPersona =
    typeof rawBuyerPersona === 'string' && rawBuyerPersona.trim().length > 0
      ? rawBuyerPersona.trim()
      : undefined

  return {
    title: formData.get('title'),
    source: formData.get('source') || undefined,
    raw_text: formData.get('raw_text'),
    tags_json: parseJsonArrayField(formData, 'tags_json'),
    recency_date: recencyDate,
    market_region: marketRegion,
    buyer_persona: buyerPersona,
    trend_score: trendScore,
    fit_score: fitScore,
    evidence_links: parseJsonArrayField(formData, 'evidence_links'),
    key_takeaways: parseJsonArrayField(formData, 'key_takeaways'),
    recommended_angles: parseJsonArrayField(formData, 'recommended_angles'),
  }
}

// ============================================
// Server Actions
// ============================================

/**
 * Create a new research report.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: createResearchSchema.safeParse() validates all fields.
 * Step 3 — Execute:  createResearch() inserts the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes the list.
 */
export async function createResearchAction(formData: FormData): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  const raw = parseResearchFormData(formData)
  const parsed = createResearchSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos invalidos' }
  }

  // Resolve workspace (creates one if user has none)
  let workspaceId: string
  try {
    workspaceId = await getWorkspaceId()
  } catch {
    return { error: 'No se pudo obtener el workspace' }
  }

  // Step 3: Execute
  const result = await createResearch(workspaceId, user.id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('research.created', {
    workspace_id: workspaceId,
    research_id: result.data?.id,
    title: parsed.data.title,
  })

  revalidatePath('/research')

  return { success: true }
}

/**
 * Update an existing research report by id.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: createResearchSchema.partial().safeParse() validates partial fields.
 * Step 3 — Execute:  updateResearch() patches the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes list and detail.
 */
export async function updateResearchAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  if (!id) {
    return { error: 'ID de investigacion requerido' }
  }

  // Step 2: Validate (partial — only provided fields are validated)
  const raw = parseResearchFormData(formData)
  const partialSchema = createResearchSchema.partial()
  const parsed = partialSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute
  const result = await updateResearch(id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('research.updated', {
    user_id: user.id,
    research_id: id,
  })

  revalidatePath('/research')
  revalidatePath(`/research/${id}`)

  return { success: true }
}

/**
 * Delete a research report by id.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: id must be a non-empty string.
 * Step 3 — Execute:  deleteResearch() removes the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes the list.
 */
export async function deleteResearchAction(id: string): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate id
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { error: 'ID de investigacion invalido' }
  }

  // Step 3: Execute
  const result = await deleteResearch(id)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('research.deleted', {
    user_id: user.id,
    research_id: id,
  })

  revalidatePath('/research')

  return { success: true }
}
