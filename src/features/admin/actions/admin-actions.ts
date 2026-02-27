'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const toggleAdminSchema = z.object({
  targetUserId: z.string().uuid(),
})

/**
 * Toggle platform admin status for a target user.
 * 4-step pattern: Auth(platform admin) → Validate → Execute → Side effects
 */
export async function togglePlatformAdminAction(input: {
  targetUserId: string
}): Promise<{ error?: string; success?: boolean }> {
  // Step 1: Auth (platform admin only)
  const caller = await requireAdmin()

  // Step 2: Validate
  const parsed = toggleAdminSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute via SECURITY DEFINER RPC
  const supabase = await createClient()

  const { error } = await supabase.rpc('toggle_platform_admin', {
    p_caller_id: caller.id,
    p_target_user_id: parsed.data.targetUserId,
  })

  if (error) {
    return { error: error.message }
  }

  // Step 4: Side effects
  revalidatePath('/admin')
  return { success: true }
}
