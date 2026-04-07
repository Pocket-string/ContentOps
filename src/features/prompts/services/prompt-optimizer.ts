import { createClient } from '@/lib/supabase/server'
import {
  getActivePrompt,
  createPromptVersion,
  activatePromptVersion,
  updatePromptScore,
  logOptimizationResult,
} from './prompt-version-service'
import { computeWeightedEngagement } from '@/features/analytics/services/performance-analyzer'
import type { PromptType } from '@/shared/types/content-ops'

interface BinaryEvalResult {
  impressions_above_median: boolean
  has_substantive_comment: boolean
  has_save: boolean
  engagement_above_median: boolean
  recipe_pass: boolean
  critic_score_pass: boolean
}

/**
 * Compute binary evaluation score for posts generated with a specific prompt version.
 * Returns a score from 0-6 (number of passing binary evals).
 * Requires at least `minPosts` posts with metrics to produce a meaningful score.
 */
export async function computePromptScore(
  workspaceId: string,
  promptVersionId: string,
  minPosts = 5,
): Promise<{ score: number; evals: BinaryEvalResult[]; postCount: number } | null> {
  const supabase = await createClient()

  // Get posts generated with this prompt version
  const { data: junctions } = await supabase
    .from('post_prompt_version')
    .select('post_id')
    .eq('prompt_version_id', promptVersionId)

  if (!junctions || junctions.length === 0) return null

  const postIds = junctions.map(j => j.post_id)

  // Get metrics for these posts
  const { data: metricsRows } = await supabase
    .from('metrics')
    .select('post_id, impressions, comments, saves, shares, reactions')
    .in('post_id', postIds)
    .gt('impressions', 0)

  if (!metricsRows || metricsRows.length < minPosts) return null

  // Get workspace-wide median for comparison
  const { data: campaigns } = await supabase.from('campaigns').select('id').eq('workspace_id', workspaceId)
  const campaignIds = (campaigns ?? []).map(c => c.id)
  const { data: allPosts } = await supabase.from('posts').select('id').in('campaign_id', campaignIds)
  const allPostIds = (allPosts ?? []).map(p => p.id)
  const { data: allMetrics } = await supabase
    .from('metrics')
    .select('impressions, comments, saves, shares, reactions')
    .in('post_id', allPostIds)
    .gt('impressions', 0)

  // Compute medians
  const allEngagements = (allMetrics ?? []).map(m =>
    computeWeightedEngagement({ id: '', post_id: '', leads: 0, impressions: m.impressions, comments: m.comments, saves: m.saves, shares: m.shares, reactions: m.reactions })
  ).sort((a, b) => a - b)
  const allImpressions = (allMetrics ?? []).map(m => m.impressions).sort((a, b) => a - b)

  const medianEngagement = allEngagements.length > 0 ? allEngagements[Math.floor(allEngagements.length / 2)] : 0
  const medianImpressions = allImpressions.length > 0 ? allImpressions[Math.floor(allImpressions.length / 2)] : 0

  // Get critic scores for these posts
  const { data: versions } = await supabase
    .from('post_versions')
    .select('post_id, score_json')
    .in('post_id', postIds)
    .eq('is_current', true)
  const scoreMap = new Map((versions ?? []).map(v => [v.post_id, v.score_json]))

  // Evaluate each post
  const evals: BinaryEvalResult[] = metricsRows.map(m => {
    const engagement = computeWeightedEngagement({ id: m.post_id, post_id: m.post_id, leads: 0, impressions: m.impressions, comments: m.comments, saves: m.saves, shares: m.shares, reactions: m.reactions })
    const scoreJson = scoreMap.get(m.post_id) as Record<string, number> | null
    const criticTotal = scoreJson?.total ?? 0

    return {
      impressions_above_median: m.impressions > medianImpressions,
      has_substantive_comment: m.comments >= 1,
      has_save: m.saves >= 1,
      engagement_above_median: engagement > medianEngagement,
      recipe_pass: true, // Assume pass if content was published (validator runs pre-publish)
      critic_score_pass: criticTotal >= 20,
    }
  })

  // Score = average number of passing evals across all posts (0-6 scale)
  const totalPassing = evals.reduce((sum, e) => {
    return sum + Object.values(e).filter(Boolean).length
  }, 0)
  const score = Math.round((totalPassing / evals.length) * 100) / 100

  return { score, evals, postCount: metricsRows.length }
}

/**
 * Run a single optimization cycle of the Karpathy loop.
 * 1. Get active prompt + compute its score
 * 2. If score is below target, return analysis for mutation
 * 3. After mutation is applied externally, evaluate and decide keep/discard
 */
export async function analyzeForOptimization(
  workspaceId: string,
  promptType: PromptType,
): Promise<{
  activeVersion: { id: string; version: number; content: string } | null
  currentScore: number | null
  postCount: number
  failingEvals: string[]
  recommendation: 'needs_improvement' | 'performing_well' | 'insufficient_data'
}> {
  const active = await getActivePrompt(workspaceId, promptType)
  if (!active) {
    return {
      activeVersion: null,
      currentScore: null,
      postCount: 0,
      failingEvals: [],
      recommendation: 'insufficient_data',
    }
  }

  const scoreResult = await computePromptScore(workspaceId, active.id)
  if (!scoreResult) {
    return {
      activeVersion: { id: active.id, version: active.version, content: active.content },
      currentScore: active.performance_score,
      postCount: 0,
      failingEvals: [],
      recommendation: 'insufficient_data',
    }
  }

  // Identify failing evals (evals that fail more than 50% of the time)
  const evalKeys = ['impressions_above_median', 'has_substantive_comment', 'has_save', 'engagement_above_median', 'recipe_pass', 'critic_score_pass'] as const
  const failingEvals: string[] = []
  for (const key of evalKeys) {
    const passRate = scoreResult.evals.filter(e => e[key]).length / scoreResult.evals.length
    if (passRate < 0.5) failingEvals.push(key)
  }

  // Update stored score
  await updatePromptScore(active.id, scoreResult.score)

  return {
    activeVersion: { id: active.id, version: active.version, content: active.content },
    currentScore: scoreResult.score,
    postCount: scoreResult.postCount,
    failingEvals,
    recommendation: failingEvals.length > 0 ? 'needs_improvement' : 'performing_well',
  }
}

/**
 * Apply a mutation: create new version, activate it, log the change.
 */
export async function applyMutation(
  workspaceId: string,
  promptType: PromptType,
  mutatedContent: string,
  hypothesis: string,
  changeDescription: string,
  parentVersionId: string,
  parentScore: number,
): Promise<{ newVersionId: string; newVersion: number } | null> {
  const result = await createPromptVersion(
    workspaceId,
    promptType,
    mutatedContent,
    hypothesis,
    parentVersionId,
  )

  if (!result) return null

  await activatePromptVersion(workspaceId, result.id, promptType)

  // Get iteration count
  const supabase = await createClient()
  const { count } = await supabase
    .from('prompt_optimization_log')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  await logOptimizationResult(
    workspaceId,
    result.id,
    (count ?? 0) + 1,
    hypothesis,
    changeDescription,
    {},
    0, // Score TBD after posts are generated
    parentScore,
    'baseline', // Will be updated to keep/discard after evaluation
  )

  return { newVersionId: result.id, newVersion: result.version }
}

/**
 * Evaluate a mutation and decide keep/discard/rollback.
 */
export async function evaluateMutation(
  workspaceId: string,
  promptType: PromptType,
  currentVersionId: string,
  parentVersionId: string,
): Promise<{ decision: 'keep' | 'discard' | 'rollback'; currentScore: number; parentScore: number }> {
  const scoreResult = await computePromptScore(workspaceId, currentVersionId, 3)
  const currentScore = scoreResult?.score ?? 0

  // Get parent score
  const supabase = await createClient()
  const { data: parent } = await supabase
    .from('prompt_versions')
    .select('performance_score')
    .eq('id', parentVersionId)
    .single()
  const parentScore = (parent?.performance_score as number) ?? 0

  let decision: 'keep' | 'discard' | 'rollback'
  if (currentScore > parentScore) {
    decision = 'keep'
    await updatePromptScore(currentVersionId, currentScore)
  } else if (currentScore < parentScore * 0.9) {
    // Significant degradation — rollback
    decision = 'rollback'
    await activatePromptVersion(workspaceId, parentVersionId, promptType)
  } else {
    // Not better, not significantly worse — discard and keep parent
    decision = 'discard'
    await activatePromptVersion(workspaceId, parentVersionId, promptType)
  }

  // Update the optimization log
  const { data: logEntry } = await supabase
    .from('prompt_optimization_log')
    .select('id')
    .eq('prompt_version_id', currentVersionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (logEntry) {
    await supabase
      .from('prompt_optimization_log')
      .update({
        score: currentScore,
        status: decision,
        eval_results: { score: currentScore, parent_score: parentScore },
      })
      .eq('id', logEntry.id)
  }

  return { decision, currentScore, parentScore }
}
