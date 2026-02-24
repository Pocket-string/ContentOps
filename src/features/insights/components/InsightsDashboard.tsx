'use client'

import dynamic from 'next/dynamic'
import type { InsightsData, TopHook, TopCTA, FormatPerformance } from '../services/insights-service'

const WeeklyTrendsChart = dynamic(
  () => import('./WeeklyTrendsChart').then((m) => ({ default: m.WeeklyTrendsChart })),
  { ssr: false, loading: () => <div className="h-[540px] animate-pulse bg-gray-100 rounded-2xl" /> }
)

// ============================================
// Props
// ============================================

interface InsightsDashboardProps {
  data: InsightsData
}

// ============================================
// Helpers
// ============================================

function scoreColor(score: number): string {
  if (score >= 15) return 'bg-green-100 text-green-700'
  if (score >= 10) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-600'
}

function funnelLabel(stage: string): string {
  const labels: Record<string, string> = {
    tofu_problem: 'TOFU Problema',
    mofu_problem: 'MOFU Problema',
    tofu_solution: 'TOFU Solucion',
    mofu_solution: 'MOFU Solucion',
    bofu_conversion: 'BOFU Conversion',
  }
  return labels[stage] ?? stage
}

function formatWeek(weekStart: string): string {
  if (!weekStart) return '—'
  try {
    return new Date(weekStart).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return weekStart
  }
}

function variantLabel(variant: string): string {
  const labels: Record<string, string> = {
    contrarian: 'Contrarian',
    story: 'Historia',
    data_driven: 'Datos',
  }
  return labels[variant] ?? variant
}

// ============================================
// Sub-components
// ============================================

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-foreground-secondary italic py-4 text-center">
      {message}
    </p>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-xs text-foreground-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function TopHooksCard({ hooks }: { hooks: TopHook[] }) {
  return (
    <SectionCard
      title="Top Hooks"
      subtitle="Los 5 ganchos con mayor puntuacion D/G/P/I"
    >
      {hooks.length === 0 ? (
        <EmptyState message="No hay datos suficientes. Genera y puntua posts primero." />
      ) : (
        <ol className="space-y-3">
          {hooks.map((hook, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2 leading-snug">
                  {hook.content || '—'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${scoreColor(hook.score_total)}`}
                  >
                    {hook.score_total.toFixed(1)}/20
                  </span>
                  <span className="text-[10px] text-foreground-secondary">
                    {variantLabel(hook.variant)}
                  </span>
                  <span className="text-[10px] text-foreground-secondary">
                    {funnelLabel(hook.funnel_stage)}
                  </span>
                  {hook.campaign_week && (
                    <span className="text-[10px] text-foreground-secondary">
                      {formatWeek(hook.campaign_week)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  )
}

function TopCTAsCard({ ctas }: { ctas: TopCTA[] }) {
  return (
    <SectionCard
      title="Top CTAs"
      subtitle="Los 5 llamados a la accion con mas leads generados"
    >
      {ctas.length === 0 ? (
        <EmptyState message="No hay datos suficientes. Registra metricas con leads primero." />
      ) : (
        <ol className="space-y-3">
          {ctas.map((cta, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2 leading-snug">
                  {cta.content || '—'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {cta.leads} lead{cta.leads !== 1 ? 's' : ''}
                  </span>
                  {cta.campaign_week && (
                    <span className="text-[10px] text-foreground-secondary">
                      {formatWeek(cta.campaign_week)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  )
}

function FormatPerformanceCard({ formats }: { formats: FormatPerformance[] }) {
  return (
    <SectionCard
      title="Rendimiento por Formato Visual"
      subtitle="Formatos usados y su score D/G/P/I promedio"
    >
      {formats.length === 0 ? (
        <EmptyState message="No hay datos suficientes. Crea versiones visuales primero." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-foreground-secondary pb-2">
                  Formato
                </th>
                <th className="text-right text-xs font-medium text-foreground-secondary pb-2">
                  Usos
                </th>
                <th className="text-right text-xs font-medium text-foreground-secondary pb-2">
                  Score Prom.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {formats.map((f, i) => (
                <tr key={i}>
                  <td className="py-2 pr-4 text-foreground font-medium">{f.format}</td>
                  <td className="py-2 text-right text-foreground-secondary">{f.count}</td>
                  <td className="py-2 text-right">
                    {f.avg_score > 0 ? (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor(f.avg_score)}`}
                      >
                        {f.avg_score.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-foreground-secondary">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}


function OverviewCard({
  totalCampaigns,
  totalPosts,
  avgDGPIScore,
}: {
  totalCampaigns: number
  totalPosts: number
  avgDGPIScore: number
}) {
  const hasScore = avgDGPIScore > 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <OverviewStat
        title="Campanas Totales"
        value={String(totalCampaigns)}
        sub="en el workspace"
      />
      <OverviewStat
        title="Posts Totales"
        value={String(totalPosts)}
        sub="en todas las campanas"
      />
      <OverviewStat
        title="Score D/G/P/I Promedio"
        value={hasScore ? `${avgDGPIScore.toFixed(1)}/20` : '—'}
        sub={hasScore ? 'de posts actuales puntuados' : 'sin scores aun'}
      />
    </div>
  )
}

function OverviewStat({
  title,
  value,
  sub,
}: {
  title: string
  value: string
  sub: string
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-6">
      <p className="text-sm text-foreground-secondary">{title}</p>
      <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      <p className="text-xs text-foreground-secondary mt-1">{sub}</p>
    </div>
  )
}

// ============================================
// Main component
// ============================================

export function InsightsDashboard({ data }: InsightsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <OverviewCard
        totalCampaigns={data.totalCampaigns}
        totalPosts={data.totalPosts}
        avgDGPIScore={data.avgDGPIScore}
      />

      {/* Top Hooks + Top CTAs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopHooksCard hooks={data.topHooks} />
        <TopCTAsCard ctas={data.topCTAs} />
      </div>

      {/* Format Performance */}
      <FormatPerformanceCard formats={data.formatPerformance} />

      {/* Weekly Trends — Recharts */}
      <SectionCard
        title="Tendencias Semanales"
        subtitle="Metricas promedio por semana de campana"
      >
        <WeeklyTrendsChart trends={data.weeklyTrends} />
      </SectionCard>
    </div>
  )
}
