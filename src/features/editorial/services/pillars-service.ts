import { createClient } from '@/lib/supabase/server'
import { editorialPillarSchema, type EditorialPillar } from '../types/pillar'
import { z } from 'zod'

export interface ServiceResult<T> {
  data?: T
  error?: string
}

/**
 * List all active editorial pillars. Cached at the DB level; safe to call frequently.
 */
export async function listEditorialPillars(): Promise<ServiceResult<EditorialPillar[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('editorial_pillars')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) return { error: error.message }
    const parsed = z.array(editorialPillarSchema).parse(data ?? [])
    return { data: parsed }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to list pillars' }
  }
}

export async function getEditorialPillarBySlug(
  slug: string
): Promise<ServiceResult<EditorialPillar | null>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('editorial_pillars')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error) return { error: error.message }
    if (!data) return { data: null }
    return { data: editorialPillarSchema.parse(data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch pillar' }
  }
}

export async function getEditorialPillarById(
  id: string
): Promise<ServiceResult<EditorialPillar | null>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('editorial_pillars')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) return { error: error.message }
    if (!data) return { data: null }
    return { data: editorialPillarSchema.parse(data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch pillar' }
  }
}
