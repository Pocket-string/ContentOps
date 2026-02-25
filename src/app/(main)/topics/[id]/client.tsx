'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TopicForm } from '@/features/topics/components'
import { deleteTopicAction, updateTopicAction } from '@/features/topics/actions/topic-actions'
import type { Topic, CreateTopicInput } from '@/shared/types/content-ops'

// -----------------------------------------------------------------------
// Inline SVG icons
// -----------------------------------------------------------------------
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

function PencilIcon({ className }: { className?: string }) {
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

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  selected: 'Seleccionado',
  used: 'Usado',
  archived: 'Archivado',
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

type BadgeVariant = 'default' | 'pending' | 'confirmed' | 'cancelled' | 'completed'

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  backlog: 'default',
  selected: 'pending',
  used: 'confirmed',
  archived: 'cancelled',
}

const PRIORITY_BADGE_VARIANT: Record<string, BadgeVariant> = {
  low: 'default',
  medium: 'pending',
  high: 'completed',
}

// Score bar: shows a filled bar proportional to value/10
function ScoreBar({ value }: { value: number }) {
  const pct = Math.round((value / 10) * 100)

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-green-100">
        <div
          className="h-1.5 rounded-full bg-green-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="text-xs font-medium text-foreground tabular-nums">
        {value}
        <span className="text-foreground-muted">/10</span>
      </span>
    </div>
  )
}

// Section heading
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-3">
      {children}
    </h2>
  )
}

// Field row for label + value pairs
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-foreground-muted mb-0.5">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

// -----------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------
interface Props {
  topic: Topic
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------
export function TopicDetailClient({ topic }: Props) {
  const router = useRouter()

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)

  // Delete confirmation
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Local topic state (updated after successful edit)
  const [current, setCurrent] = useState<Topic>(topic)

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await deleteTopicAction(current.id)

      if ('error' in result) {
        setDeleteError(result.error)
        setIsDeleting(false)
        setShowConfirm(false)
      } else {
        router.push('/topics')
      }
    } catch {
      setDeleteError('Ocurrio un error al eliminar. Intenta de nuevo.')
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  async function handleEditSubmit(data: CreateTopicInput): Promise<{ error?: string } | void> {
    const formData = new FormData()
    formData.set('title', data.title)
    if (data.hypothesis) formData.set('hypothesis', data.hypothesis)
    if (data.evidence) formData.set('evidence', data.evidence)
    if (data.anti_myth) formData.set('anti_myth', data.anti_myth)
    if (data.signals_json.length > 0) formData.set('signals_json', JSON.stringify(data.signals_json))
    if (data.fit_score !== undefined) formData.set('fit_score', String(data.fit_score))
    formData.set('priority', data.priority)
    if (data.silent_enemy_name) formData.set('silent_enemy_name', data.silent_enemy_name)
    if (data.minimal_proof) formData.set('minimal_proof', data.minimal_proof)
    if (data.failure_modes.length > 0) formData.set('failure_modes', JSON.stringify(data.failure_modes))
    if (data.expected_business_impact) formData.set('expected_business_impact', data.expected_business_impact)

    const result = await updateTopicAction(current.id, formData)

    if ('error' in result) {
      return { error: result.error }
    }

    // Optimistically update local state so UI reflects changes immediately
    setCurrent((prev) => ({
      ...prev,
      title: data.title,
      hypothesis: data.hypothesis ?? null,
      evidence: data.evidence ?? null,
      anti_myth: data.anti_myth ?? null,
      signals_json: data.signals_json,
      fit_score: data.fit_score ?? null,
      priority: data.priority,
      silent_enemy_name: data.silent_enemy_name ?? null,
      minimal_proof: data.minimal_proof ?? null,
      failure_modes: data.failure_modes,
      expected_business_impact: data.expected_business_impact ?? null,
    }))

    setIsEditing(false)
  }

  const hasEnemy =
    current.silent_enemy_name != null ||
    current.minimal_proof != null ||
    current.failure_modes.length > 0 ||
    current.expected_business_impact != null

  // -----------------------------------------------------------------------
  // Render — Edit mode
  // -----------------------------------------------------------------------
  if (isEditing) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <nav aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center gap-1.5 text-sm text-foreground-secondary
              hover:text-foreground transition-colors group"
            aria-label="Cancelar edicion"
          >
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Cancelar edicion
          </button>
        </nav>

        <Card variant="gold-accent">
          <CardContent>
            <h1 className="text-xl font-bold text-foreground mb-6">
              Editar tema
            </h1>
            <TopicForm
              topic={current}
              onSubmit={handleEditSubmit}
              onSuccess={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Render — View mode
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <nav aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => router.push('/topics')}
          className="inline-flex items-center gap-1.5 text-sm text-foreground-secondary
            hover:text-foreground transition-colors group"
          aria-label="Volver a Topics"
        >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver a Topics
        </button>
      </nav>

      <article className="space-y-4">
        {/* Header card */}
        <Card variant="gold-accent">
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant={STATUS_BADGE_VARIANT[current.status] ?? 'default'}>
                    {STATUS_LABEL[current.status] ?? current.status}
                  </Badge>
                  <Badge variant={PRIORITY_BADGE_VARIANT[current.priority] ?? 'default'}>
                    Prioridad {PRIORITY_LABEL[current.priority] ?? current.priority}
                  </Badge>
                </div>

                <h1 className="text-xl font-bold text-foreground leading-snug">
                  {current.title}
                </h1>

                <p className="mt-1.5 text-xs text-foreground-muted">
                  Creado el {formatDateTime(current.created_at)}
                  {current.updated_at !== current.created_at && (
                    <> &middot; Actualizado el {formatDateTime(current.updated_at)}</>
                  )}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    router.push(`/campaigns/new?topic_id=${current.id}`)
                  }
                >
                  Crear Campana
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  aria-label="Editar tema"
                >
                  <PencilIcon className="w-3.5 h-3.5 mr-1.5" />
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core fields: hypothesis, evidence, anti_myth */}
        {(current.hypothesis || current.evidence || current.anti_myth) && (
          <Card>
            <CardContent>
              <SectionHeading>Contenido del Tema</SectionHeading>
              <div className="space-y-5">
                {current.hypothesis && (
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1">
                      Hipotesis
                    </p>
                    <p className="text-sm text-foreground leading-relaxed border-l-2 border-accent-400 pl-3">
                      {current.hypothesis}
                    </p>
                  </div>
                )}

                {current.evidence && (
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1">
                      Evidencia
                    </p>
                    <p className="text-sm text-foreground leading-relaxed border-l-2 border-blue-400 pl-3">
                      {current.evidence}
                    </p>
                  </div>
                )}

                {current.anti_myth && (
                  <div>
                    <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-1">
                      Anti-Mito
                    </p>
                    <p className="text-sm text-foreground leading-relaxed border-l-2 border-warning-400 pl-3">
                      {current.anti_myth}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signals + Scores */}
        {(current.signals_json.length > 0 || current.fit_score != null) && (
          <Card>
            <CardContent>
              <SectionHeading>Senales y Puntuacion</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {current.fit_score != null && (
                  <FieldRow label="Fit Score">
                    <ScoreBar value={current.fit_score} />
                  </FieldRow>
                )}

                {current.signals_json.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-foreground-muted mb-2">Senales del mercado</p>
                    <div className="flex flex-wrap gap-2" aria-label="Senales del mercado">
                      {current.signals_json.map((signal) => (
                        <Badge key={signal} variant="default">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Silent Enemy section */}
        {hasEnemy && (
          <Card>
            <CardContent>
              <SectionHeading>Enemigo Silencioso</SectionHeading>
              <div className="space-y-4">
                {current.silent_enemy_name && (
                  <FieldRow label="Nombre del enemigo">
                    <span className="font-medium">{current.silent_enemy_name}</span>
                  </FieldRow>
                )}

                {current.minimal_proof && (
                  <FieldRow label="Prueba minima">
                    <p className="leading-relaxed">{current.minimal_proof}</p>
                  </FieldRow>
                )}

                {current.failure_modes.length > 0 && (
                  <div>
                    <p className="text-xs text-foreground-muted mb-2">Modos de falla</p>
                    <ul className="list-disc list-inside space-y-1">
                      {current.failure_modes.map((mode, i) => (
                        <li key={i} className="text-sm text-foreground leading-relaxed">
                          {mode}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {current.expected_business_impact && (
                  <FieldRow label="Impacto de negocio esperado">
                    <p className="leading-relaxed">{current.expected_business_impact}</p>
                  </FieldRow>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </article>

      {/* Delete error */}
      {deleteError && (
        <div
          role="alert"
          className="rounded-xl bg-error-50 border border-error-500 p-4"
        >
          <p className="text-sm text-error-700">{deleteError}</p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => !isDeleting && setShowConfirm(false)}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div
            className="relative bg-surface rounded-2xl shadow-xl border border-border
              max-w-md w-full p-6 animate-scale-in"
          >
            <h3
              id="confirm-title"
              className="text-lg font-semibold text-foreground mb-2"
            >
              Eliminar tema
            </h3>
            <p id="confirm-desc" className="text-sm text-foreground-secondary mb-6">
              Esta accion es irreversible. El tema{' '}
              <span className="font-medium text-foreground">&quot;{current.title}&quot;</span>{' '}
              sera eliminado permanentemente.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Si, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
