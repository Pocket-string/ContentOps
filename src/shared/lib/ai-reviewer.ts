import { generateObject } from 'ai'
import { openai, OPENAI_REVIEW_MODEL } from './openai-client'
import { copyReviewSchema, visualReviewSchema } from '../types/ai-review'
import type { CopyReview, VisualReview } from '../types/ai-review'

/**
 * Reviews generated copy using ChatGPT (gpt-4o-mini).
 * Returns null gracefully if OPENAI_API_KEY is missing or call fails.
 */
export async function reviewCopy(
  content: string,
  variant: string,
  funnelStage: string
): Promise<CopyReview | null> {
  if (!process.env.OPENAI_API_KEY) return null

  try {
    const result = await generateObject({
      model: openai(OPENAI_REVIEW_MODEL),
      schema: copyReviewSchema,
      system: `Eres un editor senior de contenido LinkedIn para el sector de O&M fotovoltaico (Bitalize).
Tu trabajo es dar una segunda opinion rapida sobre un copy generado por IA.

Evalua:
- Claridad del hook y CTA
- Adecuacion al funnel stage (TOFU=awareness, MOFU=consideration, BOFU=decision)
- Tono profesional pero accesible
- Longitud apropiada para LinkedIn (150-300 palabras ideal)
- Uso de datos o evidencia cuando aplica

Se conciso y accionable. Maximo 3 fortalezas, 3 debilidades.`,
      prompt: `Evalua este copy de LinkedIn:

**Variante**: ${variant}
**Etapa del funnel**: ${funnelStage}

**Contenido**:
${content}

Proporciona score (0-10), fortalezas, debilidades, recomendacion y resumen de una linea.`,
    })

    return result.object
  } catch (error) {
    console.warn('[ai-reviewer] Copy review failed:', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Reviews generated visual prompt JSON using ChatGPT (gpt-4o-mini).
 * Returns null gracefully if OPENAI_API_KEY is missing or call fails.
 */
export async function reviewVisualJson(
  promptJson: Record<string, unknown>,
  postContent: string
): Promise<VisualReview | null> {
  if (!process.env.OPENAI_API_KEY) return null

  try {
    const result = await generateObject({
      model: openai(OPENAI_REVIEW_MODEL),
      schema: visualReviewSchema,
      system: `Eres un director de arte senior que revisa prompts visuales para LinkedIn de Bitalize (O&M fotovoltaico).
Tu trabajo es dar una segunda opinion rapida sobre un prompt visual generado por IA.

Evalua:
- Coherencia entre el visual propuesto y el contenido del post
- Alineacion con la marca Bitalize (colores: #1E3A5F, #F97316, #10B981; estilo editorial/fotografico)
- Legibilidad en movil (no demasiado texto, buen contraste)
- Calidad tecnica del prompt (especificidad, ausencia de ambiguedades)

Se conciso. Maximo 3 issues.`,
      prompt: `Evalua este prompt visual de LinkedIn:

**Prompt JSON**:
${JSON.stringify(promptJson, null, 2)}

**Contenido del post asociado**:
${postContent}

Proporciona coherence_score (0-10), brand_alignment, issues, recomendacion y resumen de una linea.`,
    })

    return result.object
  } catch (error) {
    console.warn('[ai-reviewer] Visual review failed:', error instanceof Error ? error.message : error)
    return null
  }
}
