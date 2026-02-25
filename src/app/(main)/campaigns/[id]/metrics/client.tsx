'use client'

import Link from 'next/link'
import { MetricsPanel } from '@/features/analytics/components'
import {
  saveMetricsAction,
  createLearningAction,
  deleteLearningAction,
} from '@/features/analytics/actions/analytics-actions'
import type { Learning } from '@/shared/types/content-ops'

interface PostMetricRow {
  postId: string
  dayOfWeek: number
  dayLabel: string
  funnelStage: string
  postStatus: string
  impressions: number
  comments: number
  saves: number
  shares: number
  leads: number
  notes: string | null
  metricsId: string | null
}

interface Summary {
  totalImpressions: number
  totalComments: number
  totalSaves: number
  totalShares: number
  totalLeads: number
  avgImpressions: number
  avgComments: number
  avgSaves: number
  avgShares: number
  avgLeads: number
  engagementRate: number
}

interface Props {
  campaignId: string
  weekStart: string
  topicTitle: string | null
  postMetrics: PostMetricRow[]
  summary: Summary
  previousSummary: Summary | null
  learnings: Learning[]
}

export function MetricsClient({
  campaignId,
  weekStart,
  topicTitle,
  postMetrics,
  summary,
  previousSummary,
  learnings,
}: Props) {
  async function handleSaveMetrics(formData: FormData) {
    const result = await saveMetricsAction(formData)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleCreateLearning(formData: FormData) {
    const result = await createLearningAction(formData)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleDeleteLearning(learningId: string) {
    const result = await deleteLearningAction(learningId)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/campaigns/${campaignId}`}
          className="text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          &larr; Volver a campana
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-1">
          Metricas y Aprendizajes
        </h1>
        <p className="text-sm text-foreground-muted mt-0.5">
          {topicTitle && <span>Tema: {topicTitle} &middot; </span>}
          Semana del {new Date(weekStart + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <MetricsPanel
        campaignId={campaignId}
        weekStart={weekStart}
        topicTitle={topicTitle}
        postMetrics={postMetrics}
        summary={summary}
        previousSummary={previousSummary}
        learnings={learnings}
        onSaveMetrics={handleSaveMetrics}
        onCreateLearning={handleCreateLearning}
        onDeleteLearning={handleDeleteLearning}
      />
    </div>
  )
}
