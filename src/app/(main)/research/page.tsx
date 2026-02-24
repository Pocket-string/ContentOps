import { getWorkspaceId } from '@/lib/workspace'
import { getResearchList, getAllTags } from '@/features/research/services/research-service'
import { ResearchList } from '@/features/research/components/ResearchList'

export const metadata = { title: 'Research | ContentOps' }

export default async function ResearchPage() {
  const workspaceId = await getWorkspaceId()

  const [listResult, tagsResult] = await Promise.all([
    getResearchList(workspaceId),
    getAllTags(workspaceId),
  ])

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <ResearchList
        reports={listResult.data ?? []}
        allTags={tagsResult.data ?? []}
      />
    </div>
  )
}
