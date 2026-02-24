'use client'

import { useRouter } from 'next/navigation'
import { ResearchForm } from '@/features/research/components/ResearchForm'
import { createResearchAction } from '@/features/research/actions/research-actions'

interface Props {
  allTags: string[]
}

export function ResearchNewClient({ allTags }: Props) {
  const router = useRouter()

  async function handleSubmit(data: {
    title: string
    source: string
    raw_text: string
    tags_json: string[]
    recency_date?: string
    market_region?: string
    buyer_persona?: string
    trend_score?: number
    fit_score?: number
    evidence_links: string[]
    key_takeaways: string[]
    recommended_angles: string[]
  }) {
    const formData = new FormData()
    formData.set('title', data.title)
    formData.set('source', data.source)
    formData.set('raw_text', data.raw_text)
    formData.set('tags_json', JSON.stringify(data.tags_json))
    if (data.recency_date) formData.set('recency_date', data.recency_date)
    if (data.market_region) formData.set('market_region', data.market_region)
    if (data.buyer_persona) formData.set('buyer_persona', data.buyer_persona)
    if (data.trend_score !== undefined) formData.set('trend_score', String(data.trend_score))
    if (data.fit_score !== undefined) formData.set('fit_score', String(data.fit_score))
    if (data.evidence_links.length > 0) formData.set('evidence_links', JSON.stringify(data.evidence_links))
    if (data.key_takeaways.length > 0) formData.set('key_takeaways', JSON.stringify(data.key_takeaways))
    if (data.recommended_angles.length > 0) formData.set('recommended_angles', JSON.stringify(data.recommended_angles))

    const result = await createResearchAction(formData)

    if ('error' in result) {
      return { error: result.error }
    }
  }

  return (
    <ResearchForm
      allTags={allTags}
      onSubmit={handleSubmit}
      onSuccess={() => router.push('/research')}
    />
  )
}
