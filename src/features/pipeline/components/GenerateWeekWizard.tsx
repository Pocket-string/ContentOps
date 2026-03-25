'use client'

import { useState, useEffect, useCallback } from 'react'
import { startPipelineAction, getPipelineStatusAction } from '@/features/pipeline/actions/pipeline-actions'
import type { PipelineStatus, PipelineStage } from '@/shared/types/content-ops'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GenerateWeekWizardProps {
  pillars: Array<{ id: string; name: string }>
  onComplete?: (campaignId: string) => void
}

interface FormValues {
  tema: string
  buyer_persona: string
  keyword: string
  pillar_id: string
  week_start: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<PipelineStage, string> = {
  research: 'Investigacion',
  topic: 'Tema',
  campaign: 'Campana',
  copy: 'Copy',
  visual: 'Visual',
  review: 'Revision',
  complete: 'Completo',
  error: 'Error',
}

const STAGE_ORDER: PipelineStage[] = ['research', 'topic', 'campaign', 'copy', 'visual', 'review', 'complete']

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-2 mb-6" aria-label="Progreso del wizard">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const step = i + 1
        const isDone = step < currentStep
        const isActive = step === currentStep
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}
              aria-current={isActive ? 'step' : undefined}
            >
              {isDone ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : step}
            </div>
            {step < totalSteps && (
              <div className={`h-0.5 w-10 ${isDone ? 'bg-green-500' : 'bg-gray-200'}`} aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ProgressView({
  status,
  campaignId,
  onComplete,
}: {
  status: PipelineStatus
  campaignId: string
  onComplete?: (id: string) => void
}) {
  const isComplete = status.stage === 'complete'
  const isError = status.stage === 'error'
  const stageLabel = STAGE_LABELS[status.stage] ?? status.stage
  const stageIndex = STAGE_ORDER.indexOf(status.stage)

  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Estado del pipeline">
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {isComplete ? 'Pipeline completado' : isError ? 'Pipeline con errores' : 'Generando semana...'}
        </p>
        <p className="text-lg font-semibold text-gray-900">
          {stageLabel}
          {(status.current_post_index !== undefined && status.total_posts !== undefined) &&
            ` — Post ${status.current_post_index + 1} de ${status.total_posts}`}
        </p>
      </div>

      {/* Stage progress track */}
      <div className="flex items-center gap-1 justify-between" aria-hidden="true">
        {STAGE_ORDER.slice(0, -1).map((stage, i) => {
          const isReached = i <= stageIndex
          return (
            <div key={stage} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  isReached ? (isError && i === stageIndex ? 'bg-red-400' : 'bg-primary-500') : 'bg-gray-200'
                }`}
              />
              <span className={`text-xs ${isReached ? 'text-primary-700 font-medium' : 'text-gray-400'}`}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Numeric progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progreso</span>
          <span>{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${isError ? 'bg-red-500' : 'bg-primary-600'}`}
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>

      {/* Errors */}
      {status.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-red-700">Errores encontrados:</p>
          <ul className="space-y-1">
            {status.errors.map((err, i) => (
              <li key={i} className="text-xs text-red-600">
                <span className="font-medium">{err.step}:</span> {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Complete action */}
      {isComplete && (
        <div className="text-center space-y-3">
          <p className="text-sm text-green-700 font-medium">La semana fue generada correctamente.</p>
          <button
            type="button"
            onClick={() => {
              if (onComplete) {
                onComplete(campaignId)
              } else {
                window.location.href = `/campaigns/${campaignId}`
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Ver Semana Generada
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GenerateWeekWizard({ pillars, onComplete }: GenerateWeekWizardProps) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormValues>({
    tema: '',
    buyer_persona: '',
    keyword: '',
    pillar_id: '',
    week_start: '',
  })
  const [errors, setErrors] = useState<Partial<FormValues>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // Polling: every 3 seconds while pipeline is running
  const poll = useCallback(async (id: string) => {
    const result = await getPipelineStatusAction(id)
    if (result.error || !result.status) return
    setPipelineStatus(result.status)
    if (result.status.stage === 'complete' || result.status.stage === 'error') {
      setIsPolling(false)
    }
  }, [])

  useEffect(() => {
    if (!isPolling || !campaignId) return
    poll(campaignId)
    const interval = setInterval(() => poll(campaignId), 3000)
    return () => clearInterval(interval)
  }, [isPolling, campaignId, poll])

  function setField(key: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  function validateStep1() {
    const errs: Partial<FormValues> = {}
    if (!form.tema.trim() || form.tema.trim().length < 3) {
      errs.tema = 'El tema debe tener al menos 3 caracteres'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2() {
    const errs: Partial<FormValues> = {}
    if (!form.week_start) {
      errs.week_start = 'La fecha de inicio es requerida'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNextStep1() {
    if (validateStep1()) setStep(2)
  }

  function handleNextStep2() {
    if (validateStep2()) setStep(3)
  }

  async function handleSubmit() {
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('tema', form.tema.trim())
      if (form.buyer_persona.trim()) fd.append('buyer_persona', form.buyer_persona.trim())
      if (form.keyword.trim()) fd.append('keyword', form.keyword.trim())
      if (form.pillar_id) fd.append('pillar_id', form.pillar_id)
      fd.append('week_start', form.week_start)

      const result = await startPipelineAction(fd)
      if (result.error) {
        setSubmitError(result.error)
        return
      }
      const id = result.data?.campaignId as string
      setCampaignId(id)
      setIsPolling(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Progress view (post-submit)
  // ---------------------------------------------------------------------------

  if (campaignId && pipelineStatus) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl mx-auto">
        <ProgressView
          status={pipelineStatus}
          campaignId={campaignId}
          onComplete={onComplete}
        />
      </div>
    )
  }

  if (campaignId && !pipelineStatus) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl mx-auto text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" aria-hidden="true" />
        <p className="text-sm text-gray-600">Iniciando pipeline...</p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Wizard steps
  // ---------------------------------------------------------------------------

  const selectedPillar = pillars.find((p) => p.id === form.pillar_id)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Generar Semana</h2>
        <p className="text-sm text-gray-500 mt-1">Configura los parametros para generar una semana completa de contenido.</p>
      </div>

      <StepIndicator currentStep={step} totalSteps={3} />

      {/* Step 1 */}
      {step === 1 && (
        <fieldset className="space-y-5">
          <legend className="text-base font-semibold text-gray-800 mb-4">Paso 1 — Tema y audiencia</legend>

          <div>
            <label htmlFor="tema" className="block text-sm font-medium text-gray-700 mb-1">
              Tema <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="tema"
              type="text"
              value={form.tema}
              onChange={(e) => setField('tema', e.target.value)}
              placeholder="Ej: Limpieza de paneles solares en zonas desertidas"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors
                ${errors.tema ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
              aria-required="true"
              aria-describedby={errors.tema ? 'tema-error' : undefined}
            />
            {errors.tema && (
              <p id="tema-error" className="mt-1 text-xs text-red-600" role="alert">{errors.tema}</p>
            )}
          </div>

          <div>
            <label htmlFor="buyer_persona" className="block text-sm font-medium text-gray-700 mb-1">
              Buyer Persona <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              id="buyer_persona"
              type="text"
              value={form.buyer_persona}
              onChange={(e) => setField('buyer_persona', e.target.value)}
              placeholder="Ej: Gerente de O&M de planta fotovoltaica"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors bg-white"
            />
          </div>

          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
              Keyword principal <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              id="keyword"
              type="text"
              value={form.keyword}
              onChange={(e) => setField('keyword', e.target.value)}
              placeholder="Ej: soiling fotovoltaico"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors bg-white"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleNextStep1}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Siguiente
            </button>
          </div>
        </fieldset>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <fieldset className="space-y-5">
          <legend className="text-base font-semibold text-gray-800 mb-4">Paso 2 — Pillar y fecha</legend>

          {pillars.length > 0 && (
            <div>
              <label htmlFor="pillar_id" className="block text-sm font-medium text-gray-700 mb-1">
                Pilar de contenido <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <select
                id="pillar_id"
                value={form.pillar_id}
                onChange={(e) => setField('pillar_id', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors bg-white appearance-none"
              >
                <option value="">Sin pilar especifico</option>
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="week_start" className="block text-sm font-medium text-gray-700 mb-1">
              Inicio de semana <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="week_start"
              type="date"
              value={form.week_start}
              onChange={(e) => setField('week_start', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors
                ${errors.week_start ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
              aria-required="true"
              aria-describedby={errors.week_start ? 'week-start-error' : undefined}
            />
            {errors.week_start && (
              <p id="week-start-error" className="mt-1 text-xs text-red-600" role="alert">{errors.week_start}</p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-xl"
            >
              Atras
            </button>
            <button
              type="button"
              onClick={handleNextStep2}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Siguiente
            </button>
          </div>
        </fieldset>
      )}

      {/* Step 3 — Confirmation */}
      {step === 3 && (
        <div className="space-y-5">
          <p className="text-base font-semibold text-gray-800">Paso 3 — Confirmacion</p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
            <SummaryRow label="Tema" value={form.tema} />
            {form.buyer_persona && <SummaryRow label="Buyer Persona" value={form.buyer_persona} />}
            {form.keyword && <SummaryRow label="Keyword" value={form.keyword} />}
            {selectedPillar && <SummaryRow label="Pilar" value={selectedPillar.name} />}
            <SummaryRow
              label="Inicio de semana"
              value={new Date(form.week_start + 'T12:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
              })}
            />
          </div>

          <p className="text-xs text-gray-500">
            Se generaran 5 posts (Lunes a Viernes) con 3 variantes cada uno. El proceso tarda aproximadamente 2-3 minutos.
          </p>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3" role="alert">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-xl disabled:opacity-50"
            >
              Atras
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Iniciando...
                </>
              ) : 'Generar Semana'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-gray-500 font-medium w-32 shrink-0">{label}</span>
      <span className="text-gray-900 font-semibold">{value}</span>
    </div>
  )
}
