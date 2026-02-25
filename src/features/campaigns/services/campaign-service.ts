import { createClient } from '@/lib/supabase/server'
import {
  campaignSchema,
  postSchema,
  scoreJsonSchema,
  createCampaignSchema,
  weeklyBriefSchema,
  publishingPlanSchema,
  WEEKLY_PLAN,
  DEFAULT_DAYS_5,
  DEFAULT_DAYS_3,
  POST_VARIANTS,
  type Campaign,
  type Post,
  type CreateCampaignInput,
  type WeeklyBrief,
  type PublishingPlan,
} from '@/shared/types/content-ops'
import { z } from 'zod'

// ============================================
// Types
// ============================================

export interface ServiceResult<T> {
  data?: T
  error?: string
}

export interface CampaignFilters {
  status?: string
}

/**
 * Campaign with its parent topic title attached via join.
 */
export type CampaignWithTopic = Campaign & {
  topics: { title: string; hypothesis: string | null; evidence: string | null; anti_myth: string | null; signals_json: string[]; silent_enemy_name: string | null } | null
}

/**
 * Post with nested version summaries (for campaign page display).
 */
export type PostVersionSummary = z.infer<typeof postVersionSummarySchema>
export type PostWithVersions = Post & { post_versions: PostVersionSummary[] }

/**
 * Campaign with full topic join and nested posts (including versions).
 */
export type CampaignWithPosts = CampaignWithTopic & {
  posts: PostWithVersions[]
}

// ============================================
// Internal schemas for joined rows
// ============================================

const campaignWithTopicSchema = campaignSchema.extend({
  topics: z.object({
    title: z.string(),
    hypothesis: z.string().nullable(),
    evidence: z.string().nullable(),
    anti_myth: z.string().nullable(),
    signals_json: z.array(z.string()),
    silent_enemy_name: z.string().nullable(),
  }).nullable(),
})

const postVersionSummarySchema = z.object({
  id: z.string().uuid(),
  variant: z.enum(POST_VARIANTS),
  version: z.number(),
  score_json: scoreJsonSchema.nullable(),
  is_current: z.boolean(),
  content: z.string(),
})

const postWithVersionsSchema = postSchema.extend({
  post_versions: z.array(postVersionSummarySchema).default([]),
})

const campaignWithPostsSchema = campaignWithTopicSchema.extend({
  posts: z.array(postWithVersionsSchema),
})

// ============================================
// Queries
// ============================================

/**
 * Get all campaigns for a workspace with optional status filter.
 * Includes the linked topic title via join.
 * Ordered by week_start descending.
 */
export async function getCampaignList(
  workspaceId: string,
  filters?: CampaignFilters
): Promise<ServiceResult<CampaignWithTopic[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('campaigns')
      .select('*, topics(title, hypothesis, evidence, anti_myth, signals_json, silent_enemy_name)')
      .eq('workspace_id', workspaceId)
      .order('week_start', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) {
      return { error: error.message }
    }

    const parsed = z.array(campaignWithTopicSchema).safeParse(data)

    if (!parsed.success) {
      console.error('[campaign-service] getCampaignList parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[campaign-service] getCampaignList unexpected error', err)
    return { error: 'Error inesperado al obtener campanas' }
  }
}

/**
 * Get a single campaign by id, including its topic title and all posts.
 */
export async function getCampaignById(
  id: string
): Promise<ServiceResult<CampaignWithPosts>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('campaigns')
      .select('*, topics(title, hypothesis, evidence, anti_myth, signals_json, silent_enemy_name), posts(*, post_versions(id, variant, version, score_json, is_current, content))')
      .eq('id', id)
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = campaignWithPostsSchema.safeParse(data)

    if (!parsed.success) {
      console.error('[campaign-service] getCampaignById parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[campaign-service] getCampaignById unexpected error', err)
    return { error: 'Error inesperado al obtener la campana' }
  }
}

/**
 * Create a new campaign and auto-generate weekly posts.
 *
 * Respects `post_frequency` (3, 5, or 7) and `selected_days` from input.
 *   - 7: all days (Mon-Sun)
 *   - 5 (default): Mon-Fri
 *   - 3: user-chosen days (or default Mon/Wed/Fri)
 *
 * Two-step process:
 *   1. Insert the campaign row.
 *   2. Bulk-insert posts for the selected days using WEEKLY_PLAN mapping.
 *
 * Returns the full campaign with posts attached.
 */
export async function createCampaignWithPosts(
  workspaceId: string,
  userId: string,
  data: CreateCampaignInput
): Promise<ServiceResult<CampaignWithPosts>> {
  try {
    const validated = createCampaignSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de entrada invalidos' }
    }

    const supabase = await createClient()

    // Step 1: Insert campaign
    const { data: campaignRow, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        topic_id: validated.data.topic_id ?? null,
        week_start: validated.data.week_start,
        keyword: validated.data.keyword ?? null,
        resource_json: validated.data.resource_json,
        audience_json: validated.data.audience_json,
        status: 'draft',
      })
      .select()
      .single()

    if (campaignError || !campaignRow) {
      return { error: campaignError?.message ?? 'Error al crear la campana' }
    }

    const parsedCampaign = campaignSchema.safeParse(campaignRow)

    if (!parsedCampaign.success) {
      console.error('[campaign-service] createCampaignWithPosts campaign parse error', parsedCampaign.error.flatten())
      return { error: 'Error al parsear la campana creada' }
    }

    // Step 2: Determine which days to generate posts for
    const frequency = validated.data.post_frequency ?? 5
    const daysToGenerate =
      frequency === 7
        ? [1, 2, 3, 4, 5, 6, 7]
        : frequency === 3
          ? (validated.data.selected_days ?? DEFAULT_DAYS_3)
          : DEFAULT_DAYS_5

    const postsPayload = daysToGenerate.map((day) => ({
      campaign_id: parsedCampaign.data.id,
      day_of_week: day,
      funnel_stage: WEEKLY_PLAN[day].stage,
      status: 'draft' as const,
      objective: null,
    }))

    const { data: postRows, error: postsError } = await supabase
      .from('posts')
      .insert(postsPayload)
      .select()

    if (postsError) {
      return { error: postsError.message }
    }

    const parsedPosts = z.array(postSchema).safeParse(postRows)

    if (!parsedPosts.success) {
      console.error('[campaign-service] createCampaignWithPosts posts parse error', parsedPosts.error.flatten())
      return { error: 'Error al parsear los posts generados' }
    }

    // Fetch topic fields if topic_id was provided
    let topicData: { title: string; hypothesis: string | null; evidence: string | null; anti_myth: string | null; signals_json: string[]; silent_enemy_name: string | null } | null = null

    if (parsedCampaign.data.topic_id) {
      const { data: topicRow } = await supabase
        .from('topics')
        .select('title, hypothesis, evidence, anti_myth, signals_json, silent_enemy_name')
        .eq('id', parsedCampaign.data.topic_id)
        .single()

      if (topicRow) {
        topicData = {
          title: topicRow.title,
          hypothesis: topicRow.hypothesis ?? null,
          evidence: topicRow.evidence ?? null,
          anti_myth: topicRow.anti_myth ?? null,
          signals_json: Array.isArray(topicRow.signals_json) ? (topicRow.signals_json as string[]) : [],
          silent_enemy_name: topicRow.silent_enemy_name ?? null,
        }
      }
    }

    return {
      data: {
        ...parsedCampaign.data,
        topics: topicData,
        posts: parsedPosts.data.map((p) => ({ ...p, post_versions: [] })),
      },
    }
  } catch (err) {
    console.error('[campaign-service] createCampaignWithPosts unexpected error', err)
    return { error: 'Error inesperado al crear la campana' }
  }
}

/**
 * Partial update of a campaign by id.
 * Only the fields present in data are updated.
 */
export async function updateCampaign(
  id: string,
  data: Partial<CreateCampaignInput> & { status?: string }
): Promise<ServiceResult<Campaign>> {
  try {
    const partialSchema = createCampaignSchema.partial().extend({
      status: z.string().optional(),
    })

    const validated = partialSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de actualizacion invalidos' }
    }

    const updatePayload: Record<string, unknown> = {}

    if (validated.data.topic_id !== undefined) updatePayload.topic_id = validated.data.topic_id
    if (validated.data.week_start !== undefined) updatePayload.week_start = validated.data.week_start
    if (validated.data.keyword !== undefined) updatePayload.keyword = validated.data.keyword
    if (validated.data.resource_json !== undefined) updatePayload.resource_json = validated.data.resource_json
    if (validated.data.audience_json !== undefined) updatePayload.audience_json = validated.data.audience_json
    if (validated.data.status !== undefined) updatePayload.status = validated.data.status

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('campaigns')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = campaignSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[campaign-service] updateCampaign parse error', parsed.error.flatten())
      return { error: 'Error al parsear la campana actualizada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[campaign-service] updateCampaign unexpected error', err)
    return { error: 'Error inesperado al actualizar la campana' }
  }
}

/**
 * Quick status-only update for a campaign.
 * Used for kanban-style status transitions.
 */
export async function updateCampaignStatus(
  id: string,
  status: string
): Promise<ServiceResult<Campaign>> {
  try {
    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = campaignSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[campaign-service] updateCampaignStatus parse error', parsed.error.flatten())
      return { error: 'Error al parsear el estado actualizado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[campaign-service] updateCampaignStatus unexpected error', err)
    return { error: 'Error inesperado al actualizar el estado' }
  }
}

/**
 * Delete a campaign by id.
 * Posts cascade-delete via foreign key constraint on campaign_id.
 */
export async function deleteCampaign(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    return { data: null }
  } catch (err) {
    console.error('[campaign-service] deleteCampaign unexpected error', err)
    return { error: 'Error inesperado al eliminar la campana' }
  }
}

/**
 * Update weekly_brief and optionally publishing_plan for a campaign.
 */
export async function updateCampaignBrief(
  id: string,
  weeklyBrief: WeeklyBrief,
  publishingPlan?: PublishingPlan
): Promise<ServiceResult<Campaign>> {
  try {
    // Validate
    const briefParsed = weeklyBriefSchema.safeParse(weeklyBrief)
    if (!briefParsed.success) {
      return { error: 'Datos del brief invalidos' }
    }

    const updatePayload: Record<string, unknown> = {
      weekly_brief: briefParsed.data,
    }

    if (publishingPlan !== undefined) {
      const planParsed = publishingPlanSchema.safeParse(publishingPlan)
      if (!planParsed.success) {
        return { error: 'Datos del plan de publicacion invalidos' }
      }
      updatePayload.publishing_plan = planParsed.data
    }

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('campaigns')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = campaignSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[campaign-service] updateCampaignBrief parse error', parsed.error.flatten())
      return { error: 'Error al parsear la campana actualizada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[campaign-service] updateCampaignBrief unexpected error', err)
    return { error: 'Error inesperado al actualizar el brief' }
  }
}
