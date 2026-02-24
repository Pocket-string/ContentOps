'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveVisualCriticAction } from '../actions/visual-critic-actions'

// ============================================
// Types
// ============================================

interface VisualFinding {
  category: 'legibilidad' | 'coherencia_copy' | 'consistencia_editorial' | 'brand' | 'texto_render'
  severity: 'blocker' | 'warning' | 'suggestion'
  description: string
}

interface VisualCriticResult {
  findings: VisualFinding[]
  suggestions: string[]
  mobile_readability: 'pass' | 'warning' | 'fail'
  brand_consistency: 'pass' | 'warning' | 'fail'
  verdict: 'pass' | 'needs_work' | 'rewrite'
}

interface VisualCriticPanelProps {
  visualVersionId: string | null
  promptJson: Record<string, unknown> | null
  postContent: string
  format: string
  conceptType?: string
  campaignId: string
}

// ============================================
// Display constants
// ============================================

const VERDICT_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pass: { label: 'Pass', bg: 'bg-green-100', text: 'text-green-700' },
  needs_work: { label: 'Needs Work', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  rewrite: { label: 'Rewrite', bg: 'bg-red-100', text: 'text-red-700' },
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  blocker: { bg: 'bg-red-100', text: 'text-red-700' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  suggestion: { bg: 'bg-blue-100', text: 'text-blue-700' },
}

const INDICATOR_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pass: { bg: 'bg-green-100', text: 'text-green-700', label: 'OK' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Atenci\u00f3n' },
  fail: { bg: 'bg-red-100', text: 'text-red-700', label: 'Falla' },
}

const CATEGORY_LABELS: Record<string, string> = {
  legibilidad: 'Legibilidad',
  coherencia_copy: 'Copy',
  consistencia_editorial: 'Editorial',
  brand: 'Marca',
  texto_render: 'Render texto',
}

// ============================================
// Inline SVG Icons
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

// ============================================
// VisualCriticPanel component
// ============================================

export function VisualCriticPanel({
  visualVersionId,
  promptJson,
  postContent,
  format,
  conceptType,
  campaignId,
}: VisualCriticPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<VisualCriticResult | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const canEvaluate = !!visualVersionId && !!promptJson && !!postContent.trim()

  async function handleEvaluate() {
    if (!canEvaluate) return
    setIsLoading(true)
    setError('')
    setSaved(false)
    setResult(null)
    try {
      const response = await fetch('/api/ai/critic-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_json: promptJson,
          post_content: postContent,
          concept_type: conceptType,
          format,
        }),
      })
      const json: unknown = await response.json()
      if (!response.ok) {
        const errJson = json as { error?: string }
        setError(errJson.error ?? 'Error al evaluar el visual')
        return
      }
      const successJson = json as { data: VisualCriticResult }
      const aiResult = successJson.data
      setResult(aiResult)

      // Auto-save the result if we have a visualVersionId
      if (visualVersionId) {
        setIsSaving(true)
        const saveResult = await saveVisualCriticAction(
          visualVersionId,
          null,
          aiResult.findings,
          aiResult.suggestions,
          aiResult.verdict,
          campaignId
        )
        if (saveResult.error) {
          setError(`Evaluacion completada pero no se pudo guardar: ${saveResult.error}`)
        } else {
          setSaved(true)
        }
        setIsSaving(false)
      }
    } catch {
      setError('Error de red al evaluar el visual')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">VisualCritic AI</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEvaluate}
          isLoading={isLoading || isSaving}
          disabled={!canEvaluate}
          leftIcon={<SparklesIcon className="w-4 h-4" />}
        >
          Evaluar Visual
        </Button>
      </div>

      {error && (
        <p className="text-sm text-error-500 mb-3" role="alert">{error}</p>
      )}

      {result && (
        <div className="space-y-4">
          {/* Verdict + saved indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${VERDICT_STYLES[result.verdict].bg} ${VERDICT_STYLES[result.verdict].text}`}
              role="status"
            >
              {VERDICT_STYLES[result.verdict].label}
            </span>
            {saved && (
              <span className="text-xs text-foreground-muted">Guardado</span>
            )}
          </div>

          {/* Mobile readability + brand consistency indicators */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground-muted">Legibilidad movil</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${INDICATOR_STYLES[result.mobile_readability].bg} ${INDICATOR_STYLES[result.mobile_readability].text}`}>
                {INDICATOR_STYLES[result.mobile_readability].label}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground-muted">Consistencia marca</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${INDICATOR_STYLES[result.brand_consistency].bg} ${INDICATOR_STYLES[result.brand_consistency].text}`}>
                {INDICATOR_STYLES[result.brand_consistency].label}
              </span>
            </div>
          </div>

          {/* Findings */}
          {result.findings.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2">Findings</h3>
              <ul className="space-y-1.5" aria-label="Lista de findings visuales">
                {result.findings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${SEVERITY_STYLES[finding.severity].bg} ${SEVERITY_STYLES[finding.severity].text}`}>
                      {finding.severity}
                    </span>
                    <span className="text-xs text-foreground-muted shrink-0">
                      {CATEGORY_LABELS[finding.category] ?? finding.category}:
                    </span>
                    <span className="text-xs text-foreground">{finding.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2">Sugerencias</h3>
              <ul className="space-y-1" aria-label="Sugerencias de mejora visual">
                {result.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-xs text-foreground-secondary flex items-start gap-1.5">
                    <span className="text-accent-500 shrink-0 mt-0.5">-</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!result && !isLoading && (
        <p className="text-xs text-foreground-muted text-center py-2">
          {canEvaluate
            ? 'Haz click en Evaluar Visual para obtener feedback AI'
            : 'Selecciona una version con prompt JSON para evaluar'}
        </p>
      )}
    </div>
  )
}
