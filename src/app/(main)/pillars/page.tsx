import { getWorkspaceId } from '@/lib/workspace'
import { getPillarList } from '@/features/pillars/services/pillar-service'
import { PillarListClient } from './client'

export const metadata = { title: 'Pilares | ContentOps' }

export default async function PillarsPage() {
  const workspaceId = await getWorkspaceId()
  const result = await getPillarList(workspaceId)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PillarListClient pillars={result.data ?? []} />
    </div>
  )
}
