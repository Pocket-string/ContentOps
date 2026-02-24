'use client'

interface AIReviewBadgeProps {
  score: number
  recommendation: string
  summary: string
}

const SCORE_STYLES: Record<string, string> = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  publish: 'Publicar',
  minor_edits: 'Ajustes menores',
  major_rewrite: 'Reescribir',
  ready: 'Listo',
  needs_adjustments: 'Ajustes',
  rebuild: 'Reconstruir',
}

function getScoreLevel(score: number): string {
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

export function AIReviewBadge({ score, recommendation, summary }: AIReviewBadgeProps) {
  const level = getScoreLevel(score)
  const scoreStyle = SCORE_STYLES[level] ?? SCORE_STYLES.medium

  return (
    <div className="flex items-start gap-2 p-3 bg-surface border border-border rounded-xl text-xs">
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 ${scoreStyle}`}>
        {score}
      </span>
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">ChatGPT Review</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${scoreStyle}`}>
            {RECOMMENDATION_LABELS[recommendation] ?? recommendation}
          </span>
        </div>
        <p className="text-foreground-muted leading-snug">{summary}</p>
      </div>
    </div>
  )
}
