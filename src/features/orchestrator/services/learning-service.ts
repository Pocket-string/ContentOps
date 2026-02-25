import { createClient } from '@/lib/supabase/server'

// ============================================
// Types
// ============================================

export interface OrchestratorLearning {
  id: string
  workspace_id: string
  agent_type: string
  feedback_type: string
  feedback_text: string
  context_json: Record<string, unknown> | null
  created_by: string
  created_at: string
}

export interface ServiceResult<T> {
  data?: T
  error?: string
}

// ============================================
// Queries
// ============================================

/**
 * Returns the most recent learnings for a workspace, ordered by creation date.
 * Useful for giving the orchestrator context about recent user feedback.
 */
export async function getRecentLearnings(
  workspaceId: string,
  limit = 20
): Promise<ServiceResult<OrchestratorLearning[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('orchestrator_learnings')
      .select('id, workspace_id, agent_type, feedback_type, feedback_text, context_json, created_by, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[learning-service] getRecentLearnings error:', error)
      return { error: error.message }
    }

    return { data: (data ?? []) as OrchestratorLearning[] }
  } catch (err) {
    console.error('[learning-service] getRecentLearnings unexpected error:', err)
    return { error: 'Error inesperado al obtener aprendizajes' }
  }
}

/**
 * Returns learnings filtered by agent type (module) for a workspace.
 * Useful for understanding what feedback a specific module has accumulated.
 */
export async function getLearningsByAgent(
  workspaceId: string,
  agentType: string
): Promise<ServiceResult<OrchestratorLearning[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('orchestrator_learnings')
      .select('id, workspace_id, agent_type, feedback_type, feedback_text, context_json, created_by, created_at')
      .eq('workspace_id', workspaceId)
      .eq('agent_type', agentType)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[learning-service] getLearningsByAgent error:', error)
      return { error: error.message }
    }

    return { data: (data ?? []) as OrchestratorLearning[] }
  } catch (err) {
    console.error('[learning-service] getLearningsByAgent unexpected error:', err)
    return { error: 'Error inesperado al obtener aprendizajes por agente' }
  }
}

/**
 * Returns the count of positive feedback entries for a workspace.
 */
export async function getPositiveFeedbackCount(
  workspaceId: string
): Promise<ServiceResult<number>> {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('orchestrator_learnings')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('feedback_type', 'positive')

    if (error) {
      console.error('[learning-service] getPositiveFeedbackCount error:', error)
      return { error: error.message }
    }

    return { data: count ?? 0 }
  } catch (err) {
    console.error('[learning-service] getPositiveFeedbackCount unexpected error:', err)
    return { error: 'Error inesperado al contar feedback positivo' }
  }
}

/**
 * Returns the count of negative feedback entries for a workspace.
 */
export async function getNegativeFeedbackCount(
  workspaceId: string
): Promise<ServiceResult<number>> {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('orchestrator_learnings')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('feedback_type', 'negative')

    if (error) {
      console.error('[learning-service] getNegativeFeedbackCount error:', error)
      return { error: error.message }
    }

    return { data: count ?? 0 }
  } catch (err) {
    console.error('[learning-service] getNegativeFeedbackCount unexpected error:', err)
    return { error: 'Error inesperado al contar feedback negativo' }
  }
}
