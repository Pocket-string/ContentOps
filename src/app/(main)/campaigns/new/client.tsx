'use client'

import { useRouter } from 'next/navigation'
import { CampaignForm } from '@/features/campaigns/components'
import { createCampaignAction } from '@/features/campaigns/actions/campaign-actions'
import type { CreateCampaignInput } from '@/shared/types/content-ops'

interface Props {
  topics: { id: string; title: string }[]
}

export function CampaignNewClient({ topics }: Props) {
  const router = useRouter()

  async function handleSubmit(data: CreateCampaignInput) {
    const formData = new FormData()
    formData.set('week_start', data.week_start)
    if (data.topic_id) formData.set('topic_id', data.topic_id)
    if (data.keyword) formData.set('keyword', data.keyword)
    if (Object.keys(data.resource_json).length > 0) {
      formData.set('resource_json', JSON.stringify(data.resource_json))
    }
    if (Object.keys(data.audience_json).length > 0) {
      formData.set('audience_json', JSON.stringify(data.audience_json))
    }
    if (data.post_frequency !== undefined) {
      formData.set('post_frequency', String(data.post_frequency))
    }
    if (data.selected_days) {
      formData.set('selected_days', JSON.stringify(data.selected_days))
    }

    const result = await createCampaignAction(formData)

    if ('error' in result) {
      return { error: result.error }
    }
  }

  return (
    <CampaignForm
      topics={topics}
      onSubmit={handleSubmit}
      onSuccess={() => router.push('/campaigns')}
    />
  )
}
