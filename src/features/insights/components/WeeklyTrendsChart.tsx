'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { WeeklyTrend } from '../services/insights-service'

// ============================================
// Props
// ============================================

interface WeeklyTrendsChartProps {
  trends: WeeklyTrend[]
}

// ============================================
// Helpers
// ============================================

function formatWeekLabel(weekStart: string): string {
  try {
    return new Date(weekStart).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    })
  } catch {
    return weekStart
  }
}

// ============================================
// Custom Tooltips
// ============================================

interface EngagementPayloadItem {
  value: number
}

interface EngagementTooltipProps {
  active?: boolean
  payload?: EngagementPayloadItem[]
  label?: string
}

function EngagementTooltip({ active, payload, label }: EngagementTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0]?.value ?? 0
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-gray-600">Engagement: {value.toFixed(2)}%</p>
    </div>
  )
}

interface ImpressionsLeadsPayloadItem {
  name: string
  value: number
  color: string
}

interface ImpressionsLeadsTooltipProps {
  active?: boolean
  payload?: ImpressionsLeadsPayloadItem[]
  label?: string
}

function ImpressionsLeadsTooltip({ active, payload, label }: ImpressionsLeadsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((entry) => {
        const isImpressions = entry.name === 'avg_impressions'
        const displayLabel = isImpressions ? 'Impresiones' : 'Leads'
        const displayValue = isImpressions
          ? Math.round(entry.value).toLocaleString('es-ES')
          : String(entry.value)
        return (
          <p key={entry.name} style={{ color: entry.color }} className="mt-0.5">
            {displayLabel}: {displayValue}
          </p>
        )
      })}
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function WeeklyTrendsChart({ trends }: WeeklyTrendsChartProps) {
  if (trends.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic text-center py-8">
        No hay datos suficientes para mostrar graficos.
      </p>
    )
  }

  const sorted = [...trends].sort((a, b) =>
    a.week_start.localeCompare(b.week_start)
  )

  const chartData = sorted.map((t) => ({
    week: formatWeekLabel(t.week_start),
    avg_engagement_rate: t.avg_engagement_rate,
    avg_impressions: t.avg_impressions,
    total_leads: t.total_leads,
  }))

  const axisStyle = { fontSize: 12, fill: '#9ca3af' }

  return (
    <div className="space-y-8">
      {/* Top chart: Engagement Rate */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Tendencia de Engagement
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
              width={48}
            />
            <Tooltip content={<EngagementTooltip />} />
            <Line
              type="monotone"
              dataKey="avg_engagement_rate"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom chart: Impressions + Leads */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Impresiones y Leads por Semana
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<ImpressionsLeadsTooltip />} />
            <Bar
              dataKey="avg_impressions"
              fill="#60a5fa"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="total_leads"
              fill="#4ade80"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
