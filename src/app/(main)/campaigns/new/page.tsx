import { getWorkspaceId } from '@/lib/workspace'
import { getTopicList } from '@/features/topics/services/topic-service'
import { CampaignNewClient } from './client'

export const metadata = { title: 'Nueva Campana | ContentOps' }

export default async function NewCampaignPage() {
  const workspaceId = await getWorkspaceId()
  const topicsResult = await getTopicList(workspaceId, { status: 'selected' })

  // Also include backlog topics
  const backlogResult = await getTopicList(workspaceId, { status: 'backlog' })

  const allTopics = [
    ...(topicsResult.data ?? []),
    ...(backlogResult.data ?? []),
  ].map((t) => ({ id: t.id, title: t.title }))

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Nueva Campana</h1>
      <CampaignNewClient topics={allTopics} />
    </div>
  )
}
