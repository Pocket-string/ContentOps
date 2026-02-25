import { notFound } from 'next/navigation'
import { getCampaignById } from '@/features/campaigns/services/campaign-service'
import { getConversionConfig } from '@/features/conversion/services/conversion-service'
import { ConversionClient } from './client'

export const metadata = { title: 'Conversion | ContentOps' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConversionPage({ params }: Props) {
  const { id: campaignId } = await params

  const [campaignResult, configResult] = await Promise.all([
    getCampaignById(campaignId),
    getConversionConfig(campaignId),
  ])

  if (!campaignResult.data) {
    notFound()
  }

  const campaign = campaignResult.data

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <ConversionClient
        campaignId={campaignId}
        keyword={campaign.keyword}
        topicTitle={campaign.topics?.title}
        weekStart={campaign.week_start}
        config={configResult.data ?? {}}
      />
    </div>
  )
}
