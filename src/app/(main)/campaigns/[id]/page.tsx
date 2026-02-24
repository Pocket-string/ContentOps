import { notFound } from 'next/navigation'
import { getCampaignById } from '@/features/campaigns/services/campaign-service'
import { CampaignBuilderClient } from './client'

export const metadata = { title: 'Campaign Builder | ContentOps' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getCampaignById(id)

  if (!result.data) {
    notFound()
  }

  const campaign = {
    ...result.data,
    topic_title: result.data.topics?.title,
    topicData: result.data.topics ? {
      title: result.data.topics.title,
      evidence: result.data.topics.evidence,
      anti_myth: result.data.topics.anti_myth,
      signals_json: result.data.topics.signals_json,
      silent_enemy_name: result.data.topics.silent_enemy_name,
    } : null,
    topics: undefined,
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <CampaignBuilderClient campaign={campaign} posts={result.data.posts} />
    </div>
  )
}
