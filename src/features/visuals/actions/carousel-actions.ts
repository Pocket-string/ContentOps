'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { upsertCarouselSlides, getCarouselSlides } from '../services/carousel-service'
import { generateDefaultSlideStructure, slidesFromCarouselPlan } from '../services/carousel-prompt-builder'
import { carouselPlanSchema } from '../schemas/visual-prompt-schema'
import type { CarouselSlide } from '@/shared/types/content-ops'

interface ActionSuccess {
  success: true
  slides?: CarouselSlide[]
}

interface ActionError {
  error: string
}

type ActionResult = ActionSuccess | ActionError

/**
 * Initialize carousel slides for a visual version.
 * Creates default slide structures if none exist.
 */
export async function initCarouselSlidesAction(
  visualVersionId: string,
  topic: string,
  slideCount: number
): Promise<ActionResult> {
  await requireAuth()

  const validated = z.object({
    visualVersionId: z.string().uuid(),
    topic: z.string().min(1),
    slideCount: z.number().min(2).max(10),
  }).safeParse({ visualVersionId, topic, slideCount })

  if (!validated.success) {
    return { error: 'Datos invalidos' }
  }

  // Check if slides already exist
  const existing = await getCarouselSlides(visualVersionId)
  if (existing.data && existing.data.length > 0) {
    return { success: true, slides: existing.data }
  }

  // Generate default structure
  const defaults = generateDefaultSlideStructure(topic, slideCount)
  const result = await upsertCarouselSlides(visualVersionId, defaults)

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath('/campaigns')
  return { success: true, slides: result.data }
}

/**
 * Save updated slide content (headline, body_text).
 */
export async function saveCarouselSlidesAction(
  visualVersionId: string,
  slides: Array<{
    slide_index: number
    headline?: string
    body_text?: string
    prompt_json: Record<string, unknown>
  }>
): Promise<ActionResult> {
  await requireAuth()

  if (!visualVersionId) {
    return { error: 'ID de version visual requerido' }
  }

  const result = await upsertCarouselSlides(visualVersionId, slides)

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath('/campaigns')
  return { success: true, slides: result.data }
}

/**
 * Initialize carousel slides from an AI-generated carousel plan.
 * Extracts rich per-slide data (prompt_overall, visual_description, etc.)
 * instead of using boilerplate defaults.
 */
export async function initCarouselFromPlanAction(
  visualVersionId: string,
  planData: Record<string, unknown>
): Promise<ActionResult> {
  await requireAuth()

  if (!visualVersionId) {
    return { error: 'ID de version visual requerido' }
  }

  // Validate the plan data
  const parsed = carouselPlanSchema.safeParse(planData)
  if (!parsed.success) {
    console.error('[initCarouselFromPlan] Invalid plan:', parsed.error.issues)
    return { error: 'Plan de carrusel invalido' }
  }

  // Convert plan to slide structures with rich prompt_json
  const slideStructures = slidesFromCarouselPlan(parsed.data)

  // Upsert slides (replaces existing if any)
  const result = await upsertCarouselSlides(visualVersionId, slideStructures)

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath('/campaigns')
  return { success: true, slides: result.data }
}
