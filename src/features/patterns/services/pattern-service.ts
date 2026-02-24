import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import {
  patternSchema,
  createPatternSchema,
  type Pattern,
  type CreatePatternInput,
} from '@/shared/types/content-ops'

export interface ServiceResult<T> {
  data?: T
  error?: string
}

/**
 * Get all patterns for a workspace, optionally filtered by pattern_type.
 */
export async function getPatterns(
  workspaceId: string,
  patternType?: string
): Promise<ServiceResult<Pattern[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('pattern_library')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (patternType) {
      query = query.eq('pattern_type', patternType)
    }

    const { data, error } = await query

    if (error) return { error: error.message }

    const parsed = z.array(patternSchema).safeParse(data)
    if (!parsed.success) {
      console.error('[pattern-service] parse error', parsed.error.flatten())
      return { error: 'Error al parsear patrones' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[pattern-service] getPatterns unexpected error', err)
    return { error: 'Error inesperado' }
  }
}

/**
 * Get top performing patterns for AI retrieval.
 * Ordered by dgpi_score first, then engagement_rate.
 * Used by generate-copy to inject successful patterns into the AI prompt.
 */
export async function getTopPatterns(
  workspaceId: string,
  patternType: string,
  funnelStage?: string,
  limit = 5
): Promise<ServiceResult<Pattern[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pattern_library')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('pattern_type', patternType)
      .order('created_at', { ascending: false })
      .limit(limit * 3) // over-fetch to allow client-side filtering & sorting

    if (error) return { error: error.message }

    const parsed = z.array(patternSchema).safeParse(data)
    if (!parsed.success) {
      console.error('[pattern-service] parse error', parsed.error.flatten())
      return { error: 'Error al parsear patrones' }
    }

    let patterns = parsed.data

    // Filter by funnel_stage if provided
    if (funnelStage) {
      const withStage = patterns.filter(
        (p) => p.context.funnel_stage === funnelStage
      )
      // Fall back to all patterns if none match the funnel stage
      if (withStage.length > 0) {
        patterns = withStage
      }
    }

    // Sort by performance: dgpi_score > engagement_rate > recency
    patterns.sort((a, b) => {
      const aScore = a.performance.dgpi_score ?? -1
      const bScore = b.performance.dgpi_score ?? -1
      if (bScore !== aScore) return bScore - aScore

      const aEng = a.performance.engagement_rate ?? -1
      const bEng = b.performance.engagement_rate ?? -1
      return bEng - aEng
    })

    return { data: patterns.slice(0, limit) }
  } catch (err) {
    console.error('[pattern-service] getTopPatterns unexpected error', err)
    return { error: 'Error inesperado' }
  }
}

/**
 * Create a new pattern in the library.
 */
export async function createPattern(
  workspaceId: string,
  userId: string,
  input: CreatePatternInput
): Promise<ServiceResult<Pattern>> {
  try {
    // Validate input (defence-in-depth — actions also validate)
    const parsed = createPatternSchema.safeParse(input)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pattern_library')
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        pattern_type: parsed.data.pattern_type,
        content: parsed.data.content,
        context: parsed.data.context ?? {},
        performance: parsed.data.performance ?? {},
        source_post_version_id: parsed.data.source_post_version_id ?? null,
        source_campaign_id: parsed.data.source_campaign_id ?? null,
        tags: parsed.data.tags,
      })
      .select()
      .single()

    if (error) return { error: error.message }

    const parsedResult = patternSchema.safeParse(data)
    if (!parsedResult.success) {
      console.error('[pattern-service] parse error on create', parsedResult.error.flatten())
      return { error: 'Error al parsear patron creado' }
    }

    return { data: parsedResult.data }
  } catch (err) {
    console.error('[pattern-service] createPattern unexpected error', err)
    return { error: 'Error inesperado' }
  }
}

/**
 * Delete a pattern by ID.
 */
export async function deletePattern(
  patternId: string
): Promise<ServiceResult<void>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('pattern_library')
      .delete()
      .eq('id', patternId)

    if (error) return { error: error.message }
    return { data: undefined }
  } catch (err) {
    console.error('[pattern-service] deletePattern unexpected error', err)
    return { error: 'Error inesperado' }
  }
}
