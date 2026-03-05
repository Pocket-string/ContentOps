import { createClient } from '@/lib/supabase/server'
import {
  contentPillarSchema,
  createPillarSchema,
  type ContentPillar,
  type CreatePillarInput,
} from '@/shared/types/content-ops'
import { z } from 'zod'

// ============================================
// Result type
// ============================================

export interface ServiceResult<T> {
  data?: T
  error?: string
}

// ============================================
// Queries
// ============================================

/**
 * Get all active content pillars for a workspace.
 * Ordered by sort_order ascending so UI renders them in the intended sequence.
 */
export async function getPillarList(
  workspaceId: string
): Promise<ServiceResult<ContentPillar[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('content_pillars')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true })

    if (error) {
      return { error: error.message }
    }

    const parsed = z.array(contentPillarSchema).safeParse(data)

    if (!parsed.success) {
      console.error('[pillar-service] getPillarList parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[pillar-service] getPillarList unexpected error', err)
    return { error: 'Error inesperado al obtener los pilares' }
  }
}

/**
 * Get a single content pillar by id.
 */
export async function getPillarById(
  id: string
): Promise<ServiceResult<ContentPillar>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('content_pillars')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = contentPillarSchema.safeParse(data)

    if (!parsed.success) {
      console.error('[pillar-service] getPillarById parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[pillar-service] getPillarById unexpected error', err)
    return { error: 'Error inesperado al obtener el pilar' }
  }
}

// ============================================
// Mutations
// ============================================

/**
 * Insert a new content pillar row.
 * Validates the input with createPillarSchema before writing.
 */
export async function createPillar(
  workspaceId: string,
  userId: string,
  data: CreatePillarInput
): Promise<ServiceResult<ContentPillar>> {
  try {
    const validated = createPillarSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de entrada invalidos' }
    }

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('content_pillars')
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        name: validated.data.name,
        description: validated.data.description ?? null,
        color: validated.data.color,
        sort_order: validated.data.sort_order,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = contentPillarSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[pillar-service] createPillar parse error', parsed.error.flatten())
      return { error: 'Error al parsear la fila insertada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[pillar-service] createPillar unexpected error', err)
    return { error: 'Error inesperado al crear el pilar' }
  }
}

/**
 * Partial update of an existing content pillar.
 * Accepts any subset of CreatePillarInput fields.
 * Guards against empty payloads before writing to DB.
 */
export async function updatePillar(
  id: string,
  data: Partial<CreatePillarInput>
): Promise<ServiceResult<ContentPillar>> {
  try {
    const partialSchema = createPillarSchema.partial()
    const validated = partialSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de actualizacion invalidos' }
    }

    const payload: Record<string, unknown> = {}

    if (validated.data.name !== undefined) payload.name = validated.data.name
    if (validated.data.description !== undefined) payload.description = validated.data.description
    if (validated.data.color !== undefined) payload.color = validated.data.color
    if (validated.data.sort_order !== undefined) payload.sort_order = validated.data.sort_order

    if (Object.keys(payload).length === 0) {
      return { error: 'No se proporcionaron campos para actualizar' }
    }

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('content_pillars')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = contentPillarSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[pillar-service] updatePillar parse error', parsed.error.flatten())
      return { error: 'Error al parsear la fila actualizada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[pillar-service] updatePillar unexpected error', err)
    return { error: 'Error inesperado al actualizar el pilar' }
  }
}

/**
 * Delete a content pillar by id.
 */
export async function deletePillar(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('content_pillars')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    return { data: null }
  } catch (err) {
    console.error('[pillar-service] deletePillar unexpected error', err)
    return { error: 'Error inesperado al eliminar el pilar' }
  }
}
