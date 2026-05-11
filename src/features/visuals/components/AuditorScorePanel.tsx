'use client'

/**
 * PRP-013: AuditorScorePanel — gauge /50 + 10 checks + acciones.
 *
 * Renderiza el resultado del endpoint /api/ai/audit-visual.
 * Permite "Regenerar con feedback" (textarea pre-llenada con findings) y
 * "Aprobar para publicar" (deshabilitado si score < 45).
 */

import { useState } from 'react'

import type { AuditorResult } from '@/features/visuals/types/archetype'

interface Props {
  result: AuditorResult | null
  isLoading?: boolean
  isApproving?: boolean
  onRegenerate: (feedback: string) => void
  onApprove: () => void | Promise<void>
  /** Optional: trigger a re-audit without regenerate. */
  onReaudit?: () => void
}

const VERDICT_LABEL: Record<AuditorResult['verdict'], string> = {
  publishable: 'Publishable',
  retry_recommended: 'Retry recommended',
  regenerate: 'Regenerate',
}

const VERDICT_COLOR: Record<AuditorResult['verdict'], { bg: string; text: string; ring: string }> = {
  publishable: { bg: 'bg-emerald-500', text: 'text-emerald-700', ring: 'stroke-emerald-500' },
  retry_recommended: { bg: 'bg-amber-500', text: 'text-amber-700', ring: 'stroke-amber-500' },
  regenerate: { bg: 'bg-rose-500', text: 'text-rose-700', ring: 'stroke-rose-500' },
}

export function AuditorScorePanel({
  result,
  isLoading = false,
  isApproving = false,
  onRegenerate,
  onApprove,
  onReaudit,
}: Props) {
  const [feedback, setFeedback] = useState('')

  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-border bg-white p-4 space-y-3"
        data-testid="auditor-panel-loading"
      >
        <p className="text-sm text-muted-foreground animate-pulse">Auditando visual... (10 checks)</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div
        className="rounded-xl border border-border bg-white p-4 space-y-3"
        data-testid="auditor-panel-empty"
      >
        <h3 className="text-sm font-semibold text-foreground">Auditor Visual (PRP-013)</h3>
        <p className="text-xs text-muted-foreground">
          Genera o compone una imagen para evaluarla con los 10 checks anti-genérico.
        </p>
        {onReaudit && (
          <button
            type="button"
            onClick={onReaudit}
            className="text-xs font-semibold text-primary-600 hover:text-primary-800"
          >
            Re-auditar imagen actual
          </button>
        )}
      </div>
    )
  }

  const { score, checks, verdict, findings } = result
  const passCount = checks.filter((c) => c.passed).length
  const colors = VERDICT_COLOR[verdict]

  // Gauge SVG (0-50 → 0-1.0 ratio)
  const ratio = score / 50
  const circumference = 2 * Math.PI * 36 // r=36
  const offset = circumference * (1 - ratio)

  return (
    <div
      className="rounded-xl border border-border bg-white p-4 space-y-4"
      data-testid="auditor-panel"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-foreground">Auditor Visual (PRP-013)</h3>
        <span className={['text-xs font-semibold uppercase tracking-wide', colors.text].join(' ')}>
          {VERDICT_LABEL[verdict]}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Gauge */}
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="36" className="fill-none stroke-slate-200" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="36"
              className={['fill-none transition-all duration-500', colors.ring].join(' ')}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground" data-testid="auditor-score">
              {score}
            </span>
            <span className="text-xs text-muted-foreground">/ 50</span>
          </div>
        </div>

        {/* Summary */}
        <div className="flex-1 space-y-1 text-xs">
          <div className="font-semibold text-foreground">
            {passCount} de 10 checks pasaron
          </div>
          <p className="text-muted-foreground leading-snug">
            Threshold publicable: ≥ 45/50 (9 de 10 checks).
          </p>
        </div>
      </div>

      {/* 10 checks list */}
      <details className="rounded-lg bg-slate-50 p-3" data-testid="auditor-checks">
        <summary className="cursor-pointer text-xs font-semibold text-foreground">
          ▼ Checks (haz click para expandir)
        </summary>
        <ul className="mt-3 space-y-1.5">
          {checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-xs">
              <span className={c.passed ? 'text-emerald-600' : 'text-rose-600'}>
                {c.passed ? '✓' : '✗'}
              </span>
              <div className="flex-1">
                <div className={c.passed ? 'text-foreground' : 'text-rose-700 font-semibold'}>
                  #{checks.indexOf(c) + 1} {c.label}
                </div>
                {!c.passed && c.reason && (
                  <div className="text-rose-600 italic mt-0.5">↳ {c.reason}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </details>

      {/* Findings */}
      {findings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Findings accionables:</p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
            {findings.slice(0, 5).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
            {findings.length > 5 && (
              <li className="text-muted-foreground italic">+ {findings.length - 5} más...</li>
            )}
          </ul>
        </div>
      )}

      {/* Actions */}
      {verdict !== 'publishable' && (
        <div className="space-y-2 border-t border-border pt-3">
          <label htmlFor="auditor-feedback" className="text-xs font-semibold text-foreground">
            Feedback para regenerar:
          </label>
          <textarea
            id="auditor-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={findings.slice(0, 3).join('\n- ')}
            className="w-full rounded-lg border border-border p-2 text-xs min-h-[60px]"
            data-testid="auditor-feedback-input"
          />
          <button
            type="button"
            onClick={() => onRegenerate(feedback || findings.join('\n- '))}
            className="w-full rounded-lg bg-primary-600 text-white px-3 py-2 text-xs font-semibold hover:bg-primary-700"
            data-testid="auditor-regenerate-btn"
          >
            🔄 Regenerar con feedback
          </button>
        </div>
      )}

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={onApprove}
          disabled={verdict !== 'publishable' || isApproving}
          className={[
            'w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
            verdict === 'publishable' && !isApproving
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed',
          ].join(' ')}
          data-testid="auditor-approve-btn"
        >
          {isApproving ? 'Aprobando...' : '✅ Aprobar para publicar'}
        </button>
        {verdict !== 'publishable' && (
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            Disponible cuando score ≥ 45/50
          </p>
        )}
      </div>
    </div>
  )
}
