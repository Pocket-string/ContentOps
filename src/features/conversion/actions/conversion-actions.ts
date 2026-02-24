'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { track } from '@/lib/tracking'
import {
  updateResource,
  updateTemplates,
  updatePinnedComment,
} from '../services/conversion-service'

// ============================================
// Schemas (mirrored from conversion-service for action-layer validation)
// ============================================

const resourceDataSchema = z.object({
  type: z.string().min(1),
  url: z.string().url(),
  name: z.string().min(1),
  description: z.string(),
})

const templateDataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  content: z.string().min(1),
})

// ============================================
// Result types
// ============================================

type ActionResult = { success: true } | { error: string }

// ============================================
// Server Actions
// ============================================

/**
 * Update the resource block of a campaign's ConversionConfig.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: JSON.parse + resourceDataSchema.safeParse() validates the payload.
 * Step 3 — Execute:  updateResource() merges the resource into resource_json via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes the campaigns list.
 */
export async function updateResourceAction(
  campaignId: string,
  resourceJson: string
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  if (!campaignId || typeof campaignId !== 'string' || campaignId.trim().length === 0) {
    return { error: 'ID de campana requerido' }
  }

  // Step 2: Validate
  let rawResource: unknown

  try {
    rawResource = JSON.parse(resourceJson)
  } catch {
    return { error: 'JSON invalido' }
  }

  const parsed = resourceDataSchema.safeParse(rawResource)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos de recurso invalidos' }
  }

  // Step 3: Execute
  const result = await updateResource(campaignId, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('conversion.resource_updated', {
    user_id: user.id,
    campaign_id: campaignId,
    resource_type: parsed.data.type,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Replace all conversion templates for a campaign.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: JSON.parse + z.array(templateDataSchema).safeParse() validates the payload.
 * Step 3 — Execute:  updateTemplates() overwrites the templates array in resource_json via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes the campaigns list.
 */
export async function updateTemplatesAction(
  campaignId: string,
  templatesJson: string
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  if (!campaignId || typeof campaignId !== 'string' || campaignId.trim().length === 0) {
    return { error: 'ID de campana requerido' }
  }

  // Step 2: Validate
  let rawTemplates: unknown

  try {
    rawTemplates = JSON.parse(templatesJson)
  } catch {
    return { error: 'JSON invalido' }
  }

  const parsed = z.array(templateDataSchema).safeParse(rawTemplates)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos de plantillas invalidos' }
  }

  // Step 3: Execute
  const result = await updateTemplates(campaignId, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('conversion.templates_updated', {
    user_id: user.id,
    campaign_id: campaignId,
    template_count: parsed.data.length,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Update the pinned comment template for a campaign.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: z.string() validates the pinned comment value.
 * Step 3 — Execute:  updatePinnedComment() merges the value into resource_json via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes the campaigns list.
 */
export async function updatePinnedCommentAction(
  campaignId: string,
  pinnedComment: string
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  if (!campaignId || typeof campaignId !== 'string' || campaignId.trim().length === 0) {
    return { error: 'Campaign ID requerido' }
  }

  // Step 2: Validate
  const parsed = z.string().safeParse(pinnedComment)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Comentario fijado invalido' }
  }

  // Step 3: Execute
  const result = await updatePinnedComment(campaignId, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('conversion.pinned_comment_updated', {
    user_id: user.id,
    campaign_id: campaignId,
  })

  revalidatePath('/campaigns')

  return { success: true }
}
