'use client'

interface CheckResult {
  id: string
  label: string
  passed: boolean
  severity: 'error' | 'warning'
  detail?: string
}

interface QAScoreCardProps {
  checks: CheckResult[]
  label?: string
}

export function QAScoreCard({ checks, label = 'QA Score' }: QAScoreCardProps) {
  if (checks.length === 0) return null

  const passed = checks.filter(c => c.passed).length
  const total = checks.length
  const pct = Math.round((passed / total) * 100)
  const errors = checks.filter(c => !c.passed && c.severity === 'error').length
  const warnings = checks.filter(c => !c.passed && c.severity === 'warning').length

  const isReady = pct >= 85
  const barColor = isReady ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  const badgeColor = isReady
    ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-yellow-50 text-yellow-700 border-yellow-200'

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-border rounded-xl">
      {/* Label */}
      <span className="text-xs font-medium text-foreground-muted shrink-0">{label}</span>

      {/* Progress bar */}
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Percentage */}
      <span className={`text-sm font-bold tabular-nums ${isReady ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
        {pct}%
      </span>

      {/* Status badge */}
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${badgeColor}`}>
        {isReady ? 'OK' : errors > 0 ? `${errors} error${errors > 1 ? 'es' : ''}` : `${warnings} aviso${warnings > 1 ? 's' : ''}`}
      </span>
    </div>
  )
}
