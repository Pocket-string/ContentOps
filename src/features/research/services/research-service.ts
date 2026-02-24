import { createClient } from '@/lib/supabase/server'
import {
  researchReportSchema,
  createResearchSchema,
  type ResearchReport,
  type CreateResearchInput,
} from '@/shared/types/content-ops'
import { z } from 'zod'

// ============================================
// Types
// ============================================

export interface ResearchFilters {
  search?: string
  tags?: string[]
}

export interface ServiceResult<T> {
  data?: T
  error?: string
}

// ============================================
// Queries
// ============================================

/**
 * Get paginated list of research reports for a workspace.
 * Supports optional full-text search and tag filtering.
 * Ordered by created_at descending.
 */
export async function getResearchList(
  workspaceId: string,
  filters?: ResearchFilters
): Promise<ServiceResult<ResearchReport[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('research_reports')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (filters?.search && filters.search.trim().length > 0) {
      const term = filters.search.trim()
      query = query.or(
        `title.ilike.%${term}%,raw_text.ilike.%${term}%,source.ilike.%${term}%`
      )
    }

    if (filters?.tags && filters.tags.length > 0) {
      // tags_json is a JSONB array — use the @> operator to check containment
      query = query.contains('tags_json', filters.tags)
    }

    const { data, error } = await query

    if (error) {
      return { error: error.message }
    }

    const parsed = z.array(researchReportSchema).safeParse(data)

    if (!parsed.success) {
      console.error('[research-service] getResearchList parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[research-service] getResearchList unexpected error', err)
    return { error: 'Error inesperado al obtener investigaciones' }
  }
}

/**
 * Get a single research report by id.
 */
export async function getResearchById(
  id: string
): Promise<ServiceResult<ResearchReport>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('research_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = researchReportSchema.safeParse(data)

    if (!parsed.success) {
      console.error('[research-service] getResearchById parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[research-service] getResearchById unexpected error', err)
    return { error: 'Error inesperado al obtener la investigacion' }
  }
}

/**
 * Insert a new research report.
 */
export async function createResearch(
  workspaceId: string,
  userId: string,
  data: CreateResearchInput
): Promise<ServiceResult<ResearchReport>> {
  try {
    const validated = createResearchSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de entrada invalidos' }
    }

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('research_reports')
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        title: validated.data.title,
        source: validated.data.source ?? null,
        raw_text: validated.data.raw_text,
        tags_json: validated.data.tags_json,
        recency_date: validated.data.recency_date ?? null,
        market_region: validated.data.market_region ?? null,
        buyer_persona: validated.data.buyer_persona ?? null,
        trend_score: validated.data.trend_score ?? null,
        fit_score: validated.data.fit_score ?? null,
        evidence_links: validated.data.evidence_links,
        key_takeaways: validated.data.key_takeaways,
        recommended_angles: validated.data.recommended_angles,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = researchReportSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[research-service] createResearch parse error', parsed.error.flatten())
      return { error: 'Error al parsear la fila insertada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[research-service] createResearch unexpected error', err)
    return { error: 'Error inesperado al crear la investigacion' }
  }
}

/**
 * Update an existing research report by id.
 * Only the provided fields are updated (partial update).
 */
export async function updateResearch(
  id: string,
  data: Partial<CreateResearchInput>
): Promise<ServiceResult<ResearchReport>> {
  try {
    // Validate only the fields being updated using partial schema
    const partialSchema = createResearchSchema.partial()
    const validated = partialSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de actualizacion invalidos' }
    }

    const updatePayload: Record<string, unknown> = {}

    if (validated.data.title !== undefined) updatePayload.title = validated.data.title
    if (validated.data.source !== undefined) updatePayload.source = validated.data.source
    if (validated.data.raw_text !== undefined) updatePayload.raw_text = validated.data.raw_text
    if (validated.data.tags_json !== undefined) updatePayload.tags_json = validated.data.tags_json
    if (validated.data.recency_date !== undefined) updatePayload.recency_date = validated.data.recency_date
    if (validated.data.market_region !== undefined) updatePayload.market_region = validated.data.market_region
    if (validated.data.buyer_persona !== undefined) updatePayload.buyer_persona = validated.data.buyer_persona
    if (validated.data.trend_score !== undefined) updatePayload.trend_score = validated.data.trend_score
    if (validated.data.fit_score !== undefined) updatePayload.fit_score = validated.data.fit_score
    if (validated.data.evidence_links !== undefined) updatePayload.evidence_links = validated.data.evidence_links
    if (validated.data.key_takeaways !== undefined) updatePayload.key_takeaways = validated.data.key_takeaways
    if (validated.data.recommended_angles !== undefined) updatePayload.recommended_angles = validated.data.recommended_angles

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('research_reports')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = researchReportSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[research-service] updateResearch parse error', parsed.error.flatten())
      return { error: 'Error al parsear la fila actualizada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[research-service] updateResearch unexpected error', err)
    return { error: 'Error inesperado al actualizar la investigacion' }
  }
}

/**
 * Delete a research report by id.
 */
export async function deleteResearch(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('research_reports')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    return { data: null }
  } catch (err) {
    console.error('[research-service] deleteResearch unexpected error', err)
    return { error: 'Error inesperado al eliminar la investigacion' }
  }
}

/**
 * Get all unique tags used across research_reports in a workspace.
 * Useful for tag autocomplete.
 */
export async function getAllTags(
  workspaceId: string
): Promise<ServiceResult<string[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('research_reports')
      .select('tags_json')
      .eq('workspace_id', workspaceId)

    if (error) {
      return { error: error.message }
    }

    const rowSchema = z.object({ tags_json: z.array(z.string()) })
    const rows = z.array(rowSchema).safeParse(data)

    if (!rows.success) {
      console.error('[research-service] getAllTags parse error', rows.error.flatten())
      return { error: 'Error al parsear etiquetas' }
    }

    // Flatten all tag arrays and deduplicate
    const uniqueTags = Array.from(
      new Set(rows.data.flatMap((row) => row.tags_json))
    ).sort()

    return { data: uniqueTags }
  } catch (err) {
    console.error('[research-service] getAllTags unexpected error', err)
    return { error: 'Error inesperado al obtener etiquetas' }
  }
}
