'use client'

import { useState } from 'react'
import type { Pattern, PatternType } from '@/shared/types/content-ops'
import { PATTERN_TYPES } from '@/shared/types/content-ops'

// ---- Types ----

interface PatternLibraryProps {
  patterns: Pattern[]
  onDelete: (patternId: string) => Promise<{ error?: string }>
}

// ---- Constants ----

const TYPE_LABELS: Record<PatternType, string> = {
  hook: 'Hook',
  cta: 'CTA',
  visual_format: 'Formato Visual',
  topic_angle: 'Angulo de Tema',
  content_structure: 'Estructura',
}

const TYPE_COLORS: Record<PatternType, string> = {
  hook: 'bg-blue-100 text-blue-700 border-blue-200',
  cta: 'bg-green-100 text-green-700 border-green-200',
  visual_format: 'bg-purple-100 text-purple-700 border-purple-200',
  topic_angle: 'bg-orange-100 text-orange-700 border-orange-200',
  content_structure: 'bg-pink-100 text-pink-700 border-pink-200',
}

const ALL_TAB = 'all'
type TabValue = PatternType | typeof ALL_TAB

// ---- Inline icons ----

const I = (className?: string) => ({
  className,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
})

function TrashIcon({ c }: { c?: string }) {
  return (
    <svg {...I(c)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

function BookmarkIcon({ c }: { c?: string }) {
  return (
    <svg {...I(c)}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  )
}

// ---- PatternCard ----

interface PatternCardProps {
  pattern: Pattern
  onDelete: (id: string) => Promise<{ error?: string }>
}

function PatternCard({ pattern, onDelete }: PatternCardProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const typeColor = TYPE_COLORS[pattern.pattern_type] ?? 'bg-gray-100 text-gray-700 border-gray-200'
  const typeLabel = TYPE_LABELS[pattern.pattern_type] ?? pattern.pattern_type

  async function handleDelete() {
    setIsDeleting(true)
    setError('')
    const result = await onDelete(pattern.id)
    if (result.error) {
      setError(result.error)
      setIsDeleting(false)
      setIsConfirming(false)
    }
    // If success, component unmounts via parent re-render
  }

  const hasPerformance =
    pattern.performance.dgpi_score != null ||
    pattern.performance.engagement_rate != null ||
    pattern.performance.impressions != null

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header: type badge + delete */}
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${typeColor}`}>
          {typeLabel}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {isConfirming ? (
            <div className="flex items-center gap-1.5" role="group" aria-label="Confirmar eliminacion">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Confirmar eliminacion"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button
                onClick={() => setIsConfirming(false)}
                disabled={isDeleting}
                className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Cancelar eliminacion"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirming(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label={`Eliminar patron`}
            >
              <TrashIcon c="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-foreground leading-relaxed line-clamp-4">
        {pattern.content}
      </p>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Context info */}
      {(pattern.context.funnel_stage || pattern.context.variant || pattern.context.topic) && (
        <div className="flex flex-wrap gap-1.5">
          {pattern.context.funnel_stage && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {pattern.context.funnel_stage.replace(/_/g, ' ')}
            </span>
          )}
          {pattern.context.variant && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {pattern.context.variant}
            </span>
          )}
          {pattern.context.topic && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full truncate max-w-[200px]">
              {pattern.context.topic}
            </span>
          )}
        </div>
      )}

      {/* Performance metrics */}
      {hasPerformance && (
        <div className="flex flex-wrap gap-3 pt-1 border-t border-border">
          {pattern.performance.dgpi_score != null && (
            <span className="text-xs text-foreground-muted">
              <span className="font-semibold text-foreground">
                {pattern.performance.dgpi_score}/20
              </span>{' '}
              D/G/P/I
            </span>
          )}
          {pattern.performance.engagement_rate != null && (
            <span className="text-xs text-foreground-muted">
              <span className="font-semibold text-foreground">
                {pattern.performance.engagement_rate.toFixed(1)}%
              </span>{' '}
              engagement
            </span>
          )}
          {pattern.performance.impressions != null && (
            <span className="text-xs text-foreground-muted">
              <span className="font-semibold text-foreground">
                {pattern.performance.impressions.toLocaleString('es-ES')}
              </span>{' '}
              impresiones
            </span>
          )}
        </div>
      )}

      {/* Tags */}
      {pattern.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {pattern.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-accent-50 text-accent-700 border border-accent-200 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Empty State ----

function EmptyState({ activeTab }: { activeTab: TabValue }) {
  const label = activeTab === ALL_TAB ? 'ninguno' : TYPE_LABELS[activeTab as PatternType] ?? activeTab
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
        <BookmarkIcon c="w-7 h-7 text-primary-400" />
      </div>
      <h3 className="text-base font-semibold text-foreground">Sin patrones guardados</h3>
      <p className="text-sm text-foreground-muted max-w-xs">
        {activeTab === ALL_TAB
          ? 'No hay patrones en la biblioteca todavia. Los patrones te permiten reutilizar hooks, CTAs y estructuras que han funcionado bien.'
          : `No hay patrones de tipo "${label}" todavia.`}
      </p>
    </div>
  )
}

// ---- Main Component ----

export function PatternLibrary({ patterns, onDelete }: PatternLibraryProps) {
  const [activeTab, setActiveTab] = useState<TabValue>(ALL_TAB)

  const filtered =
    activeTab === ALL_TAB
      ? patterns
      : patterns.filter((p) => p.pattern_type === activeTab)

  const countFor = (tab: TabValue) =>
    tab === ALL_TAB
      ? patterns.length
      : patterns.filter((p) => p.pattern_type === tab).length

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Filtrar por tipo de patron"
        className="flex flex-wrap gap-2"
      >
        {([ALL_TAB, ...PATTERN_TYPES] as TabValue[]).map((tab) => {
          const count = countFor(tab)
          const label = tab === ALL_TAB ? 'Todos' : TYPE_LABELS[tab as PatternType]
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={`
                inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                border transition-all duration-200
                ${isActive
                  ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                  : 'bg-surface text-foreground-muted border-border hover:border-primary-300 hover:text-foreground'}
              `}
            >
              {label}
              <span
                className={`
                  inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
                  ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}
                `}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Pattern grid */}
      {filtered.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <div
          role="tabpanel"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
