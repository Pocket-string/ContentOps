'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  VISUAL_FORMATS,
  FORMAT_LABELS,
  DEFAULT_FORMAT,
  QA_CHECKLIST,
  type VisualFormat,
} from '../constants/brand-rules'
import type { VisualVersion, VisualStatus } from '@/shared/types/content-ops'
import { VisualCriticPanel } from './VisualCriticPanel'
import { AIReviewBadge } from '@/shared/components/ai-review-badge'
import type { VisualReview } from '@/shared/types/ai-review'
import { updateNanoBananaAction } from '../actions/visual-actions'
import { ImageGenerator } from './ImageGenerator'

// ============================================
// Types
// ============================================

interface VisualEditorProps {
  postId: string
  campaignId: string
  dayOfWeek: number
  postContent: string
  funnelStage: string
  topicTitle?: string
  keyword?: string
  visuals: VisualVersion[]
  onCreateVisual: (formData: FormData) => Promise<{ success?: true; error?: string }>
  onUpdatePrompt: (visualId: string, promptJson: string) => Promise<{ success?: true; error?: string }>
  onUpdateStatus: (visualId: string, status: string) => Promise<{ success?: true; error?: string }>
  onUpdateQA: (visualId: string, qaJson: string) => Promise<{ success?: true; error?: string }>
  onUploadImage: (visualId: string, imageUrl: string) => Promise<{ success?: true; error?: string }>
}

// ============================================
// Display constants
// ============================================

const STATUS_LABELS: Record<VisualStatus, string> = {
  draft: 'Borrador',
  pending_qa: 'Pendiente QA',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

const STATUS_COLORS: Record<VisualStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_qa: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const QA_CATEGORY_LABELS: Record<string, string> = {
  formato: 'Formato',
  estilo: 'Estilo',
  texto: 'Texto',
  marca: 'Marca',
}

const FORMAT_OPTIONS = VISUAL_FORMATS.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))

const NB_ITERATION_REASONS = [
  'Texto ilegible',
  'Caos visual / composicion saturada',
  'Logo incorrecto o ausente',
  'Colores fuera de marca',
  'Formato incorrecto',
  'Otro',
] as const

const TEXTAREA_BASE =
  'w-full px-4 py-3 bg-background text-foreground border rounded-xl placeholder:text-foreground-muted text-sm leading-relaxed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent'

// ============================================
// Inline SVG Icons
// ============================================

function ArrowLeftIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
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

function SaveIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

function XIcon({ sm }: { sm?: boolean }) {
  const size = sm ? 'w-3.5 h-3.5' : 'w-4 h-4'
  return (
    <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ============================================
// Utilities
// ============================================

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function sortedNewestFirst(visuals: VisualVersion[]) {
  return [...visuals].sort((a, b) => b.version - a.version)
}

function parseQaJson(qa: Record<string, unknown> | null): Record<string, boolean> {
  if (!qa) return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(qa)) {
    if (typeof v === 'boolean') out[k] = v
  }
  return out
}

function allQaChecked(checks: Record<string, boolean>) {
  return QA_CHECKLIST.every((item) => checks[item.id] === true)
}

// ============================================
// Main VisualEditor component
// ============================================

export function VisualEditor({
  postId,
  campaignId,
  postContent,
  funnelStage,
  topicTitle,
  keyword,
  visuals,
  onCreateVisual,
  onUpdatePrompt,
  onUpdateStatus,
  onUpdateQA,
  onUploadImage,
}: VisualEditorProps) {
  const [selectedVisualId, setSelectedVisualId] = useState<string | null>(visuals[0]?.id ?? null)
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [format, setFormat] = useState<VisualFormat>(DEFAULT_FORMAT)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isIterating, setIsIterating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [feedback, setFeedback] = useState('')
  const [iterationChanges, setIterationChanges] = useState<string[]>([])
  const [iteratedJson, setIteratedJson] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [qaChecks, setQaChecks] = useState<Record<string, boolean>>({})
  const [isSavingImage, setIsSavingImage] = useState(false)
  const [isSavingQA, setIsSavingQA] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [visualReview, setVisualReview] = useState<VisualReview | null>(null)
  // Nano Banana Pro state
  const [nbRunId, setNbRunId] = useState('')
  const [nbIterationReason, setNbIterationReason] = useState('')
  const [nbQaNotes, setNbQaNotes] = useState('')
  const [nbCustomReason, setNbCustomReason] = useState('')
  const [isSavingNB, setIsSavingNB] = useState(false)

  const selectedVisual = visuals.find((v) => v.id === selectedVisualId) ?? null
  const sortedVisuals = sortedNewestFirst(visuals)

  // Load selected visual into editor
  useEffect(() => {
    if (!selectedVisual) {
      setJsonText(''); setJsonError(''); setImageUrl(''); setQaChecks({})
      setNbRunId(''); setNbIterationReason(''); setNbQaNotes(''); setNbCustomReason('')
      return
    }
    setJsonText(JSON.stringify(selectedVisual.prompt_json, null, 2))
    setJsonError('')
    setImageUrl(selectedVisual.image_url ?? '')
    setQaChecks(parseQaJson(selectedVisual.qa_json))
    setIteratedJson(''); setIterationChanges([]); setFeedback('')
    // Load NB fields
    const reason = selectedVisual.iteration_reason ?? ''
    const isPreset = NB_ITERATION_REASONS.slice(0, -1).includes(reason as (typeof NB_ITERATION_REASONS)[number])
    setNbRunId(selectedVisual.nanobanana_run_id ?? '')
    setNbQaNotes(selectedVisual.qa_notes ?? '')
    setNbIterationReason(reason === '' ? '' : isPreset ? reason : 'Otro')
    setNbCustomReason(isPreset ? '' : reason)
  }, [selectedVisualId]) // eslint-disable-line react-hooks/exhaustive-deps

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  function handleJsonChange(value: string) {
    setJsonText(value)
    try { JSON.parse(value); setJsonError('') }
    catch (e) { setJsonError(e instanceof Error ? e.message : 'JSON invalido') }
  }

  const handleSaveJson = useCallback(async () => {
    if (!selectedVisualId || jsonError) return
    setIsSaving(true); setError('')
    try {
      const res = await onUpdatePrompt(selectedVisualId, jsonText)
      if (res.error) { setError(res.error) } else { showSuccess('Prompt guardado correctamente') }
    } finally { setIsSaving(false) }
  }, [selectedVisualId, jsonText, jsonError, onUpdatePrompt])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true); setError('')
    try {
      const res = await fetch('/api/ai/generate-visual-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_content: postContent, funnel_stage: funnelStage, format, topic: topicTitle, keyword, additional_instructions: additionalInstructions || undefined }),
      })
      const json: unknown = await res.json()
      if (!res.ok) { setError((json as { error?: string }).error ?? 'Error al generar'); return }
      const resp = json as { data: Record<string, unknown>; review?: VisualReview }
      setJsonText(JSON.stringify(resp.data, null, 2)); setJsonError('')
      setVisualReview(resp.review ?? null)
    } catch { setError('Error de red al generar el prompt visual') }
    finally { setIsGenerating(false) }
  }, [postContent, funnelStage, format, topicTitle, keyword, additionalInstructions])

  const handleIterate = useCallback(async () => {
    if (!feedback.trim() || !jsonText) return
    let currentPrompt: unknown
    try { currentPrompt = JSON.parse(jsonText) }
    catch { setError('El JSON actual es invalido. Corrigelo antes de iterar.'); return }
    setIsIterating(true); setError('')
    try {
      const res = await fetch('/api/ai/iterate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_prompt_json: currentPrompt, feedback }),
      })
      const json: unknown = await res.json()
      if (!res.ok) { setError((json as { error?: string }).error ?? 'Error al iterar'); return }
      const { prompt, changes_made } = (json as { data: { prompt: Record<string, unknown>; changes_made: string[] } }).data
      setIteratedJson(JSON.stringify(prompt, null, 2)); setIterationChanges(changes_made)
    } catch { setError('Error de red al iterar el prompt visual') }
    finally { setIsIterating(false) }
  }, [feedback, jsonText])

  const handleApplyIteration = useCallback(async () => {
    if (!selectedVisualId || !iteratedJson) return
    setIsSaving(true); setError('')
    try {
      const res = await onUpdatePrompt(selectedVisualId, iteratedJson)
      if (res.error) { setError(res.error); return }
      setJsonText(iteratedJson); setJsonError(''); setIteratedJson(''); setIterationChanges([]); setFeedback('')
      showSuccess('Prompt actualizado con los cambios de IA')
    } finally { setIsSaving(false) }
  }, [selectedVisualId, iteratedJson, onUpdatePrompt])

  const handleCreateVisual = useCallback(async () => {
    if (!jsonText || jsonError) return
    setIsCreating(true); setError('')
    try {
      const fd = new FormData()
      fd.set('post_id', postId); fd.set('format', format); fd.set('prompt_json', jsonText)
      const res = await onCreateVisual(fd)
      if (res.error) { setError(res.error) } else { showSuccess('Version visual creada correctamente') }
    } finally { setIsCreating(false) }
  }, [postId, format, jsonText, jsonError, onCreateVisual])

  const handleSaveImageUrl = useCallback(async () => {
    if (!selectedVisualId || !imageUrl.trim()) return
    setIsSavingImage(true); setError('')
    try {
      const res = await onUploadImage(selectedVisualId, imageUrl.trim())
      if (res.error) { setError(res.error) } else { showSuccess('URL de imagen guardada') }
    } finally { setIsSavingImage(false) }
  }, [selectedVisualId, imageUrl, onUploadImage])

  const handleSaveQA = useCallback(async () => {
    if (!selectedVisualId) return
    setIsSavingQA(true); setError('')
    try {
      const res = await onUpdateQA(selectedVisualId, JSON.stringify(qaChecks))
      if (res.error) { setError(res.error); return }
      const newStatus = allQaChecked(qaChecks) ? 'approved' : 'pending_qa'
      await onUpdateStatus(selectedVisualId, newStatus)
      showSuccess('QA guardado correctamente')
    } finally { setIsSavingQA(false) }
  }, [selectedVisualId, qaChecks, onUpdateQA, onUpdateStatus])

  const handleSaveNanoBanana = useCallback(async () => {
    if (!selectedVisualId) return
    const resolvedReason = nbIterationReason === 'Otro' ? nbCustomReason.trim() : nbIterationReason
    setIsSavingNB(true); setError('')
    const payload = JSON.stringify({ nanobanana_run_id: nbRunId.trim() || undefined, qa_notes: nbQaNotes.trim() || undefined, iteration_reason: resolvedReason || undefined })
    try {
      const res = await updateNanoBananaAction(selectedVisualId, payload)
      if ('error' in res) { setError(res.error) } else { showSuccess('Metadata Nano Banana guardada') }
    } finally { setIsSavingNB(false) }
  }, [selectedVisualId, nbRunId, nbIterationReason, nbCustomReason, nbQaNotes])

  // ============================================
  // Render
  // ============================================

  const qaByCategory = QA_CHECKLIST.reduce<Record<string, typeof QA_CHECKLIST>>((acc, item) => {
    ;(acc[item.category] ??= []).push(item)
    return acc
  }, {})

  const isJsonValid = jsonText !== '' && jsonError === ''
  const hasImage = !!(selectedVisual?.image_url || imageUrl.trim())

  return (
    <div className="min-h-screen bg-background">
      {/* Toast notifications */}
      {error && (
        <div role="alert" className="fixed top-4 right-4 z-50 max-w-sm bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl shadow-lg flex items-start gap-2">
          <XIcon /><span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto shrink-0 hover:text-red-900" aria-label="Cerrar error"><XIcon sm /></button>
        </div>
      )}
      {successMsg && (
        <div role="status" aria-live="polite" className="fixed top-4 right-4 z-50 max-w-sm bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckIcon /><span>{successMsg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ========== LEFT COLUMN (2/3) ========== */}
          <div className="w-full lg:w-2/3 space-y-5">

            {/* 1. Header */}
            <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Link href={`/campaigns/${campaignId}`} className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors group" aria-label="Volver a la campana">
                  <span className="group-hover:-translate-x-0.5 transition-transform"><ArrowLeftIcon /></span>
                  Volver a la campana
                </Link>
                <h1 className="text-lg font-bold text-foreground sm:ml-auto">Visual Editor</h1>
              </div>
              {(topicTitle || keyword) && (
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {topicTitle && <span className="text-sm text-foreground-muted">Tema: <span className="font-medium text-foreground">{topicTitle}</span></span>}
                  {keyword && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-50 text-accent-600 border border-accent-200">#{keyword}</span>}
                </div>
              )}
              <div className="mt-4 max-w-xs">
                <Select label="Formato" options={FORMAT_OPTIONS} value={format} onChange={(e) => setFormat(e.target.value as VisualFormat)} aria-label="Formato del visual" />
              </div>
            </div>

            {/* 2. JSON Editor */}
            <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Prompt JSON</h2>
                {jsonText !== '' && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isJsonValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role="status" aria-live="polite">
                    {isJsonValid ? <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>JSON valido</> : <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>JSON invalido</>}
                  </span>
                )}
              </div>
              <div>
                <label htmlFor="json-editor" className="sr-only">Editor de prompt JSON</label>
                <textarea
                  id="json-editor"
                  value={jsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  rows={20}
                  placeholder={'{\n  "scene": { "description": "..." }\n}'}
                  spellCheck={false}
                  aria-describedby={jsonError ? 'json-error' : undefined}
                  className={`${TEXTAREA_BASE} font-mono resize-y ${jsonError ? 'border-red-400' : 'border-border hover:border-border-dark'}`}
                />
                {jsonError && <p id="json-error" className="mt-1.5 text-xs text-red-500 font-mono">{jsonError}</p>}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm" onClick={handleSaveJson} isLoading={isSaving} disabled={!selectedVisualId || !isJsonValid} leftIcon={<SaveIcon />}>Guardar Cambios</Button>
                <Button variant="outline" size="sm" onClick={handleCreateVisual} isLoading={isCreating} disabled={!isJsonValid} leftIcon={<PlusIcon />}>Nueva Version</Button>
              </div>
            </div>

            {/* 3. AI Generation */}
            <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Generar con IA</h2>
              <div>
                <label htmlFor="additional-instructions" className="block text-sm font-medium text-foreground mb-1.5">
                  Instrucciones adicionales <span className="text-xs font-normal text-foreground-muted">(opcional)</span>
                </label>
                <textarea
                  id="additional-instructions"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  rows={2}
                  placeholder="Ej: Enfoca en durabilidad de paneles bifaciales, usa tonos oscuros..."
                  className={`${TEXTAREA_BASE} border-border hover:border-border-dark resize-none`}
                />
              </div>
              <Button variant="secondary" size="sm" onClick={handleGenerate} isLoading={isGenerating} leftIcon={<SparklesIcon />}>Generar Prompt Visual</Button>
              {visualReview && (
                <AIReviewBadge
                  score={visualReview.coherence_score}
                  recommendation={visualReview.recommendation}
                  summary={visualReview.one_line_summary}
                />
              )}
            </div>

            {/* 4. AI Iteration */}
            <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Iterar con IA</h2>
              <div>
                <label htmlFor="iteration-feedback" className="block text-sm font-medium text-foreground mb-1.5">Feedback para iterar</label>
                <textarea
                  id="iteration-feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="Ej: Cambia el mood a mas dinamico, usa mas naranja, ajusta el headline..."
                  className={`${TEXTAREA_BASE} border-border hover:border-border-dark resize-y`}
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleIterate} isLoading={isIterating} disabled={!feedback.trim() || !jsonText} leftIcon={<SparklesIcon />}>Iterar Prompt</Button>

              {iteratedJson && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3" role="region" aria-label="Resultado de iteracion">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Cambios realizados</p>
                    <button onClick={() => { setIteratedJson(''); setIterationChanges([]) }} className="text-blue-400 hover:text-blue-600 transition-colors" aria-label="Descartar iteracion">
                      <XIcon />
                    </button>
                  </div>
                  {iterationChanges.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Lista de cambios">
                      {iterationChanges.map((change, i) => <li key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{change}</li>)}
                    </ul>
                  )}
                  <Button variant="primary" size="sm" onClick={handleApplyIteration} isLoading={isSaving} disabled={!selectedVisualId} leftIcon={<SaveIcon />}>Aplicar Cambios</Button>
                </div>
              )}
            </div>

            {/* 5. Nano Banana Pro */}
            <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Historial Nano Banana Pro</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">NB Pro</span>
              </div>
              <Input id="nb-run-id" value={nbRunId} onChange={(e) => setNbRunId(e.target.value)} label="Run ID" placeholder="Pega el Run ID de Nano Banana Pro aqui" hint="Copia el ID del run desde la herramienta NB Pro" />
              <div>
                <Select label="Razon de iteracion" value={nbIterationReason} onChange={(e) => { setNbIterationReason(e.target.value); if (e.target.value !== 'Otro') setNbCustomReason('') }} options={[{ value: '', label: 'Selecciona una razon...' }, ...NB_ITERATION_REASONS.map((r) => ({ value: r, label: r }))]} aria-label="Razon de iteracion Nano Banana" />
                {nbIterationReason === 'Otro' && (
                  <input id="nb-custom-reason" type="text" value={nbCustomReason} onChange={(e) => setNbCustomReason(e.target.value)} placeholder="Describe la razon de la iteracion..." className="mt-2 w-full px-3 py-2 bg-background text-foreground border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent" aria-label="Razon personalizada" />
                )}
              </div>
              <div>
                <label htmlFor="nb-qa-notes" className="block text-sm font-medium text-foreground mb-1.5">Notas de QA <span className="text-xs font-normal text-foreground-muted">(opcional)</span></label>
                <textarea id="nb-qa-notes" value={nbQaNotes} onChange={(e) => setNbQaNotes(e.target.value)} rows={3} placeholder="Observaciones sobre la calidad, problemas encontrados, ajustes solicitados..." className={`${TEXTAREA_BASE} border-border hover:border-border-dark resize-none`} />
              </div>
              <Button variant="primary" size="sm" onClick={handleSaveNanoBanana} isLoading={isSavingNB} disabled={!selectedVisualId} leftIcon={<SaveIcon />} className="w-full">Guardar Metadata NB</Button>
              {visuals.some((v) => v.nanobanana_run_id || v.iteration_reason || v.qa_notes) && (
                <div className="pt-2 border-t border-border space-y-2" role="region" aria-label="Historial de iteraciones Nano Banana">
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Iteraciones registradas</p>
                  <ol className="space-y-2">
                    {sortedVisuals.filter((v) => v.nanobanana_run_id || v.iteration_reason || v.qa_notes).map((v) => (
                      <li key={v.id} className={`rounded-xl border p-3 text-xs space-y-1 ${v.id === selectedVisualId ? 'border-orange-300 bg-orange-50' : 'border-border bg-background'}`}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ClockIcon /><span className="font-bold text-foreground">v{v.version}</span>
                          {v.iteration_reason && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">{v.iteration_reason}</span>}
                        </div>
                        {v.nanobanana_run_id && <p className="text-foreground-muted font-mono truncate">Run: {v.nanobanana_run_id}</p>}
                        {v.qa_notes && <p className="text-foreground leading-snug">{v.qa_notes}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>

          {/* ========== RIGHT COLUMN (1/3, sticky) ========== */}
          <div className="w-full lg:w-1/3 space-y-5 lg:sticky lg:top-6">

            {/* 1. Version History */}
            <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Historial de versiones <span className="ml-1 text-xs font-normal text-foreground-muted">({visuals.length} total)</span>
              </h2>
              {sortedVisuals.length === 0 ? (
                <p className="text-sm text-foreground-muted text-center py-6">Sin versiones guardadas</p>
              ) : (
                <ol className="space-y-2" aria-label="Versiones del visual">
                  {sortedVisuals.map((visual) => {
                    const isSelected = visual.id === selectedVisualId
                    const status = visual.status as VisualStatus
                    return (
                      <li key={visual.id}>
                        <button
                          onClick={() => setSelectedVisualId(visual.id)}
                          aria-pressed={isSelected}
                          aria-label={`Version ${visual.version}, formato ${visual.format}`}
                          className={`w-full text-left rounded-xl border p-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${isSelected ? 'border-primary-300 bg-primary-50' : 'border-border bg-background hover:border-border-dark'}`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold text-foreground tabular-nums">v{visual.version}</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{visual.format}</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                            </div>
                          </div>
                          <p className="text-xs text-foreground-muted">{formatDate(visual.created_at)}</p>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>

            {/* 2. Current Status */}
            {selectedVisual && (
              <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Estado actual</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedVisual.status as VisualStatus]}`} role="status">
                  {STATUS_LABELS[selectedVisual.status as VisualStatus]}
                </span>
              </div>
            )}

            {/* 3. Image Generation */}
            {selectedVisualId && (
              <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
                <ImageGenerator
                  visualVersionId={selectedVisualId}
                  promptJson={selectedVisual?.prompt_json ?? {}}
                  format={format}
                  currentImageUrl={selectedVisual?.image_url ?? null}
                  onImageGenerated={(url) => setImageUrl(url)}
                />
                <details className="mt-3 text-xs text-foreground-muted">
                  <summary className="cursor-pointer hover:text-foreground">URL manual (avanzado)</summary>
                  <div className="mt-2 space-y-2">
                    <Input label="URL de imagen" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://supabase.../storage/v1/..." type="url" />
                    <Button variant="outline" size="sm" onClick={handleSaveImageUrl} isLoading={isSavingImage} disabled={!imageUrl.trim()} leftIcon={<SaveIcon />} className="w-full">Guardar URL</Button>
                  </div>
                </details>
              </div>
            )}

            {/* 4. QA Checklist (only when image exists) */}
            {selectedVisualId && hasImage && (
              <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">QA Checklist</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${allQaChecked(qaChecks) ? STATUS_COLORS.approved : STATUS_COLORS.pending_qa}`} role="status" aria-live="polite">
                    {allQaChecked(qaChecks) ? STATUS_LABELS.approved : STATUS_LABELS.pending_qa}
                  </span>
                </div>
                <div className="space-y-4">
                  {Object.entries(qaByCategory).map(([category, items]) => (
                    <fieldset key={category}>
                      <legend className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                        {QA_CATEGORY_LABELS[category] ?? category}
                      </legend>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={qaChecks[item.id] ?? false}
                              onChange={(e) => setQaChecks((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                              className="mt-0.5 h-4 w-4 rounded border-border text-primary-500 focus:ring-accent-500 focus:ring-2 shrink-0 cursor-pointer"
                              aria-label={item.label}
                            />
                            <span className="text-sm text-foreground leading-snug group-hover:text-primary-600 transition-colors">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
                <Button variant="primary" size="sm" onClick={handleSaveQA} isLoading={isSavingQA} leftIcon={<SaveIcon />} className="w-full">Guardar QA</Button>
              </div>
            )}

            {/* 5. VisualCritic AI */}
            {selectedVisualId && (
              <VisualCriticPanel
                visualVersionId={selectedVisualId}
                promptJson={selectedVisual ? selectedVisual.prompt_json : null}
                postContent={postContent}
                format={format}
                conceptType={selectedVisual?.concept_type ?? undefined}
                campaignId={campaignId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
