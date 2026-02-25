'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ResearchForm } from '@/features/research/components/ResearchForm'
import { updateResearchAction } from '@/features/research/actions/research-actions'
import type { ResearchReport } from '@/shared/types/content-ops'

interface Props {
  research: ResearchReport
  allTags: string[]
}

export function ResearchEditClient({ research, allTags }: Props) {
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

    const result = await updateResearchAction(research.id, formData)

    if ('error' in result) {
      return { error: result.error }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/research/${research.id}`}
          aria-label="Volver al detalle"
          className="
            inline-flex items-center justify-center w-9 h-9 rounded-xl
            border border-border text-foreground-muted
            hover:border-border-dark hover:text-foreground
            transition-colors duration-200
          "
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Editar Research</h1>
      </div>

      {/* Form */}
      <ResearchForm
        research={research}
        allTags={allTags}
        onSubmit={handleSubmit}
        onSuccess={() => router.push(`/research/${research.id}`)}
      />
    </div>
  )
}
