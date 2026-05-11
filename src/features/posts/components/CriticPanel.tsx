'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import type { WeeklyBrief, PostVariant, PostVersion, ScoreJson } from '@/shared/types/content-ops'

// ============================================
// Types
// ============================================

interface VariantEval {
  variant: string
  score: {
    detener: number
    ganar: number
    provocar: number
    iniciar: number
    receta?: number
    total: number
  }
  findings: Array<{
    category: string
    severity: 'blocker' | 'warning' | 'suggestion'
    description: string
  }>
  suggestions: string[]
  verdict: 'pass' | 'needs_work' | 'rewrite'
}

interface CriticResult {
  evaluations: VariantEval[]
  recommended_variant: string
  recommendation_reason: string
}

// PRP-012 Fase 4: Naturalidad audit result
interface NaturalidadEvaluation {
  variant_id: string
  score_total: number
  scores_per_criteria: {
    especificidad_tecnica: number
    humanidad_voz_natural: number
    claridad_problema: number
    escena_dato_decision: number
    relevancia_audiencia: number
    traduccion_tecnico_negocio: number
    ausencia_cliches_ia: number
    fuerza_hook: number
    calidad_cta: number
    probabilidad_comentarios: number
  }
  diagnostico: string
  frases_genericas: string[]
  frases_humanas: string[]
  mejoras_prioritarias: string[]
}

interface NaturalidadResult {
  evaluations: NaturalidadEvaluation[]
}

interface CriticPanelProps {
  versions: PostVersion[]
  funnelStage: string
  keyword?: string
  topic?: string
  context?: string
  weeklyBrief?: WeeklyBrief
  previousHooks?: string[]
  pillarContext?: string
  // PRP-012
  audienceRole?: string | null
  editorialPillarName?: string | null
  onApplyScore?: (variant: PostVariant, score: ScoreJson) => Promise<void>
}

// ============================================
// Constants
// ============================================

const VARIANT_LABELS: Record<string, string> = {
  contrarian: 'Revelacion',
  story: 'Terreno',
  data_driven: 'Framework',
}

const VERDICT_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pass: { label: 'Aprobado', bg: 'bg-green-100', text: 'text-green-700' },
  needs_work: { label: 'Necesita Mejoras', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  rewrite: { label: 'Reescribir', bg: 'bg-red-100', text: 'text-red-700' },
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  blocker: { bg: 'bg-red-100', text: 'text-red-700' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  suggestion: { bg: 'bg-blue-100', text: 'text-blue-700' },
}

// ============================================
// Icons
// ============================================

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z" />
      <path d="M5 15l.75 2.25L8 18l-2.25.75L5 21l-.75-2.25L2 18l2.25-.75z" />
    </svg>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

// ============================================
// Main Component
// ============================================

export function CriticPanel({
  versions,
  funnelStage,
  keyword,
  topic,
  context,
  weeklyBrief,
  previousHooks,
  pillarContext,
  audienceRole,
  editorialPillarName,
  onApplyScore,
}: CriticPanelProps) {
  const [activeTab, setActiveTab] = useState<'critic' | 'naturalidad'>('critic')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CriticResult | null>(null)
  const [error, setError] = useState('')
  const [appliedScores, setAppliedScores] = useState<Set<string>>(new Set())
  // PRP-012 Fase 4: Naturalidad state
  const [isAuditing, setIsAuditing] = useState(false)
  const [naturalidadResult, setNaturalidadResult] = useState<NaturalidadResult | null>(null)

  // Get the latest version for each variant
  const getLatestVersions = useCallback(() => {
    const variantMap = new Map<string, PostVersion>()
    for (const v of versions) {
      const existing = variantMap.get(v.variant)
      if (!existing || v.version > existing.version) {
        variantMap.set(v.variant, v)
      }
    }
    return Array.from(variantMap.values())
  }, [versions])

  const latestVersions = getLatestVersions()
  const hasContent = latestVersions.length > 0

  async function handleEvaluateAll() {
    if (!hasContent) return
    setIsLoading(true)
    setError('')
    setResult(null)
    setAppliedScores(new Set())

    try {
      const variantsPayload = latestVersions.map(v => ({
        variant: v.variant,
        content: v.content,
      }))

      const response = await fetch('/api/ai/critic-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: variantsPayload,
          funnel_stage: funnelStage,
          keyword,
          topic,
          context,
          weekly_brief: weeklyBrief,
          previous_hooks: previousHooks?.length ? previousHooks : undefined,
          pillar_name: pillarContext?.split(' — ')[0],
          pillar_description: pillarContext?.includes(' — ') ? pillarContext.split(' — ').slice(1).join(' — ') : undefined,
        }),
      })

      const json: unknown = await response.json()
      if (!response.ok) {
        const errJson = json as { error?: string }
        setError(errJson.error ?? 'Error al evaluar')
        return
      }
      const successJson = json as { data: CriticResult }
      setResult(successJson.data)
    } catch {
      setError('Error de red al evaluar')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleApplyScore(evaluation: VariantEval) {
    if (!onApplyScore) return
    const scorePayload: ScoreJson = {
      detener: evaluation.score.detener,
      ganar: evaluation.score.ganar,
      provocar: evaluation.score.provocar,
      iniciar: evaluation.score.iniciar,
      receta: evaluation.score.receta ?? 0,
      total: evaluation.score.total,
      notes: `AI Critic: ${evaluation.verdict}. ${evaluation.suggestions.join('. ')}`,
    }
    await onApplyScore(evaluation.variant as PostVariant, scorePayload)
    setAppliedScores(prev => new Set(prev).add(evaluation.variant))
  }

  const [isApplyingAll, setIsApplyingAll] = useState(false)

  async function handleApplyAllScores() {
    if (!result || !onApplyScore) return
    setIsApplyingAll(true)
    try {
      for (const evaluation of result.evaluations) {
        if (!appliedScores.has(evaluation.variant)) {
          await handleApplyScore(evaluation)
        }
      }
    } catch (err) {
      console.error('[CriticPanel] apply all scores error:', err)
      setError('Error al aplicar scores. Intenta de nuevo.')
    } finally {
      setIsApplyingAll(false)
    }
  }

  // PRP-012 Fase 4: Auditar naturalidad (Capa 2)
  async function handleAuditNaturalidad() {
    if (!hasContent) return
    setIsAuditing(true)
    setError('')
    setNaturalidadResult(null)

    try {
      const variantsPayload = latestVersions.map(v => ({
        id: v.variant,
        label: VARIANT_LABELS[v.variant] ?? v.variant,
        content: v.content,
      }))

      const response = await fetch('/api/ai/audit-naturalidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: variantsPayload,
          pillar_name: editorialPillarName ?? undefined,
          audience_role: audienceRole ?? undefined,
        }),
      })

      const json: unknown = await response.json()
      if (!response.ok) {
        const errJson = json as { error?: string }
        setError(errJson.error ?? 'Error al auditar naturalidad')
        return
      }
      const successJson = json as { data: NaturalidadResult }
      setNaturalidadResult(successJson.data)
    } catch {
      setError('Error de red al auditar naturalidad')
    } finally {
      setIsAuditing(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">CopyCritic AI</h2>
        <p className="text-xs text-foreground-muted mt-0.5">
          Evaluación D/G/P/I/R + Auditor Naturalidad (PRP-012)
        </p>
      </div>

      {/* PRP-012: Tab bar */}
      <div role="tablist" className="flex border-b border-border mb-4">
        <button
          role="tab"
          aria-selected={activeTab === 'critic'}
          onClick={() => setActiveTab('critic')}
          className={`px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'critic'
              ? 'text-accent-600 border-b-2 border-accent-600'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          D/G/P/I/R
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'naturalidad'}
          onClick={() => setActiveTab('naturalidad')}
          className={`px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'naturalidad'
              ? 'text-violet-600 border-b-2 border-violet-600'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          Naturalidad 0-50
        </button>
      </div>

      {/* Tab actions */}
      {activeTab === 'critic' && (
        <div className="flex items-center justify-end mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEvaluateAll}
            isLoading={isLoading}
            disabled={!hasContent}
            leftIcon={<SparklesIcon className="w-4 h-4" />}
          >
            Evaluar {latestVersions.length > 1 ? `(${latestVersions.length})` : ''}
          </Button>
        </div>
      )}
      {activeTab === 'naturalidad' && (
        <div className="flex items-center justify-end mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAuditNaturalidad}
            isLoading={isAuditing}
            disabled={!hasContent}
          >
            🪄 Auditar Naturalidad
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-error-500 mb-3">{error}</p>
      )}

      {/* PRP-012: Naturalidad tab content */}
      {activeTab === 'naturalidad' && naturalidadResult && (
        <div className="space-y-4">
          {naturalidadResult.evaluations.map((evalItem) => {
            const score = evalItem.score_total
            const colorClass =
              score >= 45 ? 'bg-success-50 text-success-700 border-success-200' :
              score >= 40 ? 'bg-warning-50 text-warning-700 border-warning-200' :
              score >= 35 ? 'bg-orange-50 text-orange-700 border-orange-200' :
              'bg-error-50 text-error-700 border-error-200'
            const verdictText =
              score >= 45 ? 'Publicable. Solo ajustes menores.' :
              score >= 40 ? 'Publicable con edición humana breve.' :
              score >= 35 ? 'Requiere reescritura parcial.' :
              'No publicar. Rehacer desde input más real.'
            return (
              <div key={evalItem.variant_id} className={`border rounded-xl p-4 ${colorClass}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">
                    {VARIANT_LABELS[evalItem.variant_id] ?? evalItem.variant_id}
                  </span>
                  <span className="text-lg font-bold">{score}/50</span>
                </div>
                <p className="text-xs mb-3 italic">{verdictText}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs mb-3">
                  {Object.entries(evalItem.scores_per_criteria).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className="capitalize text-foreground-secondary">{key.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span
                              key={n}
                              className={`inline-block w-1.5 h-3 mr-0.5 rounded-sm ${
                                n <= val ? 'bg-current opacity-70' : 'bg-current opacity-15'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-mono text-[10px] tabular-nums">{val}/5</span>
                      </div>
                    </div>
                  ))}
                </div>

                {evalItem.diagnostico && (
                  <p className="text-xs text-foreground-secondary mb-2 italic">{evalItem.diagnostico}</p>
                )}

                {evalItem.frases_genericas.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1">🚫 Frases problemáticas:</p>
                    <ul className="space-y-0.5">
                      {evalItem.frases_genericas.map((f, i) => (
                        <li key={i} className="text-xs pl-2 border-l-2 border-current opacity-80">{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evalItem.frases_humanas.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1">✅ Frases que conviene mantener:</p>
                    <ul className="space-y-0.5">
                      {evalItem.frases_humanas.map((f, i) => (
                        <li key={i} className="text-xs pl-2 border-l-2 border-current opacity-80">{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evalItem.mejoras_prioritarias.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1">⚡ Mejoras prioritarias:</p>
                    <ol className="space-y-0.5 list-decimal list-inside">
                      {evalItem.mejoras_prioritarias.map((m, i) => (
                        <li key={i} className="text-xs">{m}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )
          })}
          <p className="text-[10px] text-foreground-muted italic text-center">
            ℹ️ Score informativo — NO bloquea publicación
          </p>
        </div>
      )}

      {activeTab === 'critic' && result && (
        <div className="space-y-4">
          {/* Recommendation banner */}
          <div className="bg-accent-50 border border-accent-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrophyIcon className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-bold text-accent-700">
                Recomendacion: {VARIANT_LABELS[result.recommended_variant] ?? result.recommended_variant}
              </span>
            </div>
            <p className="text-xs text-accent-600">{result.recommendation_reason}</p>
          </div>

          {/* Apply all scores button */}
          {onApplyScore && result.evaluations.length > 0 && appliedScores.size < result.evaluations.length && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleApplyAllScores}
              isLoading={isApplyingAll}
              disabled={isApplyingAll}
              leftIcon={<CheckCircleIcon className="w-4 h-4" />}
              className="w-full"
            >
              Aplicar todos los scores D/G/P/I
            </Button>
          )}

          {/* Per-variant evaluations */}
          {result.evaluations.map((evaluation) => {
            const label = VARIANT_LABELS[evaluation.variant] ?? evaluation.variant
            const isRecommended = evaluation.variant === result.recommended_variant
            const verdictStyle = VERDICT_STYLES[evaluation.verdict] ?? VERDICT_STYLES.needs_work
            const isApplied = appliedScores.has(evaluation.variant)

            return (
              <div
                key={evaluation.variant}
                className={`border rounded-xl p-4 space-y-3 ${
                  isRecommended
                    ? 'border-accent-300 bg-accent-50/30'
                    : 'border-border'
                }`}
              >
                {/* Variant header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    {isRecommended && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                        <TrophyIcon className="w-3 h-3" /> Mejor
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${verdictStyle.bg} ${verdictStyle.text}`}>
                      {verdictStyle.label}
                    </span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums px-2.5 py-0.5 rounded-full ${
                    evaluation.score.total >= 16 ? 'bg-green-100 text-green-700'
                      : evaluation.score.total >= 10 ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {evaluation.score.total}/25
                  </span>
                </div>

                {/* D/G/P/I Score bars */}
                <div className="grid grid-cols-5 gap-2">
                  {(['detener', 'ganar', 'provocar', 'iniciar', 'receta'] as const).map((dim) => {
                    const val = evaluation.score[dim] ?? 0
                    const pct = (val / 5) * 100
                    return (
                      <div key={dim} className="text-center">
                        <div className="text-xs font-bold text-foreground uppercase">{dim[0]}</div>
                        <div className="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              val >= 4 ? 'bg-green-500' : val >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-xs text-foreground-muted mt-0.5 tabular-nums">{val}/5</div>
                      </div>
                    )
                  })}
                </div>

                {/* Findings */}
                {evaluation.findings.length > 0 && (
                  <ul className="space-y-1">
                    {evaluation.findings.map((f, i) => {
                      const sStyle = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.suggestion
                      return (
                        <li key={i} className="flex items-start gap-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${sStyle.bg} ${sStyle.text}`}>
                            {f.severity}
                          </span>
                          <span className="text-xs text-foreground">{f.description}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Suggestions */}
                {evaluation.suggestions.length > 0 && (
                  <ul className="space-y-0.5">
                    {evaluation.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-foreground-secondary flex items-start gap-1.5">
                        <span className="text-accent-500 shrink-0 mt-0.5">-</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Apply score button */}
                {onApplyScore && (
                  <button
                    type="button"
                    onClick={() => handleApplyScore(evaluation)}
                    disabled={isApplied}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      isApplied
                        ? 'bg-green-50 text-green-600 cursor-default'
                        : 'bg-gray-100 text-foreground hover:bg-gray-200'
                    }`}
                  >
                    {isApplied ? 'Score aplicado' : 'Aplicar score D/G/P/I'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!result && !isLoading && (
        <p className="text-xs text-foreground-muted text-center py-2">
          Genera contenido y haz click en Evaluar para obtener feedback AI sobre todas las variantes
        </p>
      )}
    </div>
  )
}
