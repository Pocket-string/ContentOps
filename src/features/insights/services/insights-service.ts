import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { scoreJsonSchema } from '@/shared/types/content-ops'

// ============================================
// Types
// ============================================

export interface ServiceResult<T> {
  data?: T
  error?: string
}

export interface TopHook {
  content: string
  variant: string
  funnel_stage: string
  score_total: number
  campaign_week: string
}

export interface TopCTA {
  content: string
  leads: number
  campaign_week: string
}

export interface FormatPerformance {
  format: string
  count: number
  avg_score: number
}

export interface WeeklyTrend {
  week_start: string
  avg_impressions: number
  avg_comments: number
  avg_engagement_rate: number
  total_leads: number
}

export interface InsightsData {
  topHooks: TopHook[]
  topCTAs: TopCTA[]
  formatPerformance: FormatPerformance[]
  weeklyTrends: WeeklyTrend[]
  totalCampaigns: number
  totalPosts: number
  avgDGPIScore: number
}

// ============================================
// Internal Zod schemas for DB row parsing
// ============================================

const metricsCTARowSchema = z.object({
  leads: z.number().int().min(0),
  post_id: z.string().uuid(),
})

const postVersionForCTARowSchema = z.object({
  post_id: z.string().uuid(),
  content: z.string(),
})

const campaignForWeekRowSchema = z.object({
  id: z.string().uuid(),
  week_start: z.string().nullable(),
})

const visualFormatRowSchema = z.object({
  format: z.string(),
  post_id: z.string().uuid(),
})

const postVersionScoreRowSchema = z.object({
  post_id: z.string().uuid(),
  score_json: z.unknown().nullable(),
})

const metricsForTrendRowSchema = z.object({
  post_id: z.string().uuid(),
  impressions: z.number().int().min(0),
  comments: z.number().int().min(0),
  saves: z.number().int().min(0),
  shares: z.number().int().min(0),
  leads: z.number().int().min(0),
})

const postForTrendRowSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
})

const campaignForTrendRowSchema = z.object({
  id: z.string().uuid(),
  week_start: z.string().nullable(),
})

// ============================================
// Helpers
// ============================================

function extractHook(content: string): string {
  const firstLine = content.split('\n')[0] ?? ''
  return firstLine.trim().slice(0, 200)
}

function extractCTA(content: string): string {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Try to find the last meaningful line as CTA (typically after body)
  const last = lines[lines.length - 1] ?? ''
  return last.slice(0, 200)
}

function parseScoreTotal(scoreJson: unknown): number {
  const parsed = scoreJsonSchema.safeParse(scoreJson)
  return parsed.success ? parsed.data.total : 0
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

// ============================================
// Main aggregation function
// ============================================

/**
 * Aggregate all insights data for a workspace.
 *
 * Runs several focused queries and assembles InsightsData.
 * Each query is scoped to the workspace via joins.
 */
export async function getInsightsData(
  workspaceId: string
): Promise<ServiceResult<InsightsData>> {
  try {
    const supabase = await createClient()

    // Run all queries in parallel for efficiency
    const [
      topHooksResult,
      metricsLeadsResult,
      visualFormatsResult,
      campaignListResult,
      postVersionScoresResult,
    ] = await Promise.all([
      // 1. Top hooks: current post_versions joined through posts → campaigns
      supabase
        .from('post_versions')
        .select(
          'content, variant, score_json, posts!inner(funnel_stage, campaign_id, campaigns!inner(workspace_id, week_start))'
        )
        .eq('is_current', true)
        .eq('posts.campaigns.workspace_id', workspaceId)
        .not('score_json', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100),

      // 2. Metrics with leads: join through posts → campaigns for workspace scope
      supabase
        .from('metrics')
        .select('post_id, leads, posts!inner(campaign_id, campaigns!inner(workspace_id))')
        .eq('posts.campaigns.workspace_id', workspaceId)
        .gt('leads', 0)
        .order('leads', { ascending: false })
        .limit(20),

      // 3. Visual versions formats for workspace
      supabase
        .from('visual_versions')
        .select('format, post_id, posts!inner(campaign_id, campaigns!inner(workspace_id))')
        .eq('posts.campaigns.workspace_id', workspaceId)
        .limit(500),

      // 4. All campaigns for workspace (for totals and weekly trends)
      supabase
        .from('campaigns')
        .select('id, week_start')
        .eq('workspace_id', workspaceId)
        .order('week_start', { ascending: false })
        .limit(52), // max one year

      // 5. Current post_version scores for avg DGPI
      supabase
        .from('post_versions')
        .select('post_id, score_json')
        .eq('is_current', true)
        .not('score_json', 'is', null),
    ])

    // ------------------------------------------------
    // Parse Top Hooks
    // ------------------------------------------------
    const topHooks: TopHook[] = []

    if (!topHooksResult.error && topHooksResult.data) {
      type RawHookRow = {
        content: string
        variant: string
        score_json: unknown
        posts: {
          funnel_stage: string
          campaign_id: string
          campaigns: { workspace_id: string; week_start: string | null }
        } | {
          funnel_stage: string
          campaign_id: string
          campaigns: { workspace_id: string; week_start: string | null }
        }[] | null
      }

      const rows = topHooksResult.data as unknown as RawHookRow[]

      const scoredRows = rows
        .map((row) => {
          const post = Array.isArray(row.posts) ? row.posts[0] : row.posts
          if (!post) return null

          const campaign = Array.isArray(post.campaigns) ? post.campaigns[0] : post.campaigns
          if (!campaign) return null

          return {
            content: extractHook(row.content),
            variant: row.variant,
            funnel_stage: post.funnel_stage,
            score_total: parseScoreTotal(row.score_json),
            campaign_week: campaign.week_start ?? '',
          }
        })
        .filter((r): r is TopHook => r !== null && r.content.length > 0)
        .sort((a, b) => b.score_total - a.score_total)
        .slice(0, 5)

      topHooks.push(...scoredRows)
    }

    // ------------------------------------------------
    // Parse Top CTAs
    // ------------------------------------------------
    const topCTAs: TopCTA[] = []

    if (!metricsLeadsResult.error && metricsLeadsResult.data) {
      type RawMetricsRow = {
        post_id: string
        leads: number
        posts: {
          campaign_id: string
          campaigns: { workspace_id: string }
        } | {
          campaign_id: string
          campaigns: { workspace_id: string }
        }[] | null
      }

      const metricsRows = metricsLeadsResult.data as unknown as RawMetricsRow[]
      const postIds = metricsRows.map((r) => r.post_id)

      if (postIds.length > 0) {
        const { data: pvRows } = await supabase
          .from('post_versions')
          .select('post_id, content')
          .in('post_id', postIds)
          .eq('is_current', true)

        const pvMap = new Map<string, string>()
        if (pvRows) {
          const parsedPV = z.array(postVersionForCTARowSchema).safeParse(pvRows)
          if (parsedPV.success) {
            for (const pv of parsedPV.data) {
              pvMap.set(pv.post_id, pv.content)
            }
          }
        }

        // We need campaign week — fetch posts to get campaign_id then map campaigns
        const postCampaignMap = new Map<string, string>()
        const { data: postsRaw } = await supabase
          .from('posts')
          .select('id, campaign_id')
          .in('id', postIds)

        if (postsRaw) {
          for (const p of (postsRaw as { id: string; campaign_id: string }[])) {
            postCampaignMap.set(p.id, p.campaign_id)
          }
        }

        const campaignIds = [...new Set([...postCampaignMap.values()])]
        const campaignWeekMap = new Map<string, string>()
        if (campaignIds.length > 0) {
          const { data: campRaw } = await supabase
            .from('campaigns')
            .select('id, week_start')
            .in('id', campaignIds)

          if (campRaw) {
            const parsedCamps = z.array(campaignForWeekRowSchema).safeParse(campRaw)
            if (parsedCamps.success) {
              for (const c of parsedCamps.data) {
                campaignWeekMap.set(c.id, c.week_start ?? '')
              }
            }
          }
        }

        const parsedMetrics = z.array(metricsCTARowSchema).safeParse(
          metricsRows.map((r) => ({ leads: r.leads, post_id: r.post_id }))
        )

        if (parsedMetrics.success) {
          for (const m of parsedMetrics.data) {
            const content = pvMap.get(m.post_id)
            if (!content) continue
            const campaignId = postCampaignMap.get(m.post_id) ?? ''
            const week = campaignWeekMap.get(campaignId) ?? ''
            topCTAs.push({
              content: extractCTA(content),
              leads: m.leads,
              campaign_week: week,
            })
          }
        }
      }
    }

    // ------------------------------------------------
    // Parse Format Performance
    // ------------------------------------------------
    const formatPerformance: FormatPerformance[] = []

    if (!visualFormatsResult.error && visualFormatsResult.data) {
      type RawVisualRow = {
        format: string
        post_id: string
        posts: unknown
      }

      const visualRows = visualFormatsResult.data as RawVisualRow[]
      const parsedVisuals = z.array(visualFormatRowSchema).safeParse(
        visualRows.map((r) => ({ format: r.format, post_id: r.post_id }))
      )

      if (parsedVisuals.success) {
        const formatPostMap = new Map<string, string[]>()
        for (const v of parsedVisuals.data) {
          const existing = formatPostMap.get(v.format) ?? []
          existing.push(v.post_id)
          formatPostMap.set(v.format, existing)
        }

        // Fetch scores for these posts
        const allPostIds = [...new Set(parsedVisuals.data.map((v) => v.post_id))]
        let postScoreMap = new Map<string, number>()

        if (allPostIds.length > 0) {
          const { data: pvScoreRaw } = await supabase
            .from('post_versions')
            .select('post_id, score_json')
            .in('post_id', allPostIds)
            .eq('is_current', true)
            .not('score_json', 'is', null)

          if (pvScoreRaw) {
            const parsedScores = z.array(postVersionScoreRowSchema).safeParse(pvScoreRaw)
            if (parsedScores.success) {
              postScoreMap = new Map(
                parsedScores.data.map((pv) => [
                  pv.post_id,
                  parseScoreTotal(pv.score_json),
                ])
              )
            }
          }
        }

        for (const [format, postIdList] of formatPostMap.entries()) {
          const scores = postIdList
            .map((pid) => postScoreMap.get(pid))
            .filter((s): s is number => s !== undefined)

          formatPerformance.push({
            format,
            count: postIdList.length,
            avg_score: avg(scores),
          })
        }

        // Sort by avg_score descending, then count
        formatPerformance.sort((a, b) => {
          if (b.avg_score !== a.avg_score) return b.avg_score - a.avg_score
          return b.count - a.count
        })
      }
    }

    // ------------------------------------------------
    // Weekly Trends + Total Campaigns/Posts
    // ------------------------------------------------
    const weeklyTrends: WeeklyTrend[] = []
    let totalCampaigns = 0
    let totalPosts = 0

    if (!campaignListResult.error && campaignListResult.data) {
      const parsedCampaigns = z.array(campaignForTrendRowSchema).safeParse(
        campaignListResult.data
      )

      if (parsedCampaigns.success) {
        totalCampaigns = parsedCampaigns.data.length
        const campaignIds = parsedCampaigns.data.map((c) => c.id)

        if (campaignIds.length > 0) {
          // Fetch posts for these campaigns
          const { data: postsRaw } = await supabase
            .from('posts')
            .select('id, campaign_id')
            .in('campaign_id', campaignIds)

          const parsedPosts = z.array(postForTrendRowSchema).safeParse(postsRaw ?? [])

          if (parsedPosts.success) {
            totalPosts = parsedPosts.data.length
            const postIds = parsedPosts.data.map((p) => p.id)
            const postCampaignLookup = new Map(
              parsedPosts.data.map((p) => [p.id, p.campaign_id])
            )

            // Batch-fetch metrics for all posts
            if (postIds.length > 0) {
              const { data: metricsRaw } = await supabase
                .from('metrics')
                .select('post_id, impressions, comments, saves, shares, leads')
                .in('post_id', postIds)

              const parsedTrendMetrics = z.array(metricsForTrendRowSchema).safeParse(
                metricsRaw ?? []
              )

              if (parsedTrendMetrics.success) {
                // Group metrics by campaign_id
                const campaignMetrics = new Map<
                  string,
                  Array<z.infer<typeof metricsForTrendRowSchema>>
                >()

                for (const m of parsedTrendMetrics.data) {
                  const campId = postCampaignLookup.get(m.post_id)
                  if (!campId) continue
                  const existing = campaignMetrics.get(campId) ?? []
                  existing.push(m)
                  campaignMetrics.set(campId, existing)
                }

                // Build weekly trends (only campaigns with metrics)
                for (const camp of parsedCampaigns.data) {
                  const mList = campaignMetrics.get(camp.id) ?? []
                  if (mList.length === 0) continue

                  const totalImp = mList.reduce((s, m) => s + m.impressions, 0)
                  const totalCom = mList.reduce((s, m) => s + m.comments, 0)
                  const totalSav = mList.reduce((s, m) => s + m.saves, 0)
                  const totalSha = mList.reduce((s, m) => s + m.shares, 0)
                  const totalLds = mList.reduce((s, m) => s + m.leads, 0)
                  const count = mList.length

                  const engRate =
                    totalImp > 0
                      ? ((totalCom + totalSav + totalSha) / totalImp) * 100
                      : 0

                  weeklyTrends.push({
                    week_start: camp.week_start ?? '',
                    avg_impressions: totalImp / count,
                    avg_comments: totalCom / count,
                    avg_engagement_rate: engRate,
                    total_leads: totalLds,
                  })
                }

                // Sort by week_start descending
                weeklyTrends.sort((a, b) =>
                  b.week_start.localeCompare(a.week_start)
                )
              }
            }
          }
        }
      }
    }

    // ------------------------------------------------
    // Average D/G/P/I Score
    // ------------------------------------------------
    let avgDGPIScore = 0

    if (!postVersionScoresResult.error && postVersionScoresResult.data) {
      const scores = (
        postVersionScoresResult.data as Array<{ post_id: string; score_json: unknown }>
      )
        .map((pv) => parseScoreTotal(pv.score_json))
        .filter((s) => s > 0)

      avgDGPIScore = avg(scores)
    }

    return {
      data: {
        topHooks,
        topCTAs,
        formatPerformance,
        weeklyTrends,
        totalCampaigns,
        totalPosts,
        avgDGPIScore,
      },
    }
  } catch (err) {
    console.error('[insights-service] getInsightsData unexpected error', err)
    return { error: 'Error inesperado al obtener insights' }
  }
}
