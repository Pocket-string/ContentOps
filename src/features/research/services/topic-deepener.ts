import { z } from 'zod'
import { generateText } from 'ai'
import { getGoogleProvider } from '@/shared/lib/ai-router'
import { GEMINI_MODEL } from '@/shared/lib/gemini'
import { createClient } from '@/lib/supabase/server'

// Schema for the topic deepening output
const topicDeepeningSchema = z.object({
  subproblems: z.array(z.string()).min(2).max(8),
  specific_evidence: z.array(z.object({
    fact: z.string(),
    source: z.string(),
  })).min(2).max(10),
  daily_angles: z.array(z.object({
    day: z.number().min(1).max(5),
    angle: z.string(),
    funnel_stage: z.string(),
  })).min(3).max(5),
  objections: z.array(z.string()).min(1).max(5),
  cta_suggestions: z.array(z.string()).min(1).max(5),
})

export type TopicDeepeningResult = z.infer<typeof topicDeepeningSchema>

interface TopicDeepeningInput {
  workspaceId: string
  researchId: string
  topicTitle: string
  hypothesis: string | null
  silentEnemyName: string | null
  evidence: string | null
  contentAngles: string[]
  existingSynthesis: Record<string, unknown> | null
}

/**
 * Executes a second-pass focused research on a selected topic.
 * Gathers specific evidence, sub-problems, daily angles, objections, and CTA suggestions
 * to support a full 5-day campaign.
 */
export async function deepenTopic(input: TopicDeepeningInput): Promise<TopicDeepeningResult | null> {
  const {
    workspaceId,
    researchId,
    topicTitle,
    hypothesis,
    silentEnemyName,
    evidence,
    contentAngles,
    existingSynthesis,
  } = input

  const googleProvider = await getGoogleProvider(workspaceId)

  const contextBlock = [
    `Tema: ${topicTitle}`,
    hypothesis ? `Hipotesis contrarian: ${hypothesis}` : '',
    silentEnemyName ? `Enemigo invisible: ${silentEnemyName}` : '',
    evidence ? `Evidencia inicial: ${evidence}` : '',
    contentAngles.length > 0 ? `Angulos de contenido ya derivados:\n${contentAngles.map((a, i) => `  ${i + 1}. ${a}`).join('\n')}` : '',
    existingSynthesis?.summary ? `Resumen de investigacion original: ${String(existingSynthesis.summary).slice(0, 1000)}` : '',
  ].filter(Boolean).join('\n\n')

  // Step 1: Focused Google Search on the specific topic
  let searchResults = ''
  try {
    const queries = [
      `${topicTitle} O&M fotovoltaico datos recientes`,
      hypothesis ? `${hypothesis} evidencia solar energy` : `${topicTitle} solar performance data`,
    ]

    const results = await Promise.allSettled(
      queries.map((q, i) =>
        new Promise<string>(resolve => setTimeout(resolve, i * 500)).then(() => '').then(() =>
          generateText({
            model: googleProvider(GEMINI_MODEL),
            tools: { google_search: googleProvider.tools.googleSearch({}) },
            system: `Eres un investigador especializado en O&M fotovoltaico. Busca informacion especifica, datos verificables, y casos concretos sobre el tema dado. NO generalices.`,
            prompt: q,
          }).then(r => r.text)
        )
      )
    )

    searchResults = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<string>).value)
      .filter(t => t.trim().length > 50)
      .join('\n\n---\n\n')
  } catch (searchErr) {
    console.error('[topic-deepener] Search failed (continuing with context only):', searchErr)
  }

  // Step 2: Structure the deepened data
  const structuringPrompt = `Profundiza en este topic para construir una campana semanal de LinkedIn (L-V, 5 posts).

CONTEXTO DEL TOPIC:
${contextBlock}

${searchResults ? `INVESTIGACION ADICIONAL:\n${searchResults.slice(0, 5000)}` : ''}

Responde UNICAMENTE con JSON valido (sin markdown, sin backticks):
{
  "subproblems": ["subproblema narrable 1", "subproblema narrable 2", ...],
  "specific_evidence": [
    {"fact": "dato o cifra verificable", "source": "fuente especifica"}
  ],
  "daily_angles": [
    {"day": 1, "angle": "angulo para Lunes (TOFU Problema)", "funnel_stage": "tofu_problem"},
    {"day": 2, "angle": "angulo para Martes (MOFU Problema)", "funnel_stage": "mofu_problem"},
    {"day": 3, "angle": "angulo para Miercoles (TOFU Solucion)", "funnel_stage": "tofu_solution"},
    {"day": 4, "angle": "angulo para Jueves (MOFU Solucion)", "funnel_stage": "mofu_solution"},
    {"day": 5, "angle": "angulo para Viernes (BOFU Conversion)", "funnel_stage": "bofu_conversion"}
  ],
  "objections": ["objecion frecuente 1", "objecion frecuente 2"],
  "cta_suggestions": ["CTA sugerido para BOFU 1", "CTA sugerido 2"]
}

REGLAS:
- subproblems: 3-6 subproblemas NARRABLES (historias de terreno, escenas concretas, no abstracciones)
- specific_evidence: cifras verificables con fuente. Si no hay fuente verificada, indicar "Evidencia de campo"
- daily_angles: EXACTAMENTE 5, uno por dia L-V, siguiendo el funnel TOFU→MOFU→BOFU
- Cada angulo debe ser DIFERENTE y usar evidencia distinta
- objections: objeciones reales que un Asset Manager o O&M Manager haria
- cta_suggestions: CTAs concretos para el recurso de conversion (DM, checklist, diagnostico)`

  try {
    const { text: jsonText } = await generateText({
      model: googleProvider(GEMINI_MODEL),
      system: structuringPrompt,
      prompt: `Profundiza el topic: "${topicTitle}"`,
    })

    const cleaned = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[topic-deepener] No JSON found in response')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])
    const validated = topicDeepeningSchema.safeParse(parsed)
    if (!validated.success) {
      console.error('[topic-deepener] Validation failed:', validated.error.issues)
      return null
    }

    // Persist to research_reports
    try {
      const supabase = await createClient()
      await supabase
        .from('research_reports')
        .update({ topic_deepening_json: validated.data })
        .eq('id', researchId)
    } catch (persistErr) {
      console.error('[topic-deepener] Failed to persist (non-fatal):', persistErr)
    }

    return validated.data
  } catch (err) {
    console.error('[topic-deepener] Failed:', err)
    return null
  }
}
