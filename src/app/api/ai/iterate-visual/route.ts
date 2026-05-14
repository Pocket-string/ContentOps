import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { generateObjectWithFallback, getModel } from '@/shared/lib/ai-router'
import { visualPromptSchemaV2, carouselPlanSchema, VISUAL_TYPE_OPTIONS } from '@/features/visuals/schemas/visual-prompt-schema'
import { normalizeCarouselPlan } from '@/features/visuals/utils/normalize-carousel'
import {
  BRAND_LOGO_DESCRIPTION,
  BRAND_SIGNATURE,
  BRAND_COLORS_SEMANTIC,
  NEGATIVE_PROMPTS,
} from '@/features/visuals/constants/brand-rules'
import { getActiveBrandProfile } from '@/features/brand/services/brand-service'

// Output schema — updated V2 prompt plus explicit changelog
const iterateOutputSchema = z.object({
  prompt: visualPromptSchemaV2,
  changes_made: z.array(z.string()).min(1),
})

export type IterateVisualOutput = z.infer<typeof iterateOutputSchema>

// Input schema — validated before touching the AI
const iterateInputSchema = z.object({
  current_prompt_json: z.record(z.unknown()),
  feedback: z.string().min(1, 'El feedback es requerido'),
  concept_type: z.enum(['single', 'carousel_4x5']).optional(),
})

// Shared brand identity block for system prompts
function buildBrandIdentityBlock(sigText: string, logoDesc: string): string {
  return `## LOGO — POST-PROCESADO (NO DIBUJAR)

El logo real se composita automaticamente en post-procesamiento como pill glass-morphism en la esquina inferior derecha.
- NO dibujar logo, banda blanca, ni reservar espacio
- Usar el canvas COMPLETO para contenido
- Mantener esquina inferior derecha (~22% x 10%) relativamente limpia

## FIRMA DEL AUTOR

Incluir: "${sigText}" — ${BRAND_SIGNATURE.default_placement}

## IDENTIDAD DE MARCA BITALIZE (restricciones inamovibles)

- Primario: ${BRAND_COLORS_SEMANTIC.primary} (azul oscuro — confianza)
- Secundario: ${BRAND_COLORS_SEMANTIC.secondary} (naranja — energia)
- Acento: ${BRAND_COLORS_SEMANTIC.accent} (verde — sostenibilidad)
- Texto principal: ${BRAND_COLORS_SEMANTIC.text_main}
- Texto secundario: ${BRAND_COLORS_SEMANTIC.text_secondary}
- Fondo: ${BRAND_COLORS_SEMANTIC.background} o ${BRAND_COLORS_SEMANTIC.background_dark}
- Tipografia: Inter, sans-serif
- Estilo: Infografia educativa estilo NotebookLM, editorial, siempre full color

**Negative prompts permanentes**: ${NEGATIVE_PROMPTS.join(', ')}`
}

export async function POST(request: Request): Promise<Response> {
  // 1. Auth
  const user = await requireAuth()

  // 2. Rate limit (10 req/min per user)
  const rateLimitResult = aiRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  // 3. Validate input with Zod
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo de la solicitud invalido' }, { status: 400 })
  }

  const parsed = iterateInputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  // 4. Get workspace context
  const workspaceId = await getWorkspaceId()

  const { current_prompt_json, feedback, concept_type } = parsed.data

  // 4b. Fetch brand profile for author signature + logo context
  const brandResult = await getActiveBrandProfile(workspaceId)
  const brand = brandResult.data
  const authorSignature = brand?.author_signature ?? BRAND_SIGNATURE.text
  const logoDescription = brand?.logo_urls?.length
    ? `${brand.logo_urls.map(l => l.name).join(', ')} logo. ${BRAND_LOGO_DESCRIPTION.reference_description}`
    : BRAND_LOGO_DESCRIPTION.reference_description
  const brandBlock = buildBrandIdentityBlock(authorSignature, logoDescription)

  // 5. Detect carousel vs single-image
  const isCarousel = concept_type === 'carousel_4x5' || (
    Array.isArray(current_prompt_json.slides) && current_prompt_json.slides.length >= 2
  )

  try {
    if (isCarousel) {
      return await iterateCarousel(current_prompt_json, feedback, workspaceId, brandBlock)
    }
    return await iterateSingleImage(current_prompt_json, feedback, workspaceId, brandBlock)
  } catch (error) {
    console.error('[iterate-visual] AI error:', error)
    return Response.json(
      { error: 'Error al iterar el prompt visual. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}

// ============================================
// Single-image iteration (existing behavior)
// ============================================

async function iterateSingleImage(
  current_prompt_json: Record<string, unknown>,
  feedback: string,
  workspaceId: string,
  brandBlock: string
): Promise<Response> {
  const isV1Input = 'scene' in current_prompt_json && 'composition' in current_prompt_json
  const isV2Input = 'meta' in current_prompt_json && 'layout' in current_prompt_json && 'content' in current_prompt_json

  const result = await generateObjectWithFallback({
    task: 'iterate-visual',
    workspaceId,
    schema: iterateOutputSchema,
    system: `Eres el Director de Arte Senior de Bitalize que itera sobre prompts visuales para LinkedIn.

Tu trabajo: aplicar el feedback del editor al prompt JSON visual existente y devolver una version MEJORADA en schema V2 junto con una lista de cambios.

${isV1Input ? `## IMPORTANTE: UPGRADE V1 → V2
El prompt actual usa el schema antiguo (V1: scene/composition/text_overlay/style/brand/technical). Tu output DEBE ser schema V2 (meta/brand/layout/content/style_guidelines/negative_prompts/prompt_overall). Migra toda la informacion del V1 al V2 y ademas aplica el feedback.` : ''}

${brandBlock}

## REGLAS DE ITERACION

1. Aplica SOLO los cambios que el feedback solicita — no alteres lo que no se pide cambiar
2. Manten las restricciones de marca aunque el feedback contradiga alguna (explica en changes_made)
3. Si el feedback es ambiguo, interpreta de forma conservadora
4. Documenta CADA cambio en changes_made: "[campo]: [descripcion]"
5. SIEMPRE regenera prompt_overall completo incorporando todos los cambios

REGLA CRITICA PARA prompt_overall:
- NUNCA escribir "Inter Bold, 48px, #FFFFFF" — aparecera LITERALMENTE como texto visible en la imagen
- EN VEZ DE specs CSS → describir visualmente: "Large bold white headline at the top"
- Hex codes, font names, pixel sizes van en campos ESTRUCTURADOS, NO en prompt_overall
- prompt_overall describe la IMAGEN como la veria un fotografo/ilustrador`,
    prompt: `**Prompt visual actual** (${isV1Input ? 'schema V1 — migrar a V2' : isV2Input ? 'schema V2' : 'formato desconocido — migrar a V2'}):
${JSON.stringify(current_prompt_json, null, 2)}

**Feedback del editor**:
${feedback}

Genera la version actualizada en schema V2 aplicando exactamente el feedback. Lista todos los cambios en changes_made.${isV1Input ? ' Incluye "V1→V2 migration" como primer item en changes_made.' : ''}`,
  })

  return Response.json({ data: result.object })
}

// ============================================
// Carousel iteration (preserves multi-slide format)
// ============================================

async function iterateCarousel(
  current_prompt_json: Record<string, unknown>,
  feedback: string,
  workspaceId: string,
  brandBlock: string
): Promise<Response> {
  // Per CLAUDE.md: generateObject ALWAYS fails with Gemini for long inputs.
  // Carousel plans are large (~5-8K chars), so use generateText + manual JSON parse.
  const { generateText } = await import('ai')

  const currentSlides = Array.isArray(current_prompt_json.slides) ? current_prompt_json.slides : []
  const slideCount = currentSlides.length

  const system = `Eres el Director de Arte Senior de Bitalize que itera sobre PLANES DE CARRUSEL para LinkedIn.

Tu trabajo: aplicar el feedback del editor al plan de carrusel existente, manteniendo el formato 4:5 vertical (1080x1350) de carrusel de LinkedIn.

${brandBlock}

## REGLAS DE ITERACION PARA CARRUSEL

1. MANTENER el formato de carrusel: la salida DEBE tener la misma estructura con meta, global_style, slides[], style_guidelines, negative_prompts
2. MANTENER el mismo numero de slides (${slideCount}) a menos que el feedback pida agregar o eliminar
3. Aplica SOLO los cambios que el feedback solicita — no alteres slides que no se mencionan
4. Si el feedback aplica a UN slide especifico, modifica solo ese slide
5. Si el feedback aplica a TODO el carrusel (estilo, colores, etc.), actualiza global_style, style_guidelines, Y cada prompt_overall
6. Documenta CADA cambio en changes_made: "[slide N / campo]: [descripcion]"
7. SIEMPRE regenera prompt_overall de cada slide afectado

REGLA CRITICA PARA prompt_overall de cada slide:
- NUNCA escribir "Inter Bold, 48px, #FFFFFF" — aparecera LITERALMENTE como texto visible en la imagen
- EN VEZ DE specs CSS → describir visualmente: "Large bold white headline at the top"
- Hex codes, font names, pixel sizes van en campos ESTRUCTURADOS, NO en prompt_overall
- prompt_overall describe la IMAGEN como la veria un fotografo/ilustrador

## TIPOS VISUALES VALIDOS
${VISUAL_TYPE_OPTIONS.join(', ')}

## ROLES DE SLIDE VALIDOS
cover_hook, problem, evidence, supporting, solution, cta_close

CRITICO: Tu respuesta DEBE ser UNICAMENTE un objeto JSON valido. Sin markdown, sin backticks, sin texto adicional. Solo el JSON.

Estructura requerida:
{
  "carousel_plan": { ...el plan actualizado con la misma estructura... },
  "changes_made": ["cambio 1", "cambio 2"]
}`

  const prompt = `**Plan de carrusel actual** (${slideCount} slides):
${JSON.stringify(current_prompt_json, null, 2)}

**Feedback del editor**:
${feedback}

Genera la version actualizada del plan de carrusel aplicando exactamente el feedback. Mantiene la estructura de carrusel con ${slideCount} slides. Lista todos los cambios en changes_made.`

  const model = await getModel('iterate-visual', workspaceId)
  const textResult = await generateText({ model, system, prompt })

  // Parse response — strip markdown fences if present
  let rawJson: unknown
  try {
    const clean = textResult.text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    rawJson = JSON.parse(clean)
  } catch {
    console.error('[iterate-visual] Carousel JSON parse error:', textResult.text.slice(0, 500))
    return Response.json(
      { error: 'La IA no devolvio un JSON valido para la iteracion del carrusel. Intenta de nuevo.' },
      { status: 500 }
    )
  }

  // Extract carousel_plan and changes_made from response
  const raw = rawJson as Record<string, unknown>
  const carouselPlan = (raw.carousel_plan ?? raw) as Record<string, unknown>
  const changesMade = Array.isArray(raw.changes_made)
    ? raw.changes_made.filter((c): c is string => typeof c === 'string')
    : ['Iteracion aplicada']

  // Normalize and validate with carouselPlanSchema
  const normalized = normalizeCarouselPlan(carouselPlan, slideCount)
  const validated = carouselPlanSchema.safeParse(normalized)

  if (!validated.success) {
    console.error('[iterate-visual] Carousel validation error after normalization:', validated.error.issues.map(i => `${i.path.join('.')}: ${i.message}`))
    // Return normalized data anyway — it's been coerced to be safe
    return Response.json({
      data: { prompt: normalized, changes_made: changesMade }
    })
  }

  return Response.json({
    data: { prompt: validated.data, changes_made: changesMade }
  })
}
