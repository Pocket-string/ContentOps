import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { researchRateLimiter } from '@/lib/rate-limit'
import { google, GEMINI_MODEL } from '@/shared/lib/gemini'
import { createClient } from '@/lib/supabase/server'
import { buildResearchPrompt } from '@/features/research/services/research-prompt-builder'
import { getWorkspaceId } from '@/lib/workspace'

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
  })).min(1).max(10),
  suggested_topics: z.array(z.object({
    title: z.string(),
    angle: z.string(),
    hook_idea: z.string(),
  })).min(1).max(8),
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

    // 4b. Step 1: Grounded search via Gemini + Google Search
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

    // If grounded search returned empty text, use the original prompt as fallback
    const textForStructuring = groundedText.trim().length > 50
      ? groundedText
      : `Tema de investigacion: ${tema}\n\nPrompt: ${researchPrompt}\n\nGenera un analisis basado en tu conocimiento del sector fotovoltaico.`

    // 4c. Step 2: Structure into JSON via text mode (generateObject fails with long inputs)
    const { text: jsonText } = await generateText({
      model: google(GEMINI_MODEL),
      system: `Responde UNICAMENTE con un objeto JSON valido. Sin markdown, sin backticks, sin texto antes o despues.
El JSON debe seguir esta estructura EXACTA:
{
  "summary": "resumen ejecutivo (1-3 parrafos)",
  "key_findings": [
    {"finding": "hallazgo con datos", "relevance": "por que importa", "source_hint": "fuente opcional"}
  ],
  "suggested_topics": [
    {"title": "titulo del post", "angle": "angulo editorial", "hook_idea": "idea de gancho con dato"}
  ],
  "market_context": "contexto de mercado"
}
REGLAS:
- key_findings: minimo 3, maximo 8 items
- suggested_topics: minimo 3, maximo 6 items
- Todos los valores deben ser strings, no arrays ni objetos anidados`,
      prompt: `Estructura esta investigacion en JSON:\n\n${textForStructuring.slice(0, 6000)}`,
    })

    // Parse JSON from response — handle markdown code blocks, whitespace, etc.
    const cleaned = jsonText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('La IA no pudo estructurar los resultados. Intenta de nuevo.')
    }

    // Lenient parse: accept extra items by slicing arrays
    const rawParsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    const findings = Array.isArray(rawParsed.key_findings) ? rawParsed.key_findings.slice(0, 10) : []
    const topics = Array.isArray(rawParsed.suggested_topics) ? rawParsed.suggested_topics.slice(0, 8) : []
    rawParsed.key_findings = findings
    rawParsed.suggested_topics = topics

    const validated = researchOutputSchema.safeParse(rawParsed)
    if (!validated.success) {
      console.error('[grounded-research] Validation failed:', validated.error.issues)
      throw new Error('Los resultados no coinciden con el formato esperado. Intenta de nuevo.')
    }
    const researchData = validated.data

    // 4d. Persist results
    let savedResearchId: string | undefined

    if (research_id) {
      // Update existing report
      const supabase = await createClient()
      await supabase
        .from('research_reports')
        .update({ ai_synthesis: researchData })
        .eq('id', research_id)
      savedResearchId = research_id
    } else {
      // Auto-create a new research report so results are never lost
      try {
        const workspaceId = await getWorkspaceId()
        const supabase = await createClient()

        const { data: newReport, error: insertError } = await supabase
          .from('research_reports')
          .insert({
            workspace_id: workspaceId,
            created_by: user.id,
            title: tema,
            source: 'AI Research (Gemini + Google Search)',
            raw_text: groundedText,
            tags_json: [],
            ai_synthesis: researchData,
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('[grounded-research] Auto-save insert error:', insertError)
        } else if (newReport) {
          savedResearchId = newReport.id as string
        }
      } catch (saveErr) {
        // Non-fatal: log and continue — the AI result is still returned
        console.error('[grounded-research] Auto-save unexpected error:', saveErr)
      }
    }

    return Response.json({ data: researchData, research_id: savedResearchId })
  } catch (error) {
    console.error('[grounded-research] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: `Error al investigar: ${message}` },
      { status: 500 }
    )
  }
}
