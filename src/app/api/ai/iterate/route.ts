import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { getModel } from '@/shared/lib/ai-router'

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

  // 4. Get workspace context
  const workspaceId = await getWorkspaceId()

  // 5. Generate with AI (text-based JSON — generateObject fails with Gemini on long prompts)
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

    const result = await generateText({
      model: await getModel('iterate', workspaceId),
      system: `Eres un editor experto de copy para LinkedIn en el sector O&M fotovoltaico.
Tu trabajo es iterar sobre un post existente aplicando el feedback del usuario.
Mantén el estilo de la variante (${variant}) mientras mejoras según las indicaciones.
Metodología D/G/P/I: Detener(hook), Ganar(valor), Provocar(reacción), Iniciar(CTA).
Reglas: máx 3000 chars, párrafos cortos, sin links externos, CTA al final, hashtags al final.

IMPORTANTE: Responde UNICAMENTE con un JSON valido, sin markdown, sin backticks, sin texto adicional.`,
      prompt: `**Post actual (variante: ${variant})**:
${current_content}

**Feedback del editor**:
${feedback}${scoreContext}

Genera una versión mejorada aplicando el feedback. Responde con este JSON exacto:
{
  "content": "El texto completo del post mejorado",
  "hook": "La primera linea del post",
  "cta": "El call-to-action al final",
  "changes_made": ["Cambio 1", "Cambio 2"]
}`,
    })

    // Parse JSON from text response
    let jsonText = result.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    let parsed_ai: unknown
    try {
      parsed_ai = JSON.parse(jsonText)
    } catch {
      console.error('[iterate] Failed to parse AI JSON:', jsonText.slice(0, 500))
      return Response.json(
        { error: 'Error al parsear la respuesta de la IA. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const validated = iteratedCopySchema.safeParse(parsed_ai)
    if (!validated.success) {
      console.error('[iterate] Zod validation failed:', validated.error.issues)
      return Response.json(
        { error: 'La IA genero un formato invalido. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    return Response.json({ data: validated.data })
  } catch (error) {
    console.error('[iterate] AI error:', error)
    return Response.json(
      { error: 'Error al iterar el contenido. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
