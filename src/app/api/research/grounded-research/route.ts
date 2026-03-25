import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { researchRateLimiter } from '@/lib/rate-limit'
import { GEMINI_MODEL } from '@/shared/lib/gemini'
import { getGoogleProvider } from '@/shared/lib/ai-router'
import { createClient } from '@/lib/supabase/server'
import { buildResearchPrompt } from '@/features/research/services/research-prompt-builder'
import { getWorkspaceId } from '@/lib/workspace'

// Allow up to 120 seconds for 3 sequential AI calls (ChatGPT + 2x Gemini)
export const maxDuration = 120

const inputSchema = z.object({
  tema: z.string().min(3, 'El tema debe tener al menos 3 caracteres'),
  buyer_persona: z.string().optional(),
  region: z.string().optional(),
  research_id: z.string().uuid().optional(),
  pillar_id: z.string().uuid().optional(),
  pillar_name: z.string().optional(),
  pillar_description: z.string().optional(),
})

const researchOutputSchema = z.object({
  summary: z.string(),
  key_findings: z.array(z.object({
    finding: z.string(),
    relevance: z.string(),
    source: z.string().describe('Source name, report title, or URL where this finding comes from'),
  })).min(1).max(10),
  suggested_topics: z.array(z.object({
    title: z.string(),
    angle: z.string(),
    hook_idea: z.string(),
  })).min(1).max(8),
  market_context: z.string().optional(),
  sources: z.array(z.string()).default([])
    .describe('Consolidated list of all unique source URLs or report names referenced'),
  // PRP-008: Deep research enrichment fields
  invisible_enemy: z.string().optional()
    .describe('The hidden enemy: what the audience does not see that is costing them money'),
  thesis: z.string().optional()
    .describe('Main contrarian thesis from the research'),
  conversion_resource: z.string().optional()
    .describe('What resource to offer in BOFU (checklist, diagnostic, guide)'),
  topic_candidates: z.array(z.object({
    title: z.string(),
    angle: z.string(),
    hook_idea: z.string(),
    fit_score: z.number().min(0).max(100),
    ai_recommendation: z.string().optional(),
  })).default([]),
})

/** Delay utility for staggering parallel requests */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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

  const { tema, buyer_persona, region, research_id, pillar_id, pillar_name, pillar_description } = parsed.data

  // 4. Get workspace context and Google provider (needed for BYOK)
  const workspaceId = await getWorkspaceId()
  const googleProvider = await getGoogleProvider(workspaceId)

  try {
    // 4a. Build optimized prompt via ChatGPT
    const promptData = await buildResearchPrompt(tema, buyer_persona, region, pillar_name)
    const researchPrompt = promptData?.optimized_prompt ?? tema

    // 4b. Step 1: Grounded search via Gemini + Google Search
    // Build pillar focus instruction
    const pillarInstruction = pillar_name
      ? `\n\n## ENFOQUE TEMATICO (PILAR)\nEsta investigacion pertenece al pilar: "${pillar_name}"${pillar_description ? ` — ${pillar_description}` : ''}.\nTODOS los hallazgos y topics sugeridos deben estar alineados con este pilar. NO incluyas hallazgos o topics que no se relacionen directamente con este enfoque tematico.`
      : ''

    const systemPrompt = `Eres un analista de investigacion experto en el sector de O&M fotovoltaico (operacion y mantenimiento de plantas solares).

Tu mision es investigar temas del sector y producir un reporte detallado con hallazgos clave y contexto de mercado.

Reglas:
- Basa tus hallazgos en informacion verificable y reciente
- Cada finding debe incluir datos especificos (numeros, porcentajes, nombres de empresas)
- Para CADA hallazgo, indica claramente la fuente (URL, nombre del reporte, organizacion, o estudio)
- Prioriza informacion cuantitativa sobre opiniones
- NO inventes datos ni fuentes — solo incluye informacion verificable
- NO agregues enfoque en IA, machine learning o tecnologia a menos que el tema lo pida explicitamente
- Mantenete fiel al tema solicitado — no desvies la investigacion hacia temas adyacentes
${buyer_persona ? `- Enfoca para el perfil: ${buyer_persona}` : ''}
${region ? `- Region de interes: ${region}` : ''}${pillarInstruction}`

    // 4b-1. Multi-query parallel research (PRP-008 enhancement)
    // Use search_queries from prompt builder if available, otherwise use the main prompt
    const searchQueries = promptData?.search_queries?.length
      ? promptData.search_queries.slice(0, 5)
      : [researchPrompt]

    const searchResults = await Promise.allSettled(
      searchQueries.map((query: string, i: number) =>
        delay(i * 500).then(() =>
          generateText({
            model: googleProvider(GEMINI_MODEL),
            tools: {
              google_search: googleProvider.tools.googleSearch({}),
            },
            system: systemPrompt,
            prompt: query,
          })
        )
      )
    )

    // Merge all successful results
    const successfulTexts = searchResults
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<{ text: string }>).value.text)
      .filter(t => t.trim().length > 50)

    const mergedGroundedText = successfulTexts.length > 0
      ? successfulTexts.join('\n\n---\n\n')
      : ''

    // 4b-2. Iterative deepening: generate follow-up questions and research deeper
    let deepenedText = ''
    if (mergedGroundedText.length > 200) {
      try {
        const { text: followUpQuestions } = await generateText({
          model: googleProvider(GEMINI_MODEL),
          system: 'Genera 2 preguntas de seguimiento especificas para profundizar esta investigacion. Responde SOLO con las preguntas, una por linea.',
          prompt: mergedGroundedText.slice(0, 3000),
        })

        const questions = followUpQuestions.split('\n').filter(q => q.trim().length > 10).slice(0, 2)
        if (questions.length > 0) {
          const deepResults = await Promise.allSettled(
            questions.map((q, i) =>
              delay(i * 500).then(() =>
                generateText({
                  model: googleProvider(GEMINI_MODEL),
                  tools: { google_search: googleProvider.tools.googleSearch({}) },
                  system: systemPrompt,
                  prompt: q,
                })
              )
            )
          )
          deepenedText = deepResults
            .filter(r => r.status === 'fulfilled')
            .map(r => (r as PromiseFulfilledResult<{ text: string }>).value.text)
            .filter(t => t.trim().length > 50)
            .join('\n\n---\n\n')
        }
      } catch (deepErr) {
        // Non-fatal: iterative deepening is optional
        console.error('[grounded-research] Deepening failed (continuing):', deepErr)
      }
    }

    const groundedText = [mergedGroundedText, deepenedText].filter(Boolean).join('\n\n=== PROFUNDIZACION ===\n\n')

    // If grounded search returned empty text, use the original prompt as fallback
    const textForStructuring = groundedText.trim().length > 50
      ? groundedText
      : `Tema de investigacion: ${tema}\n\nPrompt: ${researchPrompt}\n\nGenera un analisis basado en tu conocimiento del sector fotovoltaico.`

    // 4c. Step 2: Structure into JSON via text mode (generateObject fails with long inputs)
    const pillarContextForStructuring = pillar_name
      ? `\n- PILAR TEMATICO: "${pillar_name}"${pillar_description ? ` (${pillar_description})` : ''}. Todos los topics deben alinearse con este pilar. Si un hallazgo no se relaciona con el pilar, NO generes un topic para el.`
      : ''

    const { text: jsonText } = await generateText({
      model: googleProvider(GEMINI_MODEL),
      system: `Responde UNICAMENTE con un objeto JSON valido. Sin markdown, sin backticks, sin texto antes o despues.
El JSON debe seguir esta estructura EXACTA:
{
  "summary": "resumen ejecutivo (1-3 parrafos)",
  "key_findings": [
    {"finding": "hallazgo con datos especificos", "relevance": "por que importa", "source": "nombre del reporte, organizacion, o URL de la fuente"}
  ],
  "suggested_topics": [
    {"title": "titulo del post", "angle": "angulo editorial basado en un hallazgo especifico", "hook_idea": "idea de gancho con dato extraido del hallazgo"}
  ],
  "market_context": "contexto de mercado",
  "sources": ["fuente 1 (URL o nombre del reporte)", "fuente 2"],
  "invisible_enemy": "El enemigo invisible: lo que la audiencia NO ve que le esta costando dinero. Debe ser especifico (ej: 'El PR que miente porque no mide soiling heterogeneo'), NO generico (ej: 'las perdidas ocultas')",
  "thesis": "Tesis contrarian principal de la investigacion. Una afirmacion que desafia la creencia instalada del sector. Especifica y provocadora.",
  "conversion_resource": "Que recurso concreto ofrecer en BOFU: checklist, diagnostico, guia, template, calculadora. Debe derivarse de los hallazgos.",
  "topic_candidates": [
    {"title": "titulo", "angle": "angulo editorial", "hook_idea": "idea de hook con dato", "fit_score": 85, "ai_recommendation": "por que este topic es bueno para LinkedIn"}
  ]
}
REGLAS:
- key_findings: minimo 3, maximo 8 items
- suggested_topics: minimo 3, maximo 6 items (backward compat)
- topic_candidates: 3-8 items con fit_score de 0-100 basado en potencial viral en LinkedIn
- fit_score: 90+ = viral potencial, 70-89 = solido, 50-69 = aceptable, <50 = debil
- CADA suggested_topic y topic_candidate DEBE derivarse de key_findings
- El "angle" debe referenciar el hallazgo especifico del que se deriva
- El "hook_idea" debe usar un dato concreto extraido de los hallazgos
- invisible_enemy: DEBE ser especifico al tema investigado, NO generico
- thesis: DEBE ser contrarian — desafiar una creencia comun del sector
- NO agregues angulos de IA o tecnologia que no esten en la investigacion
- CADA key_finding DEBE tener "source" con la fuente especifica
- "sources" debe listar TODAS las fuentes unicas referenciadas
- NO inventes fuentes — si no puedes atribuir un hallazgo, indica "Conocimiento del sector"${pillarContextForStructuring}`,
      prompt: `Estructura esta investigacion en JSON:\n\n${textForStructuring.slice(0, 8000)}`,
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
    const sources = Array.isArray(rawParsed.sources) ? rawParsed.sources.slice(0, 20) : []
    const topicCandidates = Array.isArray(rawParsed.topic_candidates) ? rawParsed.topic_candidates.slice(0, 8) : []
    rawParsed.key_findings = findings
    rawParsed.suggested_topics = topics
    rawParsed.sources = sources
    rawParsed.topic_candidates = topicCandidates

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
            ...(pillar_id ? { pillar_id } : {}),
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
