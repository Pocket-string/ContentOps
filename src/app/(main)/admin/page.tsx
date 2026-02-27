import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminPanel } from '@/features/admin/components'
import type { PlatformUser } from '@/features/admin/components/AdminPanel'

export const metadata = {
  title: 'Admin | ContentOps',
}

export default async function AdminPage() {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const { data: users } = await supabase
    .rpc('get_all_platform_users', { p_caller_id: admin.id })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Panel de Administracion</h1>
        <p className="text-foreground-secondary mt-1 text-sm">
          Gestiona usuarios y permisos de la plataforma.
        </p>
      </div>
      <AdminPanel users={(users ?? []) as PlatformUser[]} />
    </div>
  )
}
