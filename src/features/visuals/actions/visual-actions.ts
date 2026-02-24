'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { VISUAL_STATUSES } from '@/shared/types/content-ops'
import { requireAuth } from '@/lib/auth'
import { track } from '@/lib/tracking'
import {
  createVisualVersion,
  updateVisualPrompt,
  updateVisualStatus,
  updateVisualQA,
  updateVisualImageUrl,
  updateNanoBananaFields,
} from '../services/visual-service'

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
 * Create a new visual version for a post.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: Extract and validate post_id, format, prompt_json from FormData.
 * Step 3 — Execute:  createVisualVersion() inserts the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function createVisualVersionAction(formData: FormData): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  const createVisualSchema = z.object({
    post_id: z.string().min(1, 'post_id requerido'),
    format: z.string().min(1, 'formato requerido'),
    prompt_json: z.record(z.unknown()),
  })

  const promptJsonRaw = formData.get('prompt_json')

  let promptJsonParsed: unknown
  try {
    promptJsonParsed = JSON.parse(typeof promptJsonRaw === 'string' ? promptJsonRaw : '')
  } catch {
    return { error: 'JSON invalido' }
  }

  const raw = {
    post_id: formData.get('post_id'),
    format: formData.get('format'),
    prompt_json: promptJsonParsed,
  }

  const parsed = createVisualSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute
  const result = await createVisualVersion(user.id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('visual_version.created', {
    user_id: user.id,
    visual_version_id: result.data?.id,
    post_id: parsed.data.post_id,
    format: parsed.data.format,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Update the prompt JSON of an existing visual version.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: visualId is non-empty; promptJson is valid JSON.
 * Step 3 — Execute:  updateVisualPrompt() patches prompt_json via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function updateVisualPromptAction(
  visualId: string,
  promptJson: string
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  if (!visualId || typeof visualId !== 'string' || visualId.trim().length === 0) {
    return { error: 'ID de visual requerido' }
  }

  let promptParsed: unknown
  try {
    promptParsed = JSON.parse(promptJson)
  } catch {
    return { error: 'JSON invalido' }
  }

  const promptSchema = z.record(z.unknown())
  const parsedPrompt = promptSchema.safeParse(promptParsed)

  if (!parsedPrompt.success) {
    return { error: 'Estructura de prompt invalida' }
  }

  // Step 3: Execute
  const result = await updateVisualPrompt(visualId, parsedPrompt.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('visual_version.prompt_updated', {
    user_id: user.id,
    visual_version_id: visualId,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Update the status of a visual version.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: visualId is non-empty; status is validated against VISUAL_STATUSES enum.
 * Step 3 — Execute:  updateVisualStatus() patches the status column via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function updateVisualStatusAction(
  visualId: string,
  status: string
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  if (!visualId || typeof visualId !== 'string' || visualId.trim().length === 0) {
    return { error: 'ID de visual requerido' }
  }

  const statusSchema = z.enum(VISUAL_STATUSES)
  const parsedStatus = statusSchema.safeParse(status)

  if (!parsedStatus.success) {
    return {
      error: `Estado invalido. Valores permitidos: ${VISUAL_STATUSES.join(', ')}`,
    }
  }

  // Step 3: Execute
  const result = await updateVisualStatus(visualId, parsedStatus.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('visual_version.status_changed', {
    user_id: user.id,
    visual_version_id: visualId,
    new_status: parsedStatus.data,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Update the QA checklist of a visual version.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: visualId is non-empty; qaJson is valid JSON.
 * Step 3 — Execute:  updateVisualQA() patches qa_json via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function updateVisualQAAction(
  visualId: string,
  qaJson: string
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  if (!visualId || typeof visualId !== 'string' || visualId.trim().length === 0) {
    return { error: 'ID de visual requerido' }
  }

  let qaParsed: unknown
  try {
    qaParsed = JSON.parse(qaJson)
  } catch {
    return { error: 'JSON invalido' }
  }

  const qaSchema = z.record(z.unknown())
  const parsedQA = qaSchema.safeParse(qaParsed)

  if (!parsedQA.success) {
    return { error: 'Estructura de QA invalida' }
  }

  // Step 3: Execute
  const result = await updateVisualQA(visualId, parsedQA.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('visual_version.qa_updated', {
    user_id: user.id,
    visual_version_id: visualId,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Set the image URL of a visual version after upload.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: visualId is non-empty; imageUrl is a valid URL.
 * Step 3 — Execute:  updateVisualImageUrl() patches image_url via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function uploadVisualImageAction(
  visualId: string,
  imageUrl: string
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  if (!visualId || typeof visualId !== 'string' || visualId.trim().length === 0) {
    return { error: 'ID de visual requerido' }
  }

  const urlSchema = z.string().url('URL de imagen invalida')
  const parsedUrl = urlSchema.safeParse(imageUrl)

  if (!parsedUrl.success) {
    return { error: parsedUrl.error.errors[0]?.message ?? 'URL de imagen invalida' }
  }

  // Step 3: Execute
  const result = await updateVisualImageUrl(visualId, parsedUrl.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('visual_version.image_uploaded', {
    user_id: user.id,
    visual_version_id: visualId,
    image_url: parsedUrl.data,
  })

  revalidatePath('/campaigns')

  return { success: true }
}

/**
 * Update Nano Banana Pro metadata on a visual version.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: visualId non-empty; fields parsed from JSON string via Zod.
 * Step 3 — Execute:  updateNanoBananaFields() patches the NB columns via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes campaigns.
 */
export async function updateNanoBananaAction(
  visualId: string,
  fields: string // JSON string of { nanobanana_run_id?, qa_notes?, iteration_reason? }
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  if (!visualId || typeof visualId !== 'string' || visualId.trim().length === 0) {
    return { error: 'ID requerido' }
  }

  let rawFields: unknown
  try {
    rawFields = JSON.parse(fields)
  } catch {
    return { error: 'JSON invalido' }
  }

  const nanoBananaSchema = z.object({
    nanobanana_run_id: z.string().optional(),
    qa_notes: z.string().optional(),
    iteration_reason: z.string().optional(),
  })

  const validated = nanoBananaSchema.safeParse(rawFields)
  if (!validated.success) {
    return { error: 'Datos invalidos' }
  }

  // Step 3: Execute
  const result = await updateNanoBananaFields(visualId, validated.data)
  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('visual_version.nanobanana_updated', {
    user_id: user.id,
    visual_version_id: visualId,
  })

  revalidatePath('/campaigns')

  return { success: true }
}
