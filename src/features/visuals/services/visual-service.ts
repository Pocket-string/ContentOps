import { createClient } from '@/lib/supabase/server'
import {
  visualVersionSchema,
  type VisualVersion,
} from '@/shared/types/content-ops'
import { z } from 'zod'

// ============================================
// Types
// ============================================

export interface ServiceResult<T> {
  data?: T
  error?: string
}

const createVisualInputSchema = z.object({
  post_id: z.string().uuid(),
  format: z.string().min(1),
  prompt_json: z.record(z.unknown()),
})

export type CreateVisualInput = z.infer<typeof createVisualInputSchema>

// ============================================
// Queries
// ============================================

/**
 * Get all visual_versions for a given post, ordered by version descending.
 */
export async function getVisualsByPostId(
  postId: string
): Promise<ServiceResult<VisualVersion[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('visual_versions')
      .select('*')
      .eq('post_id', postId)
      .order('version', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    const parsed = z.array(visualVersionSchema).safeParse(data)

    if (!parsed.success) {
      console.error('[visual-service] getVisualsByPostId parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[visual-service] getVisualsByPostId unexpected error', err)
    return { error: 'Error inesperado al obtener los visuales del post' }
  }
}

// ============================================
// Mutations
// ============================================

/**
 * Create a new visual_version for a given post.
 *
 * Two-step process:
 *   1. Query the max version number for this post_id.
 *   2. Insert the new version with version = max + 1.
 *
 * Defaults: status = 'draft', qa_json = null, image_url = null.
 */
export async function createVisualVersion(
  userId: string,
  data: CreateVisualInput
): Promise<ServiceResult<VisualVersion>> {
  try {
    const validated = createVisualInputSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de entrada invalidos' }
    }

    const supabase = await createClient()

    // Step 1: Get max version for this post
    const { data: maxRow, error: maxError } = await supabase
      .from('visual_versions')
      .select('version')
      .eq('post_id', validated.data.post_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxError) {
      return { error: maxError.message }
    }

    const nextVersion = (maxRow?.version ?? 0) + 1

    // Step 2: Insert new version
    const { data: newRow, error: insertError } = await supabase
      .from('visual_versions')
      .insert({
        post_id: validated.data.post_id,
        version: nextVersion,
        format: validated.data.format,
        prompt_json: validated.data.prompt_json,
        qa_json: null,
        image_url: null,
        status: 'draft',
        created_by: userId,
      })
      .select()
      .single()

    if (insertError || !newRow) {
      return { error: insertError?.message ?? 'Error al crear el visual' }
    }

    const parsed = visualVersionSchema.safeParse(newRow)

    if (!parsed.success) {
      console.error('[visual-service] createVisualVersion parse error', parsed.error.flatten())
      return { error: 'Error al parsear el visual creado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[visual-service] createVisualVersion unexpected error', err)
    return { error: 'Error inesperado al crear el visual' }
  }
}

/**
 * Update prompt_json on a visual_version.
 * Resets status to 'draft' when the prompt changes.
 */
export async function updateVisualPrompt(
  visualId: string,
  promptJson: Record<string, unknown>
): Promise<ServiceResult<VisualVersion>> {
  try {
    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('visual_versions')
      .update({ prompt_json: promptJson, status: 'draft' })
      .eq('id', visualId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = visualVersionSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[visual-service] updateVisualPrompt parse error', parsed.error.flatten())
      return { error: 'Error al parsear el prompt actualizado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[visual-service] updateVisualPrompt unexpected error', err)
    return { error: 'Error inesperado al actualizar el prompt del visual' }
  }
}

/**
 * Update the status field on a visual_version.
 */
export async function updateVisualStatus(
  visualId: string,
  status: string
): Promise<ServiceResult<VisualVersion>> {
  try {
    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('visual_versions')
      .update({ status })
      .eq('id', visualId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = visualVersionSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[visual-service] updateVisualStatus parse error', parsed.error.flatten())
      return { error: 'Error al parsear el estado actualizado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[visual-service] updateVisualStatus unexpected error', err)
    return { error: 'Error inesperado al actualizar el estado del visual' }
  }
}

/**
 * Update qa_json on a visual_version.
 * Auto-sets status to 'approved' if all QA items pass, otherwise 'pending_qa'.
 *
 * Convention: a QA item "passes" when its value is truthy (e.g. `{ contrast: true, ... }`).
 * Any falsy value (false, null, 0, '') is treated as a failing item.
 */
export async function updateVisualQA(
  visualId: string,
  qaJson: Record<string, unknown>
): Promise<ServiceResult<VisualVersion>> {
  try {
    const allPass = Object.values(qaJson).every(Boolean)
    const newStatus = allPass ? 'approved' : 'pending_qa'

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('visual_versions')
      .update({ qa_json: qaJson, status: newStatus })
      .eq('id', visualId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = visualVersionSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[visual-service] updateVisualQA parse error', parsed.error.flatten())
      return { error: 'Error al parsear el QA actualizado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[visual-service] updateVisualQA unexpected error', err)
    return { error: 'Error inesperado al actualizar el QA del visual' }
  }
}

/**
 * Update Nano Banana Pro metadata fields on a visual_version.
 * Only updates the fields that are explicitly provided (partial update pattern).
 */
export async function updateNanoBananaFields(
  visualId: string,
  fields: {
    nanobanana_run_id?: string
    qa_notes?: string
    iteration_reason?: string
    output_asset_id?: string
  }
): Promise<ServiceResult<VisualVersion>> {
  try {
    const supabase = await createClient()

    const updatePayload: Record<string, unknown> = {}
    if (fields.nanobanana_run_id !== undefined) updatePayload.nanobanana_run_id = fields.nanobanana_run_id
    if (fields.qa_notes !== undefined) updatePayload.qa_notes = fields.qa_notes
    if (fields.iteration_reason !== undefined) updatePayload.iteration_reason = fields.iteration_reason
    if (fields.output_asset_id !== undefined) updatePayload.output_asset_id = fields.output_asset_id

    const { data: row, error } = await supabase
      .from('visual_versions')
      .update(updatePayload)
      .eq('id', visualId)
      .select()
      .single()

    if (error) return { error: error.message }

    const parsed = visualVersionSchema.safeParse(row)
    if (!parsed.success) {
      console.error('[visual-service] updateNanoBananaFields parse error', parsed.error.flatten())
      return { error: 'Error al parsear visual actualizado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[visual-service] updateNanoBananaFields error', err)
    return { error: 'Error inesperado' }
  }
}

/**
 * Update image_url on a visual_version.
 * Sets status to 'pending_qa' when an image is uploaded.
 */
export async function updateVisualImageUrl(
  visualId: string,
  imageUrl: string
): Promise<ServiceResult<VisualVersion>> {
  try {
    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('visual_versions')
      .update({ image_url: imageUrl, status: 'pending_qa' })
      .eq('id', visualId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = visualVersionSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[visual-service] updateVisualImageUrl parse error', parsed.error.flatten())
      return { error: 'Error al parsear la imagen actualizada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[visual-service] updateVisualImageUrl unexpected error', err)
    return { error: 'Error inesperado al actualizar la imagen del visual' }
  }
}
