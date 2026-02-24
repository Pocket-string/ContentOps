import { notFound } from 'next/navigation'
import { getCampaignById } from '@/features/campaigns/services/campaign-service'
import { getPostByCampaignAndDay } from '@/features/posts/services/post-service'
import { getVisualsByPostId } from '@/features/visuals/services/visual-service'
import { VisualEditorClient } from './client'

export const metadata = { title: 'Visual Editor | ContentOps' }

interface Props {
  params: Promise<{ id: string; day: string }>
}

export default async function VisualEditorPage({ params }: Props) {
  const { id: campaignId, day: dayStr } = await params
  const dayOfWeek = parseInt(dayStr, 10)

  if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 5) {
    notFound()
  }

  const campaignResult = await getCampaignById(campaignId)

  if (!campaignResult.data) {
    notFound()
  }

  const postResult = await getPostByCampaignAndDay(campaignId, dayOfWeek)

  if (!postResult.data) {
    notFound()
  }

  const campaign = campaignResult.data
  const post = postResult.data

  // Get the current post content (from current version, if any)
  const currentVersion = post.versions.find((v) => v.is_current)
  const postContent = currentVersion?.content ?? ''

  // Get visual versions for this post
  const visualsResult = await getVisualsByPostId(post.id)

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <VisualEditorClient
        postId={post.id}
        campaignId={campaignId}
        dayOfWeek={dayOfWeek}
        postContent={postContent}
        funnelStage={post.funnel_stage}
        topicTitle={campaign.topics?.title}
        keyword={campaign.keyword ?? undefined}
        visuals={visualsResult.data ?? []}
      />
    </div>
  )
}
