'use client'

import { CampaignList } from '@/features/campaigns/components'
import type { Campaign } from '@/shared/types/content-ops'

type CampaignWithTopic = Campaign & { topic_title?: string }

interface Props {
  campaigns: CampaignWithTopic[]
}

export function CampaignListClient({ campaigns }: Props) {
  return <CampaignList campaigns={campaigns} />
}
