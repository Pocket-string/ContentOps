'use client'

import { CampaignBuilder } from '@/features/campaigns/components'
import { updateCampaignStatusAction, updateBriefAction, updateCampaignAction } from '@/features/campaigns/actions/campaign-actions'
import type { Campaign, WeeklyBrief, PublishingPlan } from '@/shared/types/content-ops'
import type { PostWithVersions } from '@/features/campaigns/services/campaign-service'
import type { EditorialPillar } from '@/features/editorial/types/pillar'
import type { AudienceProfile } from '@/features/editorial/types/audience'

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
  editorialPillars: EditorialPillar[]
  audienceProfiles: AudienceProfile[]
}

export function CampaignBuilderClient({ campaign, posts, editorialPillars, audienceProfiles }: Props) {
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

  async function handleKeywordChange(keyword: string) {
    const fd = new FormData()
    fd.set('keyword', keyword)
    const result = await updateCampaignAction(campaign.id, fd)
    if ('error' in result) {
      return { error: result.error }
    }
  }

  async function handleEditorialPillarChange(pillarId: string | null) {
    const fd = new FormData()
    fd.set('editorial_pillar_id', pillarId ?? '')
    const result = await updateCampaignAction(campaign.id, fd)
    if ('error' in result) {
      return { error: result.error }
    }
  }

  async function handleTargetAudienceChange(audienceId: string | null) {
    const fd = new FormData()
    fd.set('target_audience_id', audienceId ?? '')
    const result = await updateCampaignAction(campaign.id, fd)
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
      onKeywordChange={handleKeywordChange}
      editorialPillars={editorialPillars}
      audienceProfiles={audienceProfiles}
      onEditorialPillarChange={handleEditorialPillarChange}
      onTargetAudienceChange={handleTargetAudienceChange}
    />
  )
}
