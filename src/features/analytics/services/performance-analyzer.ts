import { createClient } from '@/lib/supabase/server'

interface MetricsRow {
  id: string
  post_id: string
  impressions: number
  comments: number
  saves: number
  shares: number
  reactions: number
  leads: number
}

interface WinningPost {
  post_id: string
  variant: string
  content: string
  funnel_stage: string
  score_json: Record<string, unknown> | null
  weighted_engagement_rate: number
  impressions: number
  comments: number
  saves: number
}

/**
 * Compute weighted engagement rate for a set of metrics.
 * Formula: (comments*3 + saves*2 + shares*2 + reactions) / max(impressions, 1) * 100
 * Weights reflect LinkedIn algorithm signals: comments > saves > shares > reactions
 */
export function computeWeightedEngagement(m: MetricsRow): number {
  const weighted = m.comments * 3 + m.saves * 2 + m.shares * 2 + m.reactions
  return (weighted / Math.max(m.impressions, 1)) * 100
}

/**
 * Label all posts in a workspace by performance percentile.
 * Top 20% = top_performer, Bottom 20% = underperformer, Middle = average.
 */
export async function labelPostPerformance(workspaceId: string): Promise<{ updated: number }> {
  const supabase = await createClient()

  // Fetch all metrics for workspace posts
  const { data: metricsRows } = await supabase
    .from('metrics')
    .select('id, post_id, impressions, comments, saves, shares, reactions, leads')
    .gt('impressions', 0)

  if (!metricsRows || metricsRows.length === 0) return { updated: 0 }

  // Filter to workspace posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, campaign_id')
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id')
    .eq('workspace_id', workspaceId)

  const campaignIds = new Set((campaigns ?? []).map(c => c.id))
  const workspacePostIds = new Set(
    (posts ?? []).filter(p => campaignIds.has(p.campaign_id)).map(p => p.id)
  )

  const workspaceMetrics = (metricsRows as MetricsRow[]).filter(m => workspacePostIds.has(m.post_id))
  if (workspaceMetrics.length === 0) return { updated: 0 }

  // Compute weighted engagement for each
  const scored = workspaceMetrics.map(m => ({
    ...m,
    weighted: computeWeightedEngagement(m),
  }))

  // Sort by weighted engagement
  scored.sort((a, b) => b.weighted - a.weighted)

  // Determine percentile thresholds
  const p80Index = Math.floor(scored.length * 0.2)
  const p20Index = Math.floor(scored.length * 0.8)

  // Update each metric row
  let updated = 0
  for (let i = 0; i < scored.length; i++) {
    const label = i < p80Index ? 'top_performer' : i >= p20Index ? 'underperformer' : 'average'
    const { error } = await supabase
      .from('metrics')
      .update({
        weighted_engagement_rate: Math.round(scored[i].weighted * 100) / 100,
        performance_label: label,
      })
      .eq('id', scored[i].id)
    if (!error) updated++
  }

  return { updated }
}

/**
 * Get winning posts (top performers) for a workspace with their content.
 */
export async function getWinningPosts(workspaceId: string, limit = 10): Promise<WinningPost[]> {
  const supabase = await createClient()

  // Step 1: Get workspace campaign IDs
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id')
    .eq('workspace_id', workspaceId)
  const campaignIds = (campaigns ?? []).map(c => c.id)
  if (campaignIds.length === 0) return []

  // Step 2: Get workspace post IDs with funnel_stage
  const { data: posts } = await supabase
    .from('posts')
    .select('id, funnel_stage, selected_variant, campaign_id')
    .in('campaign_id', campaignIds)
  const postMap = new Map((posts ?? []).map(p => [p.id, p]))

  // Step 3: Get top metrics
  const { data: metricsRows } = await supabase
    .from('metrics')
    .select('post_id, weighted_engagement_rate, impressions, comments, saves')
    .eq('performance_label', 'top_performer')
    .order('weighted_engagement_rate', { ascending: false })
    .limit(limit * 2)

  const workspaceMetrics = (metricsRows ?? []).filter(m => postMap.has(m.post_id)).slice(0, limit)
  if (workspaceMetrics.length === 0) return []

  // Step 4: Get content for these posts
  const postIds = workspaceMetrics.map(m => m.post_id)
  const { data: versions } = await supabase
    .from('post_versions')
    .select('post_id, variant, content, score_json')
    .in('post_id', postIds)
    .eq('is_current', true)

  const versionMap = new Map((versions ?? []).map(v => [v.post_id, v]))

  return workspaceMetrics.map(m => {
    const v = versionMap.get(m.post_id)
    const p = postMap.get(m.post_id)
    return {
      post_id: m.post_id,
      variant: v?.variant ?? p?.selected_variant ?? 'contrarian',
      content: v?.content ?? '',
      funnel_stage: p?.funnel_stage ?? '',
      score_json: (v?.score_json ?? null) as Record<string, unknown> | null,
      weighted_engagement_rate: m.weighted_engagement_rate ?? 0,
      impressions: m.impressions,
      comments: m.comments,
      saves: m.saves,
    }
  }).filter(p => p.content.length > 0)
}

/**
 * Get aggregate performance by variant type.
 */
export async function getPerformanceByVariant(workspaceId: string): Promise<Array<{
  variant: string
  count: number
  avg_engagement: number
  avg_comments: number
  avg_saves: number
}>> {
  const supabase = await createClient()

  // Get workspace posts
  const { data: campaigns } = await supabase.from('campaigns').select('id').eq('workspace_id', workspaceId)
  const campaignIds = (campaigns ?? []).map(c => c.id)
  if (campaignIds.length === 0) return []

  const { data: posts } = await supabase
    .from('posts')
    .select('id, selected_variant')
    .in('campaign_id', campaignIds)
  const postVariantMap = new Map((posts ?? []).map(p => [p.id, p.selected_variant ?? 'unknown']))

  const { data: metricsRows } = await supabase
    .from('metrics')
    .select('post_id, weighted_engagement_rate, comments, saves')
    .not('weighted_engagement_rate', 'is', null)

  if (!metricsRows || metricsRows.length === 0) return []

  const grouped = new Map<string, { rates: number[]; comments: number[]; saves: number[] }>()
  for (const row of metricsRows) {
    const variant = postVariantMap.get(row.post_id)
    if (!variant) continue
    if (!grouped.has(variant)) grouped.set(variant, { rates: [], comments: [], saves: [] })
    const g = grouped.get(variant)!
    g.rates.push(row.weighted_engagement_rate ?? 0)
    g.comments.push(row.comments)
    g.saves.push(row.saves)
  }

  return Array.from(grouped.entries()).map(([variant, g]) => ({
    variant,
    count: g.rates.length,
    avg_engagement: Math.round((g.rates.reduce((a, b) => a + b, 0) / g.rates.length) * 100) / 100,
    avg_comments: Math.round((g.comments.reduce((a, b) => a + b, 0) / g.comments.length) * 10) / 10,
    avg_saves: Math.round((g.saves.reduce((a, b) => a + b, 0) / g.saves.length) * 10) / 10,
  }))
}
