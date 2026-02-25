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
  searchParams: Promise<{ variant?: string }>
}

export default async function VisualEditorPage({ params, searchParams }: Props) {
  const { id: campaignId, day: dayStr } = await params
  const { variant: variantParam } = await searchParams
  const dayOfWeek = parseInt(dayStr, 10)

  if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    notFound()
  }

  const [campaignResult, postResult] = await Promise.all([
    getCampaignById(campaignId),
    getPostByCampaignAndDay(campaignId, dayOfWeek),
  ])

  if (!campaignResult.data || !postResult.data) {
    notFound()
  }

  const campaign = campaignResult.data
  const post = postResult.data

  // Get post content: prefer variant from query param, fall back to is_current
  const targetVersion = variantParam
    ? post.versions
        .filter((v) => v.variant === variantParam)
        .sort((a, b) => b.version - a.version)[0]
    : post.versions.find((v) => v.is_current)
  const postContent = targetVersion?.content ?? ''

  // Get visual versions for this post
  const visualsResult = await getVisualsByPostId(post.id)
  const visuals = visualsResult.data ?? []

  // Load carousel slides in parallel (batch instead of N+1)
  const carouselVisuals = visuals.filter(
    (v) => v.concept_type === 'carousel_4x5' || (v.slide_count && v.slide_count >= 2)
  )
  const slidesResults = await Promise.all(
    carouselVisuals.map((v) => getCarouselSlides(v.id))
  )
  const carouselSlidesMap: Record<string, CarouselSlide[]> = {}
  carouselVisuals.forEach((v, i) => {
    if (slidesResults[i].data) {
      carouselSlidesMap[v.id] = slidesResults[i].data!
    }
  })

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
