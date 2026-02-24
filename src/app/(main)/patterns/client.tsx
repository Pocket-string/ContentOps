'use client'

import type { Pattern, CreatePatternInput } from '@/shared/types/content-ops'
import { PatternLibrary } from '@/features/patterns/components/PatternLibrary'
import { deletePatternAction, createPatternAction } from '@/features/patterns/actions/pattern-actions'
import { useState } from 'react'
import { PATTERN_TYPES } from '@/shared/types/content-ops'
import type { PatternType } from '@/shared/types/content-ops'

// ---- Type labels for form ----

const TYPE_LABELS: Record<PatternType, string> = {
  hook: 'Hook',
  cta: 'CTA',
  visual_format: 'Formato Visual',
  topic_angle: 'Angulo de Tema',
  content_structure: 'Estructura de Contenido',
}

// ---- Inline icons ----

function PlusIcon({ c }: { c?: string }) {
  return (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function XIcon({ c }: { c?: string }) {
  return (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ---- Add Pattern Form ----

interface AddPatternFormProps {
  onClose: () => void
  onCreated: (pattern: Pattern) => void
}

function AddPatternForm({ onClose, onCreated }: AddPatternFormProps) {
  const [patternType, setPatternType] = useState<PatternType>('hook')
  const [content, setContent] = useState('')
  const [funnelStage, setFunnelStage] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [dgpiScore, setDgpiScore] = useState('')
  const [engagementRate, setEngagementRate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) {
      setError('El contenido es requerido')
      return
    }

    setIsSaving(true)
    setError('')

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const input: CreatePatternInput = {
      pattern_type: patternType,
      content: content.trim(),
      tags,
      context: funnelStage ? { funnel_stage: funnelStage } : undefined,
      performance: {
        ...(dgpiScore ? { dgpi_score: Number(dgpiScore) } : {}),
        ...(engagementRate ? { engagement_rate: Number(engagementRate) } : {}),
      },
    }

    const result = await createPatternAction(input)
    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.data) {
      onCreated(result.data)
      onClose()
    }
  }

  const INPUT_CLS = 'w-full px-3 py-2 bg-background text-foreground border border-border hover:border-border-dark rounded-xl placeholder:text-foreground-muted text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent'
  const LABEL_CLS = 'block text-sm font-medium text-foreground mb-1.5'

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-foreground">Agregar Patron</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Cerrar formulario"
        >
          <XIcon c="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pattern type */}
        <div>
          <label htmlFor="pattern-type" className={LABEL_CLS}>Tipo de patron</label>
          <select
            id="pattern-type"
            value={patternType}
            onChange={(e) => setPatternType(e.target.value as PatternType)}
            className={INPUT_CLS}
          >
            {PATTERN_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div>
          <label htmlFor="pattern-content" className={LABEL_CLS}>Contenido del patron</label>
          <textarea
            id="pattern-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Ej. ¿Sabias que el 40% de las plantas solares pierden rendimiento por soiling no detectado?"
            className={INPUT_CLS + ' resize-none leading-relaxed'}
            required
          />
        </div>

        {/* Context */}
        <div>
          <label htmlFor="funnel-stage" className={LABEL_CLS}>Etapa del funnel (opcional)</label>
          <select
            id="funnel-stage"
            value={funnelStage}
            onChange={(e) => setFunnelStage(e.target.value)}
            className={INPUT_CLS}
          >
            <option value="">Sin especificar</option>
            <option value="tofu_problem">TOFU Problema</option>
            <option value="mofu_problem">MOFU Problema</option>
            <option value="tofu_solution">TOFU Solucion</option>
            <option value="mofu_solution">MOFU Solucion</option>
            <option value="bofu_conversion">BOFU Conversion</option>
          </select>
        </div>

        {/* Performance */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="dgpi-score" className={LABEL_CLS}>D/G/P/I Score (0-20)</label>
            <input
              id="dgpi-score"
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={dgpiScore}
              onChange={(e) => setDgpiScore(e.target.value)}
              placeholder="Ej. 16.5"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="engagement-rate" className={LABEL_CLS}>Engagement rate (%)</label>
            <input
              id="engagement-rate"
              type="number"
              min="0"
              step="0.1"
              value={engagementRate}
              onChange={(e) => setEngagementRate(e.target.value)}
              placeholder="Ej. 8.3"
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="pattern-tags" className={LABEL_CLS}>Tags (separados por coma)</label>
          <input
            id="pattern-tags"
            type="text"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="Ej. soiling, tofu, pregunta"
            className={INPUT_CLS}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground-muted bg-surface border border-border rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : 'Guardar Patron'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ---- PatternsClient ----

interface PatternsClientProps {
  initialPatterns: Pattern[]
}

export function PatternsClient({ initialPatterns }: PatternsClientProps) {
  const [patterns, setPatterns] = useState<Pattern[]>(initialPatterns)
  const [showForm, setShowForm] = useState(false)

  async function handleDelete(patternId: string): Promise<{ error?: string }> {
    const result = await deletePatternAction(patternId)
    if (!result.error) {
      setPatterns((prev) => prev.filter((p) => p.id !== patternId))
    }
    return { error: result.error }
  }

  function handleCreated(pattern: Pattern) {
    setPatterns((prev) => [pattern, ...prev])
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-muted">
          {patterns.length === 0
            ? 'Sin patrones guardados.'
            : `${patterns.length} patron${patterns.length === 1 ? '' : 'es'} guardado${patterns.length === 1 ? '' : 's'}.`}
        </p>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors"
          >
            <PlusIcon c="w-4 h-4" />
            Nuevo Patron
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <AddPatternForm
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Library */}
      <PatternLibrary patterns={patterns} onDelete={handleDelete} />
    </div>
  )
}
