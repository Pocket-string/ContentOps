import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { weeklyBriefSchema } from '@/shared/types/content-ops'
import { getActiveBrandProfile } from '@/features/brand/services/brand-service'
import { generateObjectWithFallback } from '@/shared/lib/ai-router'
import { reviewVisualJson } from '@/shared/lib/ai-reviewer'

// Zod schema for the AI output (MUST parse AI responses with Zod — never use `as MyType`)
const visualPromptSchema = z.object({
  scene: z.object({
    description: z.string(),
    mood: z.string(),
    setting: z.string(),
  }),
  composition: z.object({
    layout: z.string(),
    focal_point: z.string(),
    text_placement: z.string(),
  }),
  text_overlay: z.object({
    headline: z.string(),
    subheadline: z.string().optional(),
    cta_text: z.string().optional(),
  }),
  style: z.object({
    aesthetic: z.string(),
    color_palette: z.array(z.string()),
    photography_style: z.string(),
    lighting: z.string(),
  }),
  brand: z.object({
    logo_placement: z.string(),
    brand_colors_used: z.array(z.string()),
    typography_notes: z.string(),
  }),
  technical: z.object({
    format: z.string(),
    dimensions: z.string(),
    resolution_notes: z.string(),
  }),
  negative_prompts: z.array(z.string()),
})

export type VisualPromptJson = z.infer<typeof visualPromptSchema>

// Input schema — validated before touching the AI
const inputSchema = z.object({
  post_content: z.string().min(1, 'El contenido del post es requerido'),
  funnel_stage: z.string().min(1, 'La etapa del funnel es requerida'),
  format: z.string().default('1:1'),
  topic: z.string().optional(),
  keyword: z.string().optional(),
  additional_instructions: z.string().optional(),
  weekly_brief: weeklyBriefSchema.optional(),
})

export async function POST(request: Request): Promise<Response> {
  // 1. Auth — redirect if unauthenticated (requireAuth throws/redirects)
  const user = await requireAuth()

  // 2. Rate limit (10 req/min per user)
  const rateLimitResult = aiRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  // 3. Validate input with Zod — fail fast on bad data
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

  // 4. Fetch active brand profile (fallback to hardcoded if none exists)
  const workspaceId = await getWorkspaceId()
  const brandResult = await getActiveBrandProfile(workspaceId)
  const brand = brandResult.data

  // Build brand context string — uses DB values when available, hardcoded fallback otherwise
  const brandColors = brand?.colors ?? {
    primary: '#1E3A5F',
    secondary: '#F97316',
    accent: '#10B981',
  }
  const brandTone = brand?.tone ?? 'profesional, tecnico pero accesible, confiable'
  const brandImagerySubjects = brand?.imagery.subjects ?? [
    'plantas solares fotovoltaicas',
    'paneles solares',
    'equipos de mantenimiento en campo',
    'datos y graficos de rendimiento',
    'ingenieros y tecnicos en accion',
  ]
  const brandMood = brand?.imagery.mood ?? 'profesional, innovador, sostenible, confiable, tecnico pero accesible'
  const brandLogoPlacement = brand?.logo_rules.placement ?? 'esquina inferior derecha'
  const brandTypographyHeading = brand?.typography.heading ?? 'Inter, sans-serif'
  const brandNegativePrompts = brand?.negative_prompts ?? [
    'texto borroso o ilegible',
    'logos de competidores',
    'baja calidad o pixelado',
    'colores neon o saturados artificialmente',
    'estilo infantil o cartoon',
    'imagenes sin relacion al sector solar',
    'marcas de agua o watermarks',
    'manos o figuras humanas deformadas',
    'composicion saturada o desordenada',
  ]

  // 5. Generate with AI (structured output via generateObject)
  try {
    const { post_content, funnel_stage, format, topic, keyword, additional_instructions, weekly_brief } =
      parsed.data

    const result = await generateObjectWithFallback({
      task: 'generate-visual-json',
      workspaceId,
      schema: visualPromptSchema,
      system: `Eres un director de arte experto en contenido visual para LinkedIn especializado en la marca Bitalize, empresa de O&M fotovoltaico (operaciones y mantenimiento de plantas solares).

Tu trabajo es generar un prompt JSON estructurado que un diseñador pueda usar en herramientas como Nano Banana Pro para crear el visual del post de LinkedIn.

## Identidad de Marca Bitalize

**Colores de marca**:
- Primario: ${brandColors.primary} (azul oscuro — confianza, profundidad, profesionalismo)
- Secundario: ${brandColors.secondary} (naranja — energia, accion, innovacion)
- Acento: ${brandColors.accent} (verde — sostenibilidad, eficiencia, crecimiento)

**Tipografia**: ${brandTypographyHeading}, moderna y limpia. Jerarquia clara: headline bold, subheadline medium, cta semibold.

**Estilo visual**: ${brand?.imagery.style ?? 'Editorial con toques graficos. Fotografia profesional de alta calidad. Composicion limpia y sin ruido visual.'}.

**Sujetos permitidos**: ${brandImagerySubjects.join(', ')}.

**Mood global**: ${brandMood}.

**Tono de marca**: ${brandTone}.

**Logo**: siempre en ${brandLogoPlacement}, discreto (maximo 15% del ancho), sobre fondo neutro o con padding blanco/oscuro.

**Negative prompts base** (siempre incluir):
${brandNegativePrompts.map((p) => `- ${p}`).join('\n')}

## Reglas de composición por formato

- **1:1 (cuadrado)**: focal point centrado, texto en zona inferior o superior, márgenes generosos
- **4:5 (vertical)**: composición en tercios, texto en tercio inferior, imagen en dos tercios superiores
- **16:9 (horizontal)**: composición panorámica, texto a la izquierda o derecha, imagen ocupa el fondo
- **9:16 (stories)**: full bleed, texto centrado en zona media, imagen de fondo con overlay

## Adecuación por etapa del funnel

- **TOFU (awareness)**: imágenes impactantes, visuales de escala (plantas grandes, datos sorprendentes), colores vibrantes del naranja/verde
- **MOFU (consideration)**: infografías, gráficos de rendimiento, comparativas visuales, azul dominante
- **BOFU (decision)**: casos de éxito, testimonios visuales, resultados concretos, combinación de los tres colores de marca`,
      prompt: `Genera el prompt JSON estructurado para el visual de este post de LinkedIn:

**Contenido del post**:
${post_content}

**Etapa del funnel**: ${funnel_stage}
**Formato del visual**: ${format}
${topic ? `**Tema principal**: ${topic}` : ''}
${keyword ? `**Palabra clave**: ${keyword}` : ''}
${additional_instructions ? `**Instrucciones adicionales del editor**: ${additional_instructions}` : ''}
${weekly_brief ? `**Brief de la semana**: Tema: ${weekly_brief.tema}, Buyer persona: ${weekly_brief.buyer_persona ?? 'No definido'}, Keyword: ${weekly_brief.keyword ?? 'No definida'}` : ''}

El JSON debe describir con precisión todos los elementos visuales para que un diseñador pueda crear la imagen sin ambiguedades. El visual debe complementar el mensaje del post y reforzar la propuesta de valor de Bitalize en O&M fotovoltaico.`,
    })

    // 6. ChatGPT review (optional — non-blocking on failure)
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
