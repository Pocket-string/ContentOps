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

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    role: (profile?.role as AppRole) ?? 'collaborator',
    full_name: profile?.full_name ?? null,
    workspace_id: null,
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    role: (profile?.role as AppRole) ?? 'collaborator',
    full_name: profile?.full_name ?? null,
    workspace_id: null,
  }
}

export async function requireAdmin(): Promise<UserProfile> {
  const profile = await requireAuth()

  if (profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return profile
}
