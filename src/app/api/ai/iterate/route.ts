import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { generateObjectWithFallback } from '@/shared/lib/ai-router'

// Zod schema for the AI output (MUST parse AI responses with Zod — never use `as MyType`)
const iteratedCopySchema = z.object({
  content: z.string().min(1),
  hook: z.string().min(1),
  cta: z.string().min(1),
  changes_made: z.array(z.string()).min(1),
})

export type IteratedCopy = z.infer<typeof iteratedCopySchema>

// Input schema — validated before touching the AI
const inputSchema = z.object({
  current_content: z.string().min(1, 'El contenido actual es requerido'),
  feedback: z.string().min(1, 'El feedback es requerido'),
  variant: z.enum(['contrarian', 'story', 'data_driven']),
  score: z
    .object({
      detener: z.number().min(0).max(5).optional(),
      ganar: z.number().min(0).max(5).optional(),
      provocar: z.number().min(0).max(5).optional(),
      iniciar: z.number().min(0).max(5).optional(),
    })
    .optional(),
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

  // 4. Generate with AI (structured iteration via generateObject)
  try {
    const { current_content, feedback, variant, score } = parsed.data

    // Build optional D/G/P/I score context for the prompt
    let scoreContext = ''
    if (score) {
      const entries = Object.entries(score).filter(
        (entry): entry is [string, number] => entry[1] !== undefined
      )
      if (entries.length > 0) {
        scoreContext = `\n\nScores D/G/P/I actuales (0-5): ${entries.map(([k, v]) => `${k}: ${v}/5`).join(', ')}`
      }
    }

    const result = await generateObjectWithFallback({
      task: 'iterate',
      schema: iteratedCopySchema,
      system: `Eres un editor experto de copy para LinkedIn en el sector O&M fotovoltaico.
Tu trabajo es iterar sobre un post existente aplicando el feedback del usuario.
Mantén el estilo de la variante (${variant}) mientras mejoras según las indicaciones.
Metodología D/G/P/I: Detener(hook), Ganar(valor), Provocar(reacción), Iniciar(CTA).
Reglas: máx 3000 chars, párrafos cortos, sin links externos, CTA al final, hashtags al final.`,
      prompt: `**Post actual (variante: ${variant})**:
${current_content}

**Feedback del editor**:
${feedback}${scoreContext}

Genera una versión mejorada aplicando el feedback. Explica qué cambios hiciste.`,
    })

    return Response.json({ data: result.object })
  } catch (error) {
    console.error('[iterate] AI error:', error)
    return Response.json(
      { error: 'Error al iterar el contenido. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
