import { createClient } from '@/lib/supabase/server'
import {
  metricsSchema,
  learningSchema,
  saveMetricsSchema,
  saveLearningSchema,
  WEEKLY_PLAN,
  type Metrics,
  type Learning,
  type SaveMetricsInput,
  type SaveLearningInput,
} from '@/shared/types/content-ops'
import { z } from 'zod'

// ============================================
// Types
// ============================================

export interface ServiceResult<T> {
  data?: T
  error?: string
}

export interface WeeklySummary {
  totalImpressions: number
  totalComments: number
  totalSaves: number
  totalShares: number
  totalLeads: number
  avgImpressions: number
  avgComments: number
  avgSaves: number
  avgShares: number
  avgLeads: number
  postMetrics: PostMetricRow[]
  engagementRate: number // (comments + saves + shares) / impressions * 100
}

export interface PostMetricRow {
  postId: string
  dayOfWeek: number
  dayLabel: string
  funnelStage: string
  impressions: number
  comments: number
  saves: number
  shares: number
  leads: number
  notes: string | null
  metricsId: string | null // null if no metrics recorded yet
}

// ============================================
// Internal schemas
// ============================================

const postRowSchema = z.object({
  id: z.string().uuid(),
  day_of_week: z.number().min(1).max(5),
  funnel_stage: z.string(),
})

type PostRow = z.infer<typeof postRowSchema>

// ============================================
// Metrics
// ============================================

/**
 * Get all post metric rows for a campaign using a single batch query for metrics.
 *
 * Step 1: Fetch all posts for the campaign ordered by day_of_week.
 * Step 2: Batch-fetch all metrics for those post IDs in one query.
 * Step 3: Index metrics by post_id for O(1) lookup and map to PostMetricRow.
 */
export async function getMetricsByCampaign(
  campaignId: string
): Promise<ServiceResult<PostMetricRow[]>> {
  try {
    const supabase = await createClient()

    // Step 1: Fetch all posts for this campaign
    const { data: postsRaw, error: postsError } = await supabase
      .from('posts')
      .select('id, day_of_week, funnel_stage')
      .eq('campaign_id', campaignId)
      .order('day_of_week')

    if (postsError) {
      return { error: postsError.message }
    }

    if (!postsRaw || postsRaw.length === 0) {
      return { data: [] }
    }

    const parsedPosts = z.array(postRowSchema).safeParse(postsRaw)

    if (!parsedPosts.success) {
      console.error('[analytics-service] getMetricsByCampaign parse error (posts)', parsedPosts.error.flatten())
      return { error: 'Error al parsear datos de posts' }
    }

    const posts: PostRow[] = parsedPosts.data
    const postIds = posts.map((p) => p.id)

    // Step 2: Batch-fetch all metrics for these posts in one query
    const { data: allMetricsRaw, error: metricsError } = await supabase
      .from('metrics')
      .select('*')
      .in('post_id', postIds)

    if (metricsError) {
      return { error: metricsError.message }
    }

    // Validate and index metrics by post_id for O(1) lookup
    const parsedMetrics = z.array(metricsSchema).safeParse(allMetricsRaw ?? [])

    if (!parsedMetrics.success) {
      console.error('[analytics-service] getMetricsByCampaign parse error (metrics)', parsedMetrics.error.flatten())
      return { error: 'Error al parsear datos de metricas' }
    }

    // Step 3: Index metrics by post_id (most recent wins — schema guarantees one row per post via upsert)
    const metricsMap = new Map<string, Metrics>(
      parsedMetrics.data.map((m) => [m.post_id, m])
    )

    // Map to PostMetricRow sorted by day_of_week
    const rows: PostMetricRow[] = posts.map((post) => {
      const metrics = metricsMap.get(post.id) ?? null
      const dayEntry = WEEKLY_PLAN[post.day_of_week]

      return {
        postId: post.id,
        dayOfWeek: post.day_of_week,
        dayLabel: dayEntry?.label ?? `Dia ${post.day_of_week}`,
        funnelStage: post.funnel_stage,
        impressions: metrics?.impressions ?? 0,
        comments: metrics?.comments ?? 0,
        saves: metrics?.saves ?? 0,
        shares: metrics?.shares ?? 0,
        leads: metrics?.leads ?? 0,
        notes: metrics?.notes ?? null,
        metricsId: metrics?.id ?? null,
      }
    })

    return { data: rows }
  } catch (err) {
    console.error('[analytics-service] getMetricsByCampaign unexpected error', err)
    return { error: 'Error inesperado al obtener metricas de la campana' }
  }
}

/**
 * Save metrics for a post using an upsert pattern.
 *
 * If a metrics row already exists for this post_id, it is updated.
 * Otherwise, a new row is inserted.
 */
export async function saveMetrics(
  userId: string,
  data: SaveMetricsInput
): Promise<ServiceResult<Metrics>> {
  try {
    const validated = saveMetricsSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de metricas invalidos' }
    }

    const supabase = await createClient()

    // Check if metrics already exist for this post_id
    const { data: existingRow, error: fetchError } = await supabase
      .from('metrics')
      .select('id')
      .eq('post_id', validated.data.post_id)
      .maybeSingle()

    if (fetchError) {
      return { error: fetchError.message }
    }

    let savedRow: unknown

    if (existingRow) {
      // UPDATE existing metrics row
      const { data: updatedRow, error: updateError } = await supabase
        .from('metrics')
        .update({
          impressions: validated.data.impressions,
          comments: validated.data.comments,
          saves: validated.data.saves,
          shares: validated.data.shares,
          leads: validated.data.leads,
          notes: validated.data.notes ?? null,
        })
        .eq('id', existingRow.id)
        .select()
        .single()

      if (updateError || !updatedRow) {
        return { error: updateError?.message ?? 'Error al actualizar las metricas' }
      }

      savedRow = updatedRow
    } else {
      // INSERT new metrics row
      const { data: insertedRow, error: insertError } = await supabase
        .from('metrics')
        .insert({
          post_id: validated.data.post_id,
          impressions: validated.data.impressions,
          comments: validated.data.comments,
          saves: validated.data.saves,
          shares: validated.data.shares,
          leads: validated.data.leads,
          notes: validated.data.notes ?? null,
        })
        .select()
        .single()

      if (insertError || !insertedRow) {
        return { error: insertError?.message ?? 'Error al guardar las metricas' }
      }

      savedRow = insertedRow
    }

    const parsed = metricsSchema.safeParse(savedRow)

    if (!parsed.success) {
      console.error('[analytics-service] saveMetrics parse error', parsed.error.flatten())
      return { error: 'Error al parsear las metricas guardadas' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[analytics-service] saveMetrics unexpected error', err)
    return { error: 'Error inesperado al guardar las metricas' }
  }
}

/**
 * Compute a weekly summary for a campaign.
 *
 * Calls getMetricsByCampaign internally, then aggregates totals,
 * averages, and engagement rate across all posts.
 *
 * Engagement rate formula: (comments + saves + shares) / impressions * 100
 * When impressions = 0, engagement rate is 0 to avoid division by zero.
 */
export async function getWeeklySummary(
  campaignId: string
): Promise<ServiceResult<WeeklySummary>> {
  try {
    const metricsResult = await getMetricsByCampaign(campaignId)

    if (metricsResult.error) {
      return { error: metricsResult.error }
    }

    const postMetrics = metricsResult.data ?? []
    const count = postMetrics.length

    const totalImpressions = postMetrics.reduce((sum, r) => sum + r.impressions, 0)
    const totalComments = postMetrics.reduce((sum, r) => sum + r.comments, 0)
    const totalSaves = postMetrics.reduce((sum, r) => sum + r.saves, 0)
    const totalShares = postMetrics.reduce((sum, r) => sum + r.shares, 0)
    const totalLeads = postMetrics.reduce((sum, r) => sum + r.leads, 0)

    const avgImpressions = count > 0 ? totalImpressions / count : 0
    const avgComments = count > 0 ? totalComments / count : 0
    const avgSaves = count > 0 ? totalSaves / count : 0
    const avgShares = count > 0 ? totalShares / count : 0
    const avgLeads = count > 0 ? totalLeads / count : 0

    const engagementRate =
      totalImpressions > 0
        ? ((totalComments + totalSaves + totalShares) / totalImpressions) * 100
        : 0

    return {
      data: {
        totalImpressions,
        totalComments,
        totalSaves,
        totalShares,
        totalLeads,
        avgImpressions,
        avgComments,
        avgSaves,
        avgShares,
        avgLeads,
        postMetrics,
        engagementRate,
      },
    }
  } catch (err) {
    console.error('[analytics-service] getWeeklySummary unexpected error', err)
    return { error: 'Error inesperado al calcular el resumen semanal' }
  }
}

// ============================================
// Week-over-Week Comparison
// ============================================

/**
 * Summary shape without postMetrics (for comparison only).
 */
export interface ComparisonSummary {
  totalImpressions: number
  totalComments: number
  totalSaves: number
  totalShares: number
  totalLeads: number
  avgImpressions: number
  avgComments: number
  avgSaves: number
  avgShares: number
  avgLeads: number
  engagementRate: number
}

/**
 * Get the weekly summary of the previous campaign in the same workspace.
 *
 * Finds the campaign with the most recent week_start strictly before
 * the current campaign's week_start, then computes its summary.
 */
export async function getPreviousCampaignSummary(
  workspaceId: string,
  currentCampaignId: string,
  currentWeekStart: string
): Promise<ServiceResult<ComparisonSummary | null>> {
  try {
    const supabase = await createClient()

    const { data: prevCampaigns, error } = await supabase
      .from('campaigns')
      .select('id')
      .eq('workspace_id', workspaceId)
      .neq('id', currentCampaignId)
      .lt('week_start', currentWeekStart)
      .order('week_start', { ascending: false })
      .limit(1)

    if (error) {
      return { error: error.message }
    }

    if (!prevCampaigns || prevCampaigns.length === 0) {
      return { data: null }
    }

    const prevId = (prevCampaigns[0] as { id: string }).id
    const summaryResult = await getWeeklySummary(prevId)

    if (summaryResult.error || !summaryResult.data) {
      return { data: null }
    }

    const s = summaryResult.data
    return {
      data: {
        totalImpressions: s.totalImpressions,
        totalComments: s.totalComments,
        totalSaves: s.totalSaves,
        totalShares: s.totalShares,
        totalLeads: s.totalLeads,
        avgImpressions: s.avgImpressions,
        avgComments: s.avgComments,
        avgSaves: s.avgSaves,
        avgShares: s.avgShares,
        avgLeads: s.avgLeads,
        engagementRate: s.engagementRate,
      },
    }
  } catch (err) {
    console.error('[analytics-service] getPreviousCampaignSummary unexpected error', err)
    return { data: null }
  }
}

// ============================================
// Learnings
// ============================================

/**
 * Fetch all learnings for a campaign ordered by created_at descending.
 */
export async function getLearningsByCampaign(
  campaignId: string
): Promise<ServiceResult<Learning[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('learnings')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: error.message }
    }

    const parsed = z.array(learningSchema).safeParse(data ?? [])

    if (!parsed.success) {
      console.error('[analytics-service] getLearningsByCampaign parse error', parsed.error.flatten())
      return { error: 'Error al parsear los aprendizajes' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[analytics-service] getLearningsByCampaign unexpected error', err)
    return { error: 'Error inesperado al obtener los aprendizajes' }
  }
}

/**
 * Create a new learning for a campaign.
 */
export async function createLearning(
  userId: string,
  data: SaveLearningInput
): Promise<ServiceResult<Learning>> {
  try {
    const validated = saveLearningSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos del aprendizaje invalidos' }
    }

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('learnings')
      .insert({
        campaign_id: validated.data.campaign_id,
        summary: validated.data.summary,
        bullets_json: validated.data.bullets_json,
        created_by: userId,
      })
      .select()
      .single()

    if (error || !row) {
      return { error: error?.message ?? 'Error al crear el aprendizaje' }
    }

    const parsed = learningSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[analytics-service] createLearning parse error', parsed.error.flatten())
      return { error: 'Error al parsear el aprendizaje creado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[analytics-service] createLearning unexpected error', err)
    return { error: 'Error inesperado al crear el aprendizaje' }
  }
}

/**
 * Delete a learning by its ID.
 */
export async function deleteLearning(
  learningId: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('learnings')
      .delete()
      .eq('id', learningId)

    if (error) {
      return { error: error.message }
    }

    return { data: null }
  } catch (err) {
    console.error('[analytics-service] deleteLearning unexpected error', err)
    return { error: 'Error inesperado al eliminar el aprendizaje' }
  }
}
