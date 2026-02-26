import { z } from 'zod'
import { generateImage } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { getImageModel } from '@/shared/lib/ai-router'
import { buildCarouselSlidePrompt } from '@/features/visuals/services/carousel-prompt-builder'
import { uploadImageToStorage } from '@/features/visuals/services/image-storage-service'
import { updateSlideImageUrl } from '@/features/visuals/services/carousel-service'

const slideSchema = z.object({
  id: z.string().uuid(),
  slide_index: z.number().min(0).max(9),
  headline: z.string().optional(),
  body_text: z.string().optional(),
  prompt_json: z.record(z.unknown()),
})

const inputSchema = z.object({
  visual_version_id: z.string().uuid('ID de version visual invalido'),
  slide: slideSchema,
  topic: z.string().min(1),
  total_slides: z.number().min(2).max(10),
  model_id: z
    .enum(['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'])
    .default('gemini-2.5-flash-image'),
})

/**
 * Generates image for a single carousel slide.
 * Called once per slide — the client orchestrates calling this for each slide.
 */
export async function POST(request: Request): Promise<Response> {
  // 1. Auth
  const user = await requireAuth()

  // 2. Rate limit
  const rl = aiRateLimiter.check(user.id)
  if (!rl.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  // 3. Validate input
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo invalido' }, { status: 400 })
  }

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  const { visual_version_id, slide, topic, total_slides, model_id } = parsed.data

  // 4. Get workspace context for BYOK
  const workspaceId = await getWorkspaceId()

  // 4b. Build prompt with carousel narrative context
  const textPrompt = buildCarouselSlidePrompt(
    {
      slide_index: slide.slide_index,
      headline: slide.headline,
      body_text: slide.body_text,
      prompt_json: slide.prompt_json,
    },
    { topic, total_slides }
  )

  try {
    // 5. Generate image — 4:5 → 3:4 (closest supported)
    const result = await generateImage({
      model: await getImageModel(model_id, workspaceId),
      prompt: textPrompt,
      aspectRatio: '3:4',
      providerOptions: {
        google: { personGeneration: 'allow_adult' },
      },
    })

    // 6. Upload with slide-specific path
    const storagePath = `${visual_version_id}/slide-${slide.slide_index}`
    const uploadResult = await uploadImageToStorage(
      workspaceId,
      storagePath,
      result.image.base64,
      result.image.mediaType
    )

    if (uploadResult.error) {
      return Response.json({ error: uploadResult.error }, { status: 500 })
    }

    const publicUrl = uploadResult.data!.publicUrl

    // 7. Update slide image_url in DB
    const updateResult = await updateSlideImageUrl(slide.id, publicUrl)
    if (updateResult.error) {
      console.error('[generate-carousel] DB update failed:', updateResult.error)
    }

    return Response.json({
      data: {
        slide_index: slide.slide_index,
        image_url: publicUrl,
        model_id,
      },
    })
  } catch (error) {
    console.error('[generate-carousel] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: `Error al generar slide ${slide.slide_index + 1}: ${message}` },
      { status: 500 }
    )
  }
}
