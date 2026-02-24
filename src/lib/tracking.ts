import { createClient } from '@/lib/supabase/server'

/**
 * Fire-and-forget event tracking.
 * Never breaks the main flow — errors are silently caught.
 */
export function track(event: string, properties?: Record<string, unknown>) {
  void (async () => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // For now, just log. In production, insert into an events table or send to analytics.
      console.log('[track]', event, { user_id: user?.id, ...properties })
    } catch {
      // Silently fail — tracking must never break the main flow
    }
  })()
}
