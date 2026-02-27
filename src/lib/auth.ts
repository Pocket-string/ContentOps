import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AppRole = 'admin' | 'editor' | 'collaborator'

interface UserProfile {
  id: string
  email: string
  role: AppRole
  full_name: string | null
  workspace_id: string | null
}

export async function requireAuth(): Promise<UserProfile> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  return {
    id: user.id,
    email: user.email!,
    role: (membership?.role as AppRole) ?? 'admin',
    full_name: (user.user_metadata?.full_name as string) ?? null,
    workspace_id: membership?.workspace_id ?? null,
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  return {
    id: user.id,
    email: user.email!,
    role: (membership?.role as AppRole) ?? 'admin',
    full_name: (user.user_metadata?.full_name as string) ?? null,
    workspace_id: membership?.workspace_id ?? null,
  }
}

export async function requireAdmin(): Promise<UserProfile> {
  const profile = await requireAuth()

  if (profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return profile
}
