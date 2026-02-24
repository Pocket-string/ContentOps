'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { TagInput } from './TagInput'
import type { ResearchReport } from '@/shared/types/content-ops'

interface ResearchFormProps {
  research?: ResearchReport
  allTags?: string[]
  onSuccess?: () => void
  onSubmit: (data: {
    title: string
    source: string
    raw_text: string
    tags_json: string[]
    // Phase 1 new fields
    recency_date?: string
    market_region?: string
    buyer_persona?: string
    trend_score?: number
    fit_score?: number
    evidence_links: string[]
    key_takeaways: string[]
    recommended_angles: string[]
  }) => Promise<{ error?: string } | void>
}

interface FieldErrors {
  title?: string
  raw_text?: string
  trend_score?: string
  fit_score?: string
  form?: string
}

const MARKET_REGION_OPTIONS = [
  { value: '', label: 'Seleccionar region...' },
  { value: 'LATAM', label: 'LATAM' },
  { value: 'Europa', label: 'Europa' },
  { value: 'MENA', label: 'MENA' },
  { value: 'Asia', label: 'Asia' },
  { value: 'Global', label: 'Global' },
]

// ---------------------------------------------------------------------------
// DynamicStringList — inline helper component
// ---------------------------------------------------------------------------

interface DynamicStringListProps {
  label: string
  hint?: string
  placeholder?: string
  value: string[]
  onChange: (updated: string[]) => void
  addLabel?: string
}

function DynamicStringList({
  label,
  hint,
  placeholder = 'Escribe aqui...',
  value,
  onChange,
  addLabel = 'Agregar',
}: DynamicStringListProps) {
  function handleChange(index: number, newValue: string) {
    const updated = value.map((item, i) => (i === index ? newValue : item))
    onChange(updated)
  }

  function handleAdd() {
    onChange([...value, ''])
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="w-full">
      <p className="block text-sm font-medium text-foreground mb-1.5">{label}</p>
      {hint && <p className="text-xs text-foreground-muted mb-2">{hint}</p>}

      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={placeholder}
              className="
                flex-1 px-4 py-2.5
                bg-surface text-foreground
                border border-border rounded-xl
                placeholder:text-foreground-muted
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
                hover:border-border-dark
              "
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label={`Eliminar elemento ${index + 1}`}
              className="
                flex-shrink-0 w-8 h-8 flex items-center justify-center
                rounded-lg border border-border text-foreground-muted
                hover:border-error-500 hover:text-error-500 hover:bg-error-50
                transition-colors duration-200
              "
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M1 1L13 13M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="
          mt-2 flex items-center gap-1.5 text-sm text-accent-600
          hover:text-accent-700 transition-colors duration-200
        "
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M7 1V13M1 7H13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        {addLabel}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ResearchForm
// ---------------------------------------------------------------------------

export function ResearchForm({
  research,
  allTags = [],
  onSuccess,
  onSubmit,
}: ResearchFormProps) {
  const isEditMode = Boolean(research)

  // Existing fields
  const [title, setTitle] = useState(research?.title ?? '')
  const [source, setSource] = useState(research?.source ?? '')
  const [rawText, setRawText] = useState(research?.raw_text ?? '')
  const [tags, setTags] = useState<string[]>(research?.tags_json ?? [])

  // Phase 1 new fields
  const [recencyDate, setRecencyDate] = useState(research?.recency_date ?? '')
  const [marketRegion, setMarketRegion] = useState(research?.market_region ?? '')
  const [buyerPersona, setBuyerPersona] = useState(research?.buyer_persona ?? '')
  const [trendScore, setTrendScore] = useState<string>(
    research?.trend_score != null ? String(research.trend_score) : ''
  )
  const [fitScore, setFitScore] = useState<string>(
    research?.fit_score != null ? String(research.fit_score) : ''
  )
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>(
    research?.evidence_links ?? []
  )
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(
    research?.key_takeaways ?? []
  )
  const [recommendedAngles, setRecommendedAngles] = useState<string[]>(
    research?.recommended_angles ?? []
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [errors, setErrors] = useState<FieldErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!title.trim()) next.title = 'El titulo es requerido'
    if (rawText.trim().length < 10)
      next.raw_text = 'El texto debe tener al menos 10 caracteres'
    if (trendScore !== '') {
      const num = Number(trendScore)
      if (isNaN(num) || num < 0 || num > 10)
        next.trend_score = 'El Trend Score debe ser un numero entre 0 y 10'
    }
    if (fitScore !== '') {
      const num = Number(fitScore)
      if (isNaN(num) || num < 0 || num > 10)
        next.fit_score = 'El Fit Score debe ser un numero entre 0 y 10'
    }
    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const result = await onSubmit({
        title: title.trim(),
        source: source.trim(),
        raw_text: rawText.trim(),
        tags_json: tags,
        recency_date: recencyDate.trim() || undefined,
        market_region: marketRegion.trim() || undefined,
        buyer_persona: buyerPersona.trim() || undefined,
        trend_score: trendScore !== '' ? Number(trendScore) : undefined,
        fit_score: fitScore !== '' ? Number(fitScore) : undefined,
        evidence_links: evidenceLinks.filter(Boolean),
        key_takeaways: keyTakeaways.filter(Boolean),
        recommended_angles: recommendedAngles.filter(Boolean),
      })

      if (result && 'error' in result && result.error) {
        setErrors({ form: result.error })
      } else {
        onSuccess?.()
      }
    } catch {
      setErrors({ form: 'Ocurrio un error inesperado. Intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Global form error */}
      {errors.form && (
        <div
          role="alert"
          className="rounded-xl bg-error-50 border border-error-500 p-4"
        >
          <p className="text-sm text-error-700">{errors.form}</p>
        </div>
      )}

      {/* Title */}
      <Input
        id="research-title"
        name="title"
        label="Titulo *"
        placeholder="Ej: Impacto del soiling en paneles bifaciales"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        required
      />

      {/* Source */}
      <Input
        id="research-source"
        name="source"
        label="Fuente (opcional)"
        placeholder="Ej: https://solar-journal.com/article o 'Informe interno Q1'"
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />

      {/* Raw text */}
      <div className="w-full">
        <label
          htmlFor="research-raw-text"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Contenido / Notas *
        </label>
        <textarea
          id="research-raw-text"
          name="raw_text"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={8}
          placeholder="Pega aqui el articulo, tus notas de investigacion, datos, citas relevantes..."
          className={`
            w-full px-4 py-2.5 resize-y
            bg-surface text-foreground
            border rounded-xl
            placeholder:text-foreground-muted
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
            ${errors.raw_text ? 'border-error-500 focus:ring-error-500' : 'border-border hover:border-border-dark'}
          `}
          aria-describedby={errors.raw_text ? 'raw-text-error' : undefined}
          required
        />
        {errors.raw_text && (
          <p id="raw-text-error" className="mt-1.5 text-sm text-error-500" role="alert">
            {errors.raw_text}
          </p>
        )}
      </div>

      {/* Tags */}
      <TagInput
        label="Etiquetas"
        value={tags}
        onChange={setTags}
        suggestions={allTags}
        placeholder="soiling, bifacial, O&M..."
      />

      {/* Research Profundo toggle */}
      <div className="border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          aria-controls="advanced-research-section"
          className="flex items-center gap-2 text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors duration-200"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Research Profundo (opcional)
        </button>
      </div>

      {/* Collapsible advanced section */}
      {showAdvanced && (
        <div
          id="advanced-research-section"
          className="space-y-5 rounded-xl border border-border bg-surface p-5"
        >
          {/* Recency date + Market region row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="research-recency-date"
              name="recency_date"
              label="Fecha de Vigencia"
              type="date"
              value={recencyDate}
              onChange={(e) => setRecencyDate(e.target.value)}
            />
            <Select
              id="research-market-region"
              label="Region de Mercado"
              options={MARKET_REGION_OPTIONS}
              value={marketRegion}
              onChange={(e) => setMarketRegion(e.target.value)}
            />
          </div>

          {/* Buyer persona */}
          <Input
            id="research-buyer-persona"
            name="buyer_persona"
            label="Buyer Persona"
            placeholder="Ej: Director de O&M en planta solar utility-scale"
            value={buyerPersona}
            onChange={(e) => setBuyerPersona(e.target.value)}
          />

          {/* Trend score + Fit score row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="research-trend-score"
              name="trend_score"
              label="Trend Score (0-10)"
              type="number"
              min={0}
              max={10}
              step={1}
              placeholder="Ej: 7"
              value={trendScore}
              onChange={(e) => setTrendScore(e.target.value)}
              error={errors.trend_score}
            />
            <Input
              id="research-fit-score"
              name="fit_score"
              label="Fit Score (0-10)"
              type="number"
              min={0}
              max={10}
              step={1}
              placeholder="Ej: 8"
              value={fitScore}
              onChange={(e) => setFitScore(e.target.value)}
              error={errors.fit_score}
            />
          </div>

          {/* Evidence links */}
          <DynamicStringList
            label="Links de Evidencia"
            hint="URLs de fuentes que respaldan este research"
            placeholder="https://..."
            value={evidenceLinks}
            onChange={setEvidenceLinks}
            addLabel="Agregar link"
          />

          {/* Key takeaways */}
          <DynamicStringList
            label="Key Takeaways"
            hint="Conclusiones clave que extraes de este research"
            placeholder="Ej: El soiling reduce hasta un 30% la produccion en zonas aridas..."
            value={keyTakeaways}
            onChange={setKeyTakeaways}
            addLabel="Agregar takeaway"
          />

          {/* Recommended angles */}
          <DynamicStringList
            label="Angulos Recomendados"
            hint="Enfoques narrativos sugeridos para convertir esto en contenido"
            placeholder="Ej: Dato sorprendente vs expectativa del mercado..."
            value={recommendedAngles}
            onChange={setRecommendedAngles}
            addLabel="Agregar angulo"
          />
        </div>
      )}

      {/* Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full sm:w-auto"
        >
          {isEditMode ? 'Actualizar' : 'Guardar Research'}
        </Button>
      </div>
    </form>
  )
}
