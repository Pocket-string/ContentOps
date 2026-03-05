'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ContentPillar, CreatePillarInput } from '@/shared/types/content-ops'

interface PillarFormProps {
  pillar?: ContentPillar
  onSubmit: (data: CreatePillarInput) => Promise<{ error?: string } | void>
  onSuccess?: () => void
}

interface FieldErrors {
  name?: string
  description?: string
  form?: string
}

const PRESET_COLORS: Array<{ hex: string; label: string }> = [
  { hex: '#EF4444', label: 'Rojo' },
  { hex: '#3B82F6', label: 'Azul' },
  { hex: '#10B981', label: 'Verde' },
  { hex: '#F59E0B', label: 'Ambar' },
  { hex: '#8B5CF6', label: 'Morado' },
]

const DEFAULT_COLOR = '#6B7280'

export function PillarForm({ pillar, onSubmit, onSuccess }: PillarFormProps) {
  const isEditMode = Boolean(pillar)

  const [name, setName] = useState(pillar?.name ?? '')
  const [description, setDescription] = useState(pillar?.description ?? '')
  const [color, setColor] = useState(pillar?.color ?? DEFAULT_COLOR)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!name.trim()) next.name = 'El nombre del pilar es requerido'
    if (description && description.length > 500)
      next.description = 'La descripcion no puede superar los 500 caracteres'
    return next
  }

  const handlePresetColor = useCallback((hex: string) => {
    setColor(hex)
  }, [])

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
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        sort_order: pillar?.sort_order ?? 0,
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

  const descriptionLength = description?.length ?? 0
  const isDescriptionNearLimit = descriptionLength > 450

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Global form error */}
      {errors.form && (
        <div
          role="alert"
          className="rounded-xl bg-error-50 border border-error-500 px-4 py-3"
        >
          <p className="text-sm text-error-700">{errors.form}</p>
        </div>
      )}

      {/* Name */}
      <Input
        id="pillar-name"
        name="name"
        label="Nombre *"
        placeholder="Ej: Perdidas ocultas en FV"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        required
        autoFocus
      />

      {/* Description */}
      <div className="w-full">
        <label
          htmlFor="pillar-description"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Descripcion
          <span className="ml-1 text-foreground-muted font-normal">(opcional)</span>
        </label>
        <textarea
          id="pillar-description"
          name="description"
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Describe brevemente el enfoque tematico de este pilar..."
          className={`
            w-full px-4 py-2.5 resize-y
            bg-surface text-foreground
            border rounded-xl
            placeholder:text-foreground-muted
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
            ${errors.description
              ? 'border-error-500 focus:ring-error-500'
              : 'border-border hover:border-border-dark'}
          `}
          aria-describedby={
            errors.description ? 'description-error' : 'description-counter'
          }
        />
        <div className="mt-1.5 flex items-start justify-between gap-2">
          {errors.description ? (
            <p id="description-error" className="text-sm text-error-500" role="alert">
              {errors.description}
            </p>
          ) : (
            <span />
          )}
          <p
            id="description-counter"
            className={`text-xs flex-shrink-0 ${
              isDescriptionNearLimit ? 'text-amber-500' : 'text-foreground-muted'
            }`}
            aria-live="polite"
          >
            {descriptionLength}/500
          </p>
        </div>
      </div>

      {/* Color picker */}
      <div className="w-full">
        <p className="block text-sm font-medium text-foreground mb-2">
          Color del Pilar
        </p>

        {/* Preset swatches */}
        <div
          className="flex items-center gap-2 mb-3 flex-wrap"
          role="group"
          aria-label="Colores predefinidos"
        >
          {PRESET_COLORS.map(({ hex, label }) => {
            const isSelected = color === hex
            return (
              <button
                key={hex}
                type="button"
                onClick={() => handlePresetColor(hex)}
                aria-label={`Color ${label}`}
                aria-pressed={isSelected}
                className={`
                  w-7 h-7 rounded-full transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2
                  ${isSelected
                    ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                    : 'hover:scale-105 hover:ring-2 hover:ring-offset-1 hover:ring-border-dark'}
                `}
                style={{ backgroundColor: hex }}
              />
            )
          })}
        </div>

        {/* Custom color input row */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="pillar-color-picker"
            className="text-sm text-foreground-muted flex-shrink-0"
          >
            Personalizado:
          </label>
          <input
            id="pillar-color-picker"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="
              w-9 h-9 rounded-lg border border-border cursor-pointer
              bg-surface p-0.5
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2
            "
            aria-label="Seleccionar color personalizado"
          />
          <span
            className="text-sm font-mono text-foreground-muted uppercase tracking-wider"
            aria-live="polite"
            aria-label={`Valor hex del color: ${color}`}
          >
            {color}
          </span>
          {/* Live preview dot */}
          <div
            className="w-5 h-5 rounded-full border border-border flex-shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full sm:w-auto"
        >
          {isEditMode ? 'Guardar Cambios' : 'Crear Pilar'}
        </Button>
      </div>
    </form>
  )
}
