'use client'

/**
 * PRP-013: ScreenshotCaptureControl — control de captura via Playwright headless.
 *
 * Visible solo cuando archetype ∈ {screenshot_annotated, dashboard_annotated, carousel_mini_report}.
 * Flow:
 * 1. User elige URL destino (sugerida o custom)
 * 2. Click "📸 Capturar via Playwright" → POST /api/ai/capture-screenshot
 * 3. Backend Playwright headless captura + upload a Storage → retorna base_image_url
 * 4. UI muestra preview + permite re-capturar
 */

import { useState } from 'react'

import type { ArchetypeSlug, BaseImageSource } from '@/features/visuals/types/archetype'
import { ARCHETYPE_REGISTRY } from '@/features/visuals/constants/archetypes'

interface Props {
  archetype: ArchetypeSlug
  visualVersionId?: string
  postId: string
  /** Current base image URL (if already captured). */
  currentBaseImageUrl?: string | null
  currentBaseImageSource?: BaseImageSource | null
  onCaptured: (params: {
    base_image_url: string
    base_image_source: BaseImageSource
    captured_from_url?: string
  }) => void
  disabled?: boolean
}

interface CaptureResponse {
  data?: {
    base_image_url: string
  }
  error?: string
}

const VIEWPORTS = [
  { value: '1080x1080', label: '1080×1080 (1:1)', width: 1080, height: 1080 },
  { value: '1080x1350', label: '1080×1350 (4:5)', width: 1080, height: 1350 },
] as const

export function ScreenshotCaptureControl({
  archetype,
  visualVersionId,
  postId,
  currentBaseImageUrl,
  currentBaseImageSource,
  onCaptured,
  disabled = false,
}: Props) {
  const def = ARCHETYPE_REGISTRY[archetype]
  const sources = def.suggestedSources ?? []

  const [selectedUrl, setSelectedUrl] = useState<string>(sources[0] ?? '')
  const [customUrl, setCustomUrl] = useState('')
  const [viewport, setViewport] = useState<(typeof VIEWPORTS)[number]['value']>('1080x1080')
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentBaseImageUrl ?? null)

  const handleCapture = async () => {
    const url = customUrl.trim() || selectedUrl
    if (!url) {
      setError('Elige una URL para capturar')
      return
    }
    setIsCapturing(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/capture-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, viewport, post_id: postId, visual_version_id: visualVersionId }),
      })
      const json: CaptureResponse = await res.json()
      if (!res.ok || !json.data) {
        setError(json.error ?? `Captura falló (HTTP ${res.status})`)
        return
      }
      setPreviewUrl(json.data.base_image_url)
      onCaptured({
        base_image_url: json.data.base_image_url,
        base_image_source: 'playwright_capture',
        captured_from_url: url,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red al capturar')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleManualUpload = async (file: File) => {
    setIsCapturing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('post_id', postId)
      if (visualVersionId) formData.append('visual_version_id', visualVersionId)
      const res = await fetch('/api/ai/capture-screenshot', {
        method: 'PUT',
        body: formData,
      })
      const json: CaptureResponse = await res.json()
      if (!res.ok || !json.data) {
        setError(json.error ?? `Upload falló (HTTP ${res.status})`)
        return
      }
      setPreviewUrl(json.data.base_image_url)
      onCaptured({
        base_image_url: json.data.base_image_url,
        base_image_source: 'manual_upload',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red al subir')
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div
      className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 space-y-3"
      data-testid="screenshot-capture-control"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-emerald-900">
          📎 Captura de producto (base real)
        </h3>
        {currentBaseImageSource && (
          <span className="text-[10px] font-mono uppercase bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
            {currentBaseImageSource}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="capture-url" className="block text-xs font-semibold text-emerald-900">
          URL destino:
        </label>
        {sources.length > 0 && (
          <select
            id="capture-url"
            value={selectedUrl}
            onChange={(e) => {
              setSelectedUrl(e.target.value)
              setCustomUrl('')
            }}
            disabled={disabled || isCapturing}
            className="w-full rounded-lg border border-emerald-300 bg-white px-2 py-1.5 text-xs"
          >
            {sources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
            <option value="">— Custom URL —</option>
          </select>
        )}
        <input
          type="url"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          placeholder="https://lucvia.com/demo/..."
          disabled={disabled || isCapturing}
          className="w-full rounded-lg border border-emerald-300 bg-white px-2 py-1.5 text-xs"
          data-testid="capture-url-input"
        />
      </div>

      <div className="space-y-2">
        <span className="block text-xs font-semibold text-emerald-900">Viewport:</span>
        <div className="flex gap-2">
          {VIEWPORTS.map((vp) => (
            <label
              key={vp.value}
              className={[
                'flex items-center gap-1.5 text-xs cursor-pointer rounded-lg border px-2 py-1',
                viewport === vp.value
                  ? 'border-emerald-500 bg-white'
                  : 'border-emerald-200 bg-emerald-50',
              ].join(' ')}
            >
              <input
                type="radio"
                name="viewport"
                value={vp.value}
                checked={viewport === vp.value}
                onChange={() => setViewport(vp.value)}
                disabled={disabled || isCapturing}
                className="w-3 h-3"
              />
              {vp.label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleCapture}
        disabled={disabled || isCapturing || (!customUrl.trim() && !selectedUrl)}
        className="w-full rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
        data-testid="capture-screenshot-btn"
      >
        {isCapturing ? 'Capturando...' : '📸 Capturar via Playwright'}
      </button>

      <details className="text-xs">
        <summary className="cursor-pointer text-emerald-700 hover:text-emerald-900">
          O subir manualmente
        </summary>
        <div className="mt-2 pt-2">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={disabled || isCapturing}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleManualUpload(f)
            }}
            data-testid="capture-upload-input"
          />
        </div>
      </details>

      {error && (
        <p className="text-xs text-rose-700 font-semibold" data-testid="capture-error">
          ⚠️ {error}
        </p>
      )}

      {previewUrl && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-emerald-900">Preview base:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Base capturada"
            className="w-full max-h-64 object-contain border border-emerald-300 rounded-lg bg-white"
            data-testid="capture-preview-img"
          />
        </div>
      )}
    </div>
  )
}
