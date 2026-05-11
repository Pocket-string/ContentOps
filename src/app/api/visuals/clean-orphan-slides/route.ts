/**
 * PRP-013 iter 1: clean orphan carousel_slides for a visual_version.
 *
 * When a visual_version's archetype switches from carousel-based to a
 * non-carousel archetype (e.g. carousel_mini_report → screenshot_annotated),
 * the carousel_slides rows persist and the editor keeps rendering stale
 * slide previews. This endpoint deletes them so the composed image surfaces.
 */
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { deleteCarouselSlidesByVisualVersion } from '@/features/visuals/services/carousel-service'

const inputSchema = z.object({
  visual_version_id: z.string().uuid(),
})

export async function POST(request: Request): Promise<Response> {
  await requireAuth()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo invalido' }, { status: 400 })
  }
  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }, { status: 400 })
  }

  const result = await deleteCarouselSlidesByVisualVersion(parsed.data.visual_version_id)
  if (result.error) {
    return Response.json({ error: result.error }, { status: 500 })
  }

  return Response.json({ data: result.data })
}
