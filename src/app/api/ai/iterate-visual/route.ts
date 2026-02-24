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

// Shared visual prompt schema (mirrors generate-visual-json output)
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

// Output schema — updated prompt plus explicit changelog
const iterateOutputSchema = z.object({
  prompt: visualPromptSchema,
  changes_made: z.array(z.string()).min(1),
})

export type IterateVisualOutput = z.infer<typeof iterateOutputSchema>

// Input schema — validated before touching the AI
const iterateInputSchema = z.object({
  current_prompt_json: z.record(z.unknown()),
  feedback: z.string().min(1, 'El feedback es requerido'),
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

  const parsed = iterateInputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  // 4. Generate with AI (structured iteration via generateObject)
  try {
    const { current_prompt_json, feedback } = parsed.data

    const result = await generateObject({
      model: openrouter('google/gemini-2.0-flash-001'),
      schema: iterateOutputSchema,
      system: `Eres un director de arte experto que itera sobre prompts visuales para LinkedIn de la marca Bitalize (O&M fotovoltaico).

Tu trabajo es aplicar el feedback del editor al prompt JSON visual existente y devolver una versión mejorada junto con una lista clara de los cambios realizados.

## Identidad de Marca Bitalize (restricciones inamovibles)
- Colores: #1E3A5F (azul oscuro), #F97316 (naranja), #10B981 (verde)
- Tipografia: Inter, sans-serif, moderna y limpia
- Logo: esquina inferior derecha, discreto
- Sujetos: plantas solares, paneles fotovoltaicos, equipos de mantenimiento, datos y graficos
- Estilo: editorial, fotografico con toques graficos, profesional e innovador
- Negative prompts permanentes: texto borroso, logos competidores, baja calidad, colores neon, infantil, sin relacion solar, marcas de agua, manos deformadas

## Reglas de iteracion
- Aplica SOLO los cambios que el feedback solicita — no alteres lo que no se pide cambiar
- Mantén las restricciones de marca aunque el feedback contradiga alguna de ellas (explica en changes_made si hay conflicto)
- Si el feedback es ambiguo, interpreta de la forma mas conservadora posible
- Documenta cada cambio en changes_made con el formato: "[campo modificado]: [descripcion del cambio]"`,
      prompt: `**Prompt visual actual**:
${JSON.stringify(current_prompt_json, null, 2)}

**Feedback del editor**:
${feedback}

Genera la version actualizada del prompt aplicando exactamente el feedback indicado. Lista todos los cambios realizados en changes_made.`,
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
