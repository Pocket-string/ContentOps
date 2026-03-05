import { generateText } from 'ai'
import { getGoogleProvider } from '@/shared/lib/ai-router'
import { GEMINI_MODEL } from '@/shared/lib/gemini'
import { z } from 'zod'
import type { CreateTopicInput } from '@/shared/types/content-ops'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SelectedTopic {
  title: string
  angle: string
  hook_idea: string
}

interface ResearchContext {
  title: string
  summary?: string
  market_context?: string
  key_findings: Array<{ finding: string; relevance: string; source: string }>
  sources: string[]
  pillar_id?: string
  fit_score?: number
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const derivedTopicSchema = z.object({
  hypothesis: z.string(),
  evidence: z.string(),
  anti_myth: z.string(),
  silent_enemy_name: z.string(),
  minimal_proof: z.string(),
  failure_modes: z.array(z.string()).min(1).max(5),
  expected_business_impact: z.string(),
  signals_json: z.array(z.string()).min(1).max(5),
})

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Uses AI to intelligently derive a Topic from a Research, extracting
 * ONLY the findings relevant to the specific selected topic.
 *
 * Returns a Partial<CreateTopicInput> with AI-mapped fields.
 * Falls back to empty object if AI fails (caller should use manual mapping).
 */
export async function deriveTopicFromResearch(
  workspaceId: string,
  research: ResearchContext,
  selectedTopic: SelectedTopic
): Promise<Partial<CreateTopicInput>> {
  try {
    const googleProvider = await getGoogleProvider(workspaceId)

    // Build findings context — numbered for AI reference
    const findingsText = research.key_findings
      .map((f, i) => `${i + 1}. ${f.finding}\n   Relevancia: ${f.relevance}\n   Fuente: ${f.source}`)
      .join('\n\n')

    const sourcesText = research.sources.length > 0
      ? research.sources.join('\n')
      : 'No hay fuentes adicionales disponibles'

    const { text: jsonText } = await generateText({
      model: googleProvider(GEMINI_MODEL),
      system: `Eres un estratega de contenido B2B para LinkedIn especializado en O&M fotovoltaico.

Tu tarea: dado un tema ESPECIFICO seleccionado de una investigacion, extraer SOLO la informacion relevante para ESE tema y mapearla a los campos de un Topic de contenido.

REGLAS CRITICAS:
- SOLO incluye informacion directamente relacionada con el tema seleccionado
- NO copies todos los hallazgos — selecciona UNICAMENTE los 2-3 mas relevantes para este tema
- Cada campo debe ser ESPECIFICO para este tema, NO generico sobre toda la investigacion
- Usa datos concretos (%, numeros, rangos) cuando esten disponibles en los hallazgos
- El "hypothesis" es una creencia del mercado que este tema desafia (contrarian)
- El "anti_myth" es un mito concreto que este tema derriba
- El "silent_enemy_name" es un nombre corto y memorable (3-6 palabras) del problema oculto
- Las "failure_modes" son formas concretas en que este problema se manifiesta en campo
- El "expected_business_impact" debe cuantificar el impacto con datos del hallazgo
- Las "signals_json" son senales observables en el mercado/datos que validan este tema
- Responde UNICAMENTE con JSON valido, sin markdown, sin backticks, sin texto adicional`,

      prompt: `## TEMA SELECCIONADO
Titulo: ${selectedTopic.title}
Angulo: ${selectedTopic.angle}
Hook: ${selectedTopic.hook_idea}

## INVESTIGACION COMPLETA
Resumen: ${research.summary ?? 'N/A'}
Contexto de mercado: ${research.market_context ?? 'N/A'}

### Hallazgos clave:
${findingsText}

### Fuentes:
${sourcesText}

## GENERA EL SIGUIENTE JSON
{
  "hypothesis": "Creencia del mercado que este tema desafia — formulada como afirmacion contrarian que provoque debate (1-2 oraciones)",
  "evidence": "Los 2-3 hallazgos MAS relevantes para este tema, con datos concretos y fuentes. SOLO los que se relacionan directamente con '${selectedTopic.title}'",
  "anti_myth": "Un mito especifico del sector que este tema derriba, basado en los hallazgos relevantes (1-2 oraciones)",
  "silent_enemy_name": "Nombre corto del enemigo silencioso (3-6 palabras, ej: 'El PR que miente', 'La limpieza que no limpia')",
  "minimal_proof": "Las 2-3 fuentes verificables MAS relevantes para este tema especifico",
  "failure_modes": ["Modo de falla concreto 1", "Modo de falla 2", "Modo de falla 3"],
  "expected_business_impact": "Impacto de negocio cuantificable de este problema especifico (2-3 oraciones con datos del hallazgo)",
  "signals_json": ["Senal observable 1", "Senal observable 2", "Senal observable 3"]
}`,
    })

    // Parse JSON from response
    const cleaned = jsonText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[topic-derivation] No JSON found in AI response')
      return {}
    }

    const parsed = JSON.parse(jsonMatch[0]) as unknown
    const validated = derivedTopicSchema.safeParse(parsed)

    if (!validated.success) {
      console.error('[topic-derivation] Validation failed:', validated.error.issues)
      return {}
    }

    return {
      title: selectedTopic.title,
      hypothesis: validated.data.hypothesis,
      evidence: validated.data.evidence,
      anti_myth: validated.data.anti_myth,
      silent_enemy_name: validated.data.silent_enemy_name,
      minimal_proof: validated.data.minimal_proof,
      failure_modes: validated.data.failure_modes,
      expected_business_impact: validated.data.expected_business_impact,
      signals_json: validated.data.signals_json,
      fit_score: research.fit_score,
      priority: 'high',
      pillar_id: research.pillar_id,
    }
  } catch (error) {
    console.error('[topic-derivation] AI derivation failed:', error)
    return {}
  }
}
