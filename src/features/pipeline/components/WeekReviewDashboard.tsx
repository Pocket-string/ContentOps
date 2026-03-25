'use client'

import { useState } from 'react'
import { approveAllAction } from '@/features/pipeline/actions/pipeline-actions'
import { PieceReviewCard } from './PieceReviewCard'

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

interface WeekReviewDashboardProps {
  campaignId: string
  posts: Post[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeekReviewDashboard({ campaignId, posts }: WeekReviewDashboardProps) {
  const [isApprovingAll, setIsApprovingAll] = useState(false)
  const [approveAllError, setApproveAllError] = useState('')
  const [approveAllDone, setApproveAllDone] = useState(false)

  const sortedPosts = [...posts].sort((a, b) => a.day_of_week - b.day_of_week)

  const approvedCount = posts.filter(
    (p) => p.status === 'approved' || p.status === 'published',
  ).length

  const withVisualCount = posts.filter((p) => p.visual_versions.some((v) => v.image_url)).length

  async function handleApproveAll() {
    setApproveAllError('')
    setIsApprovingAll(true)
    try {
      const result = await approveAllAction(campaignId)
      if (result.error) {
        setApproveAllError(result.error)
      } else {
        setApproveAllDone(true)
        // Soft-refresh: reload the page to reflect updated statuses
        window.location.reload()
      }
    } finally {
      setIsApprovingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Dashboard header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Revision Semanal</h2>
          <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
            <span>
              <span className="font-semibold text-green-700">{approvedCount}</span>
              <span>/{posts.length} aprobados</span>
            </span>
            <span aria-hidden="true" className="text-gray-300">|</span>
            <span>
              <span className="font-semibold text-primary-700">{withVisualCount}</span>
              <span>/{posts.length} con visual</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1.5">
          <button
            type="button"
            onClick={handleApproveAll}
            disabled={isApprovingAll || approveAllDone}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Aprobar todos los posts de la semana"
          >
            {isApprovingAll ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Aprobando...
              </>
            ) : approveAllDone ? (
              'Todo Aprobado'
            ) : (
              'Aprobar Todo'
            )}
          </button>
          {approveAllError && (
            <p className="text-xs text-red-600" role="alert">{approveAllError}</p>
          )}
        </div>
      </div>

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm">No hay posts generados para esta semana todavia.</p>
        </div>
      )}

      {/* Posts grid */}
      {posts.length > 0 && (
        <section aria-label="Posts de la semana para revision">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {sortedPosts.map((post) => (
              <PieceReviewCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Approve all confirmation notice */}
      {approveAllDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center" role="status">
          <p className="text-sm font-semibold text-green-800">
            Todos los posts fueron aprobados. La semana esta lista para publicar.
          </p>
        </div>
      )}
    </div>
  )
}
