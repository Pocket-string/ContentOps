import { z } from 'zod'
import { tool, generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { google, GEMINI_MODEL } from '@/shared/lib/gemini'
import { buildResearchPrompt } from '@/features/research/services/research-prompt-builder'
import { getWorkspaceId } from '@/lib/workspace'

/**
 * Specialist tools that the orchestrator can call via Gemini function calling.
 * Each tool wraps existing service logic, making it available to the AI.
 *
 * AI SDK v6 uses `inputSchema` (not `parameters`).
 */

// ============================================
// Tool: Get Campaign Status
// ============================================
export const getCampaignStatus = tool({
  description: 'Obtiene el estado actual de una campana: posts generados, scores, estado de cada dia',
  inputSchema: z.object({
    campaignId: z.string().uuid().describe('ID de la campana'),
  }),
  execute: async ({ campaignId }) => {
    const supabase = await createClient()
    const { data: campaign } = await supabase
      .from('campaigns')
      .select(`
        id, week_start, keyword, status,
        topics(title, hypothesis),
        posts(
          id, day_of_week, funnel_stage, status, objective,
          post_versions(id, variant, version, is_current, score_json, content)
        )
      `)
      .eq('id', campaignId)
      .single()

    if (!campaign) return { error: 'Campana no encontrada' }

    const posts = (campaign.posts ?? []).map((p: Record<string, unknown>) => {
      const versions = (p.post_versions ?? []) as Array<Record<string, unknown>>
      const currentVersions = versions.filter((v) => v.is_current)
      return {
        day: p.day_of_week,
        funnel: p.funnel_stage,
        status: p.status,
        objective: p.objective,
        variantsGenerated: currentVersions.length,
        scores: currentVersions
          .filter((v) => v.score_json)
          .map((v) => ({
            variant: v.variant,
            score: (v.score_json as Record<string, unknown>)?.total ?? null,
          })),
      }
    })

    // topics is an array from the join — extract first item
    const topicsArr = campaign.topics as unknown as Array<Record<string, unknown>> | null
    const topicTitle = topicsArr?.[0]?.title ?? 'Sin tema'

    return {
      id: campaign.id,
      topic: topicTitle,
      keyword: campaign.keyword,
      status: campaign.status,
      weekStart: campaign.week_start,
      posts,
    }
  },
})

// ============================================
// Tool: Get Post Content
// ============================================
export const getPostContent = tool({
  description: 'Obtiene el contenido actual de un post especifico con sus variantes y scores',
  inputSchema: z.object({
    campaignId: z.string().uuid().describe('ID de la campana'),
    dayOfWeek: z.number().min(1).max(7).describe('Dia de la semana (1=Lunes, 7=Domingo)'),
  }),
  execute: async ({ campaignId, dayOfWeek }) => {
    const supabase = await createClient()
    const { data: post } = await supabase
      .from('posts')
      .select(`
        id, day_of_week, funnel_stage, status, objective,
        post_versions(id, variant, version, content, score_json, is_current, created_at)
      `)
      .eq('campaign_id', campaignId)
      .eq('day_of_week', dayOfWeek)
      .single()

    if (!post) return { error: 'Post no encontrado' }

    const versions = (post.post_versions ?? []) as Array<Record<string, unknown>>
    const currentVersions = versions.filter((v) => v.is_current)

    return {
      id: post.id,
      day: post.day_of_week,
      funnel: post.funnel_stage,
      status: post.status,
      objective: post.objective,
      variants: currentVersions.map((v) => ({
        variant: v.variant,
        version: v.version,
        contentPreview: (v.content as string)?.slice(0, 300) ?? '',
        score: v.score_json,
      })),
      totalVersions: versions.length,
    }
  },
})

// ============================================
// Tool: Get Research Summary
// ============================================
export const getResearchSummary = tool({
  description: 'Obtiene el resumen de una investigacion guardada con sus hallazgos clave',
  inputSchema: z.object({
    researchId: z.string().uuid().describe('ID del research'),
  }),
  execute: async ({ researchId }) => {
    const supabase = await createClient()
    const { data: research } = await supabase
      .from('research_reports')
      .select('id, title, source, raw_text, key_takeaways, recommended_angles, fit_score, ai_synthesis')
      .eq('id', researchId)
      .single()

    if (!research) return { error: 'Research no encontrado' }

    return {
      id: research.id,
      title: research.title,
      source: research.source,
      textPreview: research.raw_text?.slice(0, 500) ?? '',
      keyTakeaways: research.key_takeaways,
      recommendedAngles: research.recommended_angles,
      fitScore: research.fit_score,
      hasSynthesis: !!research.ai_synthesis,
    }
  },
})

// ============================================
// Tool: Get Topic Details
// ============================================
export const getTopicDetails = tool({
  description: 'Obtiene los detalles completos de un tema: hipotesis, evidencia, senales, enemigo silencioso',
  inputSchema: z.object({
    topicId: z.string().uuid().describe('ID del tema'),
  }),
  execute: async ({ topicId }) => {
    const supabase = await createClient()
    const { data: topic } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single()

    if (!topic) return { error: 'Tema no encontrado' }

    return {
      id: topic.id,
      title: topic.title,
      hypothesis: topic.hypothesis,
      evidence: topic.evidence,
      antiMyth: topic.anti_myth,
      silentEnemy: topic.silent_enemy_name,
      signals: topic.signals_json,
      fitScore: topic.fit_score,
      priority: topic.priority,
      status: topic.status,
    }
  },
})

// ============================================
// Tool: List Recent Campaigns
// ============================================
export const listRecentCampaigns = tool({
  description: 'Lista las campanas recientes del workspace con su estado',
  inputSchema: z.object({
    limit: z.number().min(1).max(10).default(5).describe('Cantidad de campanas a devolver'),
  }),
  execute: async ({ limit }) => {
    const supabase = await createClient()
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, week_start, keyword, status, topics(title)')
      .order('week_start', { ascending: false })
      .limit(limit)

    // topics is an array from the join — extract first item title
    return {
      campaigns: (campaigns ?? []).map((c) => {
        const topicsArr = c.topics as unknown as Array<Record<string, unknown>> | null
        return {
          id: c.id,
          weekStart: c.week_start,
          keyword: c.keyword,
          status: c.status,
          topic: topicsArr?.[0]?.title ?? 'Sin tema',
        }
      }),
    }
  },
})

// ============================================
// Tool: Get Workspace Patterns
// ============================================
export const getTopPatterns = tool({
  description: 'Obtiene los patrones mas exitosos (hooks, CTAs) del workspace para inspiracion',
  inputSchema: z.object({
    patternType: z.enum(['hook', 'cta', 'content_structure']).describe('Tipo de patron'),
    limit: z.number().min(1).max(10).default(5),
  }),
  execute: async ({ patternType, limit }) => {
    const supabase = await createClient()
    const { data: patterns } = await supabase
      .from('patterns')
      .select('id, content, context, performance, tags')
      .eq('pattern_type', patternType)
      .order('created_at', { ascending: false })
      .limit(limit)

    return {
      patterns: (patterns ?? []).map((p) => ({
        content: p.content,
        context: p.context,
        performance: p.performance,
        tags: p.tags,
      })),
    }
  },
})

// ============================================
// Tool: Navigate User
// ============================================
export const suggestNavigation = tool({
  description: 'Sugiere al usuario navegar a una pagina especifica de la app. Usa esto cuando el usuario necesita ir a otro modulo para completar una tarea.',
  inputSchema: z.object({
    path: z.string().describe('Ruta de la pagina. Ej: /research/new, /campaigns, /topics'),
    reason: z.string().describe('Razon por la que se sugiere esta navegacion'),
  }),
  execute: async ({ path, reason }) => {
    return { navigateTo: path, reason }
  },
})

// ============================================
// Tool: Record Learning
// ============================================
export const recordLearning = tool({
  description: 'Registra un aprendizaje o insight del usuario sobre el flujo de trabajo para mejorar futuras interacciones',
  inputSchema: z.object({
    insight: z.string().describe('El aprendizaje o insight a registrar'),
    agentType: z.string().describe('Area: copy, visual, research, topic, campaign, general'),
    context: z.string().optional().describe('Contexto adicional'),
  }),
  execute: async ({ insight, agentType, context }) => {
    const supabase = await createClient()

    // Get workspace_id from current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!member) return { error: 'Sin workspace' }

    await supabase.from('orchestrator_learnings').insert({
      workspace_id: member.workspace_id,
      agent_type: agentType,
      feedback_type: 'refinement',
      feedback_text: insight,
      context_json: { context: context ?? null, source: 'orchestrator_chat' },
      created_by: user.id,
    })

    return { recorded: true, message: 'Aprendizaje registrado para futuras interacciones' }
  },
})

// ============================================
// Tool: Run Grounded Research
// ============================================
const researchOutputSchema = z.object({
  summary: z.string(),
  key_findings: z.array(z.object({
    finding: z.string(),
    relevance: z.string(),
    source_hint: z.string().optional(),
  })).min(1).max(10),
  suggested_topics: z.array(z.object({
    title: z.string(),
    angle: z.string(),
    hook_idea: z.string(),
  })).min(1).max(8),
  market_context: z.string().optional(),
})

export const runGroundedResearch = tool({
  description: 'Ejecuta una investigacion de mercado con IA y Google Search sobre un tema del sector fotovoltaico. Crea un reporte con hallazgos clave y topics sugeridos para LinkedIn. USALA cuando el usuario pida investigar un tema.',
  inputSchema: z.object({
    tema: z.string().min(3).describe('Tema a investigar. Ej: "Limpieza robotizada de paneles solares 2026"'),
    buyerPersona: z.string().optional().describe('Perfil objetivo. Ej: "O&M Manager", "Asset Manager", "CTO"'),
    region: z.string().optional().describe('Region de interes. Ej: "LATAM", "Espana", "Global"'),
  }),
  execute: async ({ tema, buyerPersona, region }) => {
    try {
      // 1. Build optimized prompt via ChatGPT
      const promptData = await buildResearchPrompt(tema, buyerPersona, region)
      const researchPrompt = promptData?.optimized_prompt ?? tema

      // 2. Grounded search via Gemini + Google Search
      const systemPrompt = `Eres un analista de investigacion experto en el sector de O&M fotovoltaico (operacion y mantenimiento de plantas solares).

Tu mision es investigar temas del sector y producir un reporte detallado con hallazgos clave, topics sugeridos para contenido de LinkedIn, y contexto de mercado.

Reglas:
- Basa tus hallazgos en informacion verificable y reciente
- Cada finding debe incluir datos especificos (numeros, porcentajes, nombres de empresas)
- Los topics sugeridos deben seguir la metodologia D/G/P/I (Detener scroll, Ganar atencion, Provocar reaccion, Iniciar conversacion)
- Los hooks deben ser especificos y con datos, no genericos
- Prioriza informacion cuantitativa sobre opiniones
${buyerPersona ? `- Enfoca para el perfil: ${buyerPersona}` : ''}
${region ? `- Region de interes: ${region}` : ''}`

      const { text: groundedText } = await generateText({
        model: google(GEMINI_MODEL),
        tools: {
          google_search: google.tools.googleSearch({}),
        },
        system: systemPrompt,
        prompt: researchPrompt,
      })

      const textForStructuring = groundedText.trim().length > 50
        ? groundedText
        : `Tema de investigacion: ${tema}\n\nGenera un analisis basado en tu conocimiento del sector fotovoltaico.`

      // 3. Structure into JSON
      const { text: jsonText } = await generateText({
        model: google(GEMINI_MODEL),
        system: `Responde UNICAMENTE con un objeto JSON valido. Sin markdown, sin backticks.
El JSON debe seguir esta estructura:
{
  "summary": "resumen ejecutivo (1-3 parrafos)",
  "key_findings": [{"finding": "dato", "relevance": "importancia", "source_hint": "fuente"}],
  "suggested_topics": [{"title": "titulo", "angle": "angulo", "hook_idea": "gancho"}],
  "market_context": "contexto"
}
key_findings: 3-8 items, suggested_topics: 3-6 items. Todos strings.`,
        prompt: `Estructura esta investigacion en JSON:\n\n${textForStructuring.slice(0, 6000)}`,
      })

      // Parse JSON
      const cleaned = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return { error: 'No se pudo estructurar la investigacion. Intenta de nuevo.' }
      }

      const rawParsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
      if (Array.isArray(rawParsed.key_findings)) rawParsed.key_findings = rawParsed.key_findings.slice(0, 10)
      if (Array.isArray(rawParsed.suggested_topics)) rawParsed.suggested_topics = rawParsed.suggested_topics.slice(0, 8)

      const validated = researchOutputSchema.safeParse(rawParsed)
      if (!validated.success) {
        return { error: 'Los resultados no tienen el formato esperado. Intenta de nuevo.' }
      }
      const researchData = validated.data

      // 4. Save to DB
      let savedResearchId: string | undefined
      try {
        const workspaceId = await getWorkspaceId()
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const { data: newReport } = await supabase
          .from('research_reports')
          .insert({
            workspace_id: workspaceId,
            created_by: user!.id,
            title: tema,
            source: 'AI Research (Orchestrator)',
            raw_text: groundedText,
            tags_json: [],
            ai_synthesis: researchData,
          })
          .select('id')
          .single()

        if (newReport) savedResearchId = newReport.id as string
      } catch (saveErr) {
        console.error('[orchestrator] Research auto-save error:', saveErr)
      }

      return {
        success: true,
        researchId: savedResearchId,
        summary: researchData.summary,
        keyFindings: researchData.key_findings.length,
        suggestedTopics: researchData.suggested_topics.map((t) => t.title),
        viewUrl: savedResearchId ? `/research/${savedResearchId}` : '/research',
      }
    } catch (err) {
      console.error('[orchestrator] runGroundedResearch error:', err)
      return { error: err instanceof Error ? err.message : 'Error al investigar' }
    }
  },
})

// ============================================
// Export all tools as a single object
// ============================================
export const specialistTools = {
  getCampaignStatus,
  getPostContent,
  getResearchSummary,
  getTopicDetails,
  listRecentCampaigns,
  getTopPatterns,
  suggestNavigation,
  recordLearning,
  runGroundedResearch,
}
