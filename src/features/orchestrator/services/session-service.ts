import { createClient } from '@/lib/supabase/server'

// ============================================
// Types
// ============================================

export interface Session {
  id: string
  workspace_id: string
  user_id: string
  title: string | null
  messages_json: unknown[]
  page_context: unknown
  created_at: string
  updated_at: string
}

export interface SessionSummary {
  id: string
  title: string | null
  created_at: string
  messageCount: number
}

export interface SessionResult {
  data?: Session | null
  error?: string
}

// ============================================
// Helpers
// ============================================

/**
 * Extracts a title from the first user message in a messages array.
 * Truncates to 50 characters. Returns null if no user message found.
 */
function deriveTitleFromMessages(messages: unknown[]): string | null {
  for (const msg of messages) {
    if (
      typeof msg === 'object' &&
      msg !== null &&
      'role' in msg &&
      (msg as Record<string, unknown>).role === 'user' &&
      'content' in msg
    ) {
      const content = (msg as Record<string, unknown>).content
      if (typeof content === 'string' && content.trim().length > 0) {
        return content.trim().slice(0, 50)
      }
    }
  }
  return null
}

// ============================================
// Queries
// ============================================

/**
 * Finds the most recent session for a user updated within the last 24 hours.
 * Returns null when no active session exists.
 */
export async function getActiveSession(userId: string): Promise<SessionResult> {
  try {
    const supabase = await createClient()

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('orchestrator_sessions')
      .select('id, workspace_id, user_id, title, messages_json, page_context, created_at, updated_at')
      .eq('user_id', userId)
      .gte('updated_at', since)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[session-service] getActiveSession error:', error)
      return { error: error.message }
    }

    return { data: data as Session | null }
  } catch (err) {
    console.error('[session-service] getActiveSession unexpected error:', err)
    return { error: 'Error inesperado al obtener la sesion activa' }
  }
}

/**
 * Creates a new orchestrator session for the given user and workspace.
 * Initializes messages_json as an empty array.
 */
export async function createSession(params: {
  workspaceId: string
  userId: string
  pageContext: unknown
}): Promise<SessionResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('orchestrator_sessions')
      .insert({
        workspace_id: params.workspaceId,
        user_id: params.userId,
        page_context: params.pageContext,
        messages_json: [],
        title: null,
      })
      .select('id, workspace_id, user_id, title, messages_json, page_context, created_at, updated_at')
      .single()

    if (error) {
      console.error('[session-service] createSession error:', error)
      return { error: error.message }
    }

    return { data: data as Session }
  } catch (err) {
    console.error('[session-service] createSession unexpected error:', err)
    return { error: 'Error inesperado al crear la sesion' }
  }
}

/**
 * Persists the updated messages array to a session.
 * If no title is provided and the session has no title yet, auto-derives one
 * from the first user message (truncated to 50 chars).
 */
export async function saveMessages(
  sessionId: string,
  messages: unknown[],
  title?: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    const resolvedTitle: string | null = title ?? deriveTitleFromMessages(messages)

    const payload: Record<string, unknown> = {
      messages_json: messages,
      updated_at: new Date().toISOString(),
    }

    if (resolvedTitle !== null) {
      payload.title = resolvedTitle
    }

    const { error } = await supabase
      .from('orchestrator_sessions')
      .update(payload)
      .eq('id', sessionId)

    if (error) {
      console.error('[session-service] saveMessages error:', error)
      return { error: error.message }
    }

    return {}
  } catch (err) {
    console.error('[session-service] saveMessages unexpected error:', err)
    return { error: 'Error inesperado al guardar mensajes' }
  }
}

/**
 * Returns a summarized list of recent sessions for a user.
 * Includes the message count derived from the messages_json array length.
 */
export async function getSessionHistory(
  userId: string,
  limit = 10
): Promise<{ data?: SessionSummary[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('orchestrator_sessions')
      .select('id, title, created_at, messages_json')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[session-service] getSessionHistory error:', error)
      return { error: error.message }
    }

    const summaries: SessionSummary[] = (data ?? []).map((row) => {
      const msgs = Array.isArray(row.messages_json) ? row.messages_json : []
      return {
        id: row.id as string,
        title: (row.title as string | null) ?? null,
        created_at: row.created_at as string,
        messageCount: msgs.length,
      }
    })

    return { data: summaries }
  } catch (err) {
    console.error('[session-service] getSessionHistory unexpected error:', err)
    return { error: 'Error inesperado al obtener el historial de sesiones' }
  }
}
