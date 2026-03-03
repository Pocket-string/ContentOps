import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { weeklyBriefSchema } from '@/shared/types/content-ops'
import { getActiveBrandProfile } from '@/features/brand/services/brand-service'
import { generateObjectWithFallback } from '@/shared/lib/ai-router'
import { reviewVisualJson } from '@/shared/lib/ai-reviewer'
import { visualPromptSchemaV2, VISUAL_TYPE_OPTIONS } from '@/features/visuals/schemas/visual-prompt-schema'
import {
  BRAND_LOGO_DESCRIPTION,
  BRAND_SIGNATURE,
  BRAND_COLORS_SEMANTIC,
  BRAND_STYLE,
  NEGATIVE_PROMPTS,
  DEFAULT_STYLE_ANCHORS,
  FORMAT_DIMENSIONS,
  type VisualFormat,
} from '@/features/visuals/constants/brand-rules'

// Re-export V1 type for backward compat (other files may import it)
export type { VisualPromptJsonV2 } from '@/features/visuals/schemas/visual-prompt-schema'

// Input schema — validated before touching the AI
const inputSchema = z.object({
  post_content: z.string().min(1, 'El contenido del post es requerido'),
  funnel_stage: z.string().min(1, 'La etapa del funnel es requerida'),
  format: z.string().default('1:1'),
  topic: z.string().optional(),
  keyword: z.string().optional(),
  additional_instructions: z.string().optional(),
  concept_type: z.enum(['single', 'carousel_4x5']).optional(),
  weekly_brief: weeklyBriefSchema.optional(),
})

// ============================================
// System prompt builder
// ============================================

function buildSystemPrompt(brandOverrides: {
  colors: { primary: string; secondary: string; accent: string }
  tone: string
  imagerySubjects: string[]
  mood: string
  typographyHeading: string
  imageryStyle: string
  negativePrompts: string[]
}): string {
  const { colors, tone, imagerySubjects, mood, typographyHeading, imageryStyle, negativePrompts } = brandOverrides

  return `## ROL

Eres el **Director de Arte Senior** de Bitalize, empresa lider en O&M fotovoltaico. Generas prompt JSONs estructurados (schema V2) para crear visuales de LinkedIn con modelos de imagen AI (Gemini Imagen).

## CRITICO: prompt_overall

El campo **prompt_overall** es EL MAS IMPORTANTE del JSON. Es un prompt completo, autocontenido en texto plano que se envia DIRECTAMENTE al modelo de generacion de imagen. Debe ser extremadamente detallado e incluir:

1. Texto exacto a renderizar (entre comillas)
2. Todos los colores hex mencionados
3. Posiciones espaciales con ratios (e.g. "top 8%", "center 55% height")
4. Descripcion exacta del logo y su ubicacion
5. Elementos visuales especificos (graficos, iconos, diagramas)
6. Reglas de estilo positivas
7. Cosas a evitar (negatives)
8. Tipografia y tamanos
9. Descripcion del fondo y grid
10. Firma del autor si aplica
11. CTA si aplica

Si prompt_overall esta vago o generico, la imagen sera mala. Se PRECISO.

## LOGO — OBLIGATORIO EN TODA IMAGEN

${BRAND_LOGO_DESCRIPTION.reference_description}

**Reglas de logo:**
- Ubicacion por defecto: esquina inferior izquierda sobre banda blanca solida
- La banda blanca mide ~12% del alto total de la imagen
- El logo ocupa maximo 20% del ancho de la imagen
- Siempre usar \`use_logo: true\` y describir el logo textualmente en prompt_overall
- En fondos oscuros: logo en blanco. En fondos claros: logo en navy #1E3A5F

## FIRMA DEL AUTOR

Incluir siempre: "${BRAND_SIGNATURE.text}"
- Ubicacion: ${BRAND_SIGNATURE.default_placement}
- La firma va cerca del logo pero mas pequena y muted
- En prompt_overall mencionar: "Small author signature '${BRAND_SIGNATURE.text}' in ${BRAND_COLORS_SEMANTIC.text_secondary} near the logo"

## IDENTIDAD DE MARCA BITALIZE

**Colores semanticos** (usar SIEMPRE con hex):
- Primario (confianza): ${colors.primary}
- Secundario (energia): ${colors.secondary}
- Acento (crecimiento): ${colors.accent}
- Texto principal: ${BRAND_COLORS_SEMANTIC.text_main}
- Texto secundario: ${BRAND_COLORS_SEMANTIC.text_secondary}
- Fondo claro: ${BRAND_COLORS_SEMANTIC.background}
- Fondo oscuro: ${BRAND_COLORS_SEMANTIC.background_dark}
- Highlight datos: ${BRAND_COLORS_SEMANTIC.accent_warning}
- Metrica critica: ${BRAND_COLORS_SEMANTIC.accent_danger}

**Tipografia**: ${typographyHeading}
- Titulo: Inter Bold, 36-48px, uppercase o title-case segun contexto
- Subtitulo: Inter Medium, 20-24px
- Body: Inter Regular, 14-16px
- CTA: Inter SemiBold, 16-18px

**Estilo visual**: ${imageryStyle}

**Sujetos permitidos**: ${imagerySubjects.join(', ')}

**Mood global**: ${mood}

**Tono de marca**: ${tone}

## CLASIFICACION VISUAL (meta.visual_type)

Clasifica cada visual segun su naturaleza. Esto guia la composicion:

| Tipo | Cuando usar | Composicion tipica |
|------|-------------|-------------------|
| infographic | Datos multiples, proceso con numeros | Grid 12-col, secciones con iconos |
| data_chart | Una metrica principal, grafico central | Chart centrado 60% height |
| diagram | Flujo, ciclo, relaciones entre conceptos | Nodos + flechas, composicion abierta |
| editorial_photo | Imagen conceptual con overlays de texto | Full bleed con overlay gradient |
| text_poster | Frase impactante o cita como protagonista | Tipografia hero centrada |
| comparison | Antes/despues, vs, opciones lado a lado | Split layout 50/50 |
| timeline | Evolucion temporal, hitos | Linea horizontal o vertical con puntos |
| process_flow | Pasos secuenciales | Numbered steps horizontal o vertical |
| quote_card | Cita textual de experto o dato | Quote marks grandes + atribucion |
| custom | Ninguno anterior aplica | Libre, describir en layout |

**Mapeo por funnel:**
- TOFU (awareness): text_poster, infographic, editorial_photo — impacto visual, datos sorprendentes
- MOFU (consideration): data_chart, diagram, comparison, process_flow — profundidad tecnica
- BOFU (decision): comparison, quote_card, infographic — prueba social, resultados concretos

## LAYOUT PRECISION

Usa ratios numericos, NO descripciones vagas:

**Grid:** Preferir "rule_of_thirds" o "12_col". Nunca dejar sin grid.

**Title area:**
- position: "top-left" o "center-top"
- margin_top: "8%" del borde superior
- max_width_ratio: 0.8 (titulo no ocupa mas del 80% del ancho)

**Visual area (grafico, diagrama, iconos):**
- position: "center" o "below-title"
- height_ratio: 0.55 a 0.65 (el contenido visual ocupa 55-65% del alto)

**CTA (si aplica):**
- placement: "bottom-center"
- Estilo: rounded pill con color ${colors.secondary} y texto blanco

**Logo + firma:**
- Banda blanca inferior: 12% del alto total
- Logo: bottom-left, 20% width max
- Firma: junto al logo, mas pequena

## ESTETICA DEFAULT

${DEFAULT_STYLE_ANCHORS.join('. ')}:
- Siempre **full color** (nunca blanco y negro salvo que se pida)
- Layout tipo editorial/revista con jerarquia tipografica clara
- Graficos de datos limpios y legibles con etiquetas
- Divisores finos tipo hairline rules entre secciones
- Fondo paper-white (#F8FAFC) o dark navy (#0F172A) con panel central
- Iconos flat a todo color, stroke fino, consistentes entre si
- Texto grande y legible en movil (min 14px body, 36px titulo)
- Sin fotos stock — solo infografia editorial e ilustracion

## NEGATIVE PROMPTS BASE

Siempre incluir estos en negative_prompts:
${negativePrompts.map((p) => `- ${p}`).join('\n')}

## STYLE GUIDELINES FORMAT

El campo style_guidelines debe ser una lista de reglas POSITIVAS explicitas:
- "Flat color icons with thin stroke, no gradients"
- "Hairline dividers between sections (#E2E8F0)"
- "Data labels directly on chart elements, not in legend"
- "Title in uppercase Inter Bold 42px"
- Minimo 4 reglas, maximo 8

## CHECKLIST FINAL PARA prompt_overall

Antes de generar, verifica que prompt_overall incluye TODOS estos:
[ ] Texto exacto a renderizar (headline, subtitle, CTA)
[ ] Hex colors para todos los elementos
[ ] Posiciones espaciales con porcentajes/ratios
[ ] Descripcion del logo Bitalize + ubicacion
[ ] Firma del autor
[ ] Tipo de fondo y grid
[ ] Elementos visuales especificos
[ ] Estilo (editorial, infographic, etc.)
[ ] Reglas de tipografia (font, size, weight)
[ ] Negative prompts resumidos
[ ] Formato y dimensiones

Si falta alguno, el prompt sera de baja calidad. Se EXHAUSTIVO.`
}

// ============================================
// POST handler
// ============================================

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

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  // 4. Fetch active brand profile (fallback to hardcoded constants)
  const workspaceId = await getWorkspaceId()
  const brandResult = await getActiveBrandProfile(workspaceId)
  const brand = brandResult.data

  const brandColors = brand?.colors ?? {
    primary: BRAND_COLORS_SEMANTIC.primary,
    secondary: BRAND_COLORS_SEMANTIC.secondary,
    accent: BRAND_COLORS_SEMANTIC.accent,
  }
  const brandTone = brand?.tone ?? BRAND_STYLE.tone
  const brandImagerySubjects = brand?.imagery.subjects ?? [...BRAND_STYLE.imagery.subjects]
  const brandMood = brand?.imagery.mood ?? BRAND_STYLE.imagery.mood
  const brandTypographyHeading = brand?.typography.heading ?? BRAND_STYLE.typography.heading
  const brandImageryStyle = brand?.imagery.style ?? BRAND_STYLE.imagery.style
  const brandNegativePrompts = brand?.negative_prompts ?? [...NEGATIVE_PROMPTS]

  // 5. Build format context
  const { post_content, funnel_stage, format, topic, keyword, additional_instructions, concept_type, weekly_brief } =
    parsed.data

  const isCarousel = concept_type === 'carousel_4x5'
  const formatKey = format as VisualFormat
  const dims = FORMAT_DIMENSIONS[formatKey] ?? FORMAT_DIMENSIONS['1:1']
  const dimensionsStr = `${dims.width}x${dims.height}`

  // 6. Generate with AI (V2 structured output)
  try {
    const systemPrompt = buildSystemPrompt({
      colors: brandColors,
      tone: brandTone,
      imagerySubjects: brandImagerySubjects,
      mood: brandMood,
      typographyHeading: brandTypographyHeading,
      imageryStyle: brandImageryStyle,
      negativePrompts: brandNegativePrompts,
    })

    const carouselContext = isCarousel
      ? `\n\n## FORMATO CARRUSEL (CRITICO)
Este visual es para un CARRUSEL de LinkedIn (5-10 slides, formato 4:5 vertical).
- Genera un prompt JSON para la PORTADA del carrusel (slide 1)
- El visual_type debe reflejar el contenido del carrusel (infographic, process_flow, data_chart, etc.)
- El prompt_overall debe describir la portada: un titulo impactante grande, subtitulo breve, fondo llamativo
- La portada debe funcionar como hook visual que invite a deslizar
- Incluye en prompt_overall: "Slide 1 of carousel — cover slide designed to stop scrolling"
- Usa composicion centrada con tipografia hero para el titulo principal`
      : ''

    const result = await generateObjectWithFallback({
      task: 'generate-visual-json',
      workspaceId,
      schema: visualPromptSchemaV2,
      system: systemPrompt,
      prompt: `Genera el prompt JSON V2 estructurado para el visual de este post de LinkedIn.

**Contenido del post**:
${post_content}

**Etapa del funnel**: ${funnel_stage}
**Formato del visual**: ${format} (${dimensionsStr})${isCarousel ? ' — CARRUSEL' : ''}
**Tipos visuales disponibles**: ${VISUAL_TYPE_OPTIONS.join(', ')}
${topic ? `**Tema principal**: ${topic}` : ''}
${keyword ? `**Palabra clave**: ${keyword}` : ''}
${additional_instructions ? `**Instrucciones adicionales del editor**: ${additional_instructions}` : ''}
${weekly_brief ? `**Brief de la semana**: Tema: ${weekly_brief.tema}, Buyer persona: ${weekly_brief.buyer_persona ?? 'No definido'}, Keyword: ${weekly_brief.keyword ?? 'No definida'}` : ''}${carouselContext}

RECUERDA:
1. Clasifica el visual_type segun el contenido y funnel stage
2. Incluye el logo Bitalize con banda blanca inferior
3. Incluye la firma del autor "${BRAND_SIGNATURE.text}"
4. Usa ratios numericos en layout (no texto vago)
5. prompt_overall debe ser EXHAUSTIVO — es lo que genera la imagen${isCarousel ? '\n6. Este es un CARRUSEL — genera prompt para la portada (slide 1)' : ''}`,
    })

    // 7. ChatGPT review (optional — non-blocking on failure)
    const review = await reviewVisualJson(
      result.object as unknown as Record<string, unknown>,
      parsed.data.post_content,
      workspaceId
    )

    return Response.json({ data: result.object, review })
  } catch (error) {
    console.error('[generate-visual-json] AI error:', error)
    return Response.json(
      { error: 'Error al generar el prompt visual. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
