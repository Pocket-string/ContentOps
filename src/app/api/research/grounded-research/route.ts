import { z } from 'zod'
import { generateText, generateObject } from 'ai'
import { requireAuth } from '@/lib/auth'
import { researchRateLimiter } from '@/lib/rate-limit'
import { google, GEMINI_MODEL } from '@/shared/lib/gemini'
import { createClient } from '@/lib/supabase/server'
import { buildResearchPrompt } from '@/features/research/services/research-prompt-builder'

const inputSchema = z.object({
  tema: z.string().min(3, 'El tema debe tener al menos 3 caracteres'),
  buyer_persona: z.string().optional(),
  region: z.string().optional(),
  research_id: z.string().uuid().optional(),
})

const researchOutputSchema = z.object({
  summary: z.string(),
  key_findings: z.array(z.object({
    finding: z.string(),
    relevance: z.string(),
    source_hint: z.string().optional(),
  })).min(3).max(10),
  suggested_topics: z.array(z.object({
    title: z.string(),
    angle: z.string(),
    hook_idea: z.string(),
  })).min(3).max(8),
  market_context: z.string().optional(),
})

export type GroundedResearchOutput = z.infer<typeof researchOutputSchema>

export async function POST(request: Request): Promise<Response> {
  // 1. Auth
  const user = await requireAuth()

  // 2. Rate limit
  const rl = researchRateLimiter.check(user.id)
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

  const { tema, buyer_persona, region, research_id } = parsed.data

  try {
    // 4a. Build optimized prompt via ChatGPT
    const promptData = await buildResearchPrompt(tema, buyer_persona, region)
    const researchPrompt = promptData?.optimized_prompt ?? tema

    // 4b. Step 1: Grounded search via Gemini + Google Search (no structured output)
    const systemPrompt = `Eres un analista de investigacion experto en el sector de O&M fotovoltaico (operacion y mantenimiento de plantas solares).

Tu mision es investigar temas del sector y producir un reporte detallado con hallazgos clave, topics sugeridos para contenido de LinkedIn, y contexto de mercado.

Reglas:
- Basa tus hallazgos en informacion verificable y reciente
- Cada finding debe incluir datos especificos (numeros, porcentajes, nombres de empresas)
- Los topics sugeridos deben seguir la metodologia D/G/P/I (Detener scroll, Ganar atencion, Provocar reaccion, Iniciar conversacion)
- Los hooks deben ser especificos y con datos, no genericos
- Prioriza informacion cuantitativa sobre opiniones
${buyer_persona ? `- Enfoca para el perfil: ${buyer_persona}` : ''}
${region ? `- Region de interes: ${region}` : ''}`

    const { text: groundedText } = await generateText({
      model: google(GEMINI_MODEL),
      tools: {
        google_search: google.tools.googleSearch({}),
      },
      system: systemPrompt,
      prompt: researchPrompt,
    })

    // 4c. Step 2: Structure the grounded text into JSON schema (no tools)
    const { object: researchData } = await generateObject({
      model: google(GEMINI_MODEL),
      schema: researchOutputSchema,
      system: 'Extrae y estructura la siguiente investigacion en el formato JSON solicitado. Mantén todos los datos, cifras y fuentes mencionadas.',
      prompt: groundedText,
    })

    // 4c. Save to research_reports if research_id provided
    if (research_id) {
      const supabase = await createClient()
      await supabase
        .from('research_reports')
        .update({ ai_synthesis: researchData })
        .eq('id', research_id)
    }

    return Response.json({ data: researchData })
  } catch (error) {
    console.error('[grounded-research] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: `Error al investigar: ${message}` },
      { status: 500 }
    )
  }
}
