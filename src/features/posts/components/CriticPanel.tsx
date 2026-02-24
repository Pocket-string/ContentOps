'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { WeeklyBrief, PostVariant, ScoreJson } from '@/shared/types/content-ops'

interface CriticFinding {
  category: string
  severity: 'blocker' | 'warning' | 'suggestion'
  description: string
  location?: string
}

interface CriticResult {
  score: {
    detener: number
    ganar: number
    provocar: number
    iniciar: number
    total: number
  }
  findings: CriticFinding[]
  suggestions: string[]
  verdict: 'pass' | 'needs_work' | 'rewrite'
}

interface CriticPanelProps {
  content: string
  variant: PostVariant
  funnelStage: string
  keyword?: string
  weeklyBrief?: WeeklyBrief
  humanScore?: ScoreJson | null
}

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

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z" />
      <path d="M5 15l.75 2.25L8 18l-2.25.75L5 21l-.75-2.25L2 18l2.25-.75z" />
    </svg>
  )
}

export function CriticPanel({ content, variant, funnelStage, keyword, weeklyBrief, humanScore }: CriticPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CriticResult | null>(null)
  const [error, setError] = useState('')

  async function handleEvaluate() {
    if (!content.trim()) return
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/ai/critic-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          variant,
          funnel_stage: funnelStage,
          keyword,
          weekly_brief: weeklyBrief,
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

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">CopyCritic AI</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEvaluate}
          isLoading={isLoading}
          disabled={!content.trim()}
          leftIcon={<SparklesIcon className="w-4 h-4" />}
        >
          Evaluar
        </Button>
      </div>

      {error && (
        <p className="text-sm text-error-500 mb-3">{error}</p>
      )}

      {result && (
        <div className="space-y-4">
          {/* Verdict */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${VERDICT_STYLES[result.verdict].bg} ${VERDICT_STYLES[result.verdict].text}`}>
              {VERDICT_STYLES[result.verdict].label}
            </span>
            <span className={`text-sm font-bold tabular-nums px-2.5 py-0.5 rounded-full ${
              result.score.total >= 16 ? 'bg-green-100 text-green-700'
                : result.score.total >= 10 ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {result.score.total}/20
            </span>
          </div>

          {/* Score comparison */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="font-medium text-foreground-muted">Dimension</div>
            <div className="font-medium text-foreground-muted text-right">AI {humanScore ? '/ Humano' : ''}</div>
            {(['detener', 'ganar', 'provocar', 'iniciar'] as const).map((dim) => (
              <div key={dim} className="contents">
                <span className="text-foreground capitalize">{dim[0].toUpperCase()}</span>
                <span className="text-right tabular-nums">
                  {result.score[dim]}/5
                  {humanScore ? ` / ${humanScore[dim]}/5` : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Findings */}
          {result.findings.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2">Findings</h3>
              <ul className="space-y-1.5">
                {result.findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${SEVERITY_STYLES[f.severity].bg} ${SEVERITY_STYLES[f.severity].text}`}>
                      {f.severity}
                    </span>
                    <span className="text-xs text-foreground">{f.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2">Sugerencias</h3>
              <ul className="space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-foreground-secondary flex items-start gap-1.5">
                    <span className="text-accent-500 shrink-0 mt-0.5">-</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!result && !isLoading && (
        <p className="text-xs text-foreground-muted text-center py-2">
          Haz click en Evaluar para obtener feedback AI
        </p>
      )}
    </div>
  )
}
