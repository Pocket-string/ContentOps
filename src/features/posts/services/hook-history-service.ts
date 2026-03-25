import { createClient } from '@/lib/supabase/server'

/**
 * Get recent hooks across ALL campaigns in a workspace for anti-repetition.
 * Returns the first line (hook) of each current post version, ordered by recency.
 */
export async function getRecentHooks(
  workspaceId: string,
  limit = 50
): Promise<string[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('post_versions')
      .select(`
        content,
        created_at,
        posts!inner(
          campaign_id,
          campaigns!inner(
            workspace_id
          )
        )
      `)
      .eq('is_current', true)
      .eq('posts.campaigns.workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[hook-history] Query error:', error.message)
      return []
    }

    const hooks: string[] = []
    for (const row of data ?? []) {
      const content = row.content as string | null
      if (!content) continue
      const firstLine = content.split('\n')[0]?.trim()
      if (firstLine && firstLine.length > 10) {
        hooks.push(firstLine)
      }
    }

    return hooks
  } catch (err) {
    console.error('[hook-history] Unexpected error:', err)
    return []
  }
}
