import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { weeklyBriefSchema } from '@/shared/types/content-ops'

// OpenRouter provider (OpenAI-compatible)
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
})

// Zod schema for the AI output (MUST parse AI responses with Zod — never use `as MyType`)
const criticOutputSchema = z.object({
  score: z.object({
    detener: z.number().min(0).max(5),
    ganar: z.number().min(0).max(5),
    provocar: z.number().min(0).max(5),
    iniciar: z.number().min(0).max(5),
    total: z.number().min(0).max(20),
  }),
  findings: z.array(z.object({
    category: z.string(),
    severity: z.enum(['blocker', 'warning', 'suggestion']),
    description: z.string(),
    location: z.string().optional(),
  })),
  suggestions: z.array(z.string()).max(3),
  verdict: z.enum(['pass', 'needs_work', 'rewrite']),
})

export type CriticCopyOutput = z.infer<typeof criticOutputSchema>

// Input schema — validated before touching the AI
const inputSchema = z.object({
  content: z.string().min(1, 'Contenido requerido'),
  variant: z.string().min(1),
  funnel_stage: z.string().min(1),
  weekly_brief: weeklyBriefSchema.optional(),
  keyword: z.string().optional(),
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

  // 4. Evaluate with AI (structured output via generateObject)
  try {
    const { content, variant, funnel_stage, weekly_brief, keyword } = parsed.data

    const result = await generateObject({
      model: openrouter('google/gemini-2.0-flash-001'),
      schema: criticOutputSchema,
      system: `Eres un critico experto de copy LinkedIn para O&M fotovoltaico (operacion y mantenimiento de plantas solares).

Tu trabajo es evaluar posts de LinkedIn usando la rubrica D/G/P/I:
- **Detener (D, 0-5)**: El hook detiene el scroll? Usa datos sorprendentes, preguntas provocadoras?
- **Ganar (G, 0-5)**: El contenido gana la atencion con valor real e insights unicos?
- **Provocar (P, 0-5)**: Provoca reaccion emocional o intelectual que lleve a comentar?
- **Iniciar (I, 0-5)**: Inicia una conversacion con CTA claro?

Detectas estos problemas:
- **generico**: Contenido que podria ser de cualquier sector (no especifico de O&M solar)
- **sin_evidencia**: Afirmaciones sin datos ni fuentes
- **jerga**: Jerga tecnica excesiva sin explicacion
- **cta_debil**: CTA vago o ausente
- **hook_debil**: Primera linea que no detiene el scroll
- **longitud**: Demasiado largo (>3000 chars) o corto (<800 chars)
- **formato**: Parrafos demasiado largos, sin espaciado, sin hashtags

Reglas:
- MAXIMO 3 cambios sugeridos (enfocados, no overwhelm)
- Severity: blocker (debe corregirse), warning (recomendado), suggestion (opcional)
- Verdict: pass (score >= 16), needs_work (10-15), rewrite (< 10)
- Si hay brief semanal, verifica coherencia con el tema y restricciones`,
      prompt: `Evalua este post de LinkedIn:

**Variante**: ${variant}
**Etapa del funnel**: ${funnel_stage}
${keyword ? `**Keyword**: ${keyword}` : ''}
${weekly_brief ? `**Brief semanal**: Tema: ${weekly_brief.tema}, Enemigo silencioso: ${weekly_brief.enemigo_silencioso ?? 'N/A'}, Anti-mito: ${weekly_brief.anti_mito ?? 'N/A'}, Restriccion links: ${weekly_brief.restriccion_links ? 'NO links' : 'Links OK'}` : ''}

**Contenido del post**:
${content}

Proporciona tu evaluacion D/G/P/I con findings, suggestions (max 3) y verdict.`,
    })

    return Response.json({ data: result.object })
  } catch (error) {
    console.error('[critic-copy] AI error:', error)
    return Response.json(
      { error: 'Error al evaluar el contenido. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
