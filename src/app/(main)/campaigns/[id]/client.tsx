'use client'

import { CampaignBuilder } from '@/features/campaigns/components'
import { updateCampaignStatusAction, updateBriefAction } from '@/features/campaigns/actions/campaign-actions'
import type { Campaign, WeeklyBrief, PublishingPlan } from '@/shared/types/content-ops'
import type { PostWithVersions } from '@/features/campaigns/services/campaign-service'

type CampaignWithTopic = Campaign & {
  topic_title?: string
  topicData?: {
    title: string
    evidence: string | null
    anti_myth: string | null
    signals_json: string[]
    silent_enemy_name: string | null
  } | null
}

interface Props {
  campaign: CampaignWithTopic
  posts: PostWithVersions[]
}

export function CampaignBuilderClient({ campaign, posts }: Props) {
  async function handleStatusChange(status: string) {
    const result = await updateCampaignStatusAction(campaign.id, status)
    if ('error' in result) {
      return { error: result.error }
    }
  }

  async function handleBriefSave(brief: WeeklyBrief, plan?: PublishingPlan) {
    const result = await updateBriefAction(campaign.id, {
      weekly_brief: brief,
      publishing_plan: plan,
    })
    if ('error' in result) {
      return { error: result.error }
    }
  }

  return (
    <CampaignBuilder
      campaign={campaign}
      posts={posts}
      onStatusChange={handleStatusChange}
      onBriefSave={handleBriefSave}
    />
  )
}
