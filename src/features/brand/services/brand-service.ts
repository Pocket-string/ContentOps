import { createClient } from '@/lib/supabase/server'
import {
  brandProfileSchema,
  type BrandProfile,
  type UpdateBrandProfileInput,
} from '@/shared/types/content-ops'
import { z } from 'zod'
import type { LogoEntry } from '@/features/brand/components/LogoUploader'
import type { PaletteOption } from '@/features/brand/components/PaletteSelector'

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

// ============================================
// Logo storage helpers
// ============================================

/** Sanitize a filename for use in Supabase Storage paths. */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Uploads a logo file to Supabase Storage (brand-logos bucket).
 * Returns the public URL on success.
 */
export async function uploadLogoFile(
  workspaceId: string,
  profileId: string,
  file: File
): Promise<ServiceResult<string>> {
  try {
    const supabase = await createClient()

    const ext = file.name.split('.').pop() ?? 'png'
    const safeName = sanitizeFilename(file.name.replace(/\.[^.]+$/, ''))
    const timestamp = Date.now()
    const storagePath = `${workspaceId}/${profileId}/${timestamp}-${safeName}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) return { error: uploadError.message }

    const {
      data: { publicUrl },
    } = supabase.storage.from('brand-logos').getPublicUrl(storagePath)

    return { data: publicUrl }
  } catch (err) {
    console.error('[brand-service] uploadLogoFile error', err)
    return { error: 'Error al subir el logo' }
  }
}

/**
 * Removes a logo file from Supabase Storage given its public URL.
 * Extracts the storage path from the URL for the delete call.
 */
export async function removeLogoFile(logoUrl: string): Promise<ServiceResult<void>> {
  try {
    const supabase = await createClient()

    // Extract the path after "/brand-logos/" from the public URL
    const marker = '/brand-logos/'
    const markerIdx = logoUrl.indexOf(marker)
    if (markerIdx === -1) {
      return { error: 'URL de logo invalida' }
    }

    const storagePath = decodeURIComponent(logoUrl.slice(markerIdx + marker.length))

    const { error } = await supabase.storage.from('brand-logos').remove([storagePath])
    if (error) return { error: error.message }

    return { data: undefined }
  } catch (err) {
    console.error('[brand-service] removeLogoFile error', err)
    return { error: 'Error al eliminar el logo' }
  }
}

/**
 * Updates the logo_urls JSONB column on a brand profile.
 * Expects an array of { url, name } objects.
 */
export async function updateBrandLogos(
  profileId: string,
  logoUrls: LogoEntry[]
): Promise<ServiceResult<void>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('brand_profiles')
      .update({ logo_urls: logoUrls })
      .eq('id', profileId)

    if (error) return { error: error.message }
    return { data: undefined }
  } catch (err) {
    console.error('[brand-service] updateBrandLogos error', err)
    return { error: 'Error al actualizar logos' }
  }
}

/**
 * Saves AI-generated palette suggestions to the ai_palettes JSONB column.
 */
export async function saveBrandAiPalettes(
  profileId: string,
  palettes: PaletteOption[]
): Promise<ServiceResult<void>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('brand_profiles')
      .update({ ai_palettes: palettes })
      .eq('id', profileId)

    if (error) return { error: error.message }
    return { data: undefined }
  } catch (err) {
    console.error('[brand-service] saveBrandAiPalettes error', err)
    return { error: 'Error al guardar paletas de IA' }
  }
}
