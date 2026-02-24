'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WeekComparisonBar } from './WeekComparisonBar'

const MetricsMiniChart = dynamic(
  () => import('./MetricsMiniChart').then((m) => ({ default: m.MetricsMiniChart })),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse bg-gray-100 rounded-xl" /> }
)

// ---- Types ----

interface PostMetric {
  postId: string; dayOfWeek: number; dayLabel: string; funnelStage: string
  impressions: number; comments: number; saves: number; shares: number; leads: number
  notes: string | null; metricsId: string | null
}
interface Summary {
  totalImpressions: number; totalComments: number; totalSaves: number
  totalShares: number; totalLeads: number; avgImpressions: number; avgComments: number
  avgSaves: number; avgShares: number; avgLeads: number; engagementRate: number
}
interface Learning {
  id: string; campaign_id: string; summary: string; bullets_json: string[]
  created_by: string; created_at: string
}
export interface MetricsPanelProps {
  campaignId: string; weekStart: string; topicTitle: string | null
  postMetrics: PostMetric[]; summary: Summary; previousSummary?: Summary | null; learnings: Learning[]
  onSaveMetrics: (fd: FormData) => Promise<{ success?: true; error?: string }>
  onCreateLearning: (fd: FormData) => Promise<{ success?: true; error?: string }>
  onDeleteLearning: (id: string) => Promise<{ success?: true; error?: string }>
}
type DayState = { impressions: number; comments: number; saves: number; shares: number; leads: number; notes: string }

// ---- Constants ----

const STAGE_META: Record<string, { label: string; color: string; barColor: string }> = {
  tofu_problem:    { label: 'TOFU Problema',   color: 'bg-blue-100 text-blue-700',   barColor: 'bg-blue-400' },
  mofu_problem:    { label: 'MOFU Problema',   color: 'bg-purple-100 text-purple-700', barColor: 'bg-purple-400' },
  tofu_solution:   { label: 'TOFU Solucion',   color: 'bg-blue-100 text-blue-700',   barColor: 'bg-blue-400' },
  mofu_solution:   { label: 'MOFU Solucion',   color: 'bg-purple-100 text-purple-700', barColor: 'bg-purple-400' },
  bofu_conversion: { label: 'BOFU Conversion', color: 'bg-green-100 text-green-700', barColor: 'bg-green-400' },
}
const FALLBACK_STAGE = { label: 'Desconocido', color: 'bg-gray-100 text-gray-600', barColor: 'bg-gray-400' }
const TEXTAREA = 'w-full px-3 py-2 bg-background text-foreground border border-border hover:border-border-dark rounded-xl placeholder:text-foreground-muted text-sm leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent'
const INPUT_CLS = 'flex-1 px-4 py-2.5 bg-surface text-foreground border border-border hover:border-border-dark rounded-xl placeholder:text-foreground-muted text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent'
const HINTS = ['Hook', 'Visual', 'CTA', 'Friccion', 'Oportunidades']

// ---- Utilities ----

const fmt = (n: number) => n.toLocaleString('es-ES')
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })

// ---- Icons (inline SVG) ----

const I = (className?: string) => ({ className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const })
const EyeIcon    = ({ c }: { c?: string }) => <svg {...I(c)}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const MsgIcon    = ({ c }: { c?: string }) => <svg {...I(c)}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
const BmkIcon    = ({ c }: { c?: string }) => <svg {...I(c)}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
const ShareIcon  = ({ c }: { c?: string }) => <svg {...I(c)}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
const UsersIcon  = ({ c }: { c?: string }) => <svg {...I(c)}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const TrendIcon  = ({ c }: { c?: string }) => <svg {...I(c)}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const TrashIcon  = ({ c }: { c?: string }) => <svg {...I(c)}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const PlusIcon   = ({ c }: { c?: string }) => <svg {...I(c)}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const BulbIcon   = ({ c }: { c?: string }) => <svg {...I(c)}><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/></svg>

// ---- StatCard ----

function StatCard({ icon, label, total, avg }: { icon: React.ReactNode; label: string; total: number; avg: number }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-foreground-muted">
        <span className="w-4 h-4 shrink-0">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide truncate">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground leading-none">{fmt(total)}</p>
      <p className="text-xs text-foreground-muted">Promedio: {fmt(Math.round(avg))}</p>
    </div>
  )
}

// ---- Main Component ----

export function MetricsPanel({ postMetrics, summary, previousSummary, learnings, onSaveMetrics, onCreateLearning, onDeleteLearning }: MetricsPanelProps) {
  const [metricsState, setMetricsState] = useState<Record<number, DayState>>(
    Object.fromEntries(postMetrics.map((pm) => [pm.dayOfWeek, { impressions: pm.impressions, comments: pm.comments, saves: pm.saves, shares: pm.shares, leads: pm.leads, notes: pm.notes ?? '' }]))
  )
  const [savingDay, setSavingDay] = useState<number | null>(null)
  const [newSummary, setNewSummary] = useState('')
  const [newBullets, setNewBullets] = useState<string[]>([''])
  const [isSavingLearning, setIsSavingLearning] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleSaveMetrics(dayOfWeek: number, postId: string) {
    setSavingDay(dayOfWeek)
    const s = metricsState[dayOfWeek]
    const fd = new FormData()
    fd.set('post_id', postId); fd.set('impressions', String(s.impressions)); fd.set('comments', String(s.comments))
    fd.set('saves', String(s.saves)); fd.set('shares', String(s.shares)); fd.set('leads', String(s.leads)); fd.set('notes', s.notes)
    const result = await onSaveMetrics(fd)
    if (result.error) setError(result.error)
    setSavingDay(null)
  }

  function updateField(day: number, field: keyof DayState, value: string | number) {
    setMetricsState((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  async function handleSaveLearning() {
    const bullets = newBullets.filter((b) => b.trim())
    if (!newSummary.trim() || !bullets.length) return
    setIsSavingLearning(true); setError('')
    const fd = new FormData()
    fd.set('summary', newSummary.trim()); fd.set('bullets_json', JSON.stringify(bullets))
    const result = await onCreateLearning(fd)
    if (result.error) { setError(result.error) } else { setNewSummary(''); setNewBullets(['']) }
    setIsSavingLearning(false)
  }

  async function handleDeleteLearning(id: string) {
    const result = await onDeleteLearning(id)
    if (result.error) setError(result.error)
    setDeleteConfirmId(null)
  }

  const engLabel = summary.totalImpressions === 0 ? 'N/A' : `${summary.engagementRate.toFixed(1)}%`

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="shrink-0 hover:text-red-900 transition-colors text-lg leading-none" aria-label="Cerrar error">&times;</button>
        </div>
      )}

      {/* ===== SECTION 1: Weekly Summary ===== */}
      <section className="bg-surface border border-border rounded-2xl shadow-card p-6 space-y-5" aria-labelledby="summary-heading">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TrendIcon c="w-4 h-4 text-primary-500 shrink-0" />
            <h2 id="summary-heading" className="text-sm font-semibold text-foreground">Resumen Semanal</h2>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${summary.totalImpressions === 0 ? 'bg-gray-100 text-gray-600' : 'bg-primary-50 text-primary-700 border border-primary-200'}`}>
            Engagement: {engLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3" role="list" aria-label="Metricas totales">
          {[
            { icon: <EyeIcon c="w-4 h-4" />,   label: 'Impresiones', total: summary.totalImpressions, avg: summary.avgImpressions },
            { icon: <MsgIcon c="w-4 h-4" />,   label: 'Comentarios', total: summary.totalComments,    avg: summary.avgComments },
            { icon: <BmkIcon c="w-4 h-4" />,   label: 'Guardados',   total: summary.totalSaves,       avg: summary.avgSaves },
            { icon: <ShareIcon c="w-4 h-4" />, label: 'Compartidos', total: summary.totalShares,      avg: summary.avgShares },
            { icon: <UsersIcon c="w-4 h-4" />, label: 'Leads',       total: summary.totalLeads,       avg: summary.avgLeads },
          ].map((card, i) => (
            <div key={i} role="listitem" className={i === 4 ? 'col-span-2 md:col-span-1' : ''}>
              <StatCard {...card} />
            </div>
          ))}
        </div>

        {/* Recharts bar chart */}
        <div>
          <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-2">Impresiones por dia</p>
          <MetricsMiniChart postMetrics={postMetrics} />
          <div className="flex flex-wrap gap-3 pt-2">
            {[['bg-blue-400', 'TOFU'], ['bg-purple-400', 'MOFU'], ['bg-green-400', 'BOFU']].map(([bg, lbl]) => (
              <span key={lbl} className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <span className={`w-2.5 h-2.5 rounded-full ${bg} inline-block`} aria-hidden="true" />{lbl}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 1b: Week-over-Week Comparison ===== */}
      <WeekComparisonBar current={summary} previous={previousSummary ?? null} />

      {/* ===== SECTION 2: Metrics per Post ===== */}
      <section className="bg-surface border border-border rounded-2xl shadow-card p-6 space-y-4" aria-labelledby="metrics-form-heading">
        <div className="flex items-center gap-2">
          <TrendIcon c="w-4 h-4 text-accent-500 shrink-0" />
          <h2 id="metrics-form-heading" className="text-sm font-semibold text-foreground">Metricas por Post</h2>
        </div>
        <div className="space-y-4">
          {postMetrics.map((pm) => {
            const s = metricsState[pm.dayOfWeek] ?? { impressions: 0, comments: 0, saves: 0, shares: 0, leads: 0, notes: '' }
            const stage = STAGE_META[pm.funnelStage] ?? FALLBACK_STAGE
            const isSaving = savingDay === pm.dayOfWeek
            return (
              <div key={pm.dayOfWeek} className="border border-border rounded-xl overflow-hidden" role="article" aria-label={`Metricas de ${pm.dayLabel}`}>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">{pm.dayLabel}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stage.color}`}>{stage.label}</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {(['impressions', 'comments', 'saves', 'shares', 'leads'] as const).map((field) => (
                      <Input key={field} label={{ impressions: 'Impresiones', comments: 'Comentarios', saves: 'Guardados', shares: 'Compartidos', leads: 'Leads' }[field]}
                        type="number" min={0} value={s[field]}
                        onChange={(e) => updateField(pm.dayOfWeek, field, Number(e.target.value))}
                        aria-label={`${field} del ${pm.dayLabel}`}
                      />
                    ))}
                  </div>
                  <div>
                    <label htmlFor={`notes-${pm.dayOfWeek}`} className="block text-sm font-medium text-foreground mb-1.5">Notas</label>
                    <textarea id={`notes-${pm.dayOfWeek}`} value={s.notes} rows={1} placeholder="Observaciones del post..." className={TEXTAREA}
                      onChange={(e) => updateField(pm.dayOfWeek, 'notes', e.target.value)} aria-label={`Notas del ${pm.dayLabel}`} />
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleSaveMetrics(pm.dayOfWeek, pm.postId)} isLoading={isSaving} disabled={isSaving}>Guardar</Button>
                  </div>
                </div>
              </div>
            )
          })}
          {postMetrics.length === 0 && <p className="text-sm text-foreground-muted text-center py-8">No hay posts en esta campana.</p>}
        </div>
      </section>

      {/* ===== SECTION 3: Learnings ===== */}
      <section className="bg-surface border border-border rounded-2xl shadow-card p-6 space-y-5" aria-labelledby="learnings-heading">
        <div className="flex items-center gap-2">
          <BulbIcon c="w-4 h-4 text-warning-500 shrink-0" />
          <h2 id="learnings-heading" className="text-sm font-semibold text-foreground">Aprendizajes Semanales</h2>
        </div>

        {learnings.length > 0 && (
          <div className="space-y-3" role="list" aria-label="Aprendizajes guardados">
            {learnings.map((l) => {
              const isConfirming = deleteConfirmId === l.id
              return (
                <div key={l.id} className="border border-border rounded-xl p-4 space-y-2" role="listitem">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground leading-snug flex-1">{l.summary}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-foreground-muted">{fmtDate(l.created_at)}</span>
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5" role="group" aria-label="Confirmar eliminacion">
                          <button onClick={() => handleDeleteLearning(l.id)} className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors" aria-label="Confirmar eliminacion">Eliminar</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" aria-label="Cancelar eliminacion">Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(l.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" aria-label={`Eliminar aprendizaje: ${l.summary}`}>
                          <TrashIcon c="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {l.bullets_json.length > 0 && (
                    <ul className="space-y-1 pl-1" aria-label="Puntos clave">
                      {l.bullets_json.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground-secondary">
                          <span className="text-accent-500 mt-0.5 shrink-0" aria-hidden="true">&bull;</span>{b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {learnings.length === 0 && <p className="text-sm text-foreground-muted text-center py-4">Sin aprendizajes registrados esta semana.</p>}

        {/* Add learning form */}
        <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Agregar Aprendizaje</p>
          <Input label="Resumen" placeholder="Ej. Los hooks de pregunta generan 2x mas comentarios"
            value={newSummary} onChange={(e) => setNewSummary(e.target.value)}
            hint={`Categorias: ${HINTS.join(', ')}`} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Puntos clave</label>
            {newBullets.map((bullet, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="text" value={bullet} placeholder={`Bullet ${i + 1}...`} className={INPUT_CLS}
                  onChange={(e) => { const u = [...newBullets]; u[i] = e.target.value; setNewBullets(u) }}
                  aria-label={`Punto clave ${i + 1}`} />
                {newBullets.length > 1 && (
                  <button type="button" onClick={() => setNewBullets((p) => p.filter((_, idx) => idx !== i))}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0" aria-label={`Eliminar bullet ${i + 1}`}>
                    <TrashIcon c="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setNewBullets((p) => [...p, ''])} leftIcon={<PlusIcon c="w-3.5 h-3.5" />}>Agregar bullet</Button>
          </div>
          <div className="flex justify-end pt-1">
            <Button variant="primary" size="sm" onClick={handleSaveLearning} isLoading={isSavingLearning}
              disabled={!newSummary.trim() || newBullets.filter((b) => b.trim()).length === 0}
              leftIcon={<BulbIcon c="w-4 h-4" />}>
              Guardar Aprendizaje
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
