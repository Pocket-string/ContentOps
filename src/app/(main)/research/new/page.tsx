import { getWorkspaceId } from '@/lib/workspace'
import { getAllTags } from '@/features/research/services/research-service'
import { ResearchNewClient } from './client'

export const metadata = { title: 'Nuevo Research | ContentOps' }

export default async function NewResearchPage() {
  const workspaceId = await getWorkspaceId()
  const tagsResult = await getAllTags(workspaceId)

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Nuevo Research</h1>
      <ResearchNewClient allTags={tagsResult.data ?? []} />
    </div>
  )
}
