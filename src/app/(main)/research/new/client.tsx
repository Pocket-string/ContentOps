'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ResearchForm } from '@/features/research/components/ResearchForm'
import { DeepResearchPanel } from '@/features/research/components/DeepResearchPanel'
import { createResearchAction } from '@/features/research/actions/research-actions'

interface Props {
  allTags: string[]
}

const TABS = [
  { id: 'ai' as const, label: 'Investigacion AI' },
  { id: 'manual' as const, label: 'Manual' },
]

export function ResearchNewClient({ allTags }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai')

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
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'ai' ? (
        <DeepResearchPanel />
      ) : (
        <ResearchForm
          allTags={allTags}
          onSubmit={handleSubmit}
          onSuccess={() => router.push('/research')}
        />
      )}
    </div>
  )
}
