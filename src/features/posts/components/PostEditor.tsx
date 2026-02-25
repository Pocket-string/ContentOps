'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RecipeValidator, runChecks } from './RecipeValidator'
import { QAScoreCard } from '@/features/qa/components/QAScoreCard'
import { CopyPromptButton } from '@/shared/components/copy-prompt-button'
import { buildCopyPrompt } from '@/features/prompts/templates/copy-template'
import { parseCopyVariants } from '@/features/import/parsers/copy-parser'
import { CriticPanel } from './CriticPanel'
import type {
  Post,
  PostVersion,
  PostVariant,
  PostStatus,
  FunnelStage,
  ScoreJson,
  WeeklyBrief,
} from '@/shared/types/content-ops'
import { POST_VARIANTS, POST_STATUSES, WEEKLY_PLAN } from '@/shared/types/content-ops'
import { AIReviewBadge } from '@/shared/components/ai-review-badge'
import type { CopyReview } from '@/shared/types/ai-review'

// ============================================
// Types
// ============================================

interface PostEditorProps {
  post: Post & { versions: PostVersion[] }
  campaignId: string
  topicTitle?: string
  keyword?: string
  weeklyBrief?: WeeklyBrief
  topicContext?: string
  onSaveVersion: (formData: FormData) => Promise<{ success?: true; error?: string }>
  onSetCurrent: (versionId: string) => Promise<{ success?: true; error?: string }>
  onScore: (versionId: string, score: unknown) => Promise<{ success?: true; error?: string }>
  onStatusChange: (postId: string, status: string) => Promise<{ success?: true; error?: string }>
  onObjectiveChange: (postId: string, objective: string) => Promise<{ success?: true; error?: string }>
}

interface ScoreState {
  detener: number
  ganar: number
  provocar: number
  iniciar: number
}

interface IterationResult {
  content: string
  changes_made: string[]
}

// ============================================
// Display constants
// ============================================

const FUNNEL_META: Record<FunnelStage, { label: string; short: string; color: string }> = {
  tofu_problem: { label: 'TOFU Problema', short: 'TOFU', color: 'bg-blue-100 text-blue-700' },
  mofu_problem: { label: 'MOFU Problema', short: 'MOFU', color: 'bg-purple-100 text-purple-700' },
  tofu_solution: { label: 'TOFU Solucion', short: 'TOFU', color: 'bg-blue-100 text-blue-700' },
  mofu_solution: { label: 'MOFU Solucion', short: 'MOFU', color: 'bg-purple-100 text-purple-700' },
  bofu_conversion: { label: 'BOFU Conversion', short: 'BOFU', color: 'bg-green-100 text-green-700' },
}

const VARIANT_LABELS: Record<PostVariant, string> = {
  contrarian: 'Contrarian',
  story: 'Narrativa',
  data_driven: 'Dato de Shock',
}

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Borrador',
  review: 'En Revision',
  needs_human_review: 'Revision Humana',
  approved: 'Aprobado',
  published: 'Publicado',
}

const STATUS_OPTIONS = POST_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))

const MAX_CHARS = 3000

// ============================================
// Inline SVG Icons
// ============================================

function ArrowLeftIcon({ className }: { className?: string }) {
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
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
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
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z" />
      <path d="M5 15l.75 2.25L8 18l-2.25.75L5 21l-.75-2.25L2 18l2.25-.75z" />
    </svg>
  )
}

function SaveIcon({ className }: { className?: string }) {
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
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// ============================================
// Utilities
// ============================================

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getVariantVersions(versions: PostVersion[], variant: PostVariant): PostVersion[] {
  return versions.filter((v) => v.variant === variant)
}

function getCurrentVersionForVariant(
  versions: PostVersion[],
  variant: PostVariant
): PostVersion | null {
  const variantVersions = getVariantVersions(versions, variant)
  // Prefer is_current, then most recent (highest version number)
  const current = variantVersions.find((v) => v.is_current)
  if (current) return current
  if (variantVersions.length > 0) {
    return variantVersions.reduce((a, b) => (a.version > b.version ? a : b))
  }
  return null
}

// ============================================
// Sub-components
// ============================================

// --- Variant badge ---
function VariantBadge({ variant }: { variant: PostVariant }) {
  const styles: Record<PostVariant, string> = {
    contrarian: 'bg-orange-100 text-orange-700',
    story: 'bg-indigo-100 text-indigo-700',
    data_driven: 'bg-teal-100 text-teal-700',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}
    >
      {VARIANT_LABELS[variant]}
    </span>
  )
}

// --- Score badge ---
function ScoreBadge({ score }: { score: ScoreJson | null }) {
  if (!score) return null
  const color =
    score.total >= 16
      ? 'bg-green-100 text-green-700'
      : score.total >= 10
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      <StarIcon className="w-3 h-3" filled />
      {score.total}/20
    </span>
  )
}

// --- Rubric slider row ---
interface SliderRowProps {
  id: string
  label: string
  description: string
  value: number
  onChange: (value: number) => void
}

function SliderRow({ id, label, description, value, onChange }: SliderRowProps) {
  const trackColor =
    value >= 4
      ? 'accent-green-500'
      : value >= 2
        ? 'accent-yellow-500'
        : 'accent-red-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          <span className="font-bold">{label}</span>{' '}
          <span className="text-foreground-muted font-normal">— {description}</span>
        </label>
        <span
          className={`text-sm font-bold tabular-nums w-8 text-right ${
            value >= 4 ? 'text-green-600' : value >= 2 ? 'text-yellow-600' : 'text-red-500'
          }`}
          aria-live="polite"
        >
          {value}/5
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 ${trackColor}`}
        aria-label={`${label}: ${value} de 5`}
      />
      <div className="flex justify-between text-xs text-foreground-muted">
        <span>0</span>
        <span>5</span>
      </div>
    </div>
  )
}

// ============================================
// Main PostEditor component
// ============================================

export function PostEditor({
  post,
  campaignId,
  topicTitle,
  keyword,
  weeklyBrief,
  topicContext,
  onSaveVersion,
  onSetCurrent,
  onScore,
  onStatusChange,
  onObjectiveChange,
}: PostEditorProps) {
  // --- Core state ---
  const [activeVariant, setActiveVariant] = useState<PostVariant>('contrarian')
  const [editContent, setEditContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isIterating, setIsIterating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [iterationResult, setIterationResult] = useState<IterationResult | null>(null)
  const [score, setScore] = useState<ScoreState>({ detener: 0, ganar: 0, provocar: 0, iniciar: 0 })
  const [scoreNotes, setScoreNotes] = useState('')
  const [isSavingScore, setIsSavingScore] = useState(false)
  const [error, setError] = useState('')
  const [importText, setImportText] = useState('')
  const [importPreview, setImportPreview] = useState<ReturnType<typeof parseCopyVariants> | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [copyReview, setCopyReview] = useState<CopyReview | null>(null)

  // --- Objective state ---
  const [objective, setObjective] = useState(post.objective ?? '')
  const [isSavingObjective, setIsSavingObjective] = useState(false)

  // --- Status state ---
  const [postStatus, setPostStatus] = useState<PostStatus>(post.status)
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  // --- Derived ---
  const dayMeta = WEEKLY_PLAN[post.day_of_week]
  const funnelMeta = FUNNEL_META[post.funnel_stage]
  const charCount = editContent.length
  const isOverLimit = charCount > MAX_CHARS

  // Load version content when active variant changes
  useEffect(() => {
    const version = getCurrentVersionForVariant(post.versions, activeVariant)
    if (version) {
      setEditContent(version.content)
      if (version.score_json) {
        setScore({
          detener: version.score_json.detener,
          ganar: version.score_json.ganar,
          provocar: version.score_json.provocar,
          iniciar: version.score_json.iniciar,
        })
        setScoreNotes(version.score_json.notes ?? '')
      } else {
        setScore({ detener: 0, ganar: 0, provocar: 0, iniciar: 0 })
        setScoreNotes('')
      }
    } else {
      setEditContent('')
      setScore({ detener: 0, ganar: 0, provocar: 0, iniciar: 0 })
      setScoreNotes('')
    }
    setIterationResult(null)
    setFeedback('')
    setError('')
    setSuccessMsg('')
  }, [activeVariant, post.versions])

  // --- Handlers ---

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleSaveVersion = useCallback(async () => {
    if (!editContent.trim()) return
    setIsSaving(true)
    setError('')
    try {
      const formData = new FormData()
      formData.set('post_id', post.id)
      formData.set('variant', activeVariant)
      formData.set('content', editContent)
      const result = await onSaveVersion(formData)
      if (result.error) {
        setError(result.error)
      } else {
        showSuccess('Version guardada correctamente')
      }
    } finally {
      setIsSaving(false)
    }
  }, [editContent, activeVariant, post.id, onSaveVersion])

  const handleSetCurrent = useCallback(
    async (versionId: string) => {
      setError('')
      const result = await onSetCurrent(versionId)
      if (result.error) {
        setError(result.error)
      } else {
        showSuccess('Version activada')
      }
    },
    [onSetCurrent]
  )

  const handleSaveScore = useCallback(async () => {
    const currentVersion = getCurrentVersionForVariant(post.versions, activeVariant)
    if (!currentVersion) return
    setIsSavingScore(true)
    setError('')
    try {
      const total = score.detener + score.ganar + score.provocar + score.iniciar
      const scorePayload: ScoreJson = {
        ...score,
        total,
        notes: scoreNotes || undefined,
      }
      const result = await onScore(currentVersion.id, scorePayload)
      if (result.error) {
        setError(result.error)
      } else {
        showSuccess('Score guardado')
      }
    } finally {
      setIsSavingScore(false)
    }
  }, [score, scoreNotes, activeVariant, post.versions, onScore])

  const handleStatusChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value
      if (newStatus === postStatus) return
      setIsChangingStatus(true)
      setError('')
      try {
        const result = await onStatusChange(post.id, newStatus)
        if (result.error) {
          setError(result.error)
        } else {
          setPostStatus(newStatus as PostStatus)
          showSuccess('Estado actualizado')
        }
      } finally {
        setIsChangingStatus(false)
      }
    },
    [postStatus, post.id, onStatusChange]
  )

  const handleObjectiveBlur = useCallback(async () => {
    if (objective === (post.objective ?? '')) return
    setIsSavingObjective(true)
    try {
      const result = await onObjectiveChange(post.id, objective)
      if (result.error) setError(result.error)
    } finally {
      setIsSavingObjective(false)
    }
  }, [objective, post.objective, post.id, onObjectiveChange])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError('')
    try {
      const response = await fetch('/api/ai/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicTitle ?? 'O&M fotovoltaico',
          keyword: keyword,
          funnel_stage: post.funnel_stage,
          objective: objective || undefined,
          context: topicContext || undefined,
          weekly_brief: weeklyBrief,
        }),
      })
      const json: unknown = await response.json()
      if (!response.ok) {
        const errJson = json as { error?: string }
        setError(errJson.error ?? 'Error al generar el contenido')
        return
      }
      const successJson = json as { data: { variants: Array<{ variant: PostVariant; content: string; structured_content?: Record<string, unknown> }> }; review?: CopyReview }
      const variants = successJson.data?.variants ?? []
      setCopyReview(successJson.review ?? null)
      // Save all 3 variants
      for (const v of variants) {
        const formData = new FormData()
        formData.set('post_id', post.id)
        formData.set('variant', v.variant)
        formData.set('content', v.content)
        if (v.structured_content) {
          formData.set('structured_content', JSON.stringify(v.structured_content))
        }
        await onSaveVersion(formData)
      }
      // Switch to contrarian tab
      setActiveVariant('contrarian')
      showSuccess('Contenido generado con IA')
    } catch {
      setError('Error de red al generar el contenido')
    } finally {
      setIsGenerating(false)
    }
  }, [topicTitle, keyword, weeklyBrief, topicContext, post.funnel_stage, post.id, objective, onSaveVersion])

  const handleIterate = useCallback(async () => {
    if (!editContent.trim() || !feedback.trim()) return
    setIsIterating(true)
    setError('')
    try {
      const total = score.detener + score.ganar + score.provocar + score.iniciar
      const response = await fetch('/api/ai/iterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_content: editContent,
          feedback,
          variant: activeVariant,
          score: total > 0 ? score : undefined,
        }),
      })
      const json: unknown = await response.json()
      if (!response.ok) {
        const errJson = json as { error?: string }
        setError(errJson.error ?? 'Error al iterar el contenido')
        return
      }
      const successJson = json as { data: { content: string; changes_made: string[] } }
      setIterationResult({
        content: successJson.data.content,
        changes_made: successJson.data.changes_made,
      })
    } catch {
      setError('Error de red al iterar el contenido')
    } finally {
      setIsIterating(false)
    }
  }, [editContent, feedback, activeVariant, score])

  const handleUseIterationResult = useCallback(async () => {
    if (!iterationResult) return
    const formData = new FormData()
    formData.set('post_id', post.id)
    formData.set('variant', activeVariant)
    formData.set('content', iterationResult.content)
    setIsSaving(true)
    setError('')
    try {
      const result = await onSaveVersion(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setEditContent(iterationResult.content)
        setIterationResult(null)
        setFeedback('')
        showSuccess('Version guardada')
      }
    } finally {
      setIsSaving(false)
    }
  }, [iterationResult, activeVariant, post.id, onSaveVersion])

  // ============================================
  // Render
  // ============================================

  const currentVariantVersion = getCurrentVersionForVariant(post.versions, activeVariant)
  const totalScore = score.detener + score.ganar + score.provocar + score.iniciar

  return (
    <div className="min-h-screen bg-background">
      {/* Global messages */}
      {error && (
        <div
          role="alert"
          className="fixed top-4 right-4 z-50 max-w-sm bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl shadow-lg flex items-start gap-2"
        >
          <XIcon className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto shrink-0 hover:text-red-900"
            aria-label="Cerrar error"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-50 max-w-sm bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
        >
          <CheckIcon className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ==================== LEFT COLUMN ==================== */}
          <div className="w-full lg:w-2/3 space-y-5">

            {/* 1. Header */}
            <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-foreground-muted">
                  <Link href="/campaigns" className="hover:text-foreground transition-colors">Campanas</Link>
                  <span aria-hidden="true">/</span>
                  <Link href={`/campaigns/${campaignId}`} className="hover:text-foreground transition-colors">
                    {topicTitle || 'Campana'}
                  </Link>
                  <span aria-hidden="true">/</span>
                  <span className="text-foreground font-medium">
                    Post {dayMeta?.label ?? ''}
                  </span>
                </nav>

                <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                  {dayMeta && (
                    <span className="text-sm font-semibold text-foreground">
                      {dayMeta.label}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${funnelMeta.color}`}
                  >
                    {funnelMeta.short} &mdash; {funnelMeta.label}
                  </span>
                  {keyword && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-50 text-accent-600 border border-accent-200">
                      #{keyword}
                    </span>
                  )}
                </div>
              </div>

              {topicTitle && (
                <p className="mt-2 text-sm text-foreground-secondary">
                  Tema:{' '}
                  <span className="font-medium text-foreground">{topicTitle}</span>
                </p>
              )}
            </div>

            {/* 2. Objective field */}
            <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <label
                  htmlFor="post-objective"
                  className="text-sm font-semibold text-foreground"
                >
                  Objetivo del post
                </label>
                {isSavingObjective && (
                  <span className="text-xs text-foreground-muted flex items-center gap-1">
                    <ClockIcon className="w-3 h-3 animate-spin" />
                    Guardando...
                  </span>
                )}
              </div>
              <Input
                id="post-objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                onBlur={handleObjectiveBlur}
                placeholder="Ej: Generar debate sobre eficiencia de paneles bifaciales"
                aria-describedby="objective-hint"
              />
              <p id="objective-hint" className="mt-1.5 text-xs text-foreground-muted">
                Se guarda automaticamente al salir del campo
              </p>
            </div>

            {/* 3. Variant Tabs + 4. Copy Editor */}
            <div className="bg-surface border border-border rounded-2xl shadow-card overflow-hidden">
              {/* Tabs */}
              <div
                role="tablist"
                aria-label="Variantes del post"
                className="flex border-b border-border"
              >
                {POST_VARIANTS.map((variant) => {
                  const hasVersion =
                    getVariantVersions(post.versions, variant).length > 0
                  const isActive = activeVariant === variant
                  return (
                    <button
                      key={variant}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`tabpanel-${variant}`}
                      id={`tab-${variant}`}
                      onClick={() => setActiveVariant(variant)}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium
                        border-b-2 transition-all duration-150
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset
                        ${
                          isActive
                            ? 'border-primary-500 text-primary-600 bg-primary-50'
                            : 'border-transparent text-foreground-muted hover:text-foreground hover:bg-gray-50'
                        }
                      `}
                    >
                      {VARIANT_LABELS[variant]}
                      {hasVersion && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary-500' : 'bg-gray-400'}`}
                          aria-hidden="true"
                          title="Tiene contenido"
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Tab panel */}
              <div
                role="tabpanel"
                id={`tabpanel-${activeVariant}`}
                aria-labelledby={`tab-${activeVariant}`}
                className="p-5 space-y-4"
              >
                {/* No version state */}
                {!currentVariantVersion && editContent === '' && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <SparklesIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Sin contenido para {VARIANT_LABELS[activeVariant]}
                      </p>
                      <p className="text-xs text-foreground-muted mt-1">
                        Genera con IA o escribe directamente en el editor
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerate}
                        isLoading={isGenerating}
                        leftIcon={<SparklesIcon className="w-4 h-4" />}
                        aria-label={`Generar contenido para ${VARIANT_LABELS[activeVariant]}`}
                      >
                        Generar con AI
                      </Button>
                      <CopyPromptButton
                        getPrompt={() => buildCopyPrompt({
                          topic: topicTitle ?? '',
                          keyword,
                          funnelStage: post.funnel_stage,
                          objective: post.objective ?? undefined,
                          additionalContext: topicContext,
                        })}
                        label="Copiar Prompt"
                      />
                    </div>
                  </div>
                )}

                {/* Textarea editor */}
                <div>
                  <label htmlFor="copy-editor" className="sr-only">
                    Contenido del post — variante {VARIANT_LABELS[activeVariant]}
                  </label>
                  <textarea
                    id="copy-editor"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={12}
                    placeholder={`Escribe el copy para la variante "${VARIANT_LABELS[activeVariant]}"...`}
                    className={`
                      w-full px-4 py-3
                      bg-background text-foreground
                      border rounded-xl
                      placeholder:text-foreground-muted
                      text-sm leading-relaxed
                      resize-y
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
                      ${isOverLimit ? 'border-red-400' : 'border-border hover:border-border-dark'}
                    `}
                    aria-describedby="char-counter"
                  />

                  {/* Character counter */}
                  <div className="flex items-center justify-end mt-1.5">
                    <span
                      id="char-counter"
                      className={`text-xs font-medium tabular-nums ${
                        isOverLimit ? 'text-red-500' : 'text-foreground-muted'
                      }`}
                      aria-live="polite"
                      aria-label={`${charCount} de ${MAX_CHARS} caracteres`}
                    >
                      {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 5. Action buttons */}
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveVersion}
                    isLoading={isSaving}
                    disabled={!editContent.trim() || isOverLimit}
                    leftIcon={<SaveIcon className="w-4 h-4" />}
                  >
                    Guardar Version
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    isLoading={isGenerating}
                    leftIcon={<SparklesIcon className="w-4 h-4" />}
                  >
                    Generar con AI
                  </Button>
                  <CopyPromptButton
                    getPrompt={() => buildCopyPrompt({
                      topic: topicTitle ?? '',
                      keyword,
                      funnelStage: post.funnel_stage,
                      objective: post.objective ?? undefined,
                      additionalContext: topicContext,
                    })}
                    label="Copiar Prompt"
                  />
                </div>

                {/* AI Review badge */}
                {copyReview && (
                  <AIReviewBadge
                    score={copyReview.overall_score}
                    recommendation={copyReview.recommendation}
                    summary={copyReview.one_line_summary}
                  />
                )}

                {/* Import from ChatGPT */}
                <details className="border-t border-border pt-3">
                  <summary className="text-xs text-foreground-muted cursor-pointer hover:text-foreground">
                    Importar desde ChatGPT
                  </summary>
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={importText}
                      onChange={(e) => { setImportText(e.target.value); setImportPreview(null) }}
                      rows={5}
                      placeholder="Pega aqui las variantes generadas en ChatGPT..."
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-500 resize-y"
                    />
                    <button
                      type="button"
                      onClick={() => setImportPreview(parseCopyVariants(importText))}
                      disabled={!importText.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-surface text-foreground hover:bg-gray-50 disabled:opacity-50"
                    >
                      Analizar texto
                    </button>
                    {importPreview && (
                      <div className="space-y-2">
                        {importPreview.errors.map((err, i) => (
                          <p key={i} className="text-xs text-red-500">{err}</p>
                        ))}
                        {importPreview.variants.map((v, i) => (
                          <div key={i} className="rounded-lg border border-border p-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground">{v.variant}</span>
                              <button
                                type="button"
                                onClick={() => { setEditContent(v.content); setImportText(''); setImportPreview(null) }}
                                className="text-xs text-accent-600 hover:underline"
                              >
                                Usar esta version
                              </button>
                            </div>
                            <p className="text-xs text-foreground-muted line-clamp-2">{v.hook}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>

                {/* 6. AI Iteration panel */}
                <div className="border-t border-border pt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Iterar con IA</h3>
                  <div>
                    <label htmlFor="iteration-feedback" className="sr-only">
                      Feedback para la iteracion
                    </label>
                    <textarea
                      id="iteration-feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      placeholder="Describe que mejorar: ej. 'El hook no es suficientemente provocador', 'Acorta los parrafos'..."
                      className="
                        w-full px-4 py-3
                        bg-background text-foreground
                        border border-border hover:border-border-dark
                        rounded-xl placeholder:text-foreground-muted
                        text-sm leading-relaxed resize-y
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
                      "
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleIterate}
                    isLoading={isIterating}
                    disabled={!editContent.trim() || !feedback.trim()}
                    leftIcon={<SparklesIcon className="w-4 h-4" />}
                  >
                    Iterar con AI
                  </Button>

                  {/* Iteration preview */}
                  {iterationResult && (
                    <div
                      className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3"
                      role="region"
                      aria-label="Resultado de iteracion"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                          Vista previa — version iterada
                        </p>
                        <button
                          onClick={() => setIterationResult(null)}
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                          aria-label="Descartar iteracion"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {iterationResult.changes_made.length > 0 && (
                        <ul className="flex flex-wrap gap-1.5">
                          {iterationResult.changes_made.map((change, i) => (
                            <li
                              key={i}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                            >
                              {change}
                            </li>
                          ))}
                        </ul>
                      )}

                      <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans bg-white border border-blue-100 rounded-lg p-3 max-h-64 overflow-y-auto">
                        {iterationResult.content}
                      </pre>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleUseIterationResult}
                        isLoading={isSaving}
                        leftIcon={<SaveIcon className="w-4 h-4" />}
                      >
                        Usar esta version
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ==================== RIGHT COLUMN ==================== */}
          <div className="w-full lg:w-1/3 space-y-5 lg:sticky lg:top-6">

            {/* 1. Post Status */}
            <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Estado del post</h2>
              <Select
                label="Estado"
                options={STATUS_OPTIONS}
                value={postStatus}
                onChange={handleStatusChange}
                disabled={isChangingStatus}
                aria-label="Estado del post"
              />
            </div>

            {/* 2. D/G/P/I Rubric */}
            <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Rubrica D/G/P/I</h2>
                <span
                  className={`text-sm font-bold tabular-nums px-2.5 py-0.5 rounded-full ${
                    totalScore >= 16
                      ? 'bg-green-100 text-green-700'
                      : totalScore >= 10
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                  aria-live="polite"
                  aria-label={`Puntuacion total: ${totalScore} de 20`}
                >
                  {totalScore} / 20
                </span>
              </div>

              <div className="space-y-5">
                <SliderRow
                  id="score-detener"
                  label="D — Detener"
                  description="Detiene el scroll?"
                  value={score.detener}
                  onChange={(v) => setScore((prev) => ({ ...prev, detener: v }))}
                />
                <SliderRow
                  id="score-ganar"
                  label="G — Ganar"
                  description="Gana la atencion?"
                  value={score.ganar}
                  onChange={(v) => setScore((prev) => ({ ...prev, ganar: v }))}
                />
                <SliderRow
                  id="score-provocar"
                  label="P — Provocar"
                  description="Provoca reaccion?"
                  value={score.provocar}
                  onChange={(v) => setScore((prev) => ({ ...prev, provocar: v }))}
                />
                <SliderRow
                  id="score-iniciar"
                  label="I — Iniciar"
                  description="Inicia conversacion?"
                  value={score.iniciar}
                  onChange={(v) => setScore((prev) => ({ ...prev, iniciar: v }))}
                />
              </div>

              <div className="mt-4">
                <label htmlFor="score-notes" className="block text-sm font-medium text-foreground mb-1.5">
                  Notas del score
                </label>
                <textarea
                  id="score-notes"
                  value={scoreNotes}
                  onChange={(e) => setScoreNotes(e.target.value)}
                  rows={3}
                  placeholder="Observaciones sobre el scoring..."
                  className="
                    w-full px-3 py-2.5
                    bg-background text-foreground
                    border border-border hover:border-border-dark
                    rounded-xl placeholder:text-foreground-muted
                    text-sm leading-relaxed resize-none
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
                  "
                />
              </div>

              <div className="mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveScore}
                  isLoading={isSavingScore}
                  disabled={!currentVariantVersion}
                  leftIcon={<StarIcon className="w-4 h-4" />}
                  className="w-full"
                >
                  Guardar Score
                </Button>
                {!currentVariantVersion && (
                  <p className="text-xs text-foreground-muted mt-1.5 text-center">
                    Guarda una version primero para puntuar
                  </p>
                )}
              </div>
            </div>

            {/* QA Score Card */}
            {editContent.trim() && (
              <QAScoreCard checks={runChecks(editContent, keyword)} label="Copy QA" />
            )}

            {/* Recipe Validator */}
            <RecipeValidator content={editContent} keyword={keyword} />

            {/* CopyCritic AI */}
            <CriticPanel
              versions={post.versions}
              funnelStage={post.funnel_stage}
              keyword={keyword}
              topic={topicTitle}
              context={topicContext}
              weeklyBrief={weeklyBrief}
              onApplyScore={async (variant, scorePayload) => {
                const version = getCurrentVersionForVariant(post.versions, variant)
                if (version) {
                  await onScore(version.id, scorePayload)
                }
              }}
            />

            {/* 3. Version Timeline */}
            <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Historial de versiones
                <span className="ml-2 text-xs font-normal text-foreground-muted">
                  ({post.versions.length} total)
                </span>
              </h2>

              {post.versions.length === 0 ? (
                <p className="text-sm text-foreground-muted text-center py-6">
                  Sin versiones guardadas
                </p>
              ) : (
                <ol className="space-y-2" aria-label="Versiones del post">
                  {/* Versions are already ordered newest first by the service */}
                  {post.versions.map((version) => (
                    <li
                      key={version.id}
                      className={`
                        rounded-xl border p-3 transition-all duration-150
                        ${
                          version.is_current
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-border bg-background hover:border-border-dark'
                        }
                      `}
                      aria-current={version.is_current ? 'true' : undefined}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground tabular-nums">
                            v{version.version}
                          </span>
                          <VariantBadge variant={version.variant} />
                          {version.is_current && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                              Actual
                            </span>
                          )}
                        </div>
                        <ScoreBadge score={version.score_json} />
                      </div>

                      <p className="text-xs text-foreground-muted flex items-center gap-1 mb-2">
                        <ClockIcon className="w-3 h-3" />
                        {formatDate(version.created_at)}
                      </p>

                      {/* Content preview */}
                      <p className="text-xs text-foreground-secondary leading-relaxed line-clamp-2 mb-2">
                        {version.content.slice(0, 100)}
                        {version.content.length > 100 ? '...' : ''}
                      </p>

                      {!version.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetCurrent(version.id)}
                          className="w-full text-xs"
                          aria-label={`Usar version ${version.version} como version actual`}
                        >
                          Usar esta
                        </Button>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
