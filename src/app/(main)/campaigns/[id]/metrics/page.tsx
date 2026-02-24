import { notFound } from 'next/navigation'
import { getCampaignById } from '@/features/campaigns/services/campaign-service'
import { getMetricsByCampaign, getWeeklySummary, getLearningsByCampaign } from '@/features/analytics/services/analytics-service'
import { MetricsClient } from './client'

export const metadata = { title: 'Metricas | ContentOps' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function MetricsPage({ params }: Props) {
  const { id: campaignId } = await params

  const campaignResult = await getCampaignById(campaignId)

  if (!campaignResult.data) {
    notFound()
  }

  const campaign = campaignResult.data

  const [metricsResult, summaryResult, learningsResult] = await Promise.all([
    getMetricsByCampaign(campaignId),
    getWeeklySummary(campaignId),
    getLearningsByCampaign(campaignId),
  ])

  const defaultSummary = {
    totalImpressions: 0,
    totalComments: 0,
    totalSaves: 0,
    totalShares: 0,
    totalLeads: 0,
    avgImpressions: 0,
    avgComments: 0,
    avgSaves: 0,
    avgShares: 0,
    avgLeads: 0,
    postMetrics: [],
    engagementRate: 0,
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <MetricsClient
        campaignId={campaignId}
        weekStart={campaign.week_start}
        topicTitle={campaign.topics?.title ?? null}
        postMetrics={metricsResult.data ?? []}
        summary={summaryResult.data ?? defaultSummary}
        learnings={learningsResult.data ?? []}
      />
    </div>
  )
}
