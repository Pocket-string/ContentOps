import { createClient } from '@/lib/supabase/server'
import {
  visualConceptSchema,
  type VisualConcept,
} from '@/shared/types/content-ops'
import { z } from 'zod'

export interface ServiceResult<T> {
  data?: T
  error?: string
}

/**
 * Get visual concepts for a post.
 */
export async function getVisualConcepts(
  postId: string
): Promise<ServiceResult<VisualConcept[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('visual_concepts')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    const parsed = z.array(visualConceptSchema).safeParse(data)

    if (!parsed.success) {
      console.error('[visual-concept-service] parse error', parsed.error.flatten())
      return { error: 'Error al parsear conceptos visuales' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[visual-concept-service] unexpected error', err)
    return { error: 'Error inesperado al obtener conceptos visuales' }
  }
}

/**
 * Create visual concepts (bulk insert from AI output).
 */
export async function createVisualConcepts(
  postId: string,
  userId: string,
  concepts: Array<{
    concept_type: string
    rationale: string
    layout?: string
    text_budget?: string
    data_evidence?: string
    risk_notes?: string
  }>
): Promise<ServiceResult<VisualConcept[]>> {
  try {
    const supabase = await createClient()

    const payload = concepts.map((c) => ({
      post_id: postId,
      concept_type: c.concept_type,
      rationale: c.rationale,
      layout: c.layout ?? null,
      text_budget: c.text_budget ?? null,
      data_evidence: c.data_evidence ?? null,
      risk_notes: c.risk_notes ?? null,
      selected: false,
      created_by: userId,
    }))

    const { data, error } = await supabase
      .from('visual_concepts')
      .insert(payload)
      .select()

    if (error) {
      return { error: error.message }
    }

    const parsed = z.array(visualConceptSchema).safeParse(data)

    if (!parsed.success) {
      console.error('[visual-concept-service] create parse error', parsed.error.flatten())
      return { error: 'Error al parsear conceptos creados' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[visual-concept-service] create unexpected error', err)
    return { error: 'Error inesperado al crear conceptos visuales' }
  }
}

/**
 * Select a visual concept (set selected=true, unselect others for same post).
 */
export async function selectVisualConcept(
  conceptId: string,
  postId: string
): Promise<ServiceResult<VisualConcept>> {
  try {
    const supabase = await createClient()

    // Unselect all for this post
    await supabase
      .from('visual_concepts')
      .update({ selected: false })
      .eq('post_id', postId)

    // Select the chosen one
    const { data: row, error } = await supabase
      .from('visual_concepts')
      .update({ selected: true })
      .eq('id', conceptId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = visualConceptSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[visual-concept-service] select parse error', parsed.error.flatten())
      return { error: 'Error al parsear concepto seleccionado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[visual-concept-service] select unexpected error', err)
    return { error: 'Error inesperado al seleccionar concepto' }
  }
}
