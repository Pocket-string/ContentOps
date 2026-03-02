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

  if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    notFound()
  }

  // Fetch campaign and post in parallel
  const [campaignResult, postResult] = await Promise.all([
    getCampaignById(campaignId),
    getPostByCampaignAndDay(campaignId, dayOfWeek),
  ])

  if (!campaignResult.data || !postResult.data) {
    notFound()
  }

  const campaign = campaignResult.data
  const topicTitle = campaign.topics?.title
  const keyword = campaign.keyword ?? undefined
  const weeklyBrief = campaign.weekly_brief ?? undefined

  // Build rich context from ALL topic fields for grounded copy generation
  const topicContext = campaign.topics
    ? [
        campaign.topics.hypothesis ? `Hipotesis: ${campaign.topics.hypothesis}` : '',
        campaign.topics.evidence ? `Evidencia verificada:\n${campaign.topics.evidence}` : '',
        campaign.topics.anti_myth ? `Anti-mito: ${campaign.topics.anti_myth}` : '',
        campaign.topics.silent_enemy_name ? `Enemigo silencioso: ${campaign.topics.silent_enemy_name}` : '',
        campaign.topics.signals_json.length > 0 ? `Senales del mercado: ${campaign.topics.signals_json.join(', ')}` : '',
        campaign.topics.minimal_proof ? `Fuentes verificadas:\n${campaign.topics.minimal_proof}` : '',
        campaign.topics.expected_business_impact ? `Impacto de negocio: ${campaign.topics.expected_business_impact}` : '',
        campaign.topics.failure_modes?.length > 0 ? `Modos de falla: ${campaign.topics.failure_modes.join(', ')}` : '',
      ].filter(Boolean).join('\n\n')
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
