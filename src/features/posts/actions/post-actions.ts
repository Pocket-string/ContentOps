'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  savePostVersionSchema,
  scorePostSchema,
  POST_STATUSES,
  structuredContentSchema,
} from '@/shared/types/content-ops'
import { requireAuth } from '@/lib/auth'
import { track } from '@/lib/tracking'
import {
  createPostVersion,
  setCurrentVersion,
  scorePostVersion,
  updatePostStatus,
  updatePostObjective,
} from '../services/post-service'

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
// Server Actions
// ============================================

/**
 * Create a new post version.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: savePostVersionSchema.safeParse() validates all fields.
 * Step 3 — Execute:  createPostVersion() inserts the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function savePostVersionAction(formData: FormData): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  // Parse structured_content from FormData (JSON string)
  const rawStructuredContent = formData.get('structured_content')
  let structuredContent: unknown = undefined
  if (typeof rawStructuredContent === 'string' && rawStructuredContent.trim().length > 0) {
    try {
      const parsed = JSON.parse(rawStructuredContent)
      const validated = structuredContentSchema.safeParse(parsed)
      if (validated.success) {
        structuredContent = validated.data
      }
    } catch {
      // Ignore invalid JSON — field is optional
    }
  }

  const raw = {
    post_id: formData.get('post_id'),
    variant: formData.get('variant'),
    content: formData.get('content'),
    notes: formData.get('notes') ?? undefined,
    structured_content: structuredContent,
  }

  const parsed = savePostVersionSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute
  const result = await createPostVersion(user.id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('post_version.created', {
    user_id: user.id,
    post_version_id: result.data?.id,
    post_id: parsed.data.post_id,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Set a post version as the current active version.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: postVersionId must be a non-empty string.
 * Step 3 — Execute:  setCurrentVersion() updates is_current flag via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function setCurrentVersionAction(postVersionId: string): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  if (!postVersionId || typeof postVersionId !== 'string' || postVersionId.trim().length === 0) {
    return { error: 'ID de version invalido' }
  }

  // Step 3: Execute
  const result = await setCurrentVersion(postVersionId)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('post_version.set_current', {
    user_id: user.id,
    post_version_id: postVersionId,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Score a post version using the D/G/P/I scoring framework.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: scorePostSchema validates postVersionId + full score object.
 * Step 3 — Execute:  scorePostVersion() persists score_json via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function scorePostVersionAction(
  postVersionId: string,
  score: unknown
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  const parsed = scorePostSchema.safeParse({ post_version_id: postVersionId, score })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos de puntuacion invalidos' }
  }

  // Step 3: Execute
  const result = await scorePostVersion(parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('post_version.scored', {
    user_id: user.id,
    post_version_id: parsed.data.post_version_id,
    score_total: parsed.data.score.total,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Update the status of a post.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: postId is non-empty; status is validated against POST_STATUSES enum.
 * Step 3 — Execute:  updatePostStatus() patches the status column via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function updatePostStatusAction(
  postId: string,
  status: string
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  if (!postId || typeof postId !== 'string' || postId.trim().length === 0) {
    return { error: 'ID de post requerido' }
  }

  const statusSchema = z.enum(POST_STATUSES)
  const parsedStatus = statusSchema.safeParse(status)

  if (!parsedStatus.success) {
    return {
      error: `Estado invalido. Valores permitidos: ${POST_STATUSES.join(', ')}`,
    }
  }

  // Step 3: Execute
  const result = await updatePostStatus(postId, parsedStatus.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('post.status_changed', {
    user_id: user.id,
    post_id: postId,
    new_status: parsedStatus.data,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Update the objective of a post.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: postId is non-empty; objective is a string.
 * Step 3 — Execute:  updatePostObjective() patches the objective column via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function updatePostObjectiveAction(
  postId: string,
  objective: string
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  if (!postId || typeof postId !== 'string' || postId.trim().length === 0) {
    return { error: 'ID de post requerido' }
  }

  const objectiveSchema = z.string()
  const parsedObjective = objectiveSchema.safeParse(objective)

  if (!parsedObjective.success) {
    return { error: 'Objetivo invalido' }
  }

  // Step 3: Execute
  const result = await updatePostObjective(postId, parsedObjective.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('post.objective_updated', {
    user_id: user.id,
    post_id: postId,
  })

  revalidatePath('/campaigns')

  return { success: true }
}
