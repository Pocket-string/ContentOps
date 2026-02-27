import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AppRole = 'admin' | 'editor' | 'collaborator'

export interface UserProfile {
  id: string
  email: string
  role: AppRole
  full_name: string | null
  workspace_id: string | null
  is_platform_admin?: boolean
}

export async function requireAuth(): Promise<UserProfile> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, is_platform_admin')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  return {
    id: user.id,
    email: user.email!,
    role: (membership?.role as AppRole) ?? 'admin',
    full_name: (user.user_metadata?.full_name as string) ?? null,
    workspace_id: membership?.workspace_id ?? null,
    is_platform_admin: (membership?.is_platform_admin as boolean | undefined) ?? false,
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, is_platform_admin')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  return {
    id: user.id,
    email: user.email!,
    role: (membership?.role as AppRole) ?? 'admin',
    full_name: (user.user_metadata?.full_name as string) ?? null,
    workspace_id: membership?.workspace_id ?? null,
    is_platform_admin: (membership?.is_platform_admin as boolean | undefined) ?? false,
  }
}

/**
 * Requires the caller to be a platform admin (is_platform_admin = true).
 * Falls back to role === 'admin' if is_platform_admin column is not yet
 * present in the response (pre-migration compatibility).
 */
export async function requireAdmin(): Promise<UserProfile> {
  const profile = await requireAuth()

  const isPlatformAdmin =
    profile.is_platform_admin === true ||
    // Backwards-compat: column not yet in DB response
    (profile.is_platform_admin === undefined && profile.role === 'admin')

  if (!isPlatformAdmin) {
    redirect('/dashboard')
  }

  return profile
}
