import { createClient } from '@/lib/supabase/server'
import {
  topicSchema,
  createTopicSchema,
  type Topic,
  type CreateTopicInput,
  TOPIC_STATUSES,
} from '@/shared/types/content-ops'
import { z } from 'zod'

// Re-export ServiceResult so consumers can import from one place
export interface ServiceResult<T> {
  data?: T
  error?: string
}

// ============================================
// Filter types
// ============================================

export interface TopicFilters {
  search?: string
  status?: string
  priority?: string
}

// ============================================
// Queries
// ============================================

/**
 * Get list of topics for a workspace.
 * Supports optional filtering by search text, status, and priority.
 * Ordered by priority descending (high → medium → low) then created_at descending.
 *
 * NOTE: Supabase does not support custom sort orders for enum columns natively,
 * so we sort by a CASE expression using a raw order string.
 * Fallback: order by created_at desc if priority sorting is not available.
 */
export async function getTopicList(
  workspaceId: string,
  filters?: TopicFilters
): Promise<ServiceResult<Topic[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('topics')
      .select('*')
      .eq('workspace_id', workspaceId)
      // Primary sort: priority (high > medium > low) via ascending=false on a text column
      // is not predictable, so we apply a secondary stable sort on created_at.
      // UI layer may re-sort in memory if needed.
      .order('created_at', { ascending: false })

    if (filters?.search && filters.search.trim().length > 0) {
      const term = filters.search.trim()
      query = query.or(
        `title.ilike.%${term}%,hypothesis.ilike.%${term}%,evidence.ilike.%${term}%,anti_myth.ilike.%${term}%`
      )
    }

    if (filters?.status && filters.status.trim().length > 0) {
      query = query.eq('status', filters.status)
    }

    if (filters?.priority && filters.priority.trim().length > 0) {
      query = query.eq('priority', filters.priority)
    }

    const { data, error } = await query

    if (error) {
      return { error: error.message }
    }

    const parsed = z.array(topicSchema).safeParse(data)

    if (!parsed.success) {
      console.error('[topic-service] getTopicList parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    // Sort in-process: high > medium > low, then by created_at desc within each group
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    const sorted = [...parsed.data].sort((a, b) => {
      const priorityDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
      if (priorityDiff !== 0) return priorityDiff
      return b.created_at.localeCompare(a.created_at)
    })

    return { data: sorted }
  } catch (err) {
    console.error('[topic-service] getTopicList unexpected error', err)
    return { error: 'Error inesperado al obtener topics' }
  }
}

/**
 * Get a single topic by id.
 */
export async function getTopicById(
  id: string
): Promise<ServiceResult<Topic>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = topicSchema.safeParse(data)

    if (!parsed.success) {
      console.error('[topic-service] getTopicById parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[topic-service] getTopicById unexpected error', err)
    return { error: 'Error inesperado al obtener el topic' }
  }
}

/**
 * Insert a new topic row.
 * Status defaults to 'backlog' on creation.
 */
export async function createTopic(
  workspaceId: string,
  userId: string,
  data: CreateTopicInput
): Promise<ServiceResult<Topic>> {
  try {
    const validated = createTopicSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de entrada invalidos' }
    }

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('topics')
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        title: validated.data.title,
        hypothesis: validated.data.hypothesis ?? null,
        evidence: validated.data.evidence ?? null,
        anti_myth: validated.data.anti_myth ?? null,
        signals_json: validated.data.signals_json,
        fit_score: validated.data.fit_score ?? null,
        priority: validated.data.priority,
        status: 'backlog' as const,
        silent_enemy_name: validated.data.silent_enemy_name ?? null,
        minimal_proof: validated.data.minimal_proof ?? null,
        failure_modes: validated.data.failure_modes,
        expected_business_impact: validated.data.expected_business_impact ?? null,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = topicSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[topic-service] createTopic parse error', parsed.error.flatten())
      return { error: 'Error al parsear la fila insertada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[topic-service] createTopic unexpected error', err)
    return { error: 'Error inesperado al crear el topic' }
  }
}

// ============================================
// Update payload type
// ============================================

type UpdateTopicData = Partial<CreateTopicInput> & { status?: string }

/**
 * Partial update of an existing topic.
 * Accepts any subset of CreateTopicInput fields plus an optional status change.
 * Status is validated against the TOPIC_STATUSES enum before writing.
 */
export async function updateTopic(
  id: string,
  data: UpdateTopicData
): Promise<ServiceResult<Topic>> {
  try {
    // Build a partial update schema that also accepts status
    const partialCreateSchema = createTopicSchema.partial()
    const updateSchema = partialCreateSchema.extend({
      status: z.enum(TOPIC_STATUSES).optional(),
    })

    const validated = updateSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de actualizacion invalidos' }
    }

    const payload: Record<string, unknown> = {}

    if (validated.data.title !== undefined) payload.title = validated.data.title
    if (validated.data.hypothesis !== undefined) payload.hypothesis = validated.data.hypothesis
    if (validated.data.evidence !== undefined) payload.evidence = validated.data.evidence
    if (validated.data.anti_myth !== undefined) payload.anti_myth = validated.data.anti_myth
    if (validated.data.signals_json !== undefined) payload.signals_json = validated.data.signals_json
    if (validated.data.fit_score !== undefined) payload.fit_score = validated.data.fit_score
    if (validated.data.priority !== undefined) payload.priority = validated.data.priority
    if (validated.data.status !== undefined) payload.status = validated.data.status
    if (validated.data.silent_enemy_name !== undefined) payload.silent_enemy_name = validated.data.silent_enemy_name
    if (validated.data.minimal_proof !== undefined) payload.minimal_proof = validated.data.minimal_proof
    if (validated.data.failure_modes !== undefined) payload.failure_modes = validated.data.failure_modes
    if (validated.data.expected_business_impact !== undefined) payload.expected_business_impact = validated.data.expected_business_impact

    if (Object.keys(payload).length === 0) {
      return { error: 'No se proporcionaron campos para actualizar' }
    }

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('topics')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = topicSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[topic-service] updateTopic parse error', parsed.error.flatten())
      return { error: 'Error al parsear la fila actualizada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[topic-service] updateTopic unexpected error', err)
    return { error: 'Error inesperado al actualizar el topic' }
  }
}

/**
 * Delete a topic by id.
 */
export async function deleteTopic(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    return { data: null }
  } catch (err) {
    console.error('[topic-service] deleteTopic unexpected error', err)
    return { error: 'Error inesperado al eliminar el topic' }
  }
}
