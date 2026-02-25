import { createClient } from '@/lib/supabase/server'
import {
  criticReviewSchema,
  type CriticReview,
} from '@/shared/types/content-ops'
import { z } from 'zod'

export interface ServiceResult<T> {
  data?: T
  error?: string
}

/**
 * Get critic reviews for a post version or visual version.
 */
export async function getCriticReviews(
  versionId: string,
  criticType?: string
): Promise<ServiceResult<CriticReview[]>> {
  try {
    const supabase = await createClient()

    const column = criticType === 'visual' ? 'visual_version_id' : 'post_version_id'
    let query = supabase
      .from('critic_reviews')
      .select('*')
      .eq(column, versionId)
      .order('created_at', { ascending: false })

    if (criticType) {
      query = query.eq('critic_type', criticType)
    }

    const { data, error } = await query

    if (error) {
      return { error: error.message }
    }

    const parsed = z.array(criticReviewSchema).safeParse(data)

    if (!parsed.success) {
      console.error('[critic-service] getCriticReviews parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de critic reviews' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[critic-service] getCriticReviews unexpected error', err)
    return { error: 'Error inesperado al obtener critic reviews' }
  }
}

/**
 * Create a critic review from AI output.
 * For copy critics, pass postVersionId. For visual critics, pass visualVersionId.
 */
export async function createCriticReview(params: {
  postVersionId?: string
  visualVersionId?: string
  criticType: string
  scoreJson: unknown
  findings: unknown[]
  suggestions: string[]
  verdict: string
}): Promise<ServiceResult<CriticReview>> {
  try {
    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('critic_reviews')
      .insert({
        post_version_id: params.postVersionId ?? null,
        visual_version_id: params.visualVersionId ?? null,
        critic_type: params.criticType,
        score_json: params.scoreJson,
        findings: params.findings,
        suggestions: params.suggestions,
        verdict: params.verdict,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = criticReviewSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[critic-service] createCriticReview parse error', parsed.error.flatten())
      return { error: 'Error al parsear critic review creado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[critic-service] createCriticReview unexpected error', err)
    return { error: 'Error inesperado al crear critic review' }
  }
}
