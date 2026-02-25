import { streamText, stepCountIs } from 'ai'
import { requireAuth } from '@/lib/auth'
import { chatRateLimiter } from '@/lib/rate-limit'
import { getModel } from '@/shared/lib/ai-router'
import { createClient } from '@/lib/supabase/server'
import { chatInputSchema } from '@/features/orchestrator/types'
import { specialistTools } from '@/features/orchestrator/tools/specialist-tools'
import { getRecentLearnings } from '@/features/orchestrator/services/learning-service'

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

function buildSystemPrompt(contextDescription: string, learningsSection: string): string {
  return `Eres el Orquestador de ContentOps (Bitalize), un asistente experto en content operations para LinkedIn en el sector O&M fotovoltaico.

## Tu Rol
Eres el "maestro de marionetas" del flujo de contenido. Guias al usuario en cada etapa:
1. **Research**: Investigacion de mercado y tendencias del sector solar
2. **Topics**: Seleccion y enriquecimiento de temas para publicacion
3. **Campaigns**: Planificacion semanal de contenido con funnel stages
4. **Posts**: Generacion y refinamiento de copy con metodologia D/G/P/I
5. **Visuals**: Creacion de assets visuales para LinkedIn
6. **Analytics**: Metricas, patrones exitosos y aprendizajes

## Contexto Actual
${contextDescription}

## Herramientas Disponibles
Tienes acceso a herramientas que te permiten consultar datos reales del sistema:
- **getCampaignStatus**: Ver estado de una campana con sus posts y scores
- **getPostContent**: Leer el contenido de un post especifico con variantes
- **getResearchSummary**: Obtener resumen de investigacion con hallazgos clave
- **getTopicDetails**: Ver detalles completos de un tema (hipotesis, evidencia, senales)
- **listRecentCampaigns**: Listar campanas recientes del workspace
- **getTopPatterns**: Consultar patrones exitosos (hooks, CTAs) para inspiracion
- **suggestNavigation**: Sugerir al usuario navegar a otra pagina
- **recordLearning**: Registrar un aprendizaje para mejorar futuras interacciones

Usa las herramientas cuando el usuario pregunte sobre datos especificos. NO inventes datos — consulta siempre las herramientas para obtener informacion real.
${learningsSection}
## Reglas
- Responde en espanol, tono profesional pero cercano
- Se conciso (maximo 3-4 parrafos por respuesta)
- Cuando el usuario pregunte sobre campanas, posts o temas, USA las herramientas para obtener datos reales
- Si detectas que el usuario necesita ir a otro modulo, usa suggestNavigation
- Usa la metodologia D/G/P/I cuando hables de copy
- Referencia datos del sector O&M fotovoltaico cuando sea relevante
- Si el usuario da feedback valioso, usa recordLearning para registrarlo
- NO inventes datos ni metricas - usa las herramientas o se honesto sobre lo que no sabes`
}

/**
 * Fetches workspace_id for the current user.
 */
async function getWorkspaceId(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  return data?.workspace_id ?? null
}

/**
 * Loads recent learnings and formats them as a system prompt section.
 */
async function buildLearningsSection(workspaceId: string | null): Promise<string> {
  if (!workspaceId) return ''
  const result = await getRecentLearnings(workspaceId, 10)
  const learnings = result.data ?? []
  if (learnings.length === 0) return ''

  const items = learnings
    .filter((l) => l.feedback_text)
    .slice(0, 5)
    .map((l) => `- [${l.agent_type}] ${l.feedback_text}`)
    .join('\n')

  if (!items) return ''

  return `
## Aprendizajes del Workspace
Estos son insights y feedback previos del usuario. Usalos para mejorar tus respuestas:
${items}
`
}

/**
 * Logs a tool call to orchestrator_actions (fire-and-forget).
 */
async function logAction(params: {
  sessionId: string | undefined
  workspaceId: string | null
  userId: string
  toolName: string
  input: unknown
  output: unknown
  status: 'success' | 'failed'
  errorMessage?: string
}) {
  if (!params.workspaceId) return
  try {
    const supabase = await createClient()
    await supabase.from('orchestrator_actions').insert({
      session_id: params.sessionId ?? null,
      workspace_id: params.workspaceId,
      agent_type: 'orchestrator',
      action_name: params.toolName,
      input_data: params.input,
      output_data: params.output,
      status: params.status,
      error_message: params.errorMessage ?? null,
      executed_by: params.userId,
    })
  } catch (err) {
    console.error('[chat/route] Failed to log action:', err)
  }
}

export async function POST(request: Request): Promise<Response> {
  // 1. Auth
  const user = await requireAuth()

  // 2. Rate limit — 30 req/min per user
  const rateLimitResult = chatRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  // 3. Parse request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo invalido' }, { status: 400 })
  }

  // 4. Validate input with Zod
  const parsed = chatInputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  const { message, context, history, sessionId } = parsed.data

  // 5. Get workspace context + learnings in parallel
  const workspaceId = await getWorkspaceId(user.id)
  const learningsSection = await buildLearningsSection(workspaceId)

  // 6. Build context description for the system prompt
  const moduleLabel = MODULE_LABELS[context.module] ?? context.module
  let contextDescription = `Modulo: ${moduleLabel} (${context.path})`
  if (context.campaignId) contextDescription += `\nCampana ID: ${context.campaignId}`
  if (context.postId) contextDescription += `\nPost ID: ${context.postId}`
  if (context.topicId) contextDescription += `\nTema ID: ${context.topicId}`
  if (context.researchId) contextDescription += `\nResearch ID: ${context.researchId}`
  if (context.dayOfWeek !== undefined) contextDescription += `\nDia: ${context.dayOfWeek}`
  if (context.funnelStage) contextDescription += `\nFunnel: ${context.funnelStage}`

  const systemPrompt = buildSystemPrompt(contextDescription, learningsSection)

  // 7. Build the messages array
  const messages = [
    ...history.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user' as const, content: message },
  ]

  // 8. Stream response with tool calling + action logging
  const result = streamText({
    model: getModel('orchestrator'),
    system: systemPrompt,
    messages,
    tools: specialistTools,
    stopWhen: stepCountIs(3),
    onStepFinish: async (step) => {
      // Log each tool call to orchestrator_actions
      if (step.toolCalls && step.toolCalls.length > 0) {
        for (const tc of step.toolCalls) {
          const toolResult = step.toolResults?.find(
            (tr) => tr.toolCallId === tc.toolCallId
          )
          await logAction({
            sessionId,
            workspaceId,
            userId: user.id,
            toolName: tc.toolName,
            input: tc.input,
            output: toolResult?.output ?? null,
            status: 'success',
          })
        }
      }
    },
  })

  return result.toTextStreamResponse()
}
