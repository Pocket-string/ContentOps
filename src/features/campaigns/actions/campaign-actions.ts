'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createCampaignSchema, CAMPAIGN_STATUSES, updateBriefSchema } from '@/shared/types/content-ops'
import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { track } from '@/lib/tracking'
import {
  createCampaignWithPosts,
  updateCampaign,
  updateCampaignStatus,
  updateCampaignBrief,
  deleteCampaign,
} from '@/features/campaigns/services/campaign-service'

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
 * Parse a JSON string field from FormData.
 * Returns the parsed object on success, or an empty object on failure.
 */
function parseJsonField(value: FormDataEntryValue | null): Record<string, unknown> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {}
  }
  try {
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return {}
  } catch {
    return {}
  }
}

/**
 * Parse FormData into a plain object for campaign Zod validation.
 * Handles optional uuid fields and JSON blob fields.
 */
function parseCampaignFormData(formData: FormData): Record<string, unknown> {
  const topicId = formData.get('topic_id')
  const keyword = formData.get('keyword')
  const frequencyRaw = formData.get('post_frequency')
  const selectedDaysRaw = formData.get('selected_days')

  const result: Record<string, unknown> = {
    week_start: formData.get('week_start'),
    topic_id: typeof topicId === 'string' && topicId.trim().length > 0 ? topicId.trim() : undefined,
    keyword: typeof keyword === 'string' && keyword.trim().length > 0 ? keyword.trim() : undefined,
    resource_json: parseJsonField(formData.get('resource_json')),
    audience_json: parseJsonField(formData.get('audience_json')),
  }

  if (typeof frequencyRaw === 'string' && frequencyRaw.length > 0) {
    result.post_frequency = Number(frequencyRaw)
  }

  if (typeof selectedDaysRaw === 'string' && selectedDaysRaw.length > 0) {
    try {
      result.selected_days = JSON.parse(selectedDaysRaw) as unknown
    } catch { /* ignore */ }
  }

  return result
}

// ============================================
// Server Actions
// ============================================

/**
 * Create a new campaign and auto-generate 5 weekly posts.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: createCampaignSchema.safeParse() validates all fields.
 * Step 3 — Execute:  createCampaignWithPosts() inserts campaign + 5 posts.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes the list.
 */
export async function createCampaignAction(formData: FormData): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  const raw = parseCampaignFormData(formData)
  const parsed = createCampaignSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos invalidos' }
  }

  // Resolve workspace
  let workspaceId: string
  try {
    workspaceId = await getWorkspaceId()
  } catch {
    return { error: 'No se pudo obtener el workspace' }
  }

  // Step 3: Execute
  const result = await createCampaignWithPosts(workspaceId, user.id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('campaign.created', {
    workspace_id: workspaceId,
    campaign_id: result.data?.id,
    week_start: parsed.data.week_start,
    topic_id: parsed.data.topic_id,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Partial update of an existing campaign.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: createCampaignSchema.partial().safeParse() validates partial fields.
 * Step 3 — Execute:  updateCampaign() patches the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes list and detail.
 */
export async function updateCampaignAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { error: 'ID de campana requerido' }
  }

  // Step 2: Validate (partial — only provided fields are validated)
  const raw = parseCampaignFormData(formData)
  const partialSchema = createCampaignSchema.partial()
  const parsed = partialSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute
  const result = await updateCampaign(id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('campaign.updated', {
    user_id: user.id,
    campaign_id: id,
  })

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${id}`)

  return { success: true }
}

/**
 * Quick status-only update for a campaign.
 * Validates status against the CAMPAIGN_STATUSES enum.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: z.enum(CAMPAIGN_STATUSES) guards against invalid values.
 * Step 3 — Execute:  updateCampaignStatus() patches only the status column.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes list and detail.
 */
export async function updateCampaignStatusAction(
  id: string,
  status: string
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { error: 'ID de campana requerido' }
  }

  // Step 2: Validate status enum
  const statusSchema = z.enum(CAMPAIGN_STATUSES)
  const parsedStatus = statusSchema.safeParse(status)

  if (!parsedStatus.success) {
    return {
      error: `Estado invalido. Valores permitidos: ${CAMPAIGN_STATUSES.join(', ')}`,
    }
  }

  // Step 3: Execute
  const result = await updateCampaignStatus(id, parsedStatus.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('campaign.status_changed', {
    user_id: user.id,
    campaign_id: id,
    new_status: parsedStatus.data,
  })

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${id}`)

  return { success: true }
}

/**
 * Delete a campaign and its cascaded posts.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: id must be a non-empty string.
 * Step 3 — Execute:  deleteCampaign() removes the row (posts cascade).
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes the list.
 */
export async function deleteCampaignAction(id: string): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate id
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { error: 'ID de campana invalido' }
  }

  // Step 3: Execute
  const result = await deleteCampaign(id)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('campaign.deleted', {
    user_id: user.id,
    campaign_id: id,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Update the weekly brief and publishing plan for a campaign.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: updateBriefSchema.safeParse() validates brief data.
 * Step 3 — Execute:  updateCampaignBrief() patches the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes detail.
 */
export async function updateBriefAction(
  campaignId: string,
  data: unknown
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  if (!campaignId || typeof campaignId !== 'string' || campaignId.trim().length === 0) {
    return { error: 'ID de campana requerido' }
  }

  // Step 2: Validate
  const parsed = updateBriefSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos del brief invalidos' }
  }

  // Step 3: Execute
  const result = await updateCampaignBrief(
    campaignId,
    parsed.data.weekly_brief,
    parsed.data.publishing_plan
  )

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('campaign.brief_updated', {
    user_id: user.id,
    campaign_id: campaignId,
  })

  revalidatePath(`/campaigns/${campaignId}`)

  return { success: true }
}
