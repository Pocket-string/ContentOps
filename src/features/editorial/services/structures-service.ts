import { createClient } from '@/lib/supabase/server'
import { editorialStructureSchema, type EditorialStructure } from '../types/structure'
import { z } from 'zod'

export interface ServiceResult<T> {
  data?: T
  error?: string
}

export async function listEditorialStructures(): Promise<ServiceResult<EditorialStructure[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('editorial_structures')
      .select('*')
      .eq('is_active', true)
      .order('weekday_default', { nullsFirst: false })

    if (error) return { error: error.message }
    const parsed = z.array(editorialStructureSchema).parse(data ?? [])
    return { data: parsed }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to list structures' }
  }
}

export async function getEditorialStructureBySlug(
  slug: string
): Promise<ServiceResult<EditorialStructure | null>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('editorial_structures')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) return { error: error.message }
    if (!data) return { data: null }
    return { data: editorialStructureSchema.parse(data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch structure' }
  }
}
