'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { CAMPAIGN_STATUSES, WEEKLY_PLAN, POST_VARIANTS } from '@/shared/types/content-ops'
import type { Campaign, Post, CampaignStatus, FunnelStage, PostStatus, PostVariant, WeeklyBrief, PublishingPlan } from '@/shared/types/content-ops'
import type { PostWithVersions, PostVersionSummary } from '@/features/campaigns/services/campaign-service'
import { updatePostStatusAction } from '@/features/posts/actions/post-actions'
import { WeeklyBriefForm } from './WeeklyBriefForm'

// ---- Types ----

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

interface CampaignBuilderProps {
  campaign: CampaignWithTopic
  posts: PostWithVersions[]
  onStatusChange?: (status: string) => Promise<{ error?: string } | void>
  onBriefSave?: (brief: WeeklyBrief, plan?: PublishingPlan) => Promise<{ error?: string } | void>
}

// ---- Constants ----

const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Borrador',
  in_progress: 'En Progreso',
  ready: 'Lista',
  published: 'Publicada',
  archived: 'Archivada',
}

const CAMPAIGN_STATUS_OPTIONS = CAMPAIGN_STATUSES.map((s) => ({
  value: s,
  label: CAMPAIGN_STATUS_LABELS[s],
}))

const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Borrador',
  review: 'En Revision',
  needs_human_review: 'Revision Humana',
  approved: 'Aprobado',
  published: 'Publicado',
}

const POST_STATUS_STYLES: Record<PostStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  review: 'bg-warning-100 text-warning-700',
  needs_human_review: 'bg-orange-100 text-orange-700',
  approved: 'bg-success-100 text-success-700',
  published: 'bg-primary-100 text-primary-700',
}

const VARIANT_LABELS: Record<PostVariant, string> = {
  contrarian: 'Contrarian',
  story: 'Narrativa',
  data_driven: 'Dato de Shock',
}

/** Find the best-scored version and a copy preview from a post's versions. */
function getVersionSummary(versions: PostVersionSummary[]) {
  let bestVersion: PostVersionSummary | null = null
  let bestScore = -1

  for (const v of versions) {
    const total = v.score_json?.total ?? -1
    if (total > bestScore) {
      bestScore = total
      bestVersion = v
    }
  }

  const currentVersion = versions.find((v) => v.is_current)
  const previewVersion = bestVersion ?? currentVersion ?? versions[0]
  const previewText = previewVersion?.content?.slice(0, 120) ?? null

  return { bestVersion, bestScore: bestScore >= 0 ? bestScore : null, previewText }
}

// Funnel stage display metadata
const FUNNEL_STAGE_META: Record<
  FunnelStage,
  { label: string; short: string; bg: string; text: string; border: string; headerBg: string }
> = {
  tofu_problem: {
    label: 'TOFU Problema',
    short: 'TOFU',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    headerBg: 'bg-blue-100',
  },
  mofu_problem: {
    label: 'MOFU Problema',
    short: 'MOFU',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    headerBg: 'bg-purple-100',
  },
  tofu_solution: {
    label: 'TOFU Solucion',
    short: 'TOFU',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    headerBg: 'bg-blue-100',
  },
  mofu_solution: {
    label: 'MOFU Solucion',
    short: 'MOFU',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    headerBg: 'bg-purple-100',
  },
  bofu_conversion: {
    label: 'BOFU Conversion',
    short: 'BOFU',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    headerBg: 'bg-green-100',
  },
}

// ---- Utilities ----

function formatWeekStart(dateString: string): string {
  const date = new Date(dateString)
  const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return utcDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ---- Icons ----

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

// ---- Campaign status badge ----

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const styles: Record<CampaignStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-warning-100 text-warning-700',
    ready: 'bg-primary-100 text-primary-700',
    published: 'bg-success-100 text-success-700',
    archived: 'bg-gray-100 text-gray-500',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {CAMPAIGN_STATUS_LABELS[status]}
    </span>
  )
}

// ---- Day column card (post card or placeholder) ----

interface DayColumnProps {
  dayNumber: number
  dayLabel: string
  stage: FunnelStage
  post: PostWithVersions | undefined
  campaignId: string
  onPublishedToggle?: (postId: string, published: boolean) => Promise<void>
}

function DayColumn({ dayNumber, dayLabel, stage, post, campaignId, onPublishedToggle }: DayColumnProps) {
  const router = useRouter()
  const [isTogglingPublished, setIsTogglingPublished] = useState(false)
  const meta = FUNNEL_STAGE_META[stage]

  function handleEditPost() {
    router.push(`/campaigns/${campaignId}/posts/${dayNumber}`)
  }

  function handleEditVisual() {
    const { bestVersion } = getVersionSummary(post?.post_versions ?? [])
    const variantParam = bestVersion?.variant ? `?variant=${bestVersion.variant}` : ''
    router.push(`/campaigns/${campaignId}/visuals/${dayNumber}${variantParam}`)
  }

  async function handleTogglePublished() {
    if (!post || !onPublishedToggle) return
    setIsTogglingPublished(true)
    try {
      const newPublished = post.status !== 'published'
      await onPublishedToggle(post.id, newPublished)
    } finally {
      setIsTogglingPublished(false)
    }
  }

  return (
    <div
      className={`
        flex flex-col rounded-2xl border overflow-hidden
        transition-shadow duration-200 hover:shadow-md
        ${meta.border}
      `}
      role="article"
      aria-label={`${dayLabel} - ${meta.label}`}
    >
      {/* Column header */}
      <div className={`px-4 py-3 ${meta.headerBg}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">{dayLabel}</span>
          <span
            className={`
              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold
              ${meta.bg} ${meta.text}
            `}
          >
            {meta.short}
          </span>
        </div>
        <p className={`text-xs mt-0.5 font-medium ${meta.text}`}>{meta.label}</p>
      </div>

      {/* Card body */}
      <div className={`flex-1 flex flex-col p-4 gap-3 ${meta.bg}`}>
        {post ? (
          <>
            {/* Post status + score row */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${POST_STATUS_STYLES[post.status]}
                `}
              >
                {POST_STATUS_LABELS[post.status]}
              </span>
              {(() => {
                const { bestVersion, bestScore } = getVersionSummary(post.post_versions ?? [])
                if (bestScore === null) return null
                const scoreColor =
                  bestScore >= 16 ? 'bg-green-100 text-green-700' :
                  bestScore >= 10 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${scoreColor}`}>
                    {bestScore.toFixed(0)}/20
                  </span>
                )
              })()}
            </div>

            {/* Best variant badge */}
            {(() => {
              const { bestVersion } = getVersionSummary(post.post_versions ?? [])
              if (!bestVersion?.variant) return null
              return (
                <span className="self-start inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                  {VARIANT_LABELS[bestVersion.variant]}
                </span>
              )
            })()}

            {/* Copy preview */}
            {(() => {
              const { previewText } = getVersionSummary(post.post_versions ?? [])
              if (!previewText) return null
              return (
                <p className="text-xs text-foreground-secondary leading-relaxed line-clamp-3 flex-1">
                  {previewText}{previewText.length >= 120 ? '...' : ''}
                </p>
              )
            })()}

            {/* Published toggle */}
            {onPublishedToggle && (
              <button
                type="button"
                onClick={handleTogglePublished}
                disabled={isTogglingPublished}
                className={`self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  post.status === 'published'
                    ? 'bg-success-100 text-success-700 border-success-300'
                    : 'bg-gray-50 text-foreground-muted border-border hover:border-border-dark'
                } ${isTogglingPublished ? 'opacity-50' : ''}`}
                aria-label={post.status === 'published' ? 'Marcar como no publicado' : 'Marcar como publicado'}
              >
                <span className={`w-2 h-2 rounded-full ${post.status === 'published' ? 'bg-success-500' : 'bg-gray-300'}`} />
                {post.status === 'published' ? 'Publicado' : 'Publicar'}
              </button>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditPost}
                leftIcon={<EditIcon className="w-3.5 h-3.5" />}
                className="flex-1"
                aria-label={`Editar post del ${dayLabel}`}
              >
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditVisual}
                leftIcon={<ImageIcon className="w-3.5 h-3.5" />}
                className="flex-1"
                aria-label={`Editar visual del ${dayLabel}`}
              >
                Visual
              </Button>
            </div>
          </>
        ) : (
          /* Placeholder when no post exists */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.headerBg}`}>
              <FileIcon className={`w-5 h-5 ${meta.text}`} />
            </div>
            <div className="space-y-0.5">
              <p className={`text-xs font-medium ${meta.text}`}>{meta.label}</p>
              <p className="text-xs text-foreground-muted">Sin contenido aun</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditPost}
              className="w-full text-xs"
              aria-label={`Crear post del ${dayLabel}`}
            >
              Generar Post
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Main component ----

export function CampaignBuilder({ campaign, posts, onStatusChange, onBriefSave }: CampaignBuilderProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'semana' | 'brief'>('semana')
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')

  // Index posts by day_of_week for O(1) lookup
  const postsByDay = posts.reduce<Record<number, PostWithVersions>>((acc, post) => {
    acc[post.day_of_week] = post
    return acc
  }, {})

  // Determine which days to show (only days with posts)
  const activeDays = Object.entries(WEEKLY_PLAN)
    .filter(([dayNum]) => postsByDay[Number(dayNum)] !== undefined)

  // Grid columns class based on post count
  const gridColsClass =
    activeDays.length <= 3 ? 'md:grid-cols-3' :
    activeDays.length <= 5 ? 'md:grid-cols-5' :
    'md:grid-cols-7'

  async function handlePublishedToggle(postId: string, published: boolean) {
    const result = await updatePostStatusAction(postId, published ? 'published' : 'approved')
    if ('error' in result) {
      setStatusError(result.error)
    } else {
      router.refresh()
    }
  }

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    if (!onStatusChange || newStatus === campaign.status) return
    setStatusError('')
    setIsChangingStatus(true)
    try {
      const result = await onStatusChange(newStatus)
      if (result?.error) setStatusError(result.error)
    } finally {
      setIsChangingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Campaign header */}
      <div className="bg-surface border border-border rounded-2xl shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Left: campaign meta */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Week */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-foreground-muted shrink-0" />
              <h1 className="text-xl font-bold text-foreground">
                Semana del {formatWeekStart(campaign.week_start)}
              </h1>
            </div>

            {/* Topic + keyword row */}
            <div className="flex flex-wrap items-center gap-3">
              {campaign.topic_title && (
                <span className="text-sm text-foreground-secondary">
                  Tema:{' '}
                  {campaign.topic_id ? (
                    <Link
                      href={`/topics/${campaign.topic_id}`}
                      className="font-medium text-foreground hover:text-accent-600 transition-colors underline decoration-dotted underline-offset-2"
                    >
                      {campaign.topic_title}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{campaign.topic_title}</span>
                  )}
                </span>
              )}
              {!campaign.topic_title && (
                <span className="text-sm text-foreground-muted italic">Sin tema asociado</span>
              )}
              {campaign.keyword && (
                <div className="flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-accent-500" />
                  <span className="text-sm font-medium text-accent-600 bg-accent-50 border border-accent-200 px-2.5 py-0.5 rounded-full">
                    {campaign.keyword}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: status */}
          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
            <CampaignStatusBadge status={campaign.status} />
            {onStatusChange && (
              <div className="flex flex-col items-end gap-1">
                <Select
                  options={CAMPAIGN_STATUS_OPTIONS}
                  value={campaign.status}
                  onChange={handleStatusChange}
                  disabled={isChangingStatus}
                  aria-label="Cambiar estado de la campana"
                  className="text-xs py-1.5 min-w-[150px]"
                />
                {statusError && (
                  <p className="text-xs text-error-500" role="alert">
                    {statusError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Posts summary strip */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-foreground-muted">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{posts.length}</span>
            <span>posts</span>
            <span className="ml-1">&middot;</span>
            <span>{activeDays.map(([, { label }]) => label).join(', ')}</span>
            <span className="ml-1">&middot;</span>
            <span className="font-medium text-success-600">{posts.filter((p) => p.status === 'published').length} publicados</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/campaigns/${campaign.id}/conversion`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent-600 bg-accent-50 border border-accent-200 hover:bg-accent-100 transition-colors"
            >
              <TagIcon className="w-3 h-3" />
              Conversion
            </Link>
            <Link
              href={`/campaigns/${campaign.id}/metrics`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-secondary-600 bg-secondary-50 border border-secondary-200 hover:bg-secondary-100 transition-colors"
            >
              <ChartIcon className="w-3 h-3" />
              Metricas
            </Link>
            <Link
              href={`/campaigns/${campaign.id}/export`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100 transition-colors"
            >
              <DownloadIcon className="w-3 h-3" />
              Export
            </Link>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div role="tablist" aria-label="Secciones de la campana" className="flex border-b border-border bg-surface rounded-t-xl">
        <button
          role="tab"
          aria-selected={activeTab === 'semana'}
          aria-controls="panel-semana"
          id="tab-semana"
          onClick={() => setActiveTab('semana')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${
            activeTab === 'semana'
              ? 'border-primary-500 text-primary-600 bg-primary-50'
              : 'border-transparent text-foreground-muted hover:text-foreground hover:bg-gray-50'
          }`}
        >
          Semana
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'brief'}
          aria-controls="panel-brief"
          id="tab-brief"
          onClick={() => setActiveTab('brief')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${
            activeTab === 'brief'
              ? 'border-primary-500 text-primary-600 bg-primary-50'
              : 'border-transparent text-foreground-muted hover:text-foreground hover:bg-gray-50'
          }`}
        >
          Brief
        </button>
      </div>

      {activeTab === 'semana' && (
        <>
          {/* Builder grid */}
          <section aria-label="Posts de la semana" id="panel-semana" role="tabpanel" aria-labelledby="tab-semana">
            <h2 className="sr-only">Plan semanal de posts</h2>
            {/* Desktop: dynamic column grid */}
            <div className={`hidden md:grid ${gridColsClass} gap-4`}>
              {activeDays.map(([dayNum, { label, stage }]) => (
                <DayColumn
                  key={dayNum}
                  dayNumber={Number(dayNum)}
                  dayLabel={label}
                  stage={stage}
                  post={postsByDay[Number(dayNum)]}
                  campaignId={campaign.id}
                  onPublishedToggle={handlePublishedToggle}
                />
              ))}
            </div>

            {/* Mobile: vertical stack */}
            <div className="flex flex-col gap-4 md:hidden">
              {activeDays.map(([dayNum, { label, stage }]) => (
                <DayColumn
                  key={dayNum}
                  dayNumber={Number(dayNum)}
                  dayLabel={label}
                  stage={stage}
                  post={postsByDay[Number(dayNum)]}
                  campaignId={campaign.id}
                  onPublishedToggle={handlePublishedToggle}
                />
              ))}
            </div>
          </section>

          {/* Funnel legend */}
          <div
            className="flex flex-wrap items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl text-xs"
            aria-label="Leyenda de etapas del funnel"
          >
            <span className="font-medium text-foreground-secondary uppercase tracking-wide">
              Funnel:
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" aria-hidden="true" />
              <span className="text-foreground-secondary">TOFU &mdash; Conciencia</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" aria-hidden="true" />
              <span className="text-foreground-secondary">MOFU &mdash; Consideracion</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" aria-hidden="true" />
              <span className="text-foreground-secondary">BOFU &mdash; Conversion</span>
            </span>
          </div>
        </>
      )}

      {activeTab === 'brief' && (
        <div id="panel-brief" role="tabpanel" aria-labelledby="tab-brief" className="bg-surface border border-border rounded-2xl shadow-card p-6">
          <WeeklyBriefForm
            brief={campaign.weekly_brief ?? null}
            publishingPlan={campaign.publishing_plan ?? null}
            topicData={campaign.topicData}
            keyword={campaign.keyword ?? undefined}
            onSave={onBriefSave ?? (async () => {})}
          />
        </div>
      )}
    </div>
  )
}
