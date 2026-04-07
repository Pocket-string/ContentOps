import { generateText } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getModel } from '@/shared/lib/ai-router'
import { getWorkspaceId } from '@/lib/workspace'
import { getActiveBrandProfile } from '@/features/brand/services/brand-service'
import { getTopPatterns } from '@/features/patterns/services/pattern-service'
import { getRecentHooks } from '@/features/posts/services/hook-history-service'
import { createCampaignWithPosts } from '@/features/campaigns/services/campaign-service'
import { createPostVersion } from '@/features/posts/services/post-service'
import { createTopic } from '@/features/topics/services/topic-service'
import { deriveTopicFromResearch } from '@/features/topics/services/topic-derivation'
import { deepenTopic } from '@/features/research/services/topic-deepener'
import { buildResearchPrompt } from '@/features/research/services/research-prompt-builder'
import { FUNNEL_STAGE_GUIDE } from '@/shared/lib/funnel-stage-guide'
import { reviewCopy } from '@/shared/lib/ai-reviewer'
import type { PipelineStatus, FunnelStage } from '@/shared/types/content-ops'
import { structuredContentSchema, weeklyBriefSchema } from '@/shared/types/content-ops'
import { GEMINI_MODEL } from '@/shared/lib/gemini'
import { getGoogleProvider } from '@/shared/lib/ai-router'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineParams {
  workspaceId: string
  userId: string
  tema: string
  buyerPersona?: string
  keyword?: string
  pillarId?: string
  weekStart: string
}

interface PipelineResult {
  campaignId: string
  errors: Array<{ step: string; message: string }>
}

// Copy generation output schema (same as generate-copy route)
const generatedCopySchema = z.object({
  variants: z
    .array(
      z.object({
        variant: z.enum(['contrarian', 'story', 'data_driven']),
        content: z.string().min(1),
        hook: z.string().min(1),
        cta: z.string().min(1),
        structured_content: structuredContentSchema.optional(),
      })
    )
    .min(3),
})

// Research output schema (simplified for pipeline)
const researchOutputSchema = z.object({
  summary: z.string(),
  key_findings: z.array(z.object({
    finding: z.string(),
    relevance: z.string(),
    source: z.string(),
  })).min(1),
  suggested_topics: z.array(z.object({
    title: z.string(),
    angle: z.string(),
    hook_idea: z.string(),
  })).min(1),
  market_context: z.string().optional(),
  sources: z.array(z.string()).default([]),
  invisible_enemy: z.string().optional(),
  thesis: z.string().optional(),
  conversion_resource: z.string().optional(),
  topic_candidates: z.array(z.object({
    title: z.string(),
    angle: z.string(),
    hook_idea: z.string(),
    fit_score: z.number().min(0).max(100),
    ai_recommendation: z.string().optional(),
  })).default([]),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function computeWordOverlap(a: string, b: string): number {
  const stopWords = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'y', 'o', 'que', 'por', 'para', 'con', 'no', 'es', 'se', 'su', 'al', 'lo', 'como', 'mas', 'pero', 'sus', 'le', 'ya', 'o', 'fue', 'ha', 'si', 'a', 'the', 'is', 'of', 'and', 'to', 'in'])
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w)))
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w)))
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length
  return intersection / Math.max(wordsA.size, wordsB.size)
}

async function updatePipelineStatus(
  campaignId: string,
  status: Partial<PipelineStatus>
): Promise<void> {
  const supabase = await createClient()
  // Fetch current status, merge, and update
  const { data: current } = await supabase
    .from('campaigns')
    .select('pipeline_status')
    .eq('id', campaignId)
    .single()

  const currentStatus = (current?.pipeline_status as PipelineStatus | null) ?? {
    stage: 'research',
    progress: 0,
    started_at: new Date().toISOString(),
    completed_steps: [],
    errors: [],
  }

  const merged = { ...currentStatus, ...status }

  await supabase
    .from('campaigns')
    .update({ pipeline_status: merged })
    .eq('id', campaignId)
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function executeWeekPipeline(params: PipelineParams): Promise<PipelineResult> {
  const { workspaceId, userId, tema, buyerPersona, keyword, pillarId, weekStart } = params
  const errors: Array<{ step: string; message: string; timestamp: string }> = []
  let campaignId = ''

  try {
    // =========================================================================
    // PHASE A: Research + Topic + Campaign (synchronous — returns campaignId)
    // =========================================================================

    // STEP 1: Research
    const googleProvider = await getGoogleProvider(workspaceId)
    const promptData = await buildResearchPrompt(tema, buyerPersona, undefined, undefined)
    const researchPrompt = promptData?.optimized_prompt ?? tema

    // Update status — we'll create a temp campaign first so we can track progress
    // We'll create campaign in step 3, so for now just log

    const systemPrompt = `Eres un analista de investigacion experto en el sector de O&M fotovoltaico.
Tu mision es investigar temas del sector y producir un reporte detallado con hallazgos clave.
Reglas:
- Basa tus hallazgos en informacion verificable y reciente
- Cada finding debe incluir datos especificos
- Para CADA hallazgo, indica claramente la fuente
- Prioriza informacion cuantitativa
- NO inventes datos ni fuentes
${buyerPersona ? `- Enfoca para el perfil: ${buyerPersona}` : ''}`

    const searchQueries = promptData?.search_queries?.length
      ? promptData.search_queries.slice(0, 3) // Fewer queries for pipeline speed
      : [researchPrompt]

    const searchResults = await Promise.allSettled(
      searchQueries.map((query: string, i: number) =>
        delay(i * 500).then(() =>
          generateText({
            model: googleProvider(GEMINI_MODEL),
            tools: { google_search: googleProvider.tools.googleSearch({}) },
            system: systemPrompt,
            prompt: query,
          })
        )
      )
    )

    const groundedText = searchResults
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<{ text: string }>).value.text)
      .filter(t => t.trim().length > 50)
      .join('\n\n---\n\n')

    // Structure into JSON
    const textForStructuring = groundedText.trim().length > 50
      ? groundedText
      : `Tema: ${tema}\nGenera un analisis basado en tu conocimiento del sector fotovoltaico.`

    const { text: jsonText } = await generateText({
      model: googleProvider(GEMINI_MODEL),
      system: `Responde UNICAMENTE con un objeto JSON valido. Sin markdown, sin backticks.
El JSON debe tener: summary (string), key_findings (array of {finding, relevance, source}), suggested_topics (array of {title, angle, hook_idea}), market_context (string), sources (array), invisible_enemy (string), thesis (string), conversion_resource (string), topic_candidates (array of {title, angle, hook_idea, fit_score, ai_recommendation}).
key_findings: 3-8 items. suggested_topics: 3-6 items. topic_candidates: 3-8 items con fit_score 0-100.`,
      prompt: `Estructura esta investigacion en JSON:\n\n${textForStructuring.slice(0, 6000)}`,
    })

    const cleaned = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Research: AI no pudo estructurar resultados')

    const rawResearch = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    // Lenient slice
    if (Array.isArray(rawResearch.key_findings)) rawResearch.key_findings = rawResearch.key_findings.slice(0, 10)
    if (Array.isArray(rawResearch.suggested_topics)) rawResearch.suggested_topics = rawResearch.suggested_topics.slice(0, 8)
    if (Array.isArray(rawResearch.topic_candidates)) rawResearch.topic_candidates = rawResearch.topic_candidates.slice(0, 8)

    const researchValidated = researchOutputSchema.safeParse(rawResearch)
    if (!researchValidated.success) throw new Error('Research: formato invalido')
    const researchData = researchValidated.data

    // Save research report
    const supabase = await createClient()
    const { data: researchRow } = await supabase
      .from('research_reports')
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        title: tema,
        source: 'Pipeline Agentico (Gemini + Google Search)',
        raw_text: groundedText || tema,
        tags_json: [],
        ai_synthesis: researchData,
        ...(pillarId ? { pillar_id: pillarId } : {}),
      })
      .select('id')
      .single()

    // =========================================================================
    // STEP 2: Topic derivation
    // =========================================================================
    // Pick the best topic candidate (highest fit_score) or first suggested topic
    const bestCandidate = researchData.topic_candidates.length > 0
      ? researchData.topic_candidates.sort((a, b) => b.fit_score - a.fit_score)[0]
      : researchData.suggested_topics[0]

    const selectedTopic = {
      title: bestCandidate.title,
      angle: bestCandidate.angle,
      hook_idea: bestCandidate.hook_idea,
    }

    const researchContext = {
      title: researchData.summary.slice(0, 200),
      summary: researchData.summary,
      market_context: researchData.market_context,
      key_findings: researchData.key_findings,
      sources: researchData.sources,
      ...(pillarId ? { pillar_id: pillarId } : {}),
    }

    const derivedFields = await deriveTopicFromResearch(workspaceId, researchContext, selectedTopic)

    const topicResult = await createTopic(workspaceId, userId, {
      title: selectedTopic.title,
      priority: 'high',
      signals_json: derivedFields.signals_json ?? [],
      failure_modes: derivedFields.failure_modes ?? [],
      content_angles: derivedFields.content_angles ?? [],
      key_data_points: derivedFields.key_data_points ?? [],
      ...(pillarId ? { pillar_id: pillarId } : {}),
      ...derivedFields,
    })

    if (topicResult.error || !topicResult.data) {
      throw new Error(`Topic creation failed: ${topicResult.error}`)
    }
    const topic = topicResult.data

    // =========================================================================
    // STEP 2b: Topic deepening (PRP-010) — second focused research pass
    // =========================================================================
    let topicDeepeningData: Awaited<ReturnType<typeof deepenTopic>> = null
    try {
      const researchIdForDeepening = researchRow?.id as string | undefined
      if (researchIdForDeepening) {
        topicDeepeningData = await deepenTopic({
          workspaceId,
          researchId: researchIdForDeepening,
          topicTitle: topic.title,
          hypothesis: derivedFields.hypothesis ?? null,
          silentEnemyName: derivedFields.silent_enemy_name ?? null,
          evidence: derivedFields.evidence ?? null,
          contentAngles: derivedFields.content_angles ?? [],
          existingSynthesis: researchData as Record<string, unknown>,
        })
      }
    } catch (deepenErr) {
      // Non-fatal: topic deepening is optional enhancement
      errors.push({ step: 'topic_deepening', message: String(deepenErr), timestamp: new Date().toISOString() })
    }

    // =========================================================================
    // STEP 3: Campaign creation
    // =========================================================================
    const campaignResult = await createCampaignWithPosts(workspaceId, userId, {
      topic_id: topic.id,
      week_start: weekStart,
      keyword: keyword,
      resource_json: {},
      audience_json: {},
      post_frequency: 5,
      ...(pillarId ? { pillar_id: pillarId } : {}),
    })

    if (campaignResult.error || !campaignResult.data) {
      throw new Error(`Campaign creation failed: ${campaignResult.error}`)
    }
    const campaign = campaignResult.data
    campaignId = campaign.id

    // Now update pipeline status
    await updatePipelineStatus(campaignId, {
      stage: 'copy',
      progress: 30,
      started_at: new Date().toISOString(),
      completed_steps: ['research', 'topic', 'campaign'],
      errors: [],
      total_posts: campaign.posts.length,
    })

    // Update weekly brief on the campaign (enriched with topic deepening data)
    const deepeningContext = topicDeepeningData
      ? `\n\nEvidencia profunda: ${topicDeepeningData.specific_evidence.map(e => `${e.fact} (${e.source})`).join('; ')}\nSubproblemas: ${topicDeepeningData.subproblems.join('; ')}`
      : ''
    const weeklyBrief = {
      tema,
      enemigo_silencioso: researchData.invisible_enemy ?? derivedFields.silent_enemy_name,
      evidencia_clave: (derivedFields.evidence ?? '') + deepeningContext,
      senales_mercado: derivedFields.signals_json ?? [],
      anti_mito: derivedFields.anti_myth,
      buyer_persona: buyerPersona,
      keyword: keyword,
      recurso: researchData.conversion_resource,
      restriccion_links: true,
    }
    const briefParsed = weeklyBriefSchema.safeParse(weeklyBrief)
    if (briefParsed.success) {
      await supabase
        .from('campaigns')
        .update({ weekly_brief: briefParsed.data })
        .eq('id', campaignId)
    }

    // =========================================================================
    // PHASE B: Copy + Visual generation (fire-and-forget background)
    // Return campaignId NOW so UI can start polling
    // =========================================================================
    const bgParams = {
      campaignId,
      campaign,
      topic,
      workspaceId,
      userId,
      tema,
      keyword,
      pillarId,
    }

    // Fire-and-forget: don't await, let it run in the background
    runPipelineBackground(bgParams).catch(err => {
      console.error('[pipeline] Background pipeline error:', err)
    })

    return { campaignId, errors: [] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown pipeline error'
    console.error('[pipeline] Fatal error:', msg)

    if (campaignId) {
      await updatePipelineStatus(campaignId, {
        stage: 'error',
        progress: 0,
        errors: [...errors, { step: 'fatal', message: msg, timestamp: new Date().toISOString() }],
      })
    }

    return { campaignId, errors: [{ step: 'fatal', message: msg }] }
  }
}

// ---------------------------------------------------------------------------
// Background pipeline: Copy + Visual generation
// ---------------------------------------------------------------------------

interface BackgroundParams {
  campaignId: string
  campaign: { id: string; posts: Array<{ id: string; funnel_stage: string; day_of_week: number }> }
  topic: Record<string, unknown>
  workspaceId: string
  userId: string
  tema: string
  keyword?: string
  pillarId?: string
}

async function runPipelineBackground(params: BackgroundParams): Promise<void> {
  const { campaignId, campaign, topic, workspaceId, userId, tema, keyword } = params
  const errors: Array<{ step: string; message: string; timestamp: string }> = []

  try {
    // =========================================================================
    // STEP 4: Copy generation for each post
    // =========================================================================
    const [brandResult, hookPatterns, ctaPatterns] = await Promise.all([
      getActiveBrandProfile(workspaceId),
      getTopPatterns(workspaceId, 'hook', undefined, 5),
      getTopPatterns(workspaceId, 'cta', undefined, 5),
    ])
    const brandTone = brandResult.data?.tone ?? 'profesional, tecnico pero accesible, confiable'
    const crossCampaignHooks = await getRecentHooks(workspaceId, 50)
    const usedHooks: string[] = [...crossCampaignHooks]

    // Build topic context string for copy generation
    const topicContext = [
      (topic as Record<string, string>).hypothesis ? `Hipotesis: ${(topic as Record<string, string>).hypothesis}` : '',
      (topic as Record<string, string>).evidence ? `Evidencia: ${(topic as Record<string, string>).evidence}` : '',
      (topic as Record<string, string>).anti_myth ? `Anti-mito: ${(topic as Record<string, string>).anti_myth}` : '',
      (topic as Record<string, string>).silent_enemy_name ? `Enemigo silencioso: ${(topic as Record<string, string>).silent_enemy_name}` : '',
      (topic as Record<string, string>).expected_business_impact ? `Impacto: ${(topic as Record<string, string>).expected_business_impact}` : '',
      (topic as Record<string, string>).source_context ? `Contexto: ${(topic as Record<string, string>).source_context}` : '',
      (topic as Record<string, string>).market_context ? `Mercado: ${(topic as Record<string, string>).market_context}` : '',
    ].filter(Boolean).join('\n')

    // Build pattern context
    const patternLines: string[] = []
    if (hookPatterns.data?.length) {
      patternLines.push('**Hooks exitosos previos:**')
      for (const p of hookPatterns.data) {
        patternLines.push(`- "${p.content}"`)
      }
    }
    if (ctaPatterns.data?.length) {
      patternLines.push('\n**CTAs exitosos previos:**')
      for (const p of ctaPatterns.data) {
        patternLines.push(`- "${p.content}"`)
      }
    }
    const patternSection = patternLines.length > 0 ? `\n${patternLines.join('\n')}` : ''

    for (let i = 0; i < campaign.posts.length; i++) {
      const post = campaign.posts[i]

      await updatePipelineStatus(campaignId, {
        stage: 'copy',
        progress: 30 + Math.round((i / campaign.posts.length) * 35),
        current_post_index: i,
      })

      let copyGenerated = false
      let attempts = 0
      const maxAttempts = 2

      while (!copyGenerated && attempts < maxAttempts) {
        attempts++
        try {
          const stageConfig = FUNNEL_STAGE_GUIDE[post.funnel_stage as FunnelStage]
          const funnelGuideSection = stageConfig ? `
## GUIA POR ETAPA DEL FUNNEL (${post.funnel_stage})
- **Objetivo**: ${stageConfig.objective}
- **Tono**: ${stageConfig.tone}
- **Hook optimo**: ${stageConfig.hook_style}
- **CTA esperado**: ${stageConfig.cta_type}
- **Profundidad**: ${stageConfig.content_depth}` : ''

          const copySystemPrompt = `Eres un experto en copywriting para LinkedIn especializado en O&M fotovoltaico.
Tono de marca: ${brandTone}
${funnelGuideSection}

## HOOK — Resultado Inesperado + Detalle Especifico
PROHIBIDO: hooks genericos, empezar con emoji, "Sabias que..." sin dato.

## ESTRUCTURA — Brick by Brick (Stakes → Story → Shift)
1. Stakes: costo real de ignorar el problema
2. Story: caso de campo con tension narrativa
3. Shift: principio universal aplicable

## FORMATO LINKEDIN
- Parrafos de 1-2 lineas. Doble salto entre ideas.
- Max 2 emojis funcionales. Sin links externos.
- NO incluir hashtags (#) bajo ninguna circunstancia.

IMPORTANTE: Responde UNICAMENTE con JSON valido, sin markdown, sin backticks.`

          const antiRepSection = usedHooks.length > 0
            ? `\n## ANTI-REPETITIVIDAD\nHooks ya usados (PROHIBIDO repetir):\n${usedHooks.slice(0, 20).map((h, idx) => `${idx + 1}. "${h}"`).join('\n')}\n`
            : ''

          const userPrompt = `Genera 3 variantes de post LinkedIn:
**Tema**: ${tema}
**Keyword**: ${keyword ?? 'No especificada'}
**Etapa funnel**: ${post.funnel_stage}
${topicContext ? `\n## DATOS VERIFICADOS\n${topicContext}` : ''}
${patternSection}
${antiRepSection}

Responde con JSON: {"variants": [{"variant": "contrarian", "content": "...", "hook": "...", "cta": "...", "structured_content": {"hook":"","context":"","signals":"","provocation":"","cta":""}},...]}
Las 3 variantes: contrarian, story, data_driven. Funcionalmente distintas.`

          const result = await generateText({
            model: await getModel('generate-copy', workspaceId),
            system: copySystemPrompt,
            prompt: userPrompt,
          })

          let jsonStr = result.text.trim()
          if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
          }

          const parsed = generatedCopySchema.safeParse(JSON.parse(jsonStr))
          if (!parsed.success) {
            throw new Error('Copy format invalid')
          }

          // Check hook overlap — if >30% overlap with any used hook, try again
          const firstHook = parsed.data.variants[0].hook
          const hasOverlap = usedHooks.some(h => computeWordOverlap(firstHook, h) > 0.3)
          if (hasOverlap && attempts < maxAttempts) {
            continue // retry
          }

          // Save all 3 variants as post versions
          for (const variant of parsed.data.variants) {
            await createPostVersion(userId, {
              post_id: post.id,
              variant: variant.variant,
              content: variant.content,
              structured_content: variant.structured_content,
            })
          }

          // Track hooks for intra-campaign anti-repetition
          for (const v of parsed.data.variants) {
            usedHooks.push(v.hook)
          }

          // Auto-select recommended variant via critic (optional, non-fatal)
          try {
            const review = await reviewCopy(
              parsed.data.variants[0].content,
              parsed.data.variants[0].variant,
              post.funnel_stage,
              workspaceId
            )
            if (review?.overall_score && review.overall_score >= 70) {
              const supabaseInner = await createClient()
              await supabaseInner
                .from('posts')
                .update({ selected_variant: 'contrarian' })
                .eq('id', post.id)
            }
          } catch {
            // Non-fatal
          }

          copyGenerated = true
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          console.error(`[pipeline] Copy gen failed for post ${i + 1}, attempt ${attempts}:`, msg)
          if (attempts >= maxAttempts) {
            errors.push({ step: `copy_post_${i + 1}`, message: msg, timestamp: new Date().toISOString() })
          }
        }
      }

      // Small delay between posts to avoid rate limits
      if (i < campaign.posts.length - 1) {
        await delay(1000)
      }
    }

    // =========================================================================
    // STEP 5: Visual generation for each post (optional — non-fatal)
    // =========================================================================
    await updatePipelineStatus(campaignId, {
      stage: 'visual',
      progress: 65,
      completed_steps: ['research', 'topic', 'campaign', 'copy'],
    })

    for (let i = 0; i < campaign.posts.length; i++) {
      const post = campaign.posts[i]

      await updatePipelineStatus(campaignId, {
        stage: 'visual',
        progress: 65 + Math.round((i / campaign.posts.length) * 25),
        current_post_index: i,
      })

      try {
        const supabaseInner = await createClient()
        const { data: versions } = await supabaseInner
          .from('post_versions')
          .select('content')
          .eq('post_id', post.id)
          .eq('is_current', true)
          .limit(1)

        const postContent = versions?.[0]?.content
        if (!postContent) continue

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
        const visualResponse = await fetch(`${baseUrl}/api/ai/generate-visual-complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: '' },
          body: JSON.stringify({
            post_id: post.id,
            post_content: postContent,
            funnel_stage: post.funnel_stage,
            topic: tema,
            keyword,
          }),
        })

        if (!visualResponse.ok) {
          const errBody = await visualResponse.text()
          throw new Error(`Visual API ${visualResponse.status}: ${errBody.slice(0, 200)}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[pipeline] Visual gen failed for post ${i + 1}:`, msg)
        errors.push({ step: `visual_post_${i + 1}`, message: msg, timestamp: new Date().toISOString() })
      }

      if (i < campaign.posts.length - 1) {
        await delay(1500)
      }
    }

    // =========================================================================
    // STEP 6: Complete
    // =========================================================================
    const supabaseFinal = await createClient()
    await updatePipelineStatus(campaignId, {
      stage: errors.length > 0 ? 'review' : 'complete',
      progress: 100,
      completed_steps: ['research', 'topic', 'campaign', 'copy', 'visual'],
      errors,
    })

    await supabaseFinal
      .from('campaigns')
      .update({ status: 'in_progress' })
      .eq('id', campaignId)

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown background pipeline error'
    console.error('[pipeline] Background fatal error:', msg)

    await updatePipelineStatus(campaignId, {
      stage: 'error',
      progress: 0,
      errors: [...errors, { step: 'fatal', message: msg, timestamp: new Date().toISOString() }],
    })
  }
}
