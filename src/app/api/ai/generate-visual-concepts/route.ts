import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { weeklyBriefSchema } from '@/shared/types/content-ops'
import { generateObjectWithFallback } from '@/shared/lib/ai-router'

const conceptOutputSchema = z.object({
  concepts: z.array(z.object({
    concept_type: z.enum(['infographic_1x1', 'carousel_4x5', 'humanized_photo', 'data_chart', 'custom']),
    rationale: z.string(),
    layout: z.string(),
    text_budget: z.string(),
    data_evidence: z.string(),
    risk_notes: z.string(),
  })).length(3),
})

export type VisualConceptsOutput = z.infer<typeof conceptOutputSchema>

const inputSchema = z.object({
  post_content: z.string().min(1, 'Contenido del post requerido'),
  funnel_stage: z.string().min(1),
  topic: z.string().optional(),
  keyword: z.string().optional(),
  weekly_brief: weeklyBriefSchema.optional(),
})

export async function POST(request: Request): Promise<Response> {
  const user = await requireAuth()

  const rateLimitResult = aiRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo de la solicitud invalido' }, { status: 400 })
  }

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  try {
    const { post_content, funnel_stage, topic, keyword, weekly_brief } = parsed.data

    const result = await generateObjectWithFallback({
      task: 'generate-visual-concepts',
      schema: conceptOutputSchema,
      system: `Eres un director creativo experto en contenido visual para LinkedIn en el sector de O&M fotovoltaico (Bitalize).

Tu trabajo es proponer 3 conceptos visuales diferentes para acompanar un post de LinkedIn. Cada concepto debe ser una opcion viable con trade-offs claros.

Tipos de concepto disponibles:
- **infographic_1x1**: Infografia cuadrada con datos clave, ideal para TOFU/MOFU con estadisticas
- **carousel_4x5**: Carrusel vertical (multiples slides), ideal para explicaciones paso a paso
- **humanized_photo**: Foto profesional de campo/planta solar, ideal para storytelling y BOFU
- **data_chart**: Grafico o chart con datos de rendimiento, ideal para contenido data-driven
- **custom**: Formato especial que no encaja en las categorias anteriores

Para cada concepto evalua:
- **rationale**: Por que este concepto funciona para este post
- **layout**: Descripcion detallada de la composicion visual
- **text_budget**: Cuanto texto cabe y donde va
- **data_evidence**: Que datos o elementos clave visualizar
- **risk_notes**: Posibles problemas (texto ilegible, composicion saturada, etc.)

Los 3 conceptos DEBEN ser diferentes entre si (no 3 variaciones del mismo tipo).`,
      prompt: `Genera 3 conceptos visuales para este post de LinkedIn:

**Contenido del post**:
${post_content}

**Etapa del funnel**: ${funnel_stage}
${topic ? `**Tema**: ${topic}` : ''}
${keyword ? `**Keyword**: ${keyword}` : ''}
${weekly_brief ? `**Brief**: ${weekly_brief.tema} — Buyer: ${weekly_brief.buyer_persona ?? 'General'}` : ''}

Proporciona 3 conceptos visuales diferentes, cada uno con un concept_type distinto.`,
    })

    return Response.json({ data: result.object })
  } catch (error) {
    console.error('[generate-visual-concepts] AI error:', error)
    return Response.json(
      { error: 'Error al generar conceptos visuales. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
