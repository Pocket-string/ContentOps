import { createClient } from '@/lib/supabase/server'
import {
  carouselSlideSchema,
  type CarouselSlide,
} from '@/shared/types/content-ops'
import { z } from 'zod'

export interface ServiceResult<T> {
  data?: T
  error?: string
}

/**
 * Get all carousel slides for a visual_version, ordered by slide_index.
 */
export async function getCarouselSlides(
  visualVersionId: string
): Promise<ServiceResult<CarouselSlide[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('carousel_slides')
      .select('*')
      .eq('visual_version_id', visualVersionId)
      .order('slide_index', { ascending: true })

    if (error) {
      return { error: error.message }
    }

    const parsed = z.array(carouselSlideSchema).safeParse(data)

    if (!parsed.success) {
      console.error('[carousel-service] getCarouselSlides parse error', parsed.error.flatten())
      return { error: 'Error al parsear slides del carrusel' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[carousel-service] getCarouselSlides unexpected error', err)
    return { error: 'Error inesperado al obtener slides' }
  }
}

/**
 * Create or upsert slides for a carousel visual_version.
 * Also updates the visual_version.slide_count.
 */
export async function upsertCarouselSlides(
  visualVersionId: string,
  slides: Array<{
    slide_index: number
    prompt_json: Record<string, unknown>
    headline?: string
    body_text?: string
  }>
): Promise<ServiceResult<CarouselSlide[]>> {
  try {
    const supabase = await createClient()

    const rows = slides.map((s) => ({
      visual_version_id: visualVersionId,
      slide_index: s.slide_index,
      prompt_json: s.prompt_json,
      headline: s.headline ?? null,
      body_text: s.body_text ?? null,
    }))

    const { data, error } = await supabase
      .from('carousel_slides')
      .upsert(rows, { onConflict: 'visual_version_id,slide_index' })
      .select()

    if (error) {
      return { error: error.message }
    }

    // Update slide_count on visual_version
    const { error: updateError } = await supabase
      .from('visual_versions')
      .update({ slide_count: slides.length })
      .eq('id', visualVersionId)

    if (updateError) {
      console.error('[carousel-service] slide_count update error', updateError)
    }

    const parsed = z.array(carouselSlideSchema).safeParse(data)

    if (!parsed.success) {
      console.error('[carousel-service] upsertCarouselSlides parse error', parsed.error.flatten())
      return { error: 'Error al parsear slides creados' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[carousel-service] upsertCarouselSlides unexpected error', err)
    return { error: 'Error inesperado al crear slides' }
  }
}

/**
 * Update a single slide's image_url after generation.
 */
export async function updateSlideImageUrl(
  slideId: string,
  imageUrl: string
): Promise<ServiceResult<CarouselSlide>> {
  try {
    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('carousel_slides')
      .update({ image_url: imageUrl })
      .eq('id', slideId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = carouselSlideSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[carousel-service] updateSlideImageUrl parse error', parsed.error.flatten())
      return { error: 'Error al parsear slide actualizado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[carousel-service] updateSlideImageUrl unexpected error', err)
    return { error: 'Error inesperado al actualizar imagen del slide' }
  }
}
