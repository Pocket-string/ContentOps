import { getWorkspaceId } from '@/lib/workspace'
import { getCampaignList } from '@/features/campaigns/services/campaign-service'
import { CampaignListClient } from './client'

export const metadata = { title: 'Campaigns | ContentOps' }

export default async function CampaignsPage() {
  const workspaceId = await getWorkspaceId()
  const result = await getCampaignList(workspaceId)

  const campaigns = (result.data ?? []).map((c) => ({
    ...c,
    topic_title: c.topics?.title,
    topics: undefined,
  }))

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <CampaignListClient campaigns={campaigns} />
    </div>
  )
}
