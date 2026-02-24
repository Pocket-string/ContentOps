import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'

// OpenRouter provider (OpenAI-compatible)
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
})

// Zod schema for the AI output (MUST parse AI responses with Zod — never use `as MyType`)
const criticOutputSchema = z.object({
  findings: z.array(z.object({
    category: z.enum(['legibilidad', 'coherencia_copy', 'consistencia_editorial', 'brand', 'texto_render']),
    severity: z.enum(['blocker', 'warning', 'suggestion']),
    description: z.string(),
  })),
  suggestions: z.array(z.string()).max(3),
  mobile_readability: z.enum(['pass', 'warning', 'fail']),
  brand_consistency: z.enum(['pass', 'warning', 'fail']),
  verdict: z.enum(['pass', 'needs_work', 'rewrite']),
})

export type CriticVisualOutput = z.infer<typeof criticOutputSchema>

// Input schema — validated before touching the AI
const inputSchema = z.object({
  prompt_json: z.record(z.unknown()),
  post_content: z.string().min(1, 'Contenido del post requerido'),
  concept_type: z.string().optional(),
  format: z.string().min(1, 'Formato requerido'),
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

  // 4. Evaluate with AI (structured output via generateObject)
  try {
    const { prompt_json, post_content, concept_type, format } = parsed.data

    const result = await generateObject({
      model: openrouter('google/gemini-2.0-flash-001'),
      schema: criticOutputSchema,
      system: `Eres un critico experto de QA visual para contenido LinkedIn de O&M fotovoltaico (operacion y mantenimiento de plantas solares).

Tu trabajo es evaluar prompts de diseno visual (en formato JSON de instrucciones para un generador de imagenes) y su coherencia con el copy del post.

Evaluas estas 5 categorias:
- **legibilidad**: Legibilidad en movil — tamano de texto, contraste, densidad de elementos. Un visual debe funcionar en una pantalla pequena sin necesidad de zoom.
- **coherencia_copy**: Coherencia entre el visual y el contenido del post — el mensaje visual refuerza el copy? Los titulares o textos del visual alinean con los datos del post?
- **consistencia_editorial**: Consistencia con la linea editorial — paleta de colores de marca, tipografia, placement del logo, estilo fotografico coherente.
- **brand**: Cumplimiento de directrices de marca — uso correcto de colores corporativos, no mezclar estilos incompatibles, proporciones de logo correctas.
- **texto_render**: Problemas de render de texto — demasiado texto superpuesto, fuentes ilegibles, elementos solapados, texto sobre fondo de bajo contraste.

Reglas de severidad:
- **blocker**: Problema critico que hace el visual inaceptable para publicacion (texto ilegible, mensaje contradice el copy, logo ausente en template de marca)
- **warning**: Problema que reduce calidad pero no bloquea publicacion (bajo contraste, texto denso para movil)
- **suggestion**: Mejora opcional que elevaria la calidad

Reglas de veredicto:
- **pass**: Sin blockers, maximo 1 warning menor
- **needs_work**: 1-2 warnings significativos o 1 blocker menor
- **rewrite**: Multiples blockers o incoherencia fundamental con el copy

MAXIMO 3 sugerencias de mejora. Enfocadas y accionables.

mobile_readability y brand_consistency son indicadores independientes del veredicto.`,
      prompt: `Evalua este prompt visual de LinkedIn:

**Formato**: ${format}
${concept_type ? `**Tipo de concepto**: ${concept_type}` : ''}

**Prompt JSON del visual**:
${JSON.stringify(prompt_json, null, 2)}

**Contenido del post asociado**:
${post_content}

Proporciona tu evaluacion con findings (categoria + severidad), suggestions (max 3), mobile_readability, brand_consistency y verdict.`,
    })

    return Response.json({ data: result.object })
  } catch (error) {
    console.error('[critic-visual] AI error:', error)
    return Response.json(
      { error: 'Error al evaluar el visual. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
