import { notFound } from 'next/navigation'
import { getCampaignById } from '@/features/campaigns/services/campaign-service'
import { WeekReviewDashboard } from '@/features/pipeline/components/WeekReviewDashboard'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Review Pipeline | ContentOps' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function CampaignReviewPage({ params }: Props) {
  const { id } = await params
  const result = await getCampaignById(id)

  if (!result.data) {
    notFound()
  }

  // Fetch visual versions for each post
  const supabase = await createClient()
  const postIds = result.data.posts.map(p => p.id)

  const { data: visualVersions } = await supabase
    .from('visual_versions')
    .select('id, post_id, image_url, status')
    .in('post_id', postIds.length > 0 ? postIds : ['__none__'])
    .order('created_at', { ascending: false })

  // Map visual versions to posts
  const postsWithVisuals = result.data.posts.map(post => ({
    id: post.id,
    day_of_week: post.day_of_week,
    funnel_stage: post.funnel_stage,
    status: post.status,
    selected_variant: post.selected_variant ?? null,
    rejection_feedback: (post as Record<string, unknown>).rejection_feedback as string | null ?? null,
    versions: post.post_versions.map(v => ({
      id: v.id,
      variant: v.variant,
      content: v.content,
      is_current: v.is_current,
      score_json: v.score_json ? { total: v.score_json.total } : null,
    })),
    visual_versions: (visualVersions ?? [])
      .filter(vv => vv.post_id === post.id)
      .map(vv => ({
        id: vv.id,
        image_url: vv.image_url,
        status: vv.status,
      })),
  }))

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <a
          href={`/campaigns/${id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Volver a Campaign Builder
        </a>
      </div>
      <WeekReviewDashboard
        campaignId={id}
        posts={postsWithVisuals}
      />
    </div>
  )
}
