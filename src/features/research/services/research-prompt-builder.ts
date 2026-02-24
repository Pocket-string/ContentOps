import { generateObject } from 'ai'
import { z } from 'zod'
import { openai, OPENAI_REVIEW_MODEL } from '@/shared/lib/openai-client'

const researchPromptSchema = z.object({
  optimized_prompt: z.string(),
  search_queries: z.array(z.string()).min(2).max(5),
})

/**
 * Uses ChatGPT to generate an optimized research prompt from user inputs.
 * Returns null gracefully if OPENAI_API_KEY is missing or call fails.
 */
export async function buildResearchPrompt(
  tema: string,
  buyerPersona?: string,
  region?: string
): Promise<{ optimized_prompt: string; search_queries: string[] } | null> {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback: simple template
    return {
      optimized_prompt: buildFallbackPrompt(tema, buyerPersona, region),
      search_queries: [tema],
    }
  }

  try {
    const result = await generateObject({
      model: openai(OPENAI_REVIEW_MODEL),
      schema: researchPromptSchema,
      system: `Eres un experto en investigacion de mercado para el sector de O&M fotovoltaico (operacion y mantenimiento de plantas solares).
Tu trabajo es transformar un tema simple en un prompt de investigacion profundo y optimizado.

Reglas:
- El prompt debe guiar una investigacion web exhaustiva
- Incluye preguntas especificas, metricas relevantes, y contexto del sector
- Los search queries deben ser terminos de busqueda concretos para encontrar datos recientes
- Enfocate en datos cuantitativos, tendencias de mercado, y mejores practicas operativas
- Adapta al buyer persona y region si se proporcionan`,
      prompt: `Genera un prompt de investigacion optimizado para el siguiente tema:

**Tema**: ${tema}
${buyerPersona ? `**Buyer Persona**: ${buyerPersona}` : ''}
${region ? `**Region de mercado**: ${region}` : ''}

El prompt debe servir para investigar este tema a fondo con busqueda web, enfocado en el sector de O&M fotovoltaico.`,
    })

    return result.object
  } catch (error) {
    console.warn('[research-prompt-builder] ChatGPT failed:', error instanceof Error ? error.message : error)
    // Fallback to simple template
    return {
      optimized_prompt: buildFallbackPrompt(tema, buyerPersona, region),
      search_queries: [tema],
    }
  }
}

function buildFallbackPrompt(tema: string, buyerPersona?: string, region?: string): string {
  let prompt = `Investiga a fondo sobre "${tema}" en el contexto del sector de O&M fotovoltaico (operacion y mantenimiento de plantas solares).`

  if (buyerPersona) {
    prompt += `\n\nEnfoca la investigacion para el perfil: ${buyerPersona}.`
  }

  if (region) {
    prompt += `\n\nRegion de interes: ${region}.`
  }

  prompt += `\n\nIncluye:
- Datos cuantitativos y estadisticas recientes
- Tendencias de mercado relevantes
- Mejores practicas y casos de estudio
- Fuentes verificables
- Implicaciones para estrategia de contenido en LinkedIn`

  return prompt
}
