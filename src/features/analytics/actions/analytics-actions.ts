'use server'

import { revalidatePath } from 'next/cache'
import { saveMetricsSchema, saveLearningSchema } from '@/shared/types/content-ops'
import { requireAuth } from '@/lib/auth'
import { track } from '@/lib/tracking'
import {
  saveMetrics,
  createLearning,
  deleteLearning,
} from '../services/analytics-service'

// ============================================
// Result types
// ============================================

type ActionResult = { success: true } | { error: string }

// ============================================
// Server Actions
// ============================================

/**
 * Save (insert or update) metrics for a post.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: Parse numeric fields from FormData; validate with saveMetricsSchema.
 * Step 3 — Execute:  saveMetrics() upserts the metrics row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function saveMetricsAction(formData: FormData): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  const raw = {
    post_id: formData.get('post_id'),
    impressions: parseInt(String(formData.get('impressions') ?? '0'), 10),
    comments: parseInt(String(formData.get('comments') ?? '0'), 10),
    saves: parseInt(String(formData.get('saves') ?? '0'), 10),
    shares: parseInt(String(formData.get('shares') ?? '0'), 10),
    leads: parseInt(String(formData.get('leads') ?? '0'), 10),
    notes: formData.get('notes') ?? undefined,
  }

  const parsed = saveMetricsSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos de metricas invalidos' }
  }

  // Step 3: Execute
  const result = await saveMetrics(user.id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('metrics.saved', {
    user_id: user.id,
    post_id: parsed.data.post_id,
    metrics_id: result.data?.id,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Create a new learning entry for a campaign.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: Parse bullets_json from JSON string; validate with saveLearningSchema.
 * Step 3 — Execute:  createLearning() inserts the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function createLearningAction(formData: FormData): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  let bullets: unknown = []

  const bulletsJson = formData.get('bullets_json')

  if (bulletsJson && typeof bulletsJson === 'string') {
    try {
      bullets = JSON.parse(bulletsJson)
    } catch {
      return { error: 'Formato de bullets invalido — se esperaba JSON valido' }
    }
  }

  const raw = {
    campaign_id: formData.get('campaign_id'),
    summary: formData.get('summary'),
    bullets_json: bullets,
  }

  const parsed = saveLearningSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos del aprendizaje invalidos' }
  }

  // Step 3: Execute
  const result = await createLearning(user.id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('learning.created', {
    user_id: user.id,
    campaign_id: parsed.data.campaign_id,
    learning_id: result.data?.id,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Delete a learning by its ID.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: learningId must be a non-empty string.
 * Step 3 — Execute:  deleteLearning() removes the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function deleteLearningAction(learningId: string): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  if (!learningId || typeof learningId !== 'string' || learningId.trim().length === 0) {
    return { error: 'ID de aprendizaje invalido' }
  }

  // Step 3: Execute
  const result = await deleteLearning(learningId)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('learning.deleted', {
    user_id: user.id,
    learning_id: learningId,
  })

  revalidatePath('/campaigns')

  return { success: true }
}
