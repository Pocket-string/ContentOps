'use client'

import type { ContentPillar } from '@/shared/types/content-ops'

interface PillarSelectorProps {
  pillars: ContentPillar[]
  value?: string
  onChange: (pillarId: string | undefined) => void
  label?: string
}

export function PillarSelector({
  pillars,
  value,
  onChange,
  label = 'Pilar de contenido',
}: PillarSelectorProps) {
  const selectId = 'pillar-selector'

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value || undefined)
  }

  const activePillars = pillars.filter((p) => p.is_active)

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value ?? ''}
        onChange={handleChange}
        className="
          w-full rounded-lg border border-border bg-surface
          px-3 py-2 text-sm text-foreground
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
          hover:border-border-dark
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        aria-label={label}
      >
        <option value="">Sin pilar</option>
        {activePillars.map((pillar) => (
          <option key={pillar.id} value={pillar.id}>
            {pillar.name}
          </option>
        ))}
        {/* Show inactive pillars only when the current value is one of them */}
        {pillars
          .filter((p) => !p.is_active && p.id === value)
          .map((pillar) => (
            <option key={pillar.id} value={pillar.id}>
              {pillar.name} (inactivo)
            </option>
          ))}
      </select>
    </div>
  )
}
