'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { createClient } from '@/lib/supabase/server'

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  newRole: z.enum(['admin', 'editor', 'collaborator']),
})

/**
 * Update a workspace member's role.
 * 4-step pattern: Auth(admin) → Validate → Execute → Side effects
 */
export async function updateMemberRoleAction(input: {
  userId: string
  newRole: string
}): Promise<{ error?: string; success?: boolean }> {
  // Step 1: Auth (admin only)
  await requireAdmin()

  // Step 2: Validate
  const parsed = updateRoleSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute
  const workspaceId = await getWorkspaceId()
  const supabase = await createClient()

  const { error } = await supabase.rpc('update_member_role', {
    p_workspace_id: workspaceId,
    p_user_id: parsed.data.userId,
    p_new_role: parsed.data.newRole,
  })

  if (error) {
    return { error: error.message }
  }

  // Step 4: Side effects
  revalidatePath('/admin')
  return { success: true }
}
