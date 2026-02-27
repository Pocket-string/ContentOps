'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function fetchMembership(currentUser: User) {
      const { data } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', currentUser.id)
        .limit(1)
        .single()

      setProfile({
        id: currentUser.id,
        email: currentUser.email,
        full_name: (currentUser.user_metadata?.full_name as string) ?? null,
        role: (data?.role as Profile['role']) ?? 'admin',
        workspace_id: data?.workspace_id ?? null,
      })
    }

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchMembership(user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          fetchMembership(currentUser)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, loading }
}
