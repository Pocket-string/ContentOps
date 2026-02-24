'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { TOPIC_PRIORITIES } from '@/shared/types/content-ops'
import type { Topic, CreateTopicInput } from '@/shared/types/content-ops'

interface TopicFormProps {
  topic?: Topic
  initialData?: Partial<CreateTopicInput>
  onSubmit: (data: CreateTopicInput) => Promise<{ error?: string } | void>
  onSuccess?: () => void
}

const PRIORITY_OPTIONS = TOPIC_PRIORITIES.map((p) => ({
  value: p,
  label: p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : 'Alta',
}))

function parseSignals(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function signalsToString(signals: string[]): string {
  return signals.join(', ')
}

export function TopicForm({ topic, initialData, onSubmit, onSuccess }: TopicFormProps) {
  const isEditing = Boolean(topic)

  const [title, setTitle] = useState(topic?.title ?? initialData?.title ?? '')
  const [hypothesis, setHypothesis] = useState(topic?.hypothesis ?? initialData?.hypothesis ?? '')
  const [evidence, setEvidence] = useState(topic?.evidence ?? initialData?.evidence ?? '')
  const [antiMyth, setAntiMyth] = useState(topic?.anti_myth ?? initialData?.anti_myth ?? '')
  const [signals, setSignals] = useState(
    topic ? signalsToString(topic.signals_json) : signalsToString(initialData?.signals_json ?? [])
  )
  const [fitScore, setFitScore] = useState<string>(
    topic?.fit_score != null
      ? String(topic.fit_score)
      : initialData?.fit_score != null
      ? String(initialData.fit_score)
      : ''
  )
  const [priority, setPriority] = useState(
    topic?.priority ?? initialData?.priority ?? 'medium'
  )

  const [silentEnemyName, setSilentEnemyName] = useState(topic?.silent_enemy_name ?? initialData?.silent_enemy_name ?? '')
  const [minimalProof, setMinimalProof] = useState(topic?.minimal_proof ?? initialData?.minimal_proof ?? '')
  const [failureModes, setFailureModes] = useState(
    topic ? topic.failure_modes.join(', ') : (initialData?.failure_modes ?? []).join(', ')
  )
  const [businessImpact, setBusinessImpact] = useState(topic?.expected_business_impact ?? initialData?.expected_business_impact ?? '')
  const [showEnemySection, setShowEnemySection] = useState(false)

  const [titleError, setTitleError] = useState('')
  const [fitScoreError, setFitScoreError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): boolean {
    let valid = true

    if (!title.trim()) {
      setTitleError('El titulo es requerido')
      valid = false
    } else {
      setTitleError('')
    }

    if (fitScore !== '') {
      const num = Number(fitScore)
      if (isNaN(num) || num < 0 || num > 10) {
        setFitScoreError('El Fit Score debe ser un numero entre 0 y 10')
        valid = false
      } else {
        setFitScoreError('')
      }
    } else {
      setFitScoreError('')
    }

    return valid
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError('')

    if (!validate()) return

    const data: CreateTopicInput = {
      title: title.trim(),
      hypothesis: hypothesis.trim() || undefined,
      evidence: evidence.trim() || undefined,
      anti_myth: antiMyth.trim() || undefined,
      signals_json: parseSignals(signals),
      fit_score: fitScore !== '' ? Number(fitScore) : undefined,
      priority: priority as CreateTopicInput['priority'],
      silent_enemy_name: silentEnemyName.trim() || undefined,
      minimal_proof: minimalProof.trim() || undefined,
      failure_modes: failureModes.split(',').map((s) => s.trim()).filter(Boolean),
      expected_business_impact: businessImpact.trim() || undefined,
    }

    setIsSubmitting(true)
    try {
      const result = await onSubmit(data)
      if (result?.error) {
        setSubmitError(result.error)
      } else {
        onSuccess?.()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={isEditing ? 'Editar tema' : 'Crear tema'}>
      <div className="space-y-6">
        {/* Title */}
        <Input
          id="topic-title"
          label="Titulo *"
          placeholder="Ej: El verdadero costo del polvo en paneles solares"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={titleError}
          required
          aria-required="true"
        />

        {/* Hypothesis */}
        <div className="w-full">
          <label
            htmlFor="topic-hypothesis"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Hipotesis
          </label>
          <p className="text-xs text-foreground-muted mb-2">
            Que creencia quieres desafiar?
          </p>
          <textarea
            id="topic-hypothesis"
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            placeholder="Ej: La gente cree que el polvo solo afecta marginalmente la produccion..."
            rows={3}
            className="w-full px-4 py-2.5 bg-surface text-foreground border border-border rounded-xl
              placeholder:text-foreground-muted resize-y min-h-[80px]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
              hover:border-border-dark"
          />
        </div>

        {/* Evidence */}
        <div className="w-full">
          <label
            htmlFor="topic-evidence"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Evidencia
          </label>
          <p className="text-xs text-foreground-muted mb-2">
            Datos/hechos que soportan tu posicion
          </p>
          <textarea
            id="topic-evidence"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Ej: Estudio MIT 2023: perdida promedio de 25% de produccion en zonas aridas..."
            rows={3}
            className="w-full px-4 py-2.5 bg-surface text-foreground border border-border rounded-xl
              placeholder:text-foreground-muted resize-y min-h-[80px]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
              hover:border-border-dark"
          />
        </div>

        {/* Anti-myth */}
        <div className="w-full">
          <label
            htmlFor="topic-anti-myth"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Anti-Mito
          </label>
          <p className="text-xs text-foreground-muted mb-2">
            Mito que vas a derribar
          </p>
          <textarea
            id="topic-anti-myth"
            value={antiMyth}
            onChange={(e) => setAntiMyth(e.target.value)}
            placeholder="Ej: 'La lluvia limpia los paneles' — falso en zonas con baja precipitacion..."
            rows={3}
            className="w-full px-4 py-2.5 bg-surface text-foreground border border-border rounded-xl
              placeholder:text-foreground-muted resize-y min-h-[80px]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
              hover:border-border-dark"
          />
        </div>

        {/* Enemigo Silencioso (collapsible) */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowEnemySection(!showEnemySection)}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-accent-600 hover:text-accent-700 hover:bg-surface-raised transition-colors text-left"
            aria-expanded={showEnemySection}
            aria-controls="enemy-section"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showEnemySection ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Enemigo Silencioso (opcional)
          </button>

          {showEnemySection && (
            <div id="enemy-section" className="px-4 pb-4 pt-1 space-y-4 border-t border-border">
              {/* Silent enemy name */}
              <Input
                id="topic-silent-enemy-name"
                label="Nombre del enemigo silencioso"
                placeholder="Ej: El polvo invisible"
                value={silentEnemyName}
                onChange={(e) => setSilentEnemyName(e.target.value)}
              />

              {/* Minimal proof */}
              <div className="w-full">
                <label
                  htmlFor="topic-minimal-proof"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Prueba minima
                </label>
                <textarea
                  id="topic-minimal-proof"
                  value={minimalProof}
                  onChange={(e) => setMinimalProof(e.target.value)}
                  placeholder="Como evidenciar este problema con una accion simple"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface text-foreground border border-border rounded-xl
                    placeholder:text-foreground-muted resize-y min-h-[80px]
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
                    hover:border-border-dark"
                />
              </div>

              {/* Failure modes */}
              <Input
                id="topic-failure-modes"
                label="Modos de falla"
                placeholder="No medir, Medir sin corregir temperatura"
                hint="Separa multiples modos con comas"
                value={failureModes}
                onChange={(e) => setFailureModes(e.target.value)}
              />

              {/* Expected business impact */}
              <div className="w-full">
                <label
                  htmlFor="topic-business-impact"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Impacto de negocio esperado
                </label>
                <textarea
                  id="topic-business-impact"
                  value={businessImpact}
                  onChange={(e) => setBusinessImpact(e.target.value)}
                  placeholder="Ej: 3-8% perdida anual por soiling no detectado"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface text-foreground border border-border rounded-xl
                    placeholder:text-foreground-muted resize-y min-h-[80px]
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
                    hover:border-border-dark"
                />
              </div>
            </div>
          )}
        </div>

        {/* Signals */}
        <Input
          id="topic-signals"
          label="Senales del mercado"
          placeholder="Ej: preguntas en LinkedIn, tendencia en Google, evento reciente"
          hint="Separa multiples senales con comas"
          value={signals}
          onChange={(e) => setSignals(e.target.value)}
        />

        {/* Fit Score + Priority row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="topic-fit-score"
            label="Fit Score (0-10)"
            type="number"
            min={0}
            max={10}
            step={1}
            placeholder="Ej: 8"
            value={fitScore}
            onChange={(e) => setFitScore(e.target.value)}
            error={fitScoreError}
          />
          <Select
            id="topic-priority"
            label="Prioridad"
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={(e) => setPriority(e.target.value as CreateTopicInput['priority'])}
          />
        </div>

        {/* Submit error */}
        {submitError && (
          <p role="alert" className="text-sm text-error-500 bg-error-50 px-4 py-3 rounded-xl">
            {submitError}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditing ? 'Actualizar' : 'Guardar Tema'}
          </Button>
        </div>
      </div>
    </form>
  )
}
