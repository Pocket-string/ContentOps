import { notFound } from 'next/navigation'
import { getCampaignById } from '@/features/campaigns/services/campaign-service'
import { getPostByCampaignAndDay } from '@/features/posts/services/post-service'
import { PostEditorClient } from './client'

export const metadata = { title: 'Post Editor | ContentOps' }

interface Props {
  params: Promise<{ id: string; day: string }>
}

export default async function PostEditorPage({ params }: Props) {
  const { id: campaignId, day: dayStr } = await params
  const dayOfWeek = parseInt(dayStr, 10)

  if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 5) {
    notFound()
  }

  // Fetch campaign for context (topic, keyword)
  const campaignResult = await getCampaignById(campaignId)

  if (!campaignResult.data) {
    notFound()
  }

  // Fetch the post with all its versions
  const postResult = await getPostByCampaignAndDay(campaignId, dayOfWeek)

  if (!postResult.data) {
    notFound()
  }

  const campaign = campaignResult.data
  const topicTitle = campaign.topics?.title
  const keyword = campaign.keyword ?? undefined
  const weeklyBrief = campaign.weekly_brief ?? undefined

  // Build additional context from topic data for richer copy generation
  const topicContext = campaign.topics
    ? [
        campaign.topics.hypothesis ? `Hipotesis: ${campaign.topics.hypothesis}` : '',
        campaign.topics.evidence ? `Evidencia: ${campaign.topics.evidence}` : '',
        campaign.topics.anti_myth ? `Anti-mito: ${campaign.topics.anti_myth}` : '',
        campaign.topics.silent_enemy_name ? `Enemigo silencioso: ${campaign.topics.silent_enemy_name}` : '',
        campaign.topics.signals_json.length > 0 ? `Senales: ${campaign.topics.signals_json.join(', ')}` : '',
      ].filter(Boolean).join('\n')
    : undefined

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <PostEditorClient
        post={postResult.data}
        campaignId={campaignId}
        topicTitle={topicTitle}
        keyword={keyword}
        weeklyBrief={weeklyBrief}
        topicContext={topicContext}
      />
    </div>
  )
}
