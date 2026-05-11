'use client'

/**
 * PRP-013: ArchetypeSelector — grid de 9 cards para elegir archetype visual.
 *
 * Cada card:
 * - Emoji thumbnail
 * - Display name + descripción 1-line
 * - Badge funnel target
 * - Badge "📎 lucvia" si flow es capture_overlay
 * - Badge "⭐ Recomendado" si matchea la estructura editorial del post
 */

import { useMemo } from 'react'

import { ARCHETYPE_REGISTRY, recommendArchetype } from '@/features/visuals/constants/archetypes'
import type { ArchetypeSlug } from '@/features/visuals/types/archetype'

interface Props {
  value: ArchetypeSlug | null
  onSelect: (slug: ArchetypeSlug) => void
  /** Pasar la estructura editorial del post para marcar la card recomendada. */
  recommendedForStructure?: string | null
  /** Show only a subset of archetypes (default: all 9). */
  filter?: ArchetypeSlug[]
  disabled?: boolean
}

const ARCHETYPES_ORDER: ArchetypeSlug[] = [
  'screenshot_annotated',
  'dashboard_annotated',
  'carousel_mini_report',
  'data_decision_flow',
  'before_after',
  'field_photo_overlay',
  'founder_proof',
  'technical_report',
  'risk_card',
]

export function ArchetypeSelector({
  value,
  onSelect,
  recommendedForStructure,
  filter,
  disabled = false,
}: Props) {
  const recommended = useMemo(() => recommendArchetype(recommendedForStructure), [recommendedForStructure])
  const visibleArchetypes = filter ?? ARCHETYPES_ORDER

  return (
    <div className="space-y-3" data-testid="archetype-selector">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">Elegí archetype visual</h3>
        <span className="text-xs text-muted-foreground">PRP-013</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {visibleArchetypes.map((slug) => {
          const def = ARCHETYPE_REGISTRY[slug]
          const isSelected = value === slug
          const isRecommended = recommended === slug
          const isCaptureFlow = def.generationFlow === 'capture_overlay'

          return (
            <button
              key={slug}
              type="button"
              onClick={() => !disabled && onSelect(slug)}
              disabled={disabled}
              data-testid={`archetype-card-${slug}`}
              aria-pressed={isSelected}
              className={[
                'rounded-xl border-2 p-3 text-left transition-all',
                'flex flex-col gap-2 min-h-[140px]',
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-border bg-white hover:border-primary-300 hover:bg-primary-25',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-2xl leading-none" aria-hidden>
                  {def.thumbnailEmoji}
                </span>
                <div className="flex flex-col items-end gap-1">
                  {isRecommended && (
                    <span
                      className="text-[10px] font-semibold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded"
                      title="Recomendado para esta estructura editorial"
                    >
                      ⭐ Reco
                    </span>
                  )}
                  {isCaptureFlow && (
                    <span
                      className="text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded"
                      title="Usa captura real de lucvia/mantenimiento"
                    >
                      📎 Real
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-sm font-semibold text-foreground leading-tight">
                  {def.displayName}
                </div>
                <p className="text-xs text-muted-foreground leading-snug line-clamp-3">
                  {def.description}
                </p>
              </div>

              <div className="mt-auto flex flex-wrap gap-1">
                {def.funnelTargets.map((funnel) => (
                  <span
                    key={funnel}
                    className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                  >
                    {funnel}
                  </span>
                ))}
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {def.defaultFormat}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {value && (
        <p className="text-xs text-muted-foreground">
          Archetype seleccionado: <strong>{ARCHETYPE_REGISTRY[value].displayName}</strong>.
          {ARCHETYPE_REGISTRY[value].generationFlow === 'capture_overlay' && (
            <> Pipeline: capturar base real → componer anotaciones overlay (no AI mockup).</>
          )}
        </p>
      )}
    </div>
  )
}
