'use client'

import { useState } from 'react'
import { approvePieceAction, rejectPieceAction } from '@/features/pipeline/actions/pipeline-actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostVersion {
  id: string
  variant: string
  content: string
  is_current: boolean
  score_json?: { total: number } | null
}

interface VisualVersion {
  id: string
  image_url?: string | null
  status: string
}

interface Post {
  id: string
  day_of_week: number
  funnel_stage: string
  status: string
  selected_variant?: string | null
  rejection_feedback?: string | null
  versions: PostVersion[]
  visual_versions: VisualVersion[]
}

interface PieceReviewCardProps {
  post: Post
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_LABELS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
  7: 'Domingo',
}

const FUNNEL_LABELS: Record<string, string> = {
  tofu_problem: 'TOFU Problem',
  mofu_problem: 'MOFU Problem',
  tofu_solution: 'TOFU Solution',
  mofu_solution: 'MOFU Solution',
  bofu_conversion: 'BOFU Conversion',
}

const FUNNEL_BADGE_STYLES: Record<string, string> = {
  tofu_problem: 'bg-blue-100 text-blue-700',
  mofu_problem: 'bg-purple-100 text-purple-700',
  tofu_solution: 'bg-blue-100 text-blue-700',
  mofu_solution: 'bg-purple-100 text-purple-700',
  bofu_conversion: 'bg-green-100 text-green-700',
}

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  draft: { label: 'Borrador', style: 'bg-gray-100 text-gray-600' },
  review: { label: 'En Revision', style: 'bg-yellow-100 text-yellow-700' },
  needs_human_review: { label: 'Revision Humana', style: 'bg-orange-100 text-orange-700' },
  approved: { label: 'Aprobado', style: 'bg-green-100 text-green-700' },
  published: { label: 'Publicado', style: 'bg-primary-100 text-primary-700' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBestVersion(versions: PostVersion[]): PostVersion | null {
  if (!versions.length) return null
  let best: PostVersion | null = null
  let bestScore = -Infinity
  for (const v of versions) {
    const score = v.score_json?.total ?? -Infinity
    if (score > bestScore) {
      bestScore = score
      best = v
    }
  }
  return best ?? versions.find((v) => v.is_current) ?? versions[0]
}

function getFirstVisualWithImage(visuals: VisualVersion[]): VisualVersion | null {
  return visuals.find((v) => v.image_url) ?? null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PieceReviewCard({ post }: PieceReviewCardProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackError, setFeedbackError] = useState('')
  const [actionError, setActionError] = useState('')
  const [localStatus, setLocalStatus] = useState(post.status)
  const [localFeedback, setLocalFeedback] = useState(post.rejection_feedback ?? null)

  const dayLabel = DAY_LABELS[post.day_of_week] ?? `Dia ${post.day_of_week}`
  const funnelLabel = FUNNEL_LABELS[post.funnel_stage] ?? post.funnel_stage
  const funnelStyle = FUNNEL_BADGE_STYLES[post.funnel_stage] ?? 'bg-gray-100 text-gray-600'
  const statusInfo = STATUS_BADGE[localStatus] ?? { label: localStatus, style: 'bg-gray-100 text-gray-600' }

  const bestVersion = getBestVersion(post.versions)
  const copyPreview = bestVersion?.content?.slice(0, 150) ?? null
  const score = bestVersion?.score_json?.total ?? null
  const visual = getFirstVisualWithImage(post.visual_versions)

  const isApproved = localStatus === 'approved' || localStatus === 'published'

  async function handleApprove() {
    setActionError('')
    setIsApproving(true)
    try {
      const result = await approvePieceAction(post.id)
      if (result.error) {
        setActionError(result.error)
      } else {
        setLocalStatus('approved')
        setLocalFeedback(null)
        setShowRejectForm(false)
      }
    } finally {
      setIsApproving(false)
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedbackError('')
    if (!feedback.trim()) {
      setFeedbackError('El feedback es requerido para rechazar.')
      return
    }
    setIsRejecting(true)
    try {
      const fd = new FormData()
      fd.append('post_id', post.id)
      fd.append('feedback', feedback.trim())
      fd.append('type', 'copy')
      const result = await rejectPieceAction(fd)
      if (result.error) {
        setActionError(result.error)
      } else {
        setLocalStatus('needs_human_review')
        setLocalFeedback(feedback.trim())
        setShowRejectForm(false)
        setFeedback('')
      }
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <article
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-shadow hover:shadow-md"
      aria-label={`Post del ${dayLabel} — ${funnelLabel}`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{dayLabel}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${funnelStyle}`}>
            {funnelLabel}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.style}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Card body */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Visual + copy preview row */}
        <div className="flex gap-3">
          {visual?.image_url && (
            <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
              <img
                src={visual.image_url}
                alt="Visual del post"
                className="w-full h-full object-cover"
                width={64}
                height={64}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {copyPreview ? (
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                {copyPreview}{(bestVersion?.content?.length ?? 0) > 150 ? '...' : ''}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">Sin copy generado</p>
            )}
          </div>
        </div>

        {/* Score badge */}
        {score !== null && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full
                ${score >= 16 ? 'bg-green-100 text-green-700' :
                  score >= 10 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'}`}
            >
              Score: {score}/20
            </span>
            {bestVersion?.variant && (
              <span className="text-xs text-gray-500 capitalize">{bestVersion.variant.replace('_', ' ')}</span>
            )}
          </div>
        )}

        {/* Rejection feedback */}
        {localFeedback && localStatus === 'needs_human_review' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-orange-700 mb-1">Feedback de rechazo:</p>
            <p className="text-xs text-orange-800">{localFeedback}</p>
          </div>
        )}

        {/* Action error */}
        {actionError && (
          <p className="text-xs text-red-600" role="alert">{actionError}</p>
        )}

        {/* Reject form */}
        {showRejectForm && (
          <form onSubmit={handleRejectSubmit} className="space-y-2 mt-1">
            <label htmlFor={`feedback-${post.id}`} className="block text-xs font-medium text-gray-700">
              Motivo del rechazo
            </label>
            <textarea
              id={`feedback-${post.id}`}
              value={feedback}
              onChange={(e) => { setFeedback(e.target.value); setFeedbackError('') }}
              rows={3}
              placeholder="Explica que debe mejorar..."
              className={`w-full px-3 py-2 text-xs border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors
                ${feedbackError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              aria-describedby={feedbackError ? `feedback-error-${post.id}` : undefined}
            />
            {feedbackError && (
              <p id={`feedback-error-${post.id}`} className="text-xs text-red-600" role="alert">{feedbackError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isRejecting}
                className="flex-1 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {isRejecting ? 'Enviando...' : 'Enviar Rechazo'}
              </button>
              <button
                type="button"
                onClick={() => { setShowRejectForm(false); setFeedback(''); setFeedbackError('') }}
                className="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Card footer — action buttons */}
      {!showRejectForm && (
        <div className="px-4 pb-4 flex gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isApproving || isApproved}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
              ${isApproved
                ? 'bg-green-100 text-green-700 cursor-default focus:ring-green-400'
                : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed'}`}
            aria-pressed={isApproved}
          >
            {isApproving ? 'Aprobando...' : isApproved ? 'Aprobado' : 'Aprobar'}
          </button>
          <button
            type="button"
            onClick={() => setShowRejectForm(true)}
            disabled={isApproving}
            className="flex-1 py-2 text-xs font-semibold text-orange-700 border border-orange-300 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 disabled:opacity-60"
          >
            Rechazar
          </button>
        </div>
      )}
    </article>
  )
}
