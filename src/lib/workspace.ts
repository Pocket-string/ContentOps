import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

/**
 * Get the user's current workspace, or create a default one.
 * Returns workspace_id for use in all data queries.
 */
export async function getWorkspaceId(): Promise<string> {
  const user = await requireAuth()
  const supabase = await createClient()

  // Check existing memberships
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (membership) {
    return membership.workspace_id
  }

  // No workspace — create a default one
  // Generate UUID client-side to avoid RLS RETURNING issue
  // (SELECT policy requires membership that doesn't exist yet)
  const workspaceId = crypto.randomUUID()

  const { error: wsError } = await supabase
    .from('workspaces')
    .insert({ id: workspaceId, name: 'Mi Workspace' })

  if (wsError) {
    throw new Error('Failed to create workspace')
  }

  // Add user as admin
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      role: 'admin',
    })

  if (memberError) {
    throw new Error('Failed to add user to workspace')
  }

  return workspaceId
}
