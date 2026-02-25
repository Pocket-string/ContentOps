'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ResearchReport } from '@/shared/types/content-ops'
import { CopyPromptButton } from '@/shared/components/copy-prompt-button'
import { buildResearchPromptTemplate } from '@/features/prompts/templates/research-template'

// -----------------------------------------------------------------------
// AI Synthesis typed shapes (two formats coexist)
// -----------------------------------------------------------------------

// Format A: from grounded-research API
interface KeyFinding {
  finding: string
  relevance: string
  source_hint?: string
}

interface SuggestedTopic {
  title: string
  angle: string
  hook_idea: string
}

// Format B: from synthesize-research API
interface SynthesisBullet {
  insight: string
  suggested_topic_title: string
  suggested_angle: string
}

// Unified shape for display
interface AiSynthesis {
  summary: string
  market_context?: string
  key_findings: KeyFinding[]
  suggested_topics: SuggestedTopic[]
  bullets: SynthesisBullet[]
}

function parseSynthesis(raw: Record<string, unknown> | null): AiSynthesis | null {
  if (!raw) return null

  const summary = typeof raw['summary'] === 'string' ? raw['summary'] : ''
  const marketContext = typeof raw['market_context'] === 'string' ? raw['market_context'] : undefined

  // Parse Format A: key_findings + suggested_topics (from grounded research)
  const keyFindings: KeyFinding[] = Array.isArray(raw['key_findings'])
    ? (raw['key_findings'] as Record<string, unknown>[]).flatMap((item) => {
        if (item && typeof item === 'object' && typeof item['finding'] === 'string') {
          return [{
            finding: item['finding'] as string,
            relevance: typeof item['relevance'] === 'string' ? item['relevance'] as string : '',
            source_hint: typeof item['source_hint'] === 'string' ? item['source_hint'] as string : undefined,
          }]
        }
        return []
      })
    : []

  const suggestedTopics: SuggestedTopic[] = Array.isArray(raw['suggested_topics'])
    ? (raw['suggested_topics'] as Record<string, unknown>[]).flatMap((item) => {
        if (item && typeof item === 'object' && typeof item['title'] === 'string') {
          return [{
            title: item['title'] as string,
            angle: typeof item['angle'] === 'string' ? item['angle'] as string : '',
            hook_idea: typeof item['hook_idea'] === 'string' ? item['hook_idea'] as string : '',
          }]
        }
        return []
      })
    : []

  // Parse Format B: bullets (from synthesis API)
  const bullets: SynthesisBullet[] = Array.isArray(raw['bullets'])
    ? (raw['bullets'] as Record<string, unknown>[]).flatMap((item) => {
        if (
          item && typeof item === 'object' &&
          typeof item['insight'] === 'string' &&
          typeof item['suggested_topic_title'] === 'string' &&
          typeof item['suggested_angle'] === 'string'
        ) {
          return [{
            insight: item['insight'] as string,
            suggested_topic_title: item['suggested_topic_title'] as string,
            suggested_angle: item['suggested_angle'] as string,
          }]
        }
        return []
      })
    : []

  // Must have at least something meaningful
  if (!summary && keyFindings.length === 0 && suggestedTopics.length === 0 && bullets.length === 0) {
    return null
  }

  return { summary, market_context: marketContext, key_findings: keyFindings, suggested_topics: suggestedTopics, bullets }
}

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

function ExternalLinkIcon({ className }: { className?: string }) {
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
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------
function isUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Score bar: shows a filled bar proportional to value/10
function ScoreBar({ value, color }: { value: number; color: 'blue' | 'green' }) {
  const pct = Math.round((value / 10) * 100)
  const trackClass = color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
  const fillClass = color === 'blue' ? 'bg-blue-500' : 'bg-green-500'

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className={`flex-1 h-1.5 rounded-full ${trackClass}`}>
        <div
          className={`h-1.5 rounded-full ${fillClass} transition-all duration-300`}
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

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------
interface ResearchDetailProps {
  research: ResearchReport
  onDelete?: () => Promise<{ error?: string } | void>
}

export function ResearchDetail({ research, onDelete }: ResearchDetailProps) {
  const router = useRouter()

  // Delete state
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Synthesis state — seed from existing ai_synthesis if present
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [synthesisError, setSynthesisError] = useState<string | null>(null)
  const [synthesis, setSynthesis] = useState<AiSynthesis | null>(
    parseSynthesis(research.ai_synthesis)
  )

  const sourceIsUrl = research.source ? isUrl(research.source) : false

  const hasMetadata =
    research.recency_date != null ||
    research.market_region != null ||
    research.buyer_persona != null ||
    research.trend_score != null ||
    research.fit_score != null

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  async function handleDelete() {
    if (!onDelete) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await onDelete()
      if (result && 'error' in result && result.error) {
        setDeleteError(result.error)
        setIsDeleting(false)
        setShowConfirm(false)
      } else {
        router.push('/research')
      }
    } catch {
      setDeleteError('Ocurrio un error al eliminar. Intenta de nuevo.')
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  async function handleSynthesis() {
    setIsSynthesizing(true)
    setSynthesisError(null)

    try {
      const res = await fetch('/api/ai/synthesize-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          research_id: research.id,
          raw_text: research.raw_text,
          key_takeaways: research.key_takeaways,
          title: research.title,
          market_region: research.market_region,
          buyer_persona: research.buyer_persona,
        }),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error ?? 'Error al generar sintesis')
      }

      const body = (await res.json()) as { data: Record<string, unknown> }
      const parsed = parseSynthesis(body.data)

      if (!parsed) {
        throw new Error('La respuesta de la API no tiene el formato esperado')
      }

      setSynthesis(parsed)
    } catch (err) {
      setSynthesisError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsSynthesizing(false)
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <nav aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => router.push('/research')}
          className="inline-flex items-center gap-1.5 text-sm text-foreground-secondary
            hover:text-foreground transition-colors group"
          aria-label="Volver a Research"
        >
          <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver a Research
        </button>
      </nav>

      {/* Main content */}
      <article className="space-y-4">
        {/* Header card */}
        <Card variant="gold-accent">
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground leading-snug">
                  {research.title}
                </h1>

                {research.source && (
                  <p className="mt-2 text-sm text-foreground-secondary flex items-center gap-1.5">
                    <span className="font-medium shrink-0">Fuente:</span>
                    {sourceIsUrl ? (
                      <a
                        href={research.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-accent-600 hover:text-accent-700 hover:underline
                          inline-flex items-center gap-1"
                      >
                        {research.source}
                        <ExternalLinkIcon className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="truncate">{research.source}</span>
                    )}
                  </p>
                )}

                <p className="mt-1.5 text-xs text-foreground-muted">
                  Creado el {formatDateTime(research.created_at)}
                  {research.updated_at !== research.created_at && (
                    <> &middot; Actualizado el {formatDateTime(research.updated_at)}</>
                  )}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    router.push(`/topics/new?from_research=${research.id}`)
                  }
                >
                  Derivar Tema
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/research/${research.id}/edit`)}
                >
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

            {/* Tags */}
            {research.tags_json.length > 0 && (
              <div
                className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border"
                aria-label="Etiquetas"
              >
                {research.tags_json.map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Raw text content */}
        <Card>
          <CardContent>
            <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-4">
              Contenido
            </h2>
            <pre
              className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed"
              aria-label="Texto completo del reporte"
            >
              {research.raw_text}
            </pre>
          </CardContent>
        </Card>

        {/* Research Profundo Metadata */}
        {hasMetadata && (
          <Card>
            <CardContent>
              <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-4">
                Research Profundo
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                {research.recency_date && (
                  <div>
                    <p className="text-xs text-foreground-muted mb-0.5">Fecha de recencia</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(research.recency_date)}
                    </p>
                  </div>
                )}

                {research.market_region && (
                  <div>
                    <p className="text-xs text-foreground-muted mb-0.5">Region</p>
                    <p className="text-sm font-medium text-foreground">
                      {research.market_region}
                    </p>
                  </div>
                )}

                {research.buyer_persona && (
                  <div>
                    <p className="text-xs text-foreground-muted mb-0.5">Buyer Persona</p>
                    <p className="text-sm font-medium text-foreground">
                      {research.buyer_persona}
                    </p>
                  </div>
                )}

                {research.trend_score != null && (
                  <div>
                    <p className="text-xs text-foreground-muted mb-0.5">Trend Score</p>
                    <ScoreBar value={research.trend_score} color="blue" />
                  </div>
                )}

                {research.fit_score != null && (
                  <div>
                    <p className="text-xs text-foreground-muted mb-0.5">Fit Score</p>
                    <ScoreBar value={research.fit_score} color="green" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Takeaways */}
        {research.key_takeaways.length > 0 && (
          <Card>
            <CardContent>
              <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-4">
                Conclusiones Clave
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                {research.key_takeaways.map((item, i) => (
                  <li key={i} className="text-sm text-foreground leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommended Angles */}
        {research.recommended_angles.length > 0 && (
          <Card>
            <CardContent>
              <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-4">
                Angulos Recomendados
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                {research.recommended_angles.map((item, i) => (
                  <li key={i} className="text-sm text-foreground leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Evidence Links */}
        {research.evidence_links.length > 0 && (
          <Card>
            <CardContent>
              <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-4">
                Links de Evidencia
              </h2>
              <ul className="space-y-2">
                {research.evidence_links.map((link, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-sm">
                    <ExternalLinkIcon className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-600 hover:underline truncate"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* AI Synthesis Panel */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider">
                Sintesis AI
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSynthesis}
                  isLoading={isSynthesizing}
                >
                  {synthesis ? 'Regenerar Sintesis' : 'Generar Sintesis'}
                </Button>
                <CopyPromptButton
                  getPrompt={() => buildResearchPromptTemplate({
                    tema: research.title,
                    buyerPersona: research.buyer_persona ?? undefined,
                    region: research.market_region ?? undefined,
                  })}
                  label="Copiar Prompt Perplexity"
                />
              </div>
            </div>

            {/* Synthesis error */}
            {synthesisError && (
              <div
                role="alert"
                className="rounded-xl bg-error-50 border border-error-500 p-3 mb-4"
              >
                <p className="text-sm text-error-700">{synthesisError}</p>
              </div>
            )}

            {/* Synthesis results */}
            {synthesis ? (
              <div className="space-y-4">
                {/* Summary */}
                {synthesis.summary && (
                  <p className="text-sm text-foreground leading-relaxed border-l-2 border-accent-400 pl-3">
                    {synthesis.summary}
                  </p>
                )}

                {/* Market context */}
                {synthesis.market_context && (
                  <p className="text-xs text-foreground-muted mt-2 italic">
                    {synthesis.market_context}
                  </p>
                )}

                {/* Key Findings (Format A — from grounded research) */}
                {synthesis.key_findings.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-foreground-muted font-medium uppercase tracking-wider">
                      Hallazgos Clave ({synthesis.key_findings.length})
                    </p>
                    {synthesis.key_findings.map((finding, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-surface p-3"
                      >
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {finding.finding}
                        </p>
                        <p className="text-xs text-foreground-secondary mt-1">
                          {finding.relevance}
                        </p>
                        {finding.source_hint && (
                          <p className="text-xs text-foreground-muted mt-1 italic">
                            Fuente: {finding.source_hint}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Topics (Format A — from grounded research) */}
                {synthesis.suggested_topics.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-foreground-muted font-medium uppercase tracking-wider">
                      Topics Sugeridos ({synthesis.suggested_topics.length})
                    </p>
                    {synthesis.suggested_topics.map((topic, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row
                          sm:items-start gap-3"
                      >
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {topic.title}
                          </p>
                          <p className="text-xs text-foreground-secondary">
                            Angulo: {topic.angle}
                          </p>
                          <p className="text-xs text-foreground-muted italic">
                            Hook: {topic.hook_idea}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/topics/new?from_research=${research.id}&title=${encodeURIComponent(topic.title)}&angle=${encodeURIComponent(topic.angle)}&hook_idea=${encodeURIComponent(topic.hook_idea)}`
                            )
                          }
                          className="shrink-0 self-start"
                        >
                          Crear Topic
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Insight bullets (Format B — from synthesis API) */}
                {synthesis.bullets.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-foreground-muted font-medium uppercase tracking-wider">
                      Insights y Topics Sugeridos ({synthesis.bullets.length})
                    </p>
                    {synthesis.bullets.map((bullet, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row
                          sm:items-start gap-3"
                      >
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {bullet.suggested_topic_title}
                          </p>
                          <p className="text-xs text-foreground-secondary leading-relaxed">
                            {bullet.insight}
                          </p>
                          <p className="text-xs text-foreground-muted italic">
                            Angulo: {bullet.suggested_angle}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/topics/new?from_research=${research.id}&title=${encodeURIComponent(
                                bullet.suggested_topic_title
                              )}&angle=${encodeURIComponent(bullet.suggested_angle)}&hook_idea=${encodeURIComponent(bullet.insight)}`
                            )
                          }
                          className="shrink-0 self-start"
                        >
                          Crear Topic
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              !isSynthesizing && (
                <p className="text-sm text-foreground-muted">
                  Genera una sintesis automatica para obtener insights y topics sugeridos a
                  partir del contenido de este reporte.
                </p>
              )
            )}
          </CardContent>
        </Card>
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
          <div className="relative bg-surface rounded-2xl shadow-xl border border-border
            max-w-md w-full p-6 animate-scale-in">
            <h3
              id="confirm-title"
              className="text-lg font-semibold text-foreground mb-2"
            >
              Eliminar reporte
            </h3>
            <p id="confirm-desc" className="text-sm text-foreground-secondary mb-6">
              Esta accion es irreversible. El reporte{' '}
              <span className="font-medium text-foreground">&quot;{research.title}&quot;</span>{' '}
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
