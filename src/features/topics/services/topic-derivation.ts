import { generateText } from 'ai'
import { getModel } from '@/shared/lib/ai-router'
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
// Schema — enriched for campaign self-sufficiency
// ---------------------------------------------------------------------------

const keyDataPointSchema = z.object({
  stat: z.string(),
  source: z.string(),
  context: z.string(),
})

const derivedTopicSchema = z.object({
  // Core topic fields
  hypothesis: z.string(),
  evidence: z.string(),
  anti_myth: z.string(),
  silent_enemy_name: z.string(),
  minimal_proof: z.string(),
  failure_modes: z.array(z.string()).min(2).max(5),
  expected_business_impact: z.string(),
  signals_json: z.array(z.string()).min(2).max(5),
  // Campaign-ready fields (deep investigation)
  source_context: z.string(),
  content_angles: z.array(z.string()).min(5).max(7),
  key_data_points: z.array(keyDataPointSchema).min(3).max(8),
  target_audience: z.string(),
  market_context: z.string(),
})

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Deep AI investigation: given a specific topic angle from a Research,
 * generates a self-sufficient Topic with enough context for a full
 * weekly campaign (5-7 LinkedIn posts).
 *
 * Phase A: Extracts relevant findings from the parent research.
 * Phase B: AI generates all topic fields + campaign-ready fields.
 *
 * Returns Partial<CreateTopicInput> — empty {} on total failure.
 */
export async function deriveTopicFromResearch(
  workspaceId: string,
  research: ResearchContext,
  selectedTopic: SelectedTopic
): Promise<Partial<CreateTopicInput>> {
  try {
    // Get model (uses BYOK if available, falls back to global key)
    const model = await getModel('synthesize-research', workspaceId)

    // Phase A: Build findings context — numbered for AI reference
    const findingsText = research.key_findings.length > 0
      ? research.key_findings
          .map((f, i) => `${i + 1}. ${f.finding}\n   Relevancia: ${f.relevance}\n   Fuente: ${f.source}`)
          .join('\n\n')
      : 'No hay hallazgos disponibles'

    const sourcesText = research.sources.length > 0
      ? research.sources.join('\n')
      : 'No hay fuentes adicionales disponibles'

    // Phase B: Deep investigation prompt
    const { text: jsonText } = await generateText({
      model,
      system: `Eres un estratega de contenido B2B para LinkedIn especializado en O&M fotovoltaico.

MISION: Dado un tema ESPECIFICO seleccionado de una investigacion, generar una INVESTIGACION PROFUNDA enfocada exclusivamente en ese tema. El resultado debe contener suficiente informacion para alimentar una campana semanal de 5-7 posts de LinkedIn.

REGLAS CRITICAS:
- SOLO incluye informacion directamente relacionada con el tema seleccionado
- NO copies todos los hallazgos — selecciona UNICAMENTE los mas relevantes
- Cada campo debe ser ESPECIFICO para este tema, NO generico
- Usa datos concretos (%, numeros, rangos) cuando esten disponibles
- NUNCA inventes estadisticas — si no hay datos, di "la evidencia indica" o "segun fuentes del sector"
- Los "content_angles" son 5-7 angulos DISTINTOS para posts individuales de una campana semanal
- Cada angulo debe ser suficientemente diferente para funcionar como post independiente
- Los "key_data_points" son datos verificables con fuente que el copywriter puede citar textualmente

Responde UNICAMENTE con JSON valido, sin markdown, sin backticks, sin texto adicional.`,

      prompt: `## TEMA SELECCIONADO PARA INVESTIGACION PROFUNDA
Titulo: ${selectedTopic.title}
Angulo: ${selectedTopic.angle}
Hook: ${selectedTopic.hook_idea}

## INVESTIGACION FUENTE (contexto original)
Titulo de la investigacion: ${research.title}
Resumen: ${research.summary ?? 'N/A'}
Contexto de mercado: ${research.market_context ?? 'N/A'}

### Hallazgos clave de la investigacion:
${findingsText}

### Fuentes disponibles:
${sourcesText}

## GENERA EL SIGUIENTE JSON COMPLETO

Importante: Este JSON debe contener TODA la informacion necesaria para crear una campana semanal de 5-7 posts de LinkedIn sobre "${selectedTopic.title}".

{
  "hypothesis": "Creencia del mercado que este tema desafia — formulada como afirmacion contrarian que provoque debate (1-2 oraciones)",
  "evidence": "Los 2-3 hallazgos MAS relevantes para este tema, con datos concretos y fuentes",
  "anti_myth": "Un mito especifico del sector que este tema derriba (1-2 oraciones)",
  "silent_enemy_name": "Nombre corto del enemigo silencioso (3-6 palabras, ej: 'El PR que miente')",
  "minimal_proof": "Las 2-3 fuentes verificables MAS relevantes para este tema",
  "failure_modes": ["Modo de falla concreto 1", "Modo de falla 2", "Modo de falla 3"],
  "expected_business_impact": "Impacto de negocio cuantificable (2-3 oraciones con datos)",
  "signals_json": ["Senal observable 1", "Senal observable 2", "Senal observable 3"],
  "source_context": "Resumen consolidado de los hallazgos y datos relevantes de la investigacion original que aplican a este tema (3-5 oraciones con datos concretos)",
  "content_angles": [
    "Angulo para post 1 (TOFU: identificar dolor oculto — hook provocador)",
    "Angulo para post 2 (MOFU: profundizar diagnostico — educativo tecnico)",
    "Angulo para post 3 (TOFU: revelar que hay solucion — esperanzador)",
    "Angulo para post 4 (MOFU: demostrar con evidencia — caso concreto)",
    "Angulo para post 5 (BOFU: convertir en contacto — social proof + urgencia)"
  ],
  "key_data_points": [
    {"stat": "Dato verificable 1 (con numero/porcentaje)", "source": "Fuente del dato", "context": "Por que este dato importa para el tema"},
    {"stat": "Dato verificable 2", "source": "Fuente", "context": "Contexto"},
    {"stat": "Dato verificable 3", "source": "Fuente", "context": "Contexto"}
  ],
  "target_audience": "Perfil especifico del buyer persona para este tema (rol, industria, dolor principal, nivel de decision)",
  "market_context": "Situacion actual del mercado relevante a este tema (tendencias, regulaciones, presion competitiva — 2-3 oraciones)"
}`,
    })

    // Parse JSON from response
    const cleaned = jsonText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[topic-derivation] No JSON found in AI response. Raw text:', jsonText.slice(0, 300))
      return {}
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('[topic-derivation] JSON parse failed:', parseError instanceof Error ? parseError.message : parseError)
      console.error('[topic-derivation] Raw JSON attempt:', jsonMatch[0].slice(0, 500))
      return {}
    }

    const validated = derivedTopicSchema.safeParse(parsed)

    if (!validated.success) {
      console.error('[topic-derivation] Zod validation failed:', JSON.stringify(validated.error.issues, null, 2))
      // Attempt partial salvage: use the raw parsed data for fields that passed
      const partial = parsed as Record<string, unknown>
      const salvaged: Partial<CreateTopicInput> = {
        title: selectedTopic.title,
        priority: 'high',
        pillar_id: research.pillar_id,
        fit_score: research.fit_score,
      }
      if (typeof partial.hypothesis === 'string') salvaged.hypothesis = partial.hypothesis
      if (typeof partial.evidence === 'string') salvaged.evidence = partial.evidence
      if (typeof partial.anti_myth === 'string') salvaged.anti_myth = partial.anti_myth
      if (typeof partial.silent_enemy_name === 'string') salvaged.silent_enemy_name = partial.silent_enemy_name
      if (typeof partial.minimal_proof === 'string') salvaged.minimal_proof = partial.minimal_proof
      if (typeof partial.expected_business_impact === 'string') salvaged.expected_business_impact = partial.expected_business_impact
      if (typeof partial.source_context === 'string') salvaged.source_context = partial.source_context
      if (typeof partial.target_audience === 'string') salvaged.target_audience = partial.target_audience
      if (typeof partial.market_context === 'string') salvaged.market_context = partial.market_context
      if (Array.isArray(partial.failure_modes)) {
        salvaged.failure_modes = partial.failure_modes.filter((f): f is string => typeof f === 'string')
      }
      if (Array.isArray(partial.signals_json)) {
        salvaged.signals_json = partial.signals_json.filter((s): s is string => typeof s === 'string')
      }
      if (Array.isArray(partial.content_angles)) {
        salvaged.content_angles = partial.content_angles.filter((a): a is string => typeof a === 'string')
      }
      if (Array.isArray(partial.key_data_points)) {
        const kdpSchema = z.array(keyDataPointSchema)
        const kdpResult = kdpSchema.safeParse(partial.key_data_points)
        if (kdpResult.success) salvaged.key_data_points = kdpResult.data
      }
      console.info('[topic-derivation] Partial salvage applied:', Object.keys(salvaged).length, 'fields')
      return salvaged
    }

    console.info('[topic-derivation] Deep derivation succeeded for:', selectedTopic.title)

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
      // Campaign-ready fields
      source_context: validated.data.source_context,
      content_angles: validated.data.content_angles,
      key_data_points: validated.data.key_data_points,
      target_audience: validated.data.target_audience,
      market_context: validated.data.market_context,
      // Inherited from research
      fit_score: research.fit_score,
      priority: 'high',
      pillar_id: research.pillar_id,
    }
  } catch (error) {
    console.error(
      '[topic-derivation] AI derivation failed:',
      error instanceof Error ? `${error.name}: ${error.message}` : error
    )
    return {}
  }
}
