'use client'

// ---- Types ----

interface Summary {
  totalImpressions: number
  totalComments: number
  totalSaves: number
  totalShares: number
  totalLeads: number
  avgImpressions: number
  avgComments: number
  avgSaves: number
  avgShares: number
  avgLeads: number
  engagementRate: number
}

export interface WeekComparisonBarProps {
  current: Summary
  previous: Summary | null
}

// ---- Utilities ----

const fmt = (n: number) => n.toLocaleString('es-ES')

/**
 * Returns the relative delta % between two values.
 * For engagement rate, call with isAbsolute=true to get percentage-point delta instead.
 */
function calcDelta(current: number, previous: number, isAbsolute = false): number | null {
  if (previous === 0) return null
  if (isAbsolute) return current - previous
  return ((current - previous) / previous) * 100
}

// ---- Icons (inline SVG) ----

function ChevronUpIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="inline-block shrink-0"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="inline-block shrink-0"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ---- DeltaBadge ----

interface DeltaBadgeProps {
  delta: number | null
  suffix?: string
}

function DeltaBadge({ delta, suffix = '%' }: DeltaBadgeProps) {
  if (delta === null) {
    return (
      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
        —
      </span>
    )
  }

  if (delta === 0) {
    return (
      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
        0{suffix}
      </span>
    )
  }

  const isPositive = delta > 0
  const formatted = `${isPositive ? '+' : ''}${delta.toFixed(1)}${suffix}`

  if (isPositive) {
    return (
      <span
        className="inline-flex items-center gap-0.5 bg-green-100 text-green-700 text-xs font-medium px-1.5 py-0.5 rounded-full"
        aria-label={`Incremento de ${formatted}`}
      >
        <ChevronUpIcon />
        {formatted}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 bg-red-100 text-red-700 text-xs font-medium px-1.5 py-0.5 rounded-full"
      aria-label={`Descenso de ${formatted}`}
    >
      <ChevronDownIcon />
      {formatted}
    </span>
  )
}

// ---- MetricCell ----

interface MetricCellProps {
  label: string
  currentValue: string
  delta: number | null
  deltaSuffix?: string
}

function MetricCell({ label, currentValue, delta, deltaSuffix = '%' }: MetricCellProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide truncate">
        {label}
      </span>
      <span className="text-base font-bold text-foreground leading-none tabular-nums">
        {currentValue}
      </span>
      <DeltaBadge delta={delta} suffix={deltaSuffix} />
    </div>
  )
}

// ---- Main Component ----

export function WeekComparisonBar({ current, previous }: WeekComparisonBarProps) {
  if (previous === null) {
    return (
      <div
        className="bg-surface border border-border rounded-2xl p-4"
        role="status"
        aria-label="Comparacion con semana anterior no disponible"
      >
        <p className="text-sm font-semibold text-foreground mb-1">
          Comparacion vs Semana Anterior
        </p>
        <p className="text-sm text-foreground-muted">
          Primera semana — no hay datos previos para comparar
        </p>
      </div>
    )
  }

  const metrics: MetricCellProps[] = [
    {
      label: 'Impresiones',
      currentValue: fmt(current.totalImpressions),
      delta: calcDelta(current.totalImpressions, previous.totalImpressions),
    },
    {
      label: 'Comentarios',
      currentValue: fmt(current.totalComments),
      delta: calcDelta(current.totalComments, previous.totalComments),
    },
    {
      label: 'Guardados',
      currentValue: fmt(current.totalSaves),
      delta: calcDelta(current.totalSaves, previous.totalSaves),
    },
    {
      label: 'Compartidos',
      currentValue: fmt(current.totalShares),
      delta: calcDelta(current.totalShares, previous.totalShares),
    },
    {
      label: 'Leads',
      currentValue: fmt(current.totalLeads),
      delta: calcDelta(current.totalLeads, previous.totalLeads),
    },
    {
      label: 'Engagement',
      currentValue: `${current.engagementRate.toFixed(1)}%`,
      delta: calcDelta(current.engagementRate, previous.engagementRate, true),
      deltaSuffix: 'pp',
    },
  ]

  return (
    <section
      className="bg-surface border border-border rounded-2xl p-4"
      aria-labelledby="week-comparison-heading"
    >
      <h2
        id="week-comparison-heading"
        className="text-sm font-semibold text-foreground mb-3"
      >
        Comparacion vs Semana Anterior
      </h2>

      <div
        className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-4"
        role="list"
        aria-label="Metricas comparadas con la semana anterior"
      >
        {metrics.map((metric) => (
          <div key={metric.label} role="listitem">
            <MetricCell {...metric} />
          </div>
        ))}
      </div>
    </section>
  )
}
