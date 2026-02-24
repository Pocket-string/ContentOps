'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL, type ImageModelId } from '../constants/image-models'
import type { VisualFormat } from '../constants/brand-rules'

interface ImageGeneratorProps {
  visualVersionId: string
  promptJson: Record<string, unknown>
  format: VisualFormat
  currentImageUrl: string | null
  onImageGenerated: (imageUrl: string) => void
}

const MODEL_OPTIONS = Object.values(IMAGE_MODELS).map((m) => ({
  value: m.id,
  label: `${m.label} — ${m.description}`,
}))

function SparklesIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z" />
    </svg>
  )
}

export function ImageGenerator({
  visualVersionId,
  promptJson,
  format,
  currentImageUrl,
  onImageGenerated,
}: ImageGeneratorProps) {
  const [modelId, setModelId] = useState<ImageModelId>(DEFAULT_IMAGE_MODEL)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl)

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visual_version_id: visualVersionId,
          prompt_json: promptJson,
          format,
          model_id: modelId,
        }),
      })
      const json: unknown = await res.json()
      if (!res.ok) {
        setError((json as { error?: string }).error ?? 'Error al generar imagen')
        return
      }
      const { data } = json as { data: { image_url: string } }
      setPreviewUrl(data.image_url)
      onImageGenerated(data.image_url)
    } catch {
      setError('Error de red al generar imagen')
    } finally {
      setIsGenerating(false)
    }
  }, [visualVersionId, promptJson, format, modelId, onImageGenerated])

  const hasPrompt = Object.keys(promptJson).length > 0

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Imagen generada</h2>

      {previewUrl && (
        <div className="rounded-xl overflow-hidden border border-border bg-gray-50">
          <img
            src={previewUrl}
            alt="Visual generado"
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      <Select
        label="Modelo de imagen"
        options={MODEL_OPTIONS}
        value={modelId}
        onChange={(e) => setModelId(e.target.value as ImageModelId)}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        variant="primary"
        size="sm"
        onClick={handleGenerate}
        isLoading={isGenerating}
        disabled={!hasPrompt}
        leftIcon={<SparklesIcon />}
        className="w-full"
      >
        {previewUrl ? 'Regenerar Imagen' : 'Generar Imagen'}
      </Button>

      {isGenerating && (
        <p className="text-xs text-foreground-muted text-center">
          Generando imagen... esto puede tardar 10-30 segundos
        </p>
      )}

      {format === '4:5' && (
        <p className="text-xs text-foreground-muted">
          Nota: formato 4:5 se genera como 3:4 (formato soportado mas cercano)
        </p>
      )}
    </div>
  )
}
