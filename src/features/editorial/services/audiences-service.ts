import { createClient } from '@/lib/supabase/server'
import { audienceProfileSchema, type AudienceProfile } from '../types/audience'
import { z } from 'zod'

export interface ServiceResult<T> {
  data?: T
  error?: string
}

export async function listAudienceProfiles(): Promise<ServiceResult<AudienceProfile[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('audience_profiles')
      .select('*')
      .eq('is_active', true)
      .order('role')

    if (error) return { error: error.message }
    const parsed = z.array(audienceProfileSchema).parse(data ?? [])
    return { data: parsed }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to list audiences' }
  }
}

export async function getAudienceProfileById(
  id: string
): Promise<ServiceResult<AudienceProfile | null>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('audience_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) return { error: error.message }
    if (!data) return { data: null }
    return { data: audienceProfileSchema.parse(data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch audience' }
  }
}

export async function getAudienceProfileBySlug(
  slug: string
): Promise<ServiceResult<AudienceProfile | null>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('audience_profiles')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error) return { error: error.message }
    if (!data) return { data: null }
    return { data: audienceProfileSchema.parse(data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to fetch audience' }
  }
}
