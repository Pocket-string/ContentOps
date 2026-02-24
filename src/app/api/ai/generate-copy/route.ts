import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { weeklyBriefSchema, structuredContentSchema } from '@/shared/types/content-ops'
import { getActiveBrandProfile } from '@/features/brand/services/brand-service'
import { getTopPatterns } from '@/features/patterns/services/pattern-service'
import { generateObjectWithFallback } from '@/shared/lib/ai-router'
import { reviewCopy } from '@/shared/lib/ai-reviewer'

// Zod schema for the AI output (MUST parse AI responses with Zod — never use `as MyType`)
const generatedCopySchema = z.object({
  variants: z
    .array(
      z.object({
        variant: z.enum(['contrarian', 'story', 'data_driven']),
        content: z.string().min(1),
        hook: z.string().min(1),
        cta: z.string().min(1),
        structured_content: structuredContentSchema.optional(),
      })
    )
    .length(3),
})

export type GeneratedCopy = z.infer<typeof generatedCopySchema>

// Input schema — validated before touching the AI
const inputSchema = z.object({
  topic: z.string().min(1, 'El tema es requerido'),
  keyword: z.string().optional(),
  funnel_stage: z.string().min(1, 'La etapa del funnel es requerida'),
  objective: z.string().optional(),
  audience: z.string().optional(),
  context: z.string().optional(),
  weekly_brief: weeklyBriefSchema.optional(),
})

export async function POST(request: Request): Promise<Response> {
  // 1. Auth — redirect if unauthenticated (requireAuth throws/redirects)
  const user = await requireAuth()

  // 2. Rate limit (10 req/min per user)
  const rateLimitResult = aiRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  // 3. Validate input with Zod — fail fast on bad data
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

  // 4. Fetch active brand profile for tone injection + top patterns for retrieval
  const workspaceId = await getWorkspaceId()
  const [brandResult, hookPatterns, ctaPatterns] = await Promise.all([
    getActiveBrandProfile(workspaceId),
    getTopPatterns(workspaceId, 'hook', parsed.data.funnel_stage, 5),
    getTopPatterns(workspaceId, 'cta', undefined, 5),
  ])
  const brandTone = brandResult.data?.tone ?? 'profesional, tecnico pero accesible, confiable'

  // Build pattern context block for AI prompt injection
  const patternContext: string[] = []
  if (hookPatterns.data && hookPatterns.data.length > 0) {
    patternContext.push('**Hooks exitosos previos:**')
    for (const p of hookPatterns.data) {
      const score = p.performance.dgpi_score != null ? ` (D/G/P/I: ${p.performance.dgpi_score}/20)` : ''
      patternContext.push(`- "${p.content}"${score}`)
    }
  }
  if (ctaPatterns.data && ctaPatterns.data.length > 0) {
    patternContext.push('\n**CTAs exitosos previos:**')
    for (const p of ctaPatterns.data) {
      const rate = p.performance.engagement_rate != null ? ` (engagement: ${p.performance.engagement_rate}%)` : ''
      patternContext.push(`- "${p.content}"${rate}`)
    }
  }
  const patternSection =
    patternContext.length > 0
      ? `\n${patternContext.join('\n')}\n\nUsa estos patrones como inspiracion para generar hooks y CTAs mas efectivos.`
      : ''

  // 5. Generate with AI (structured output via generateObject)
  try {
    const { topic, keyword, funnel_stage, objective, audience, context, weekly_brief } = parsed.data

    const result = await generateObjectWithFallback({
      task: 'generate-copy',
      schema: generatedCopySchema,
      system: `Eres un experto en copywriting para LinkedIn especializado en el sector de O&M fotovoltaico (operacion y mantenimiento de plantas solares).

**Tono de marca configurado**: ${brandTone}. Aplica este tono en todo el copy generado.

Tu objetivo es crear posts de LinkedIn que maximicen el engagement usando la metodología D/G/P/I:
- **Detener (D)**: El hook debe detener el scroll. Usa datos sorprendentes, preguntas provocadoras, o declaraciones contraintuitivas.
- **Ganar (G)**: El contenido debe ganar la atención del lector con valor real, insights únicos, o perspectivas no obvias.
- **Provocar (P)**: Debe provocar una reacción emocional o intelectual que lleve a comentar.
- **Iniciar (I)**: Debe iniciar una conversación con un CTA claro que invite a la acción.

Reglas de formato LinkedIn:
- Máximo 3000 caracteres
- Párrafos cortos (máximo 2-3 líneas)
- Usar espacios entre párrafos para legibilidad
- NO incluir links externos en el cuerpo del post
- El CTA va al final, antes de los hashtags
- Usar emojis con moderación (máximo 3-4 por post)
- Incluir 3-5 hashtags relevantes al final`,
      prompt: `Genera 3 variantes de un post de LinkedIn con estos parámetros:

**Tema**: ${topic}
**Palabra clave**: ${keyword ?? 'No especificada'}
**Etapa del funnel**: ${funnel_stage}
**Objetivo del post**: ${objective ?? 'Engagement general'}
**Audiencia**: ${audience ?? 'Profesionales de energía solar y O&M fotovoltaico'}
${context ? `**Contexto adicional**: ${context}` : ''}
${weekly_brief ? `
**Brief de la semana**:
- Tema: ${weekly_brief.tema}
- Enemigo silencioso: ${weekly_brief.enemigo_silencioso ?? 'No definido'}
- Evidencia clave: ${weekly_brief.evidencia_clave ?? 'No definida'}
- Senales del mercado: ${weekly_brief.senales_mercado?.join(', ') || 'No definidas'}
- Anti-mito: ${weekly_brief.anti_mito ?? 'No definido'}
- Buyer persona: ${weekly_brief.buyer_persona ?? 'No definido'}
- Keyword: ${weekly_brief.keyword ?? 'No definida'}
- Recurso CTA: ${weekly_brief.recurso ?? 'No definido'}
- Restriccion links: ${weekly_brief.restriccion_links ? 'NO incluir links' : 'Links permitidos'}
- Reglas de tono: ${weekly_brief.tone_rules ?? 'No definidas'}` : ''}
${patternSection}
Las 3 variantes deben ser:
1. **Contrarian**: Toma una posición opuesta a la creencia popular del sector. Empieza con una declaración provocadora.
2. **Story (Historia)**: Cuenta una historia o caso real (puede ser ficticio pero realista) que ilustre el punto. Usa narrativa en primera persona.
3. **Data-driven**: Usa datos, estadísticas y hechos para construir el argumento. Incluye números específicos.

Para cada variante proporciona:
- content: El texto completo del post (con formato LinkedIn: párrafos cortos, espacios, hashtags al final)
- hook: La primera línea que detiene el scroll
- cta: El call-to-action al final del post

Para cada variante, ademas del content, hook y cta, incluye un objeto "structured_content" con:
- hook: La primera linea que detiene el scroll
- context: El contexto o setup del argumento
- signals: Las senales del mercado mencionadas
- provocation: La provocacion o punto controversial
- cta: El call-to-action
- hashtags: Array de 3-5 hashtags relevantes`,
    })

    // 6. ChatGPT review (optional — runs on first variant, non-blocking on failure)
    const firstVariant = result.object.variants[0]
    const review = await reviewCopy(
      firstVariant.content,
      firstVariant.variant,
      parsed.data.funnel_stage
    )

    return Response.json({ data: result.object, review })
  } catch (error) {
    console.error('[generate-copy] AI error:', error)
    return Response.json(
      { error: 'Error al generar el contenido. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
