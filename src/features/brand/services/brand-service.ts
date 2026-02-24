import { createClient } from '@/lib/supabase/server'
import {
  brandProfileSchema,
  type BrandProfile,
  type UpdateBrandProfileInput,
} from '@/shared/types/content-ops'
import { z } from 'zod'

export interface ServiceResult<T> {
  data?: T
  error?: string
}

export async function getActiveBrandProfile(
  workspaceId: string
): Promise<ServiceResult<BrandProfile | null>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return { error: error.message }
    if (!data) return { data: null }

    const parsed = brandProfileSchema.safeParse(data)
    if (!parsed.success) {
      console.error('[brand-service] parse error', parsed.error.flatten())
      return { error: 'Error al parsear brand profile' }
    }
    return { data: parsed.data }
  } catch (err) {
    console.error('[brand-service] unexpected error', err)
    return { error: 'Error inesperado' }
  }
}

export async function getBrandProfiles(
  workspaceId: string
): Promise<ServiceResult<BrandProfile[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('version', { ascending: false })

    if (error) return { error: error.message }

    const parsed = z.array(brandProfileSchema).safeParse(data)
    if (!parsed.success) {
      console.error('[brand-service] parse error', parsed.error.flatten())
      return { error: 'Error al parsear brand profiles' }
    }
    return { data: parsed.data }
  } catch (err) {
    console.error('[brand-service] unexpected error', err)
    return { error: 'Error inesperado' }
  }
}

export async function createBrandProfile(
  workspaceId: string
): Promise<ServiceResult<BrandProfile>> {
  try {
    const supabase = await createClient()

    // Get next version number
    const { data: existing } = await supabase
      .from('brand_profiles')
      .select('version')
      .eq('workspace_id', workspaceId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = (existing?.version ?? 0) + 1

    // Deactivate existing active profiles
    await supabase
      .from('brand_profiles')
      .update({ is_active: false })
      .eq('workspace_id', workspaceId)

    const { data, error } = await supabase
      .from('brand_profiles')
      .insert({ workspace_id: workspaceId, version: nextVersion, is_active: true })
      .select()
      .single()

    if (error) return { error: error.message }

    const parsed = brandProfileSchema.safeParse(data)
    if (!parsed.success) return { error: 'Error al parsear brand profile creado' }
    return { data: parsed.data }
  } catch (err) {
    console.error('[brand-service] unexpected error', err)
    return { error: 'Error inesperado' }
  }
}

export async function updateBrandProfile(
  profileId: string,
  input: UpdateBrandProfileInput
): Promise<ServiceResult<BrandProfile>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('brand_profiles')
      .update(input)
      .eq('id', profileId)
      .select()
      .single()

    if (error) return { error: error.message }

    const parsed = brandProfileSchema.safeParse(data)
    if (!parsed.success) return { error: 'Error al parsear brand profile actualizado' }
    return { data: parsed.data }
  } catch (err) {
    console.error('[brand-service] unexpected error', err)
    return { error: 'Error inesperado' }
  }
}
