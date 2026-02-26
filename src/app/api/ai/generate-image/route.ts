import { z } from 'zod'
import { generateImage } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { getImageModel } from '@/shared/lib/ai-router'
import { buildImagePrompt } from '@/features/visuals/services/image-prompt-builder'
import { uploadImageToStorage } from '@/features/visuals/services/image-storage-service'
import { updateVisualImageUrl } from '@/features/visuals/services/visual-service'
import { FORMAT_TO_ASPECT_RATIO } from '@/features/visuals/constants/image-models'
import type { VisualFormat } from '@/features/visuals/constants/brand-rules'

const inputSchema = z.object({
  visual_version_id: z.string().uuid('ID de version visual invalido'),
  prompt_json: z.record(z.unknown()),
  format: z.enum(['1:1', '4:5', '16:9', '9:16']),
  model_id: z
    .enum(['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'])
    .default('gemini-2.5-flash-image'),
})

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

  const { visual_version_id, prompt_json, format, model_id } = parsed.data

  // 4. Build text prompt from structured JSON
  const textPrompt = buildImagePrompt(prompt_json, format as VisualFormat)
  const aspectRatio = FORMAT_TO_ASPECT_RATIO[format as VisualFormat]

  // 4b. Get workspace context for BYOK
  const workspaceId = await getWorkspaceId()

  try {
    // 5. Generate image
    const result = await generateImage({
      model: await getImageModel(model_id, workspaceId),
      prompt: textPrompt,
      aspectRatio,
      providerOptions: {
        google: { personGeneration: 'allow_adult' },
      },
    })

    // 6. Upload to Supabase Storage
    const uploadResult = await uploadImageToStorage(
      workspaceId,
      visual_version_id,
      result.image.base64,
      result.image.mediaType
    )

    if (uploadResult.error) {
      return Response.json({ error: uploadResult.error }, { status: 500 })
    }

    const publicUrl = uploadResult.data!.publicUrl

    // 7. Update visual_versions.image_url (sets status to pending_qa)
    const updateResult = await updateVisualImageUrl(visual_version_id, publicUrl)
    if (updateResult.error) {
      console.error('[generate-image] DB update failed:', updateResult.error)
    }

    return Response.json({
      data: { image_url: publicUrl, model_id },
    })
  } catch (error) {
    console.error('[generate-image] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: `Error al generar imagen: ${message}` },
      { status: 500 }
    )
  }
}
