'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { WeeklyBrief, PublishingPlan } from '@/shared/types/content-ops'

// ---- Types ----

interface TopicData {
  title: string
  evidence: string | null
  anti_myth: string | null
  signals_json: string[]
  silent_enemy_name: string | null
}

interface WeeklyBriefFormProps {
  brief: WeeklyBrief | null
  publishingPlan: PublishingPlan | null
  topicData?: TopicData | null
  keyword?: string
  onSave: (brief: WeeklyBrief, plan?: PublishingPlan) => Promise<{ error?: string } | void>
}

// ---- Constants ----

const DAYS = [
  { key: '1', label: 'Lunes' },
  { key: '2', label: 'Martes' },
  { key: '3', label: 'Miercoles' },
  { key: '4', label: 'Jueves' },
  { key: '5', label: 'Viernes' },
]

const TEXTAREA_BASE =
  'w-full px-4 py-2.5 bg-surface text-foreground border border-border rounded-xl placeholder:text-foreground-muted resize-y transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent hover:border-border-dark'

// ---- Component ----

export function WeeklyBriefForm({
  brief,
  publishingPlan,
  topicData,
  keyword,
  onSave,
}: WeeklyBriefFormProps) {
  // Brief fields
  const [tema, setTema] = useState(brief?.tema ?? '')
  const [enemigoSilencioso, setEnemigoSilencioso] = useState(brief?.enemigo_silencioso ?? '')
  const [evidenciaClave, setEvidenciaClave] = useState(brief?.evidencia_clave ?? '')
  const [senalesMercado, setSenalesMercado] = useState(
    brief?.senales_mercado?.join(', ') ?? ''
  )
  const [antiMito, setAntiMito] = useState(brief?.anti_mito ?? '')
  const [buyerPersona, setBuyerPersona] = useState(brief?.buyer_persona ?? '')
  const [kwField, setKwField] = useState(brief?.keyword ?? keyword ?? '')
  const [recurso, setRecurso] = useState(brief?.recurso ?? '')
  const [restriccionLinks, setRestriccionLinks] = useState(brief?.restriccion_links ?? true)
  const [toneRules, setToneRules] = useState(brief?.tone_rules ?? '')

  // Publishing plan
  const [plan, setPlan] = useState<Record<string, { suggested_time: string; notes: string }>>(() => {
    const initial: Record<string, { suggested_time: string; notes: string }> = {}
    for (const d of DAYS) {
      initial[d.key] = {
        suggested_time: publishingPlan?.[d.key]?.suggested_time ?? '',
        notes: publishingPlan?.[d.key]?.notes ?? '',
      }
    }
    return initial
  })

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ---- Handlers ----

  function handleAutoFill() {
    if (!topicData) return
    setTema(topicData.title)
    if (topicData.silent_enemy_name) setEnemigoSilencioso(topicData.silent_enemy_name)
    if (topicData.evidence) setEvidenciaClave(topicData.evidence)
    if (topicData.signals_json.length > 0) setSenalesMercado(topicData.signals_json.join(', '))
    if (topicData.anti_myth) setAntiMito(topicData.anti_myth)
  }

  function handlePlanChange(
    dayKey: string,
    field: 'suggested_time' | 'notes',
    value: string
  ) {
    setPlan((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!tema.trim()) {
      setError('El tema es requerido')
      return
    }

    const briefData: WeeklyBrief = {
      tema: tema.trim(),
      enemigo_silencioso: enemigoSilencioso.trim() || undefined,
      evidencia_clave: evidenciaClave.trim() || undefined,
      senales_mercado: senalesMercado
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      anti_mito: antiMito.trim() || undefined,
      buyer_persona: buyerPersona.trim() || undefined,
      keyword: kwField.trim() || undefined,
      recurso: recurso.trim() || undefined,
      restriccion_links: restriccionLinks,
      tone_rules: toneRules.trim() || undefined,
    }

    // Build publishing plan — only include entries that have data
    const planData: PublishingPlan = {}
    for (const d of DAYS) {
      const entry = plan[d.key]
      if (entry.suggested_time || entry.notes) {
        planData[d.key] = {
          suggested_time: entry.suggested_time || undefined,
          notes: entry.notes || undefined,
        }
      }
    }

    setIsSubmitting(true)
    try {
      const result = await onSave(
        briefData,
        Object.keys(planData).length > 0 ? planData : undefined
      )
      if (result && 'error' in result && result.error) {
        setError(result.error)
      } else {
        setSuccess('Brief guardado correctamente')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError('Error inesperado al guardar el brief')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---- Render ----

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
      aria-label="Weekly Brief"
    >
      {/* Error / success messages */}
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-error-50 border border-error-500 p-4"
        >
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-xl bg-green-50 border border-green-200 p-4"
        >
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Auto-fill banner */}
      {topicData && (
        <div className="flex items-center gap-3 px-4 py-3 bg-accent-50 border border-accent-200 rounded-xl">
          <p className="text-sm text-accent-700 flex-1">
            Puedes auto-rellenar el brief desde el tema asociado:{' '}
            <span className="font-semibold">{topicData.title}</span>
          </p>
          <Button type="button" variant="outline" size="sm" onClick={handleAutoFill}>
            Auto-rellenar
          </Button>
        </div>
      )}

      {/* Tema */}
      <Input
        id="brief-tema"
        label="Tema de la semana *"
        placeholder="Ej: El costo oculto del soiling no monitoreado"
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        required
        aria-required="true"
      />

      {/* Enemigo silencioso */}
      <Input
        id="brief-enemigo"
        label="Enemigo silencioso"
        placeholder="Ej: La acumulacion invisible de polvo"
        value={enemigoSilencioso}
        onChange={(e) => setEnemigoSilencioso(e.target.value)}
      />

      {/* Evidencia clave */}
      <div className="w-full">
        <label
          htmlFor="brief-evidencia"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Evidencia clave
        </label>
        <textarea
          id="brief-evidencia"
          value={evidenciaClave}
          onChange={(e) => setEvidenciaClave(e.target.value)}
          placeholder="Datos que respaldan el tema..."
          rows={3}
          className={`${TEXTAREA_BASE} min-h-[80px]`}
        />
      </div>

      {/* Senales del mercado */}
      <Input
        id="brief-senales"
        label="Senales del mercado"
        placeholder="preguntas en LinkedIn, tendencia en Google, evento reciente"
        hint="Separa multiples senales con comas"
        value={senalesMercado}
        onChange={(e) => setSenalesMercado(e.target.value)}
      />

      {/* Anti-mito */}
      <div className="w-full">
        <label
          htmlFor="brief-anti-mito"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Anti-mito
        </label>
        <textarea
          id="brief-anti-mito"
          value={antiMito}
          onChange={(e) => setAntiMito(e.target.value)}
          placeholder="Mito que vas a derribar esta semana..."
          rows={2}
          className={`${TEXTAREA_BASE} min-h-[60px]`}
        />
      </div>

      {/* Buyer persona + Keyword */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="brief-buyer-persona"
          label="Buyer Persona"
          placeholder="Ej: Director de O&M utility-scale"
          value={buyerPersona}
          onChange={(e) => setBuyerPersona(e.target.value)}
        />
        <Input
          id="brief-keyword"
          label="Keyword"
          placeholder="Ej: soiling fotovoltaico"
          value={kwField}
          onChange={(e) => setKwField(e.target.value)}
        />
      </div>

      {/* Recurso */}
      <Input
        id="brief-recurso"
        label="Recurso (CTA material)"
        placeholder="Ej: Calculadora de soiling gratuita"
        value={recurso}
        onChange={(e) => setRecurso(e.target.value)}
      />

      {/* Restriccion de links toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={restriccionLinks}
          onClick={() => setRestriccionLinks(!restriccionLinks)}
          className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2
            ${restriccionLinks ? 'bg-accent-500' : 'bg-gray-200'}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
              transform ring-0 transition duration-200 ease-in-out
              ${restriccionLinks ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
        <span className="text-sm text-foreground">
          Restriccion de links externos en posts
        </span>
      </div>

      {/* Reglas de tono */}
      <div className="w-full">
        <label
          htmlFor="brief-tone-rules"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Reglas de tono
        </label>
        <textarea
          id="brief-tone-rules"
          value={toneRules}
          onChange={(e) => setToneRules(e.target.value)}
          placeholder="Ej: Tono tecnico pero accesible, sin jerga excesiva, datos siempre con fuente..."
          rows={2}
          className={`${TEXTAREA_BASE} min-h-[60px]`}
        />
      </div>

      {/* Publishing Plan */}
      <div className="border-t border-border pt-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Plan de Publicacion (opcional)
        </h3>
        <div className="space-y-3">
          {DAYS.map((d) => (
            <div
              key={d.key}
              className="grid grid-cols-[100px_1fr_1fr] gap-3 items-center"
            >
              <span className="text-sm font-medium text-foreground">{d.label}</span>
              <Input
                id={`plan-time-${d.key}`}
                type="time"
                value={plan[d.key].suggested_time}
                onChange={(e) => handlePlanChange(d.key, 'suggested_time', e.target.value)}
                aria-label={`Hora sugerida para el ${d.label}`}
              />
              <Input
                id={`plan-notes-${d.key}`}
                value={plan[d.key].notes}
                onChange={(e) => handlePlanChange(d.key, 'notes', e.target.value)}
                placeholder="Notas del dia..."
                aria-label={`Notas para el ${d.label}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          Guardar Brief
        </Button>
      </div>
    </form>
  )
}
