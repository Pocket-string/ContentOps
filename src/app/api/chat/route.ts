import { streamText, stepCountIs } from 'ai'
import { requireAuth } from '@/lib/auth'
import { chatRateLimiter } from '@/lib/rate-limit'
import { getModel } from '@/shared/lib/ai-router'
import { createClient } from '@/lib/supabase/server'
import { chatInputSchema } from '@/features/orchestrator/types'
import { getSpecialistTools } from '@/features/orchestrator/tools/specialist-tools'
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

## Conceptos del Dominio (MEMORIZA ESTO)

### Keyword CTA
Una **sola palabra** corta y memorable que se pide al lector escribir en los comentarios del post de LinkedIn para generar engagement. Ejemplos reales: "SCADA", "ALBEDO", "DRONE", "SOILING", "GEMELO". NO es una frase ni un call-to-action largo — es UNA palabra que funciona como gancho de interaccion. Al sugerirla, elige una palabra tecnica del sector que sea relevante al tema del post, facil de recordar, y que invite curiosidad.

### Funnel Stages (5 dias = 5 etapas)
Cada campana semanal tiene 5 posts (Lunes a Viernes), cada uno mapeado a una etapa del funnel:
| Dia | Etapa | Objetivo |
|-----|-------|----------|
| Lun (1) | tofu_problem | Awareness — el lector reconoce que tiene un problema |
| Mar (2) | mofu_problem | Profundizar — entender las consecuencias de no actuar |
| Mie (3) | tofu_solution | Presentar la solucion de forma educativa |
| Jue (4) | mofu_solution | Demostrar valor con datos, casos, o evidencia |
| Vie (5) | bofu_conversion | Convertir — CTA directo, cierre de la semana |

### Metodologia D/G/P/I (Scoring de Copy)
Cada post se evalua en 4 dimensiones, score 0-5 cada una (total 0-20):
- **D (Detener scroll)**: El hook detiene al lector? Dato impactante, pregunta provocadora, o contradiccion
- **G (Ganar atencion)**: El desarrollo mantiene la lectura? Estructura, ritmo, tension narrativa
- **P (Provocar reaccion)**: Genera emocion? Desafia creencias, crea urgencia, o valida frustraciones
- **I (Iniciar conversacion)**: El CTA motiva comentar? Keyword CTA, pregunta abierta, o reto

### 3 Variantes de Copy
Cada post se genera en 3 variantes para A/B testing:
- **Contrarian**: Desafia la creencia convencional del sector. Tono provocador.
- **Narrativa (story)**: Cuenta una historia o caso real. Tono cercano y experiencial.
- **Dato de Shock (data_driven)**: Abre con un dato estadistico impactante. Tono analitico.

### Weekly Brief (Estructura de Campana)
Cada campana semanal contiene:
- **tema**: Titulo del tema central de la semana
- **enemigo_silencioso**: El problema oculto que el lector no sabe que tiene
- **evidencia_clave**: Dato cuantitativo que respalda la urgencia
- **senales_mercado**: Tendencias actuales que validan el tema
- **anti_mito**: Creencia popular del sector que se desmiente
- **buyer_persona**: Perfil objetivo (O&M Manager, Asset Manager, CTO, etc.)
- **keyword**: La keyword CTA de la semana (UNA sola palabra)
- **recurso**: Lead magnet o recurso que se ofrece
- **restriccion_links**: LinkedIn penaliza links externos — usar estrategias alternativas

## Contexto Actual
${contextDescription}

## Herramientas Disponibles

### Acciones (ejecutan tareas)
- **runGroundedResearch**: EJECUTAR investigacion con IA + Google Search. USA ESTA cuando el usuario pida investigar.

### Consultas (leer datos reales del sistema)
- **getCampaignStatus**: Estado de una campana con posts y scores
- **getPostContent**: Contenido de un post con variantes y scores D/G/P/I
- **getResearchSummary**: Resumen de investigacion con hallazgos
- **getTopicDetails**: Detalles de un tema (hipotesis, evidencia, senales)
- **listRecentCampaigns**: Campanas recientes del workspace
- **getTopPatterns**: Patrones exitosos (hooks, CTAs, estructuras). USA ESTA cuando el usuario pregunte por keywords CTA, hooks, o patrones que funcionan.

### Utilidades
- **suggestNavigation**: Sugerir navegar a otra pagina
- **recordLearning**: Registrar un aprendizaje del usuario

## Reglas Criticas de Uso de Herramientas
1. **NUNCA inventes datos, metricas, hooks, CTAs, o keywords.** Si el usuario pide recomendaciones de CTAs, hooks, o patrones, USA getTopPatterns PRIMERO para consultar datos reales.
2. Cuando el usuario pida investigar, USA runGroundedResearch directamente — no le pidas que vaya a otro modulo.
3. Cuando pregunte sobre campanas, posts o temas, USA las herramientas de consulta para obtener datos reales.
4. Si no hay datos en el sistema (herramienta devuelve vacio), dilo honestamente y ofrece sugerencias basadas en tu conocimiento del sector, pero ACLARA que son sugerencias tuyas, no datos del workspace.
${learningsSection}
## Reglas Generales
- Responde en espanol, tono profesional pero cercano
- Se conciso (maximo 3-4 parrafos por respuesta)
- Si detectas que el usuario necesita ir a otro modulo, usa suggestNavigation
- Si el usuario da feedback valioso, usa recordLearning para registrarlo
- Referencia datos del sector O&M fotovoltaico cuando sea relevante
- Cuando hables de keyword CTA, recuerda: es UNA sola palabra para comentarios`
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
  if (context.selectedVariant) contextDescription += `\nEstas trabajando con la variante: ${context.selectedVariant}`
  if (context.visualFormat) contextDescription += `\nFormato visual: ${context.visualFormat}`

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
    model: await getModel('orchestrator', workspaceId ?? undefined),
    system: systemPrompt,
    messages,
    tools: getSpecialistTools(workspaceId ?? undefined),
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
