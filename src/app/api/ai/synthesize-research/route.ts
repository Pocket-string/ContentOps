import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { google, GEMINI_MODEL } from '@/shared/lib/gemini'

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
    .min(1)
    .max(10),
  summary: z.string(),
})

export type SynthesisOutput = z.infer<typeof synthesisOutputSchema>

// Input schema — validated before touching the AI
// Note: nullable() needed because client sends null (not undefined) for missing fields
const inputSchema = z.object({
  research_id: z.string().uuid(),
  raw_text: z.string().min(1),
  key_takeaways: z.array(z.string()).default([]),
  title: z.string().nullable().optional(),
  market_region: z.string().nullable().optional(),
  buyer_persona: z.string().nullable().optional(),
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

  // 4. Generate with AI (text-based JSON — generateObject fails with Gemini on long inputs)
  try {
    const { raw_text, key_takeaways, title, market_region, buyer_persona, research_id } =
      parsed.data

    const { text: jsonText } = await generateText({
      model: google(GEMINI_MODEL),
      system: `Eres un experto en estrategia de contenido para LinkedIn especializado en el sector de O&M fotovoltaico.

Responde UNICAMENTE con un objeto JSON valido. Sin markdown, sin backticks, sin texto antes o despues.
El JSON debe seguir esta estructura EXACTA:
{
  "summary": "los 2-3 mensajes clave de toda la investigacion",
  "bullets": [
    {
      "insight": "hallazgo o dato relevante",
      "suggested_topic_title": "titulo de post para LinkedIn",
      "suggested_angle": "angulo narrativo (contrarian/story/data-driven/how-to/prediction) con justificacion"
    }
  ]
}
REGLAS:
- bullets: minimo 3, maximo 10 items
- Todos los valores deben ser strings
- Los insights deben ser relevantes para profesionales de O&M fotovoltaico
- Prioriza datos cuantitativos, comparativas de rendimiento, y lecciones operativas
- Los titulos de post deben detener el scroll usando metodologia D/G/P/I
- El summary debe capturar los mensajes clave para estrategia de contenido`,
      prompt: `Analiza la siguiente investigacion y genera angulos de contenido para LinkedIn:

${title ? `**Titulo del informe**: ${title}` : ''}
${market_region ? `**Region de mercado**: ${market_region}` : ''}
${buyer_persona ? `**Buyer persona objetivo**: ${buyer_persona}` : ''}
${
  key_takeaways.length > 0
    ? `**Puntos clave identificados**:
${key_takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : ''
}

**Texto completo de la investigacion**:
${raw_text.slice(0, 8000)}`,
    })

    // Parse JSON from response — handle markdown code blocks
    const cleaned = jsonText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('La IA no pudo estructurar la sintesis. Intenta de nuevo.')
    }

    const rawParsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    // Slice arrays to max limits
    if (Array.isArray(rawParsed.bullets)) {
      rawParsed.bullets = rawParsed.bullets.slice(0, 10)
    }

    const validated = synthesisOutputSchema.safeParse(rawParsed)
    if (!validated.success) {
      console.error('[synthesize-research] Validation failed:', validated.error.issues)
      throw new Error('Los resultados no coinciden con el formato esperado.')
    }

    const synthesisData = validated.data

    // Save synthesis to the research_reports table
    const supabase = await createClient()
    await supabase
      .from('research_reports')
      .update({ ai_synthesis: synthesisData })
      .eq('id', research_id)

    return Response.json({ data: synthesisData })
  } catch (error) {
    console.error('[synthesize-research] AI error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: `Error al sintetizar: ${message}` },
      { status: 500 }
    )
  }
}
