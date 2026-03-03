import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { weeklyBriefSchema } from '@/shared/types/content-ops'
import { getActiveBrandProfile } from '@/features/brand/services/brand-service'
import { generateObjectWithFallback, getModel } from '@/shared/lib/ai-router'
import { reviewVisualJson } from '@/shared/lib/ai-reviewer'
import { visualPromptSchemaV2, carouselPlanSchema, VISUAL_TYPE_OPTIONS } from '@/features/visuals/schemas/visual-prompt-schema'
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
  num_slides: z.number().int().min(3).max(10).optional(),
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
// Carousel system prompt builder
// ============================================

function buildCarouselSystemPrompt(brandOverrides: {
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

Eres el **Director de Arte Senior** de Bitalize, empresa lider en O&M fotovoltaico. Generas un PLAN COMPLETO DE CARRUSEL para LinkedIn: un JSON estructurado con el contenido y prompt visual de CADA SLIDE.

## FORMATO: CARRUSEL 4:5 VERTICAL (1080x1350)

Cada slide se genera como una imagen individual de 1080x1350px (4:5 vertical) para LinkedIn.
El carrusel cuenta una HISTORIA NARRATIVA — cada slide es un capitulo que lleva al lector de un hook hasta un CTA.

## CRITICO: prompt_overall POR SLIDE

CADA slide tiene su propio **prompt_overall** — un prompt completo y autocontenido para generar esa imagen especifica. Debe incluir:

1. Texto exacto a renderizar (headline, body text) entre comillas
2. Todos los colores hex mencionados
3. Posiciones espaciales con ratios
4. Descripcion del logo Bitalize + ubicacion
5. Elementos visuales especificos para ESE slide
6. Fondo consistente con el resto del carrusel
7. Referencia a "Slide N of M" para contexto narrativo
8. Tipografia y tamanos

Si prompt_overall esta vago, la imagen sera mala. Se PRECISO y ESPECIFICO para cada slide.

## ARCO NARRATIVO DEL CARRUSEL

Distribuye los slides asi:
- **Slide 1 (cover_hook)**: Titulo impactante, tipografia hero grande, fondo llamativo. Hook que invite a deslizar.
- **Slide 2 (problem)**: Presenta el problema o pain point. Datos de contexto.
- **Slides 3-N-2 (evidence/supporting)**: Evidencia, datos, proceso, solucion. Contenido sustancial.
- **Slide N-1 (solution)**: Resumen de la solucion o takeaway principal.
- **Slide N (cta_close)**: Call to action claro. "Comenta", "Sigue", "DM", etc.

## LOGO — OBLIGATORIO EN TODA SLIDE

${BRAND_LOGO_DESCRIPTION.reference_description}

- Ubicacion: esquina inferior izquierda sobre banda blanca solida
- Banda blanca: ~12% del alto total
- Logo: maximo 20% del ancho
- Describir logo textualmente en CADA prompt_overall
- Esquina inferior derecha SIEMPRE vacia

## FIRMA DEL AUTOR

Incluir en todas las slides: "${BRAND_SIGNATURE.text}"
- Ubicacion: ${BRAND_SIGNATURE.default_placement}
- Firma cerca del logo, pequena y muted

## IDENTIDAD DE MARCA

**Colores**: primario ${colors.primary}, secundario ${colors.secondary}, acento ${colors.accent}
**Texto principal**: ${BRAND_COLORS_SEMANTIC.text_main} | secundario: ${BRAND_COLORS_SEMANTIC.text_secondary}
**Fondo claro**: ${BRAND_COLORS_SEMANTIC.background} | oscuro: ${BRAND_COLORS_SEMANTIC.background_dark}
**Tipografia**: ${typographyHeading} | Titulo: Inter Bold 36-48px | Body: Inter Regular 14-16px
**Estilo**: ${imageryStyle}
**Sujetos**: ${imagerySubjects.join(', ')}
**Mood**: ${mood} | **Tono**: ${tone}

## CONSISTENCIA VISUAL ENTRE SLIDES

CRITICO — todas las slides deben sentirse parte del MISMO carrusel:
- Mismo fondo base (ej: dark navy #020F3A con patron sutil)
- Misma paleta de colores hex
- Misma tipografia y tamanos
- Mismo estilo de iconos (flat, thin stroke, full color)
- Mismo grid system (ej: 12_col)
- Logo y firma en la misma posicion en CADA slide

## TIPOS VISUALES POR SLIDE

Cada slide puede tener un visual_type diferente segun su contenido:
${VISUAL_TYPE_OPTIONS.map((t) => `- ${t}`).join('\n')}

## NEGATIVE PROMPTS (aplicar a TODAS las slides)

${negativePrompts.map((p) => `- ${p}`).join('\n')}

## ESTETICA

${DEFAULT_STYLE_ANCHORS.join('. ')}.
Siempre full color. Legible en movil. Sin fotos stock.`
}

// ============================================
// Carousel plan normalizer — fixes common AI deviations before Zod
// ============================================

const VALID_ROLES = ['cover_hook', 'problem', 'evidence', 'supporting', 'solution', 'cta_close'] as const
const VALID_VISUAL_TYPES = VISUAL_TYPE_OPTIONS

/** Map common AI role variations to valid enum values */
function coerceRole(raw: unknown, slideIndex: number, totalSlides: number): string {
  if (typeof raw !== 'string') return slideIndex === 0 ? 'cover_hook' : 'supporting'
  const lower = raw.toLowerCase().replace(/[\s_-]+/g, '_')
  // Direct match
  if ((VALID_ROLES as readonly string[]).includes(lower)) return lower
  // Fuzzy mapping
  if (lower.includes('hook') || lower.includes('cover') || lower.includes('intro')) return 'cover_hook'
  if (lower.includes('cta') || lower.includes('close') || lower.includes('action') || lower.includes('conclusion')) return 'cta_close'
  if (lower.includes('problem') || lower.includes('pain') || lower.includes('challenge')) return 'problem'
  if (lower.includes('evidence') || lower.includes('data') || lower.includes('proof') || lower.includes('stat')) return 'evidence'
  if (lower.includes('solution') || lower.includes('result') || lower.includes('outcome') || lower.includes('takeaway')) return 'solution'
  // Positional fallback
  if (slideIndex === 0) return 'cover_hook'
  if (slideIndex === totalSlides - 1) return 'cta_close'
  if (slideIndex === 1) return 'problem'
  if (slideIndex === totalSlides - 2) return 'solution'
  return 'supporting'
}

/** Map common AI visual_type variations to valid enum values */
function coerceVisualType(raw: unknown): string {
  if (typeof raw !== 'string') return 'custom'
  const lower = raw.toLowerCase().replace(/[\s_-]+/g, '_')
  if ((VALID_VISUAL_TYPES as readonly string[]).includes(lower)) return lower
  if (lower.includes('infographic') || lower.includes('info_graphic')) return 'infographic'
  if (lower.includes('chart') || lower.includes('graph') || lower.includes('metric')) return 'data_chart'
  if (lower.includes('diagram') || lower.includes('flow') || lower.includes('cycle')) return 'diagram'
  if (lower.includes('photo') || lower.includes('editorial') || lower.includes('image')) return 'editorial_photo'
  if (lower.includes('poster') || lower.includes('text') || lower.includes('quote') || lower.includes('hero')) return 'text_poster'
  if (lower.includes('compar') || lower.includes('versus') || lower.includes('split')) return 'comparison'
  if (lower.includes('timeline') || lower.includes('history') || lower.includes('evolution')) return 'timeline'
  if (lower.includes('process') || lower.includes('step') || lower.includes('workflow')) return 'process_flow'
  if (lower.includes('quote') || lower.includes('testimonial') || lower.includes('cite')) return 'quote_card'
  return 'custom'
}

/** Clamp array length: trim excess, pad with defaults if too few */
function clampArray(arr: unknown, min: number, max: number, defaultVal = ''): string[] {
  const items = Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
  const trimmed = items.slice(0, max)
  while (trimmed.length < min) trimmed.push(defaultVal || `Item ${trimmed.length + 1}`)
  return trimmed
}

/** Comprehensive normalizer: coerces AI response to match carouselPlanSchema */
function normalizeCarouselPlan(raw: Record<string, unknown>, requestedSlides: number): Record<string, unknown> {
  // Meta
  const rawMeta = (raw.meta && typeof raw.meta === 'object' ? raw.meta : {}) as Record<string, unknown>
  const slides = Array.isArray(raw.slides) ? raw.slides.slice(0, requestedSlides) : []
  const actualCount = slides.length

  const meta = {
    slides_total: actualCount,
    narrative_arc: typeof rawMeta.narrative_arc === 'string' ? rawMeta.narrative_arc : 'Hook → Content → CTA',
    topic: typeof rawMeta.topic === 'string' ? rawMeta.topic : 'LinkedIn carousel',
    platform: 'linkedin' as const,
    format: '4:5' as const,
    dimensions: '1080x1350' as const,
  }

  // Global style
  const rawGs = (raw.global_style && typeof raw.global_style === 'object' ? raw.global_style : {}) as Record<string, unknown>
  const global_style = {
    background_style: typeof rawGs.background_style === 'string' ? rawGs.background_style : 'Dark navy #0F172A',
    color_usage: typeof rawGs.color_usage === 'string' ? rawGs.color_usage : 'Brand colors for emphasis',
    consistency_rules: clampArray(rawGs.consistency_rules, 2, 5, 'Consistent typography across all slides'),
  }

  // Slides — normalize each
  const normalizedSlides = slides.map((s: unknown, i: number) => {
    const slide = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>
    return {
      slide_index: typeof slide.slide_index === 'number' ? Math.min(Math.max(slide.slide_index, 0), 9) : i,
      role: coerceRole(slide.role, i, actualCount),
      headline: typeof slide.headline === 'string' ? slide.headline : `Slide ${i + 1}`,
      body_text: typeof slide.body_text === 'string' ? slide.body_text : '',
      visual_type: coerceVisualType(slide.visual_type),
      visual_description: typeof slide.visual_description === 'string' ? slide.visual_description : '',
      key_elements: clampArray(slide.key_elements, 2, 6, 'Visual element'),
      prompt_overall: typeof slide.prompt_overall === 'string' ? slide.prompt_overall : '',
    }
  })

  return {
    meta,
    global_style,
    slides: normalizedSlides,
    style_guidelines: clampArray(raw.style_guidelines, 3, 6, 'Clean, professional design'),
    negative_prompts: clampArray(raw.negative_prompts, 3, 8, 'Low quality imagery'),
  }
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
  const { post_content, funnel_stage, format, topic, keyword, additional_instructions, concept_type, num_slides, weekly_brief } =
    parsed.data

  const isCarousel = concept_type === 'carousel_4x5'
  const formatKey = format as VisualFormat
  const dims = FORMAT_DIMENSIONS[formatKey] ?? FORMAT_DIMENSIONS['1:1']
  const dimensionsStr = `${dims.width}x${dims.height}`

  // 6. Generate with AI
  try {
    const brandConfig = {
      colors: brandColors,
      tone: brandTone,
      imagerySubjects: brandImagerySubjects,
      mood: brandMood,
      typographyHeading: brandTypographyHeading,
      imageryStyle: brandImageryStyle,
      negativePrompts: brandNegativePrompts,
    }

    if (isCarousel) {
      // ── CAROUSEL: generate full multi-slide plan ──
      // Per CLAUDE.md: generateObject ALWAYS fails with Gemini for long inputs.
      // Use generateText + manual JSON parse + Zod validate instead.
      const { generateText } = await import('ai')
      const carouselSystem = buildCarouselSystemPrompt(brandConfig) +
        `\n\nCRITICO: Tu respuesta DEBE ser UNICAMENTE un objeto JSON valido. Sin markdown, sin backticks, sin texto adicional. Solo el JSON.`

      const requestedSlides = num_slides ?? 5
      const carouselPrompt = `Genera un PLAN COMPLETO DE CARRUSEL para este post de LinkedIn.

**Contenido del post**:
${post_content}

**Etapa del funnel**: ${funnel_stage}
**Formato**: 4:5 vertical (1080x1350) — CARRUSEL
**Numero EXACTO de slides**: ${requestedSlides}
**Tipos visuales disponibles**: ${VISUAL_TYPE_OPTIONS.join(', ')}
${topic ? `**Tema principal**: ${topic}` : ''}
${keyword ? `**Palabra clave**: ${keyword}` : ''}
${additional_instructions ? `**Instrucciones adicionales**: ${additional_instructions}` : ''}
${weekly_brief ? `**Brief de la semana**: Tema: ${weekly_brief.tema}, Buyer persona: ${weekly_brief.buyer_persona ?? 'No definido'}, Keyword: ${weekly_brief.keyword ?? 'No definida'}` : ''}

INSTRUCCIONES:
1. Genera EXACTAMENTE ${requestedSlides} slides — ni mas, ni menos. slides_total DEBE ser ${requestedSlides}
2. Para CADA slide, genera headline, body_text, visual_type, visual_description, key_elements, y prompt_overall
3. El arco narrativo debe ser: Hook → Problema → Evidencia/Datos → Solucion → CTA
4. CADA prompt_overall debe ser EXHAUSTIVO — incluir texto exacto, colores hex, posiciones, logo, firma
5. Mantener CONSISTENCIA visual: mismo fondo, misma paleta, misma tipografia en todas las slides
6. Logo Bitalize en CADA slide (esquina inferior izquierda, banda blanca)
7. Firma "${BRAND_SIGNATURE.text}" en CADA slide
8. Esquina inferior derecha SIEMPRE vacia en CADA slide

Responde SOLO con el JSON. Estructura requerida:
{
  "meta": { "slides_total": N, "narrative_arc": "...", "topic": "...", "platform": "linkedin", "format": "4:5", "dimensions": "1080x1350" },
  "global_style": { "background_style": "...", "color_usage": "...", "consistency_rules": ["..."] },
  "slides": [ { "slide_index": 0, "role": "cover_hook|problem|evidence|supporting|solution|cta_close", "headline": "...", "body_text": "...", "visual_type": "...", "visual_description": "...", "key_elements": ["..."], "prompt_overall": "..." } ],
  "style_guidelines": ["..."],
  "negative_prompts": ["..."]
}`

      const model = await getModel('generate-visual-json', workspaceId)
      const textResult = await generateText({ model, system: carouselSystem, prompt: carouselPrompt })

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
        console.error('[generate-visual-json] Carousel JSON parse error:', textResult.text.slice(0, 500))
        return Response.json(
          { error: 'La IA no devolvio un JSON valido para el carrusel. Intenta de nuevo.' },
          { status: 500 }
        )
      }

      // Normalize AI response to match strict Zod schema
      const normalized = normalizeCarouselPlan(rawJson as Record<string, unknown>, requestedSlides)

      const zodResult = carouselPlanSchema.safeParse(normalized)
      if (!zodResult.success) {
        const flatErrors = zodResult.error.flatten()
        console.error('[generate-visual-json] Carousel Zod error after normalization:', JSON.stringify(flatErrors, null, 2))
        return Response.json(
          { error: `Formato inesperado del carrusel: ${zodResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}` },
          { status: 500 }
        )
      }

      return Response.json({ data: zodResult.data, type: 'carousel_plan' })
    }

    // ── SINGLE IMAGE: generate V2 structured JSON ──
    const systemPrompt = buildSystemPrompt(brandConfig)

    const result = await generateObjectWithFallback({
      task: 'generate-visual-json',
      workspaceId,
      schema: visualPromptSchemaV2,
      system: systemPrompt,
      prompt: `Genera el prompt JSON V2 estructurado para el visual de este post de LinkedIn.

**Contenido del post**:
${post_content}

**Etapa del funnel**: ${funnel_stage}
**Formato del visual**: ${format} (${dimensionsStr})
**Tipos visuales disponibles**: ${VISUAL_TYPE_OPTIONS.join(', ')}
${topic ? `**Tema principal**: ${topic}` : ''}
${keyword ? `**Palabra clave**: ${keyword}` : ''}
${additional_instructions ? `**Instrucciones adicionales del editor**: ${additional_instructions}` : ''}
${weekly_brief ? `**Brief de la semana**: Tema: ${weekly_brief.tema}, Buyer persona: ${weekly_brief.buyer_persona ?? 'No definido'}, Keyword: ${weekly_brief.keyword ?? 'No definida'}` : ''}

RECUERDA:
1. Clasifica el visual_type segun el contenido y funnel stage
2. Incluye el logo Bitalize con banda blanca inferior
3. Incluye la firma del autor "${BRAND_SIGNATURE.text}"
4. Usa ratios numericos en layout (no texto vago)
5. prompt_overall debe ser EXHAUSTIVO — es lo que genera la imagen`,
    })

    // ChatGPT review (optional — non-blocking on failure)
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
