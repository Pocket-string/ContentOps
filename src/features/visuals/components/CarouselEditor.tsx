'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL, type ImageModelId } from '../constants/image-models'
import type { CarouselSlide } from '@/shared/types/content-ops'

interface CarouselEditorProps {
  visualVersionId: string
  slides: CarouselSlide[]
  topic: string
  label?: string
  onSlidesChange: (slides: CarouselSlide[]) => void
}

const MODEL_OPTIONS = Object.values(IMAGE_MODELS).map((m) => ({
  value: m.id,
  label: `${m.label} — ${m.description}`,
}))

const SLIDE_COUNT_OPTIONS = [
  { value: '5', label: '5 slides' },
  { value: '6', label: '6 slides' },
  { value: '7', label: '7 slides' },
  { value: '8', label: '8 slides' },
  { value: '10', label: '10 slides' },
]

function ChevronLeftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export function CarouselEditor({
  visualVersionId,
  slides,
  topic,
  label,
  onSlidesChange,
}: CarouselEditorProps) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [modelId, setModelId] = useState<ImageModelId>(DEFAULT_IMAGE_MODEL)
  const [generatingSlides, setGeneratingSlides] = useState<Set<number>>(new Set())
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')

  const currentSlide = slides[activeSlide]
  const totalSlides = slides.length

  const updateSlideField = useCallback(
    (index: number, field: 'headline' | 'body_text', value: string) => {
      const updated = slides.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
      onSlidesChange(updated)
    },
    [slides, onSlidesChange]
  )

  const generateSlide = useCallback(
    async (slideIndex: number) => {
      const slide = slides[slideIndex]
      if (!slide) return

      setGeneratingSlides((prev) => new Set(prev).add(slideIndex))
      setError('')

      try {
        const res = await fetch('/api/ai/generate-carousel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visual_version_id: visualVersionId,
            slide: {
              id: slide.id,
              slide_index: slide.slide_index,
              headline: slide.headline,
              body_text: slide.body_text,
              prompt_json: slide.prompt_json,
            },
            topic,
            total_slides: totalSlides,
            model_id: modelId,
          }),
        })

        const json: unknown = await res.json()
        if (!res.ok) {
          setError((json as { error?: string }).error ?? 'Error al generar slide')
          return
        }

        const { data } = json as { data: { slide_index: number; image_url: string } }
        const updated = slides.map((s, i) =>
          i === slideIndex ? { ...s, image_url: data.image_url } : s
        )
        onSlidesChange(updated)
      } catch {
        setError(`Error de red al generar slide ${slideIndex + 1}`)
      } finally {
        setGeneratingSlides((prev) => {
          const next = new Set(prev)
          next.delete(slideIndex)
          return next
        })
      }
    },
    [slides, visualVersionId, topic, totalSlides, modelId, onSlidesChange]
  )

  const generateAllSlides = useCallback(async () => {
    setIsGeneratingAll(true)
    setError('')

    for (let i = 0; i < slides.length; i++) {
      if (slides[i].image_url) continue // Skip already generated
      await generateSlide(i)
    }

    setIsGeneratingAll(false)
  }, [slides, generateSlide])

  const handleDownloadAll = useCallback(async () => {
    setIsDownloading(true)
    setError('')

    try {
      const safeName = (label || 'carousel')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40)

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i]
        if (!slide.image_url) continue

        const urlPath = new URL(slide.image_url).pathname
        const urlExt = urlPath.split('.').pop()?.toLowerCase()
        const ext = urlExt === 'jpg' || urlExt === 'jpeg' ? 'jpg'
          : urlExt === 'webp' ? 'webp'
          : 'png'

        const filename = `${safeName}-slide-${i + 1}.${ext}`

        try {
          const res = await fetch(slide.image_url)
          if (!res.ok) throw new Error('fetch failed')
          const blob = await res.blob()
          const blobUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(blobUrl)
        } catch {
          window.open(slide.image_url, '_blank')
        }

        // Small delay between downloads to avoid browser blocking
        if (i < slides.length - 1) {
          await new Promise((r) => setTimeout(r, 300))
        }
      }
    } catch {
      setError('Error al descargar slides')
    } finally {
      setIsDownloading(false)
    }
  }, [slides, label])

  const generatedCount = slides.filter((s) => s.image_url).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Carrusel ({generatedCount}/{totalSlides} slides)
        </h2>
        {generatedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            isLoading={isDownloading}
            leftIcon={<DownloadIcon />}
          >
            Descargar Todo
          </Button>
        )}
      </div>

      {/* Slide filmstrip navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setActiveSlide(i)}
            className={`
              relative shrink-0 w-14 h-[70px] rounded-lg border-2 overflow-hidden
              transition-all duration-200
              ${i === activeSlide
                ? 'border-primary-500 ring-2 ring-primary-200'
                : 'border-border hover:border-border-dark'
              }
            `}
          >
            {slide.image_url ? (
              <img
                src={slide.image_url}
                alt={`Slide ${i + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-foreground-muted font-medium">{i + 1}</span>
              </div>
            )}
            {generatingSlides.has(i) && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Active slide preview */}
      {currentSlide && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
              disabled={activeSlide === 0}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="text-sm font-medium text-foreground">
              Slide {activeSlide + 1} de {totalSlides}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveSlide(Math.min(totalSlides - 1, activeSlide + 1))}
              disabled={activeSlide === totalSlides - 1}
            >
              <ChevronRightIcon />
            </Button>
          </div>

          {/* Image preview */}
          <div className="rounded-xl overflow-hidden border border-border bg-gray-50 aspect-[4/5]">
            {currentSlide.image_url ? (
              <img
                src={currentSlide.image_url}
                alt={`Slide ${activeSlide + 1}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-foreground-muted">
                <span className="text-4xl font-bold opacity-20">{activeSlide + 1}</span>
                <span className="text-xs mt-1">Sin imagen</span>
              </div>
            )}
          </div>

          {/* Slide content editing */}
          <Input
            label="Headline"
            value={currentSlide.headline ?? ''}
            onChange={(e) => updateSlideField(activeSlide, 'headline', e.target.value)}
            placeholder={activeSlide === 0 ? 'Titulo del carrusel...' : `Slide ${activeSlide + 1} headline...`}
          />
          <Input
            label="Texto"
            value={currentSlide.body_text ?? ''}
            onChange={(e) => updateSlideField(activeSlide, 'body_text', e.target.value)}
            placeholder="Texto del slide..."
          />

          {/* Generate this slide */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => generateSlide(activeSlide)}
            isLoading={generatingSlides.has(activeSlide)}
            leftIcon={<SparklesIcon />}
            className="w-full"
          >
            {currentSlide.image_url ? 'Regenerar Slide' : 'Generar Slide'}
          </Button>
        </div>
      )}

      {/* Model selector + generate all */}
      <div className="space-y-2 pt-2 border-t border-border">
        <Select
          label="Modelo de imagen"
          options={MODEL_OPTIONS}
          value={modelId}
          onChange={(e) => setModelId(e.target.value as ImageModelId)}
        />

        <Button
          variant="secondary"
          size="sm"
          onClick={generateAllSlides}
          isLoading={isGeneratingAll}
          leftIcon={<SparklesIcon />}
          className="w-full"
          disabled={totalSlides === 0}
        >
          Generar Todos los Slides ({totalSlides - generatedCount} pendientes)
        </Button>

        {isGeneratingAll && (
          <p className="text-xs text-foreground-muted text-center">
            Generando slides... esto puede tardar {totalSlides * 15}-{totalSlides * 30} segundos
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
