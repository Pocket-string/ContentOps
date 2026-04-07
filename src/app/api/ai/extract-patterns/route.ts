import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { extractPatternsFromPost, buildGoldenTemplate } from '@/features/patterns/services/pattern-extractor'

const inputSchema = z.object({
  post_id: z.string().uuid(),
  content: z.string().min(50),
  variant: z.string().min(1),
  funnel_stage: z.string().min(1),
  score_json: z.record(z.unknown()).nullable().optional(),
  build_golden_template: z.boolean().default(false),
  content_type: z.enum(['alcance', 'nutricion', 'conversion']).optional(),
})

export async function POST(request: Request): Promise<Response> {
  const user = await requireAuth()

  const rl = aiRateLimiter.check(user.id)
  if (!rl.success) {
    return Response.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })
  }

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

  const workspaceId = await getWorkspaceId()
  const { post_id, content, variant, funnel_stage, score_json, build_golden_template: buildGolden, content_type } = parsed.data

  try {
    const result = await extractPatternsFromPost(
      post_id,
      workspaceId,
      user.id,
      content,
      variant,
      funnel_stage,
      (score_json ?? null) as Record<string, unknown> | null,
    )

    let goldenCreated = false
    if (buildGolden && content_type) {
      const goldenResult = await buildGoldenTemplate(workspaceId, user.id, content_type)
      goldenCreated = goldenResult.created
    }

    return Response.json({ extracted: result.extracted, golden_created: goldenCreated })
  } catch (error) {
    console.error('[extract-patterns] Error:', error)
    return Response.json(
      { error: `Error al extraer patrones: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    )
  }
}
