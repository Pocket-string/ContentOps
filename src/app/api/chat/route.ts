import { streamText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { chatRateLimiter } from '@/lib/rate-limit'
import { getModel } from '@/shared/lib/ai-router'
import { chatInputSchema } from '@/features/orchestrator/types'

// Human-readable labels for each module
const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Panel Principal',
  research: 'Investigacion',
  topics: 'Temas',
  campaigns: 'Campanas',
  posts: 'Editor de Posts',
  visuals: 'Editor Visual',
  patterns: 'Patrones',
  insights: 'Insights',
  settings: 'Configuracion',
}

const ORCHESTRATOR_SYSTEM_PROMPT = `Eres el Orquestador de ContentOps (Bitalize), un asistente experto en content operations para LinkedIn en el sector O&M fotovoltaico.

## Tu Rol
Eres el "maestro de marionetas" del flujo de contenido. Guias al usuario en cada etapa:
1. **Research**: Investigacion de mercado y tendencias del sector solar
2. **Topics**: Seleccion y enriquecimiento de temas para publicacion
3. **Campaigns**: Planificacion semanal de contenido con funnel stages
4. **Posts**: Generacion y refinamiento de copy con metodologia D/G/P/I
5. **Visuals**: Creacion de assets visuales para LinkedIn
6. **Analytics**: Metricas, patrones exitosos y aprendizajes

## Contexto Actual
{contextDescription}

## Reglas
- Responde en espanol, tono profesional pero cercano
- Se conciso (maximo 3-4 parrafos por respuesta)
- Si el usuario pide algo que puedes hacer, explica los pasos
- Si detectas que el usuario necesita ir a otro modulo, indicale la ruta
- Usa la metodologia D/G/P/I cuando hables de copy
- Referencia datos del sector O&M fotovoltaico cuando sea relevante
- Si el usuario pide generar contenido, guialo al modulo correcto
- NO inventes datos ni metricas - se honesto sobre lo que sabes y no sabes`

export async function POST(request: Request): Promise<Response> {
  // 1. Auth — redirect if unauthenticated
  const user = await requireAuth()

  // 2. Rate limit — 30 req/min per user (chat is lighter than AI generation)
  const rateLimitResult = chatRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  // 3. Parse request body — fail fast on malformed JSON
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo invalido' }, { status: 400 })
  }

  // 4. Validate input with Zod — never trust client data
  const parsed = chatInputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  const { message, context, history } = parsed.data

  // 5. Build a human-readable context description for the system prompt
  const moduleLabel = MODULE_LABELS[context.module] ?? context.module
  let contextDescription = `Modulo: ${moduleLabel} (${context.path})`
  if (context.campaignId) contextDescription += `\nCampana ID: ${context.campaignId}`
  if (context.postId) contextDescription += `\nPost ID: ${context.postId}`
  if (context.topicId) contextDescription += `\nTema ID: ${context.topicId}`
  if (context.researchId) contextDescription += `\nResearch ID: ${context.researchId}`
  if (context.dayOfWeek !== undefined) contextDescription += `\nDia: ${context.dayOfWeek}`
  if (context.funnelStage) contextDescription += `\nFunnel: ${context.funnelStage}`

  const systemPrompt = ORCHESTRATOR_SYSTEM_PROMPT.replace(
    '{contextDescription}',
    contextDescription
  )

  // 6. Build the messages array — prior history + new user turn
  const messages = [
    ...history.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user' as const, content: message },
  ]

  // 7. Stream response — toTextStreamResponse() pipes SSE chunks to the client
  const result = streamText({
    model: getModel('orchestrator'),
    system: systemPrompt,
    messages,
  })

  return result.toTextStreamResponse()
}
