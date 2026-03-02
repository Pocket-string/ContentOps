import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { generateObjectWithFallback } from '@/shared/lib/ai-router'
import { visualPromptSchemaV2 } from '@/features/visuals/schemas/visual-prompt-schema'
import {
  BRAND_LOGO_DESCRIPTION,
  BRAND_SIGNATURE,
  BRAND_COLORS_SEMANTIC,
  NEGATIVE_PROMPTS,
} from '@/features/visuals/constants/brand-rules'

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
})

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

  // 5. Detect if input is V1 or V2 — inform the AI so it can upgrade
  const { current_prompt_json, feedback } = parsed.data
  const isV1Input = 'scene' in current_prompt_json && 'composition' in current_prompt_json
  const isV2Input = 'meta' in current_prompt_json && 'layout' in current_prompt_json && 'content' in current_prompt_json

  // 6. Generate with AI (V2 structured iteration)
  try {
    const result = await generateObjectWithFallback({
      task: 'iterate-visual',
      workspaceId,
      schema: iterateOutputSchema,
      system: `Eres el Director de Arte Senior de Bitalize que itera sobre prompts visuales para LinkedIn.

Tu trabajo: aplicar el feedback del editor al prompt JSON visual existente y devolver una version MEJORADA en schema V2 junto con una lista de cambios.

${isV1Input ? `## IMPORTANTE: UPGRADE V1 → V2
El prompt actual usa el schema antiguo (V1: scene/composition/text_overlay/style/brand/technical). Tu output DEBE ser schema V2 (meta/brand/layout/content/style_guidelines/negative_prompts/prompt_overall). Migra toda la informacion del V1 al V2 y ademas aplica el feedback.` : ''}

## LOGO — OBLIGATORIO

${BRAND_LOGO_DESCRIPTION.reference_description}

- Ubicacion por defecto: esquina inferior izquierda sobre banda blanca solida
- Banda blanca: ~12% del alto total
- Logo: maximo 20% del ancho
- Siempre \`use_logo: true\`

## FIRMA DEL AUTOR

Incluir: "${BRAND_SIGNATURE.text}" — ${BRAND_SIGNATURE.default_placement}

## IDENTIDAD DE MARCA BITALIZE (restricciones inamovibles)

- Primario: ${BRAND_COLORS_SEMANTIC.primary} (azul oscuro — confianza)
- Secundario: ${BRAND_COLORS_SEMANTIC.secondary} (naranja — energia)
- Acento: ${BRAND_COLORS_SEMANTIC.accent} (verde — sostenibilidad)
- Texto principal: ${BRAND_COLORS_SEMANTIC.text_main}
- Texto secundario: ${BRAND_COLORS_SEMANTIC.text_secondary}
- Fondo: ${BRAND_COLORS_SEMANTIC.background} o ${BRAND_COLORS_SEMANTIC.background_dark}
- Tipografia: Inter, sans-serif
- Estilo: Infografia educativa estilo NotebookLM, editorial, siempre full color

**Negative prompts permanentes**: ${NEGATIVE_PROMPTS.join(', ')}

## REGLAS DE ITERACION

1. Aplica SOLO los cambios que el feedback solicita — no alteres lo que no se pide cambiar
2. Mantén las restricciones de marca aunque el feedback contradiga alguna (explica en changes_made)
3. Si el feedback es ambiguo, interpreta de forma conservadora
4. Documenta CADA cambio en changes_made: "[campo]: [descripcion]"
5. SIEMPRE regenera prompt_overall completo incorporando todos los cambios
6. prompt_overall debe ser exhaustivo: texto exacto, hex colors, posiciones con ratios, logo, firma, estilo

## CHECKLIST para prompt_overall

Verifica que incluye: texto exacto entre comillas, todos los hex colors, posiciones con %, logo Bitalize, firma autor, fondo + grid, elementos visuales, estilo, tipografia, negatives, formato.`,
      prompt: `**Prompt visual actual** (${isV1Input ? 'schema V1 — migrar a V2' : isV2Input ? 'schema V2' : 'formato desconocido — migrar a V2'}):
${JSON.stringify(current_prompt_json, null, 2)}

**Feedback del editor**:
${feedback}

Genera la version actualizada en schema V2 aplicando exactamente el feedback. Lista todos los cambios en changes_made.${isV1Input ? ' Incluye "V1→V2 migration" como primer item en changes_made.' : ''}`,
    })

    return Response.json({ data: result.object })
  } catch (error) {
    console.error('[iterate-visual] AI error:', error)
    return Response.json(
      { error: 'Error al iterar el prompt visual. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
