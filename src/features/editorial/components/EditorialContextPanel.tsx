'use client'

import { useState } from 'react'
import { Select } from '@/components/ui/select'
import type { EditorialPillar } from '../types/pillar'
import type { AudienceProfile } from '../types/audience'

interface Props {
  pillars: EditorialPillar[]
  audiences: AudienceProfile[]
  currentPillarId: string | null
  currentAudienceId: string | null
  onPillarChange?: (pillarId: string | null) => Promise<{ error?: string } | void>
  onAudienceChange?: (audienceId: string | null) => Promise<{ error?: string } | void>
}

/**
 * PRP-012 Fase 1: Editorial Context Panel
 * Renders 2 selects (pilar + audiencia) inside CampaignBuilder header.
 * Auto-saves on change via callbacks.
 */
export function EditorialContextPanel({
  pillars,
  audiences,
  currentPillarId,
  currentAudienceId,
  onPillarChange,
  onAudienceChange,
}: Props) {
  const [savingPillar, setSavingPillar] = useState(false)
  const [savingAudience, setSavingAudience] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pillarOptions = [
    { value: '', label: '— Sin pilar editorial —' },
    ...pillars.map((p) => ({ value: p.id, label: p.name })),
  ]

  const audienceOptions = [
    { value: '', label: '— Sin audiencia objetivo —' },
    ...audiences.map((a) => ({ value: a.id, label: a.role })),
  ]

  async function handlePillar(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!onPillarChange) return
    setSavingPillar(true)
    setError(null)
    const next = e.target.value || null
    const result = await onPillarChange(next)
    if (result && 'error' in result && result.error) {
      setError(result.error)
    }
    setSavingPillar(false)
  }

  async function handleAudience(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!onAudienceChange) return
    setSavingAudience(true)
    setError(null)
    const next = e.target.value || null
    const result = await onAudienceChange(next)
    if (result && 'error' in result && result.error) {
      setError(result.error)
    }
    setSavingAudience(false)
  }

  const selectedPillar = pillars.find((p) => p.id === currentPillarId) ?? null
  const selectedAudience = audiences.find((a) => a.id === currentAudienceId) ?? null

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Contexto Operacional
        </span>
        <span className="text-xs text-foreground-muted">·</span>
        <span className="text-xs text-foreground-muted">PRP-012</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            label="Pilar editorial"
            options={pillarOptions}
            value={currentPillarId ?? ''}
            onChange={handlePillar}
            disabled={savingPillar || !onPillarChange}
            className="text-sm"
          />
          {selectedPillar && (
            <p className="mt-1 text-xs text-foreground-muted line-clamp-2">
              {selectedPillar.description}
            </p>
          )}
        </div>
        <div>
          <Select
            label="Audiencia objetivo"
            options={audienceOptions}
            value={currentAudienceId ?? ''}
            onChange={handleAudience}
            disabled={savingAudience || !onAudienceChange}
            className="text-sm"
          />
          {selectedAudience && (
            <p className="mt-1 text-xs text-foreground-muted line-clamp-2">
              {selectedAudience.dolor_principal}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-error-500" role="alert">{error}</p>
      )}
    </div>
  )
}
