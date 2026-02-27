import { requireAdmin } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { createClient } from '@/lib/supabase/server'
import { AdminPanel } from '@/features/admin/components'
import type { Member } from '@/features/admin/components/AdminPanel'

export const metadata = {
  title: 'Admin | ContentOps',
}

export default async function AdminPage() {
  await requireAdmin()
  const workspaceId = await getWorkspaceId()
  const supabase = await createClient()

  const { data: members } = await supabase
    .rpc('get_workspace_members_with_email', { p_workspace_id: workspaceId })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Panel de Administracion</h1>
        <p className="text-foreground-secondary mt-1 text-sm">
          Gestiona usuarios, roles y configuraciones del workspace.
        </p>
      </div>
      <AdminPanel members={(members ?? []) as Member[]} workspaceId={workspaceId} />
    </div>
  )
}
