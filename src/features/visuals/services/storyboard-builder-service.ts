import { z } from 'zod'
import { generateText } from 'ai'
import { getModel } from '@/shared/lib/ai-router'
import { getPresetPromptFragment } from '../constants/aesthetic-presets'

const SLIDE_ROLES = ['cover', 'context', 'deep_dive', 'evidence', 'method', 'cta_close'] as const

const storyboardSchema = z.object({
  carousel_message: z.string(),
  slides: z.array(z.object({
    slide_index: z.number(),
    slide_role: z.enum(SLIDE_ROLES),
    headline: z.string(),
    subtitle: z.string().default(''),
    body_text: z.string(),
    visual_direction: z.string(),
  })).min(3).max(10),
})

export type StoryboardResult = z.infer<typeof storyboardSchema>

interface StoryboardInput {
  workspaceId: string
  postContent: string
  topicTitle: string
  funnelStage: string
  keyword?: string
  slideCount: number
  aestheticPreset: string
}

/**
 * Build a storyboard for a carousel from copy + topic + funnel stage.
 * Returns structured slide data ready for per-slide image generation.
 */
export async function buildStoryboard(input: StoryboardInput): Promise<StoryboardResult | null> {
  const { workspaceId, postContent, topicTitle, funnelStage, keyword, slideCount, aestheticPreset } = input

  const presetFragment = getPresetPromptFragment(aestheticPreset)

  const model = await getModel('generate-visual-json', workspaceId)

  const { text: jsonText } = await generateText({
    model,
    system: `Eres un director creativo especializado en carruseles de LinkedIn para el sector fotovoltaico B2B.

Tu tarea es crear un STORYBOARD para un carrusel de ${slideCount} slides basado en el copy y topic proporcionados.

REGLAS:
- Cada slide tiene un rol claro en la narrativa
- El carrusel funciona como un "curso acelerado" — no como una infografia comprimida
- Slide 1 SIEMPRE es cover/portada con hook visual fuerte
- Ultimo slide SIEMPRE es CTA/cierre
- Slides intermedios desarrollan la narrativa segun el funnel stage
- Headlines: max 8 palabras, impactantes
- Subtitles: max 15 palabras, contextualizan
- Body text: max 30 palabras, contenido clave
- Visual direction: descripcion breve de que debe mostrar la imagen

ESTETICA: ${presetFragment}

ROLES DISPONIBLES:
- cover: portada con hook visual. Titulo grande, subtitulo contextualizador
- context: contexto del problema/situacion. Datos macro, panorama
- deep_dive: profundizacion tecnica. Mecanismo, detalle, evidencia especifica
- evidence: dato de shock, cifra verificable, fuente citada
- method: solucion, framework, paso a paso
- cta_close: cierre con CTA, recurso, siguiente paso

Responde UNICAMENTE con JSON valido (sin markdown, sin backticks):
{
  "carousel_message": "mensaje general del carrusel en 1 oracion",
  "slides": [
    {
      "slide_index": 0,
      "slide_role": "cover",
      "headline": "Titulo impactante",
      "subtitle": "Contexto en 1 linea",
      "body_text": "Texto principal del slide",
      "visual_direction": "Descripcion de lo que debe mostrar la imagen"
    }
  ]
}`,
    prompt: `Crea un storyboard de ${slideCount} slides para este carrusel de LinkedIn:

COPY DEL POST:
${postContent.slice(0, 2000)}

TOPIC: ${topicTitle}
FUNNEL STAGE: ${funnelStage}
${keyword ? `KEYWORD: ${keyword}` : ''}

El carrusel debe complementar visualmente el copy, NO repetirlo textualmente.`,
  })

  const cleaned = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    // Attempt repair
    let repaired = jsonMatch[0].replace(/,\s*"[^"]*":\s*"[^"]*$/, '').replace(/,\s*"[^"]*$/, '')
    const ob = (repaired.match(/\[/g) ?? []).length - (repaired.match(/\]/g) ?? []).length
    const oc = (repaired.match(/\{/g) ?? []).length - (repaired.match(/\}/g) ?? []).length
    repaired += ']'.repeat(Math.max(0, ob)) + '}'.repeat(Math.max(0, oc))
    try { parsed = JSON.parse(repaired) } catch { return null }
  }

  const validated = storyboardSchema.safeParse(parsed)
  if (!validated.success) {
    console.error('[storyboard-builder] Validation failed:', validated.error.issues)
    return null
  }

  return validated.data
}
