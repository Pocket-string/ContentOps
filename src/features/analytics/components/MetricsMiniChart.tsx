'use client'

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// ---- Types ----

interface PostMetric {
  postId: string
  dayOfWeek: number
  dayLabel: string
  funnelStage: string
  impressions: number
  comments: number
  saves: number
  shares: number
  leads: number
  notes: string | null
  metricsId: string | null
}

export interface MetricsMiniChartProps {
  postMetrics: PostMetric[]
}

// ---- Constants ----

const STAGE_FILL: Record<string, string> = {
  tofu_problem:    '#60a5fa',
  tofu_solution:   '#60a5fa',
  mofu_problem:    '#c084fc',
  mofu_solution:   '#c084fc',
  bofu_conversion: '#4ade80',
}
const FALLBACK_FILL = '#9ca3af'

const STAGE_LABEL: Record<string, string> = {
  tofu_problem:    'TOFU Problema',
  tofu_solution:   'TOFU Solucion',
  mofu_problem:    'MOFU Problema',
  mofu_solution:   'MOFU Solucion',
  bofu_conversion: 'BOFU Conversion',
}

// ---- Custom Tooltip ----

interface TooltipPayload {
  payload?: { dayLabel: string; impressions: number; funnelStage: string }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs space-y-0.5" role="tooltip">
      <p className="font-semibold text-gray-900">{d.dayLabel}</p>
      <p className="text-gray-600">{d.impressions.toLocaleString('es-ES')} impresiones</p>
      <p className="text-gray-500">{STAGE_LABEL[d.funnelStage] ?? 'Desconocido'}</p>
    </div>
  )
}

// ---- Main Component ----

export function MetricsMiniChart({ postMetrics }: MetricsMiniChartProps) {
  const data = postMetrics.map((pm) => ({
    dayLabel:    pm.dayLabel.slice(0, 3),
    dayLabelFull: pm.dayLabel,
    impressions: pm.impressions,
    funnelStage: pm.funnelStage,
    fill:        STAGE_FILL[pm.funnelStage] ?? FALLBACK_FILL,
  }))

  const allZero = data.every((d) => d.impressions === 0)

  if (allZero) {
    return (
      <div className="flex items-center justify-center h-[200px]" aria-label="Sin datos de impresiones">
        <p className="text-sm text-gray-400">Sin datos de impresiones</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} role="img" aria-label="Impresiones por dia de la semana">
        <XAxis
          dataKey="dayLabel"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => v.toLocaleString('es-ES')}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }} />
        <Bar dataKey="impressions" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
