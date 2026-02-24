import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================
// Schemas
// ============================================

const resourceDataSchema = z.object({
  type: z.string().min(1),
  url: z.string().url(),
  name: z.string().min(1),
  description: z.string(),
})

const templateDataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  content: z.string().min(1),
})

const conversionConfigSchema = z.object({
  resource: resourceDataSchema.optional(),
  templates: z.array(templateDataSchema).optional(),
  pinned_comment: z.string().optional(),
})

// ============================================
// Types
// ============================================

export interface ServiceResult<T> {
  data?: T
  error?: string
}

export type ResourceData = z.infer<typeof resourceDataSchema>
export type TemplateData = z.infer<typeof templateDataSchema>
export type ConversionConfig = z.infer<typeof conversionConfigSchema>

// ============================================
// Internal helpers
// ============================================

/**
 * Fetch the raw resource_json from a campaign row and parse it as ConversionConfig.
 * Returns an empty config object on parse failure rather than an error,
 * because a missing or malformed field should not block writes.
 */
async function fetchCurrentConfig(
  campaignId: string
): Promise<{ config: ConversionConfig; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('resource_json')
    .eq('id', campaignId)
    .single()

  if (error) {
    return { config: {}, error: error.message }
  }

  const parsed = conversionConfigSchema.safeParse(data?.resource_json ?? {})

  if (!parsed.success) {
    console.error('[conversion-service] fetchCurrentConfig parse error', parsed.error.flatten())
    // Return empty config — do not block the update
    return { config: {} }
  }

  return { config: parsed.data }
}

/**
 * Persist a ConversionConfig back into the campaign's resource_json column.
 */
async function persistConfig(
  campaignId: string,
  config: ConversionConfig
): Promise<ServiceResult<ConversionConfig>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('campaigns')
    .update({ resource_json: config as Record<string, unknown> })
    .eq('id', campaignId)

  if (error) {
    return { error: error.message }
  }

  return { data: config }
}

// ============================================
// Public functions
// ============================================

/**
 * Get the ConversionConfig stored in a campaign's resource_json field.
 * Parses with Zod and returns a typed, structured config with safe defaults.
 */
export async function getConversionConfig(
  campaignId: string
): Promise<ServiceResult<ConversionConfig>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('campaigns')
      .select('resource_json')
      .eq('id', campaignId)
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = conversionConfigSchema.safeParse(data?.resource_json ?? {})

    if (!parsed.success) {
      console.error('[conversion-service] getConversionConfig parse error', parsed.error.flatten())
      return { error: 'Error al parsear la configuracion de conversion' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[conversion-service] getConversionConfig unexpected error', err)
    return { error: 'Error inesperado al obtener la configuracion de conversion' }
  }
}

/**
 * Merge a ResourceData object into the campaign's ConversionConfig.
 * Preserves existing templates while replacing the resource block.
 */
export async function updateResource(
  campaignId: string,
  resource: ResourceData
): Promise<ServiceResult<ConversionConfig>> {
  try {
    const { config, error: fetchError } = await fetchCurrentConfig(campaignId)

    if (fetchError) {
      return { error: fetchError }
    }

    const updatedConfig: ConversionConfig = {
      ...config,
      resource,
    }

    return await persistConfig(campaignId, updatedConfig)
  } catch (err) {
    console.error('[conversion-service] updateResource unexpected error', err)
    return { error: 'Error inesperado al actualizar el recurso' }
  }
}

/**
 * Replace the templates array in the campaign's ConversionConfig.
 * Preserves the existing resource block while replacing all templates.
 */
export async function updateTemplates(
  campaignId: string,
  templates: TemplateData[]
): Promise<ServiceResult<ConversionConfig>> {
  try {
    const { config, error: fetchError } = await fetchCurrentConfig(campaignId)

    if (fetchError) {
      return { error: fetchError }
    }

    const updatedConfig: ConversionConfig = {
      ...config,
      templates,
    }

    return await persistConfig(campaignId, updatedConfig)
  } catch (err) {
    console.error('[conversion-service] updateTemplates unexpected error', err)
    return { error: 'Error inesperado al actualizar las plantillas' }
  }
}

/**
 * Update the pinned_comment field in the campaign's ConversionConfig.
 * Preserves existing resource and templates while replacing pinned_comment.
 */
export async function updatePinnedComment(
  campaignId: string,
  pinnedComment: string
): Promise<ServiceResult<ConversionConfig>> {
  try {
    const { config, error: fetchError } = await fetchCurrentConfig(campaignId)

    if (fetchError) {
      return { error: fetchError }
    }

    const updatedConfig: ConversionConfig = {
      ...config,
      pinned_comment: pinnedComment,
    }

    return await persistConfig(campaignId, updatedConfig)
  } catch (err) {
    console.error('[conversion-service] updatePinnedComment error', err)
    return { error: 'Error inesperado al actualizar el comentario fijado' }
  }
}

/**
 * Pure function — no DB access.
 * Replaces all {{variable_name}} placeholders in a template string
 * with the corresponding values from the variables map.
 * Unknown variables are left as-is.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(variables, key)
      ? (variables[key] ?? match)
      : match
  })
}
