import { getWorkspaceId } from '@/lib/workspace'
import { getTopicList } from '@/features/topics/services/topic-service'
import { TopicListClient } from './client'

export const metadata = { title: 'Topics | ContentOps' }

export default async function TopicsPage() {
  const workspaceId = await getWorkspaceId()
  const result = await getTopicList(workspaceId)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <TopicListClient topics={result.data ?? []} />
    </div>
  )
}
