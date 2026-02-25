import { notFound } from 'next/navigation'
import { getCampaignById } from '@/features/campaigns/services/campaign-service'
import { getPostByCampaignAndDay } from '@/features/posts/services/post-service'
import { getVisualsByPostId } from '@/features/visuals/services/visual-service'
import { getCarouselSlides } from '@/features/visuals/services/carousel-service'
import { VisualEditorClient } from './client'
import type { CarouselSlide } from '@/shared/types/content-ops'

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
  const visuals = visualsResult.data ?? []

  // Load carousel slides for any carousel visual versions
  const carouselSlidesMap: Record<string, CarouselSlide[]> = {}
  for (const v of visuals) {
    if (v.concept_type === 'carousel_4x5' || (v.slide_count && v.slide_count >= 2)) {
      const slidesResult = await getCarouselSlides(v.id)
      if (slidesResult.data) {
        carouselSlidesMap[v.id] = slidesResult.data
      }
    }
  }

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
        visuals={visuals}
        carouselSlidesMap={carouselSlidesMap}
      />
    </div>
  )
}
