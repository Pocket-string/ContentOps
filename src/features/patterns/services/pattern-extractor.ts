import { z } from 'zod'
import { generateText } from 'ai'
import { getModel } from '@/shared/lib/ai-router'
import { createClient } from '@/lib/supabase/server'

const extractedPatternsSchema = z.object({
  patterns: z.array(z.object({
    recipe_step: z.string(),
    content: z.string(),
    pattern_type: z.enum(['hook', 'cta', 'content_structure', 'topic_angle']),
    effectiveness_score: z.number().min(0).max(100),
  })),
  golden_summary: z.string(),
})

/**
 * Extract patterns from a winning post using AI.
 * Decomposes the post into recipe steps (Hook, Humanization, Escalado, etc.)
 * and saves each as a pattern in pattern_library.
 */
export async function extractPatternsFromPost(
  postId: string,
  workspaceId: string,
  userId: string,
  content: string,
  variant: string,
  funnelStage: string,
  scoreJson: Record<string, unknown> | null,
): Promise<{ extracted: number }> {
  const model = await getModel('synthesize-research', workspaceId)

  const { text: jsonText } = await generateText({
    model,
    system: `Eres un analista de contenido LinkedIn. Descompone el siguiente post en sus componentes segun la receta "Ingeniero Poeta" de Jonathan Navarrete.

Responde UNICAMENTE con JSON valido (sin markdown, sin backticks):
{
  "patterns": [
    {
      "recipe_step": "hook_contradictorio|humanizacion|escalado_numerico|escena_sensorial|revelacion_metodo|dato_shock|triple_leccion|cta_conversacion",
      "content": "el texto exacto del post que corresponde a este paso",
      "pattern_type": "hook|cta|content_structure|topic_angle",
      "effectiveness_score": 85
    }
  ],
  "golden_summary": "resumen de por que este post funciona bien"
}

REGLAS:
- Extrae cada paso de la receta que encuentres en el post (no todos estaran presentes)
- effectiveness_score: 0-100 basado en que tan bien ejecuta ese paso
- pattern_type: hook para el hook, cta para el CTA, content_structure para estructura narrativa, topic_angle para el angulo tematico
- golden_summary: 1-2 oraciones explicando que hace que este post destaque`,
    prompt: `Post (variante: ${variant}, etapa: ${funnelStage}):\n\n${content}${scoreJson ? `\n\nScore D/G/P/I: ${JSON.stringify(scoreJson)}` : ''}`,
  })

  const cleaned = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { extracted: 0 }

  const parsed = extractedPatternsSchema.safeParse(JSON.parse(jsonMatch[0]))
  if (!parsed.success) return { extracted: 0 }

  const supabase = await createClient()
  let extracted = 0

  for (const pattern of parsed.data.patterns) {
    const { error } = await supabase.from('pattern_library').insert({
      workspace_id: workspaceId,
      pattern_type: pattern.pattern_type,
      content: pattern.content,
      context: { funnel_stage: funnelStage, variant },
      performance: scoreJson ?? {},
      recipe_step: pattern.recipe_step,
      effectiveness_score: pattern.effectiveness_score,
      extracted_by: 'ai_auto',
      source_post_content: content.slice(0, 2000),
      created_by: userId,
      tags: [pattern.recipe_step, variant, funnelStage],
    })
    if (!error) extracted++
  }

  return { extracted }
}

/**
 * Build a golden template from the top-performing posts for a given content type.
 */
export async function buildGoldenTemplate(
  workspaceId: string,
  userId: string,
  contentType: 'alcance' | 'nutricion' | 'conversion',
): Promise<{ created: boolean }> {
  const supabase = await createClient()

  // Map content type to funnel stages
  const stageMap: Record<string, string[]> = {
    alcance: ['tofu_problem', 'mofu_problem'],
    nutricion: ['tofu_solution', 'mofu_solution'],
    conversion: ['bofu_conversion'],
  }
  const stages = stageMap[contentType]

  // Get top 3 posts by weighted engagement for these stages
  const { data: topMetrics } = await supabase
    .from('metrics')
    .select('post_id, weighted_engagement_rate, impressions, comments, saves')
    .eq('performance_label', 'top_performer')
    .order('weighted_engagement_rate', { ascending: false })
    .limit(10)

  if (!topMetrics || topMetrics.length === 0) return { created: false }

  // Filter to matching funnel stages
  const postIds = topMetrics.map(m => m.post_id)
  const { data: posts } = await supabase
    .from('posts')
    .select('id, funnel_stage, campaign_id')
    .in('id', postIds)
    .in('funnel_stage', stages)

  if (!posts || posts.length === 0) return { created: false }

  // Verify workspace membership
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id')
    .eq('workspace_id', workspaceId)
  const campaignIds = new Set((campaigns ?? []).map(c => c.id))
  const matchingPosts = posts.filter(p => campaignIds.has(p.campaign_id)).slice(0, 3)

  if (matchingPosts.length === 0) return { created: false }

  // Get content for matching posts
  const { data: versions } = await supabase
    .from('post_versions')
    .select('post_id, content, score_json')
    .in('post_id', matchingPosts.map(p => p.id))
    .eq('is_current', true)

  if (!versions || versions.length === 0) return { created: false }

  // Build the golden template — combine the best posts
  const templateContent = versions
    .map((v, i) => `=== EJEMPLO ${i + 1} ===\n${v.content}`)
    .join('\n\n')

  const metricsSnapshot: Record<string, unknown> = {}
  for (const v of versions) {
    const m = topMetrics.find(tm => tm.post_id === v.post_id)
    if (m) {
      metricsSnapshot[v.post_id] = {
        weighted_engagement_rate: m.weighted_engagement_rate,
        impressions: m.impressions,
        comments: m.comments,
        saves: m.saves,
      }
    }
  }

  // Upsert: deactivate old template, insert new
  await supabase
    .from('golden_templates')
    .update({ is_active: false })
    .eq('workspace_id', workspaceId)
    .eq('content_type', contentType)

  const { error } = await supabase.from('golden_templates').insert({
    workspace_id: workspaceId,
    content_type: contentType,
    template_content: templateContent,
    metrics_snapshot: metricsSnapshot,
    recipe_analysis: {},
    is_active: true,
    created_by: userId,
  })

  return { created: !error }
}
