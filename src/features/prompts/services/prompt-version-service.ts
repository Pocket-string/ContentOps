import { createClient } from '@/lib/supabase/server'
import type { PromptType } from '@/shared/types/content-ops'

interface PromptVersionRow {
  id: string
  workspace_id: string
  prompt_type: string
  version: number
  content: string
  is_active: boolean
  performance_score: number | null
  posts_generated: number
  parent_version_id: string | null
  hypothesis: string | null
  created_at: string
}

/**
 * Get the active prompt for a workspace + type.
 * Returns null if no active prompt exists (caller should fall back to hardcoded default).
 */
export async function getActivePrompt(
  workspaceId: string,
  promptType: PromptType,
): Promise<PromptVersionRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('prompt_type', promptType)
    .eq('is_active', true)
    .single()

  return (data as PromptVersionRow | null) ?? null
}

/**
 * Get all prompt versions for a workspace + type, ordered by version desc.
 */
export async function getPromptVersions(
  workspaceId: string,
  promptType: PromptType,
): Promise<PromptVersionRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('prompt_type', promptType)
    .order('version', { ascending: false })

  return (data as PromptVersionRow[] | null) ?? []
}

/**
 * Create a new prompt version. Does NOT activate it.
 */
export async function createPromptVersion(
  workspaceId: string,
  promptType: PromptType,
  content: string,
  hypothesis: string | null,
  parentVersionId: string | null,
): Promise<{ id: string; version: number } | null> {
  const supabase = await createClient()

  // Get next version number
  const { data: latest } = await supabase
    .from('prompt_versions')
    .select('version')
    .eq('workspace_id', workspaceId)
    .eq('prompt_type', promptType)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = (latest?.version ?? 0) + 1

  const { data, error } = await supabase
    .from('prompt_versions')
    .insert({
      workspace_id: workspaceId,
      prompt_type: promptType,
      version: nextVersion,
      content,
      is_active: false,
      hypothesis,
      parent_version_id: parentVersionId,
    })
    .select('id, version')
    .single()

  if (error) {
    console.error('[prompt-version-service] Create failed:', error)
    return null
  }

  return data as { id: string; version: number }
}

/**
 * Activate a prompt version (deactivates the current active one for the same type).
 */
export async function activatePromptVersion(
  workspaceId: string,
  versionId: string,
  promptType: PromptType,
): Promise<boolean> {
  const supabase = await createClient()

  // Deactivate current active
  await supabase
    .from('prompt_versions')
    .update({ is_active: false })
    .eq('workspace_id', workspaceId)
    .eq('prompt_type', promptType)
    .eq('is_active', true)

  // Activate the new one
  const { error } = await supabase
    .from('prompt_versions')
    .update({ is_active: true })
    .eq('id', versionId)

  return !error
}

/**
 * Record that a post was generated with a specific prompt version.
 */
export async function recordPostGeneration(
  postId: string,
  promptVersionId: string,
): Promise<void> {
  const supabase = await createClient()

  // Insert junction
  await supabase
    .from('post_prompt_version')
    .insert({ post_id: postId, prompt_version_id: promptVersionId })

  // Increment posts_generated counter
  const { data: current } = await supabase
    .from('prompt_versions')
    .select('posts_generated')
    .eq('id', promptVersionId)
    .single()

  if (current) {
    await supabase
      .from('prompt_versions')
      .update({ posts_generated: (current.posts_generated ?? 0) + 1 })
      .eq('id', promptVersionId)
  }
}

/**
 * Seed the baseline prompt version from the hardcoded system prompt.
 * Only creates if no versions exist for the given type.
 */
export async function seedBaseline(
  workspaceId: string,
  promptType: PromptType,
  hardcodedContent: string,
): Promise<{ id: string; version: number } | null> {
  const supabase = await createClient()

  // Check if any versions exist
  const { data: existing } = await supabase
    .from('prompt_versions')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('prompt_type', promptType)
    .limit(1)

  if (existing && existing.length > 0) return null // Already seeded

  const result = await createPromptVersion(
    workspaceId,
    promptType,
    hardcodedContent,
    'Baseline: prompt original hardcodeado',
    null,
  )

  if (result) {
    await activatePromptVersion(workspaceId, result.id, promptType)
  }

  return result
}

/**
 * Update the performance score of a prompt version.
 */
export async function updatePromptScore(
  versionId: string,
  score: number,
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('prompt_versions')
    .update({ performance_score: score })
    .eq('id', versionId)
}

/**
 * Get optimization log entries for a workspace.
 */
export async function getOptimizationLog(
  workspaceId: string,
  limit = 20,
): Promise<Array<Record<string, unknown>>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('prompt_optimization_log')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as Array<Record<string, unknown>>
}

/**
 * Log an optimization iteration result.
 */
export async function logOptimizationResult(
  workspaceId: string,
  promptVersionId: string,
  iteration: number,
  hypothesis: string,
  changeDescription: string,
  evalResults: Record<string, unknown>,
  score: number,
  previousScore: number,
  status: 'baseline' | 'keep' | 'discard' | 'rollback',
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('prompt_optimization_log').insert({
    workspace_id: workspaceId,
    prompt_version_id: promptVersionId,
    iteration,
    hypothesis,
    change_description: changeDescription,
    eval_results: evalResults,
    score,
    previous_score: previousScore,
    status,
  })
}
