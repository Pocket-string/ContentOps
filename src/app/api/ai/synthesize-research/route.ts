import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

// OpenRouter provider (OpenAI-compatible)
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
})

// Zod schema for the AI output (MUST parse AI responses with Zod — never use `as MyType`)
const synthesisOutputSchema = z.object({
  bullets: z
    .array(
      z.object({
        insight: z.string(),
        suggested_topic_title: z.string(),
        suggested_angle: z.string(),
      })
    )
    .min(3)
    .max(10),
  summary: z.string(),
})

export type SynthesisOutput = z.infer<typeof synthesisOutputSchema>

// Input schema — validated before touching the AI
const inputSchema = z.object({
  research_id: z.string().uuid(),
  raw_text: z.string().min(1),
  key_takeaways: z.array(z.string()).default([]),
  title: z.string().optional(),
  market_region: z.string().optional(),
  buyer_persona: z.string().optional(),
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

  // 4. Generate with AI (structured output via generateObject) + save to DB
  try {
    const { raw_text, key_takeaways, title, market_region, buyer_persona, research_id } =
      parsed.data

    const result = await generateObject({
      model: openrouter('google/gemini-2.0-flash-001'),
      schema: synthesisOutputSchema,
      system: `Eres un experto en estrategia de contenido para LinkedIn especializado en el sector de O&M fotovoltaico (operación y mantenimiento de plantas solares).

Tu misión es analizar informes de investigación técnica o comercial del sector fotovoltaico y transformarlos en ángulos de contenido accionables para LinkedIn.

Para cada insight debes:
- Identificar el dato o hallazgo más valioso para el buyer persona del sector
- Proponer un título de post que detenga el scroll usando la metodología D/G/P/I
- Sugerir el ángulo narrativo que maximice el engagement (contrarian, story, data-driven, etc.)

Reglas clave:
- Los insights deben ser relevantes para profesionales de O&M fotovoltaico (asset managers, O&M managers, ingenieros de planta)
- Prioriza datos cuantitativos, comparativas de rendimiento, y lecciones operativas
- El resumen debe capturar los 2-3 mensajes clave de toda la investigación
- Los títulos de post deben ser directos, específicos y orientados al sector solar`,
      prompt: `Analiza la siguiente investigación y genera entre 3 y 10 ángulos de contenido para LinkedIn:

${title ? `**Título del informe**: ${title}` : ''}
${market_region ? `**Región de mercado**: ${market_region}` : ''}
${buyer_persona ? `**Buyer persona objetivo**: ${buyer_persona}` : ''}
${
  key_takeaways.length > 0
    ? `**Puntos clave identificados**:
${key_takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : ''
}

**Texto completo de la investigación**:
${raw_text}

Para cada ángulo de contenido proporciona:
- insight: El hallazgo o dato más relevante extraído de la investigación
- suggested_topic_title: Un título de post de LinkedIn que detenga el scroll (específico, con datos si aplica)
- suggested_angle: El ángulo narrativo recomendado (contrarian / story / data-driven / how-to / prediction) con una breve justificación

Además, genera un summary con los 2-3 mensajes clave de toda la investigación que sirvan como base para la estrategia de contenido.`,
    })

    // Save synthesis to the research_reports table
    const supabase = await createClient()
    await supabase
      .from('research_reports')
      .update({ ai_synthesis: result.object })
      .eq('id', research_id)

    return Response.json({ data: result.object })
  } catch (error) {
    console.error('[synthesize-research] AI error:', error)
    return Response.json(
      { error: 'Error al sintetizar la investigacion. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
