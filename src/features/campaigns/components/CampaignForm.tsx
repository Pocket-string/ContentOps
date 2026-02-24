'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { CreateCampaignInput } from '@/shared/types/content-ops'

// ---- Types ----

interface TopicOption {
  id: string
  title: string
}

interface CampaignFormProps {
  topics?: TopicOption[]
  onSubmit: (data: CreateCampaignInput) => Promise<{ error?: string } | void>
  onSuccess?: () => void
}

// ---- Icons ----

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

// ---- Component ----

export function CampaignForm({ topics = [], onSubmit, onSuccess }: CampaignFormProps) {
  const [weekStart, setWeekStart] = useState('')
  const [topicId, setTopicId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ week_start?: string }>({})

  // Build options for topic select
  const topicOptions = [
    { value: '', label: 'Sin tema asociado' },
    ...topics.map((t) => ({ value: t.id, label: t.title })),
  ]

  function validate(): boolean {
    const errors: { week_start?: string } = {}
    if (!weekStart.trim()) {
      errors.week_start = 'La fecha de inicio es requerida'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const data: CreateCampaignInput = {
        week_start: weekStart,
        topic_id: topicId || undefined,
        keyword: keyword.trim() || undefined,
        resource_json: {},
        audience_json: {},
      }

      const result = await onSubmit(data)
      if (result?.error) {
        setFormError(result.error)
        return
      }

      // Reset form on success
      setWeekStart('')
      setTopicId('')
      setKeyword('')
      onSuccess?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Crear campana">
      <div className="space-y-5">

        {/* Info box */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200"
          role="note"
          aria-label="Informacion sobre la campana"
        >
          <InfoIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 leading-relaxed">
            Se generaran automaticamente <strong>5 posts (L-V)</strong> con asignacion{' '}
            <strong>TOFU / MOFU / BOFU</strong> segun el plan semanal.
          </p>
        </div>

        {/* Week start */}
        <Input
          type="date"
          label="Semana de inicio"
          value={weekStart}
          onChange={(e) => {
            setWeekStart(e.target.value)
            if (fieldErrors.week_start) {
              setFieldErrors((prev) => ({ ...prev, week_start: undefined }))
            }
          }}
          error={fieldErrors.week_start}
          required
          aria-required="true"
        />

        {/* Topic select */}
        <Select
          label="Tema asociado"
          options={topicOptions}
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
        />

        {/* Keyword */}
        <Input
          type="text"
          label="Keyword CTA"
          placeholder="ej: SCADA, ALBEDO"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          hint="Palabra clave que se usara como llamada a la accion en los posts."
        />

        {/* Global error */}
        {formError && (
          <p
            className="text-sm text-error-500 bg-error-50 border border-error-200 rounded-xl px-4 py-3"
            role="alert"
          >
            {formError}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full"
          aria-label="Crear campana"
        >
          Crear Campana
        </Button>
      </div>
    </form>
  )
}
