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

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <PostEditorClient
        post={postResult.data}
        campaignId={campaignId}
        topicTitle={topicTitle}
        keyword={keyword}
        weeklyBrief={weeklyBrief}
      />
    </div>
  )
}
