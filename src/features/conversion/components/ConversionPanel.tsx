'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

// ---- Types ----

interface ConversionPanelProps {
  campaignId: string
  keyword: string | null
  config: {
    resource?: { type: string; url: string; name: string; description: string }
    templates?: { id: string; name: string; content: string }[]
    pinned_comment?: string
  }
  onUpdateResource: (campaignId: string, resourceJson: string) => Promise<{ success?: true; error?: string }>
  onUpdateTemplates: (campaignId: string, templatesJson: string) => Promise<{ success?: true; error?: string }>
  onUpdatePinnedComment: (campaignId: string, pinnedComment: string) => Promise<{ success?: true; error?: string }>
}

interface Template { id: string; name: string; content: string }

// ---- Constants ----

const RESOURCE_TYPES = [
  { value: '', label: 'Seleccionar tipo...' },
  { value: 'pdf', label: 'PDF' },
  { value: 'video', label: 'Video' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'ebook', label: 'Ebook' },
  { value: 'tool', label: 'Herramienta' },
  { value: 'other', label: 'Otro' },
]

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF', video: 'Video', webinar: 'Webinar',
  ebook: 'Ebook', tool: 'Herramienta', other: 'Otro',
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'default-1',
    name: 'DM Inicial',
    content: 'Hola {{nombre}}, gracias por tu interes en {{keyword}}! Aqui tienes el recurso: {{recurso_nombre}} — {{recurso_url}}',
  },
  {
    id: 'default-2',
    name: 'Respuesta Comentario',
    content: 'Gracias por comentar {{keyword}}! Te envio el recurso por DM.',
  },
  {
    id: 'default-3',
    name: 'Follow-up',
    content: 'Hola {{nombre}}, te comparti {{recurso_nombre}} sobre {{keyword}}. Te fue util? Me encantaria saber tu experiencia.',
  },
]

const TEXTAREA_BASE = `
  w-full px-3 py-2.5 bg-background text-foreground
  border border-border hover:border-border-dark rounded-xl
  placeholder:text-foreground-muted text-sm leading-relaxed resize-none
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
`

const TEMPLATE_VARS_HINT = ['{{keyword}}', '{{nombre}}', '{{recurso_nombre}}', '{{recurso_url}}']

// ---- Utilities ----

function renderTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

// ---- Inline SVG Icons ----

function svgProps(className?: string) {
  return { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M21 2l-9.6 9.6" /><path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M12 2L8 6H4l4 4-2 8 6-4 6 4-2-8 4-4h-4z" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return <svg {...svgProps(className)} strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return <svg {...svgProps(className)}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}

// ---- Sub-components ----

interface ModeSwitchProps {
  rapidMode: boolean
  onToggle: (value: boolean) => void
}

function ModeSwitch({ rapidMode, onToggle }: ModeSwitchProps) {
  return (
    <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-xl" role="group" aria-label="Modo de visualizacion">
      <button
        onClick={() => onToggle(false)}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          !rapidMode
            ? 'bg-primary-100 text-primary-700 shadow-sm'
            : 'text-gray-500 hover:bg-gray-200'
        }`}
        aria-pressed={!rapidMode}
      >
        Variables
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          rapidMode
            ? 'bg-accent-100 text-accent-700 shadow-sm'
            : 'text-gray-500 hover:bg-gray-200'
        }`}
        aria-pressed={rapidMode}
      >
        Copy/Paste
      </button>
    </div>
  )
}

// ---- Main Component ----

export function ConversionPanel({
  campaignId,
  keyword,
  config,
  onUpdateResource,
  onUpdateTemplates,
  onUpdatePinnedComment,
}: ConversionPanelProps) {
  const [resource, setResource] = useState({
    type: config.resource?.type ?? '',
    url: config.resource?.url ?? '',
    name: config.resource?.name ?? '',
    description: config.resource?.description ?? '',
  })
  const [templates, setTemplates] = useState<Template[]>(
    config.templates && config.templates.length > 0 ? config.templates : DEFAULT_TEMPLATES
  )
  const [pinnedComment, setPinnedComment] = useState(config.pinned_comment ?? '')
  const [isSavingResource, setIsSavingResource] = useState(false)
  const [isSavingTemplates, setIsSavingTemplates] = useState(false)
  const [isSavingPinnedComment, setIsSavingPinnedComment] = useState(false)
  const [pinnedPreview, setPinnedPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [rapidMode, setRapidMode] = useState(false)
  const [error, setError] = useState('')

  const templateVars: Record<string, string> = {
    keyword: keyword ?? '[KEYWORD]',
    recurso_nombre: resource.name || '[RECURSO]',
    recurso_url: resource.url || '[URL]',
    nombre: '[Nombre]',
  }

  async function handleSaveResource() {
    setError('')
    setIsSavingResource(true)
    try {
      const result = await onUpdateResource(campaignId, JSON.stringify(resource))
      if (result.error) setError(result.error)
    } finally { setIsSavingResource(false) }
  }

  async function handleSaveTemplates() {
    setError('')
    setIsSavingTemplates(true)
    try {
      const result = await onUpdateTemplates(campaignId, JSON.stringify(templates))
      if (result.error) setError(result.error)
    } finally { setIsSavingTemplates(false) }
  }

  async function handleSavePinnedComment() {
    setError('')
    setIsSavingPinnedComment(true)
    try {
      const result = await onUpdatePinnedComment(campaignId, pinnedComment)
      if (result.error) setError(result.error)
    } finally { setIsSavingPinnedComment(false) }
  }

  function handleAddTemplate() {
    setTemplates((prev) => [...prev, { id: crypto.randomUUID(), name: 'Nuevo Template', content: '' }])
  }

  function handleUpdateTemplate(id: string, field: keyof Template, value: string) {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  function handleDeleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    setDeleteConfirmId(null)
  }

  async function copyToClipboard(text: string, copyId: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(copyId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function copyAllTemplates() {
    const allRendered = templates
      .map((t) => renderTemplate(t.content, templateVars))
      .join('\n\n---\n\n')
    await copyToClipboard(allRendered, 'all')
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div role="alert" className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="shrink-0 hover:text-red-900 transition-colors text-lg leading-none" aria-label="Cerrar error">&times;</button>
        </div>
      )}

      {/* ==================== SECTION 1: Keyword CTA ==================== */}
      <section className="bg-surface border border-border rounded-2xl shadow-card p-6" aria-labelledby="section-keyword-heading">
        <div className="flex items-center gap-2 mb-4">
          <KeyIcon className="w-4 h-4 text-accent-500 shrink-0" />
          <h2 id="section-keyword-heading" className="text-sm font-semibold text-foreground">Keyword CTA</h2>
        </div>
        <div className="flex items-center gap-4">
          {keyword ? (
            <span
              className="inline-flex items-center px-5 py-2.5 rounded-full text-lg font-bold bg-accent-50 text-accent-700 border-2 border-accent-300 tracking-wide"
              aria-label={`Keyword de la campana: ${keyword}`}
            >
              #{keyword}
            </span>
          ) : (
            <span className="text-sm text-foreground-muted italic">Sin keyword definida</span>
          )}
        </div>
        <p className="mt-3 text-xs text-foreground-muted leading-relaxed max-w-prose">
          Esta keyword se usa como CTA en los posts. El lector la comenta o la menciona en DM para recibir el recurso.
        </p>
      </section>

      {/* ==================== SECTION 2: Recurso de Conversion ==================== */}
      <section className="bg-surface border border-border rounded-2xl shadow-card p-6" aria-labelledby="section-resource-heading">
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon className="w-4 h-4 text-primary-500 shrink-0" />
          <h2 id="section-resource-heading" className="text-sm font-semibold text-foreground">Recurso de Conversion</h2>
        </div>

        {/* Saved resource preview card */}
        {config.resource?.name && (
          <div className="mb-5 flex items-start gap-3 p-4 bg-primary-50 border border-primary-200 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <LinkIcon className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground truncate">{config.resource.name}</span>
                {config.resource.type && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    {RESOURCE_TYPE_LABELS[config.resource.type] ?? config.resource.type}
                  </span>
                )}
              </div>
              {config.resource.description && (
                <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2">{config.resource.description}</p>
              )}
              {config.resource.url && (
                <a href={config.resource.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:text-primary-700 underline mt-1 inline-block truncate max-w-xs">
                  {config.resource.url}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Resource form */}
        <div className="space-y-4">
          <Select label="Tipo de recurso" options={RESOURCE_TYPES} value={resource.type}
            onChange={(e) => setResource((prev) => ({ ...prev, type: e.target.value }))} />
          <Input label="Nombre" value={resource.name} placeholder="Ej. Guia SCADA 2024"
            onChange={(e) => setResource((prev) => ({ ...prev, name: e.target.value }))} />
          <Input label="URL del recurso" type="url" value={resource.url} placeholder="https://..."
            onChange={(e) => setResource((prev) => ({ ...prev, url: e.target.value }))} />
          <div className="w-full">
            <label htmlFor="resource-description" className="block text-sm font-medium text-foreground mb-1.5">Descripcion</label>
            <textarea id="resource-description" value={resource.description} rows={3}
              onChange={(e) => setResource((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Breve descripcion del recurso..."
              className={TEXTAREA_BASE}
            />
          </div>
          <Button variant="primary" size="sm" onClick={handleSaveResource} isLoading={isSavingResource} disabled={!resource.name.trim()}>
            Guardar Recurso
          </Button>
        </div>
      </section>

      {/* ==================== SECTION 3: Comentario Fijado ==================== */}
      <section className="bg-surface border border-border rounded-2xl shadow-card p-6" aria-labelledby="section-pinned-heading">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PinIcon className="w-4 h-4 text-primary-500 shrink-0" />
            <h2 id="section-pinned-heading" className="text-sm font-semibold text-foreground">Comentario Fijado</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPinnedPreview((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                pinnedPreview
                  ? 'bg-accent-100 text-accent-700 hover:bg-accent-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-pressed={pinnedPreview}
              aria-label={pinnedPreview ? 'Mostrar template raw' : 'Vista previa del comentario fijado'}
            >
              {pinnedPreview ? 'Raw' : 'Preview'}
            </button>
            <button
              onClick={() => copyToClipboard(renderTemplate(pinnedComment, templateVars), 'pinned')}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Copiar comentario fijado al portapapeles"
              title="Copiar version renderizada"
              disabled={!pinnedComment.trim()}
            >
              {copiedId === 'pinned'
                ? <CheckIcon className="w-4 h-4 text-green-500" />
                : <CopyIcon className="w-4 h-4" />
              }
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {pinnedPreview ? (
            <div
              className="text-sm text-foreground bg-accent-50 border border-accent-100 rounded-lg p-3 leading-relaxed whitespace-pre-wrap min-h-[4rem]"
              aria-label="Vista previa del comentario fijado"
            >
              {pinnedComment.trim()
                ? renderTemplate(pinnedComment, templateVars)
                : <span className="text-foreground-muted italic">Sin contenido aun...</span>
              }
            </div>
          ) : (
            <textarea
              value={pinnedComment}
              onChange={(e) => setPinnedComment(e.target.value)}
              rows={3}
              placeholder="Comenta {{keyword}} para recibir {{recurso_nombre}}"
              className={`${TEXTAREA_BASE} font-mono`}
              aria-label="Template del comentario fijado"
            />
          )}
          {!pinnedPreview && (
            <p className="text-xs text-foreground-muted">
              Variables:{' '}
              {TEMPLATE_VARS_HINT.map((v) => (
                <code key={v} className="mx-0.5 px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{v}</code>
              ))}
            </p>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSavePinnedComment}
            isLoading={isSavingPinnedComment}
          >
            Guardar Comentario Fijado
          </Button>
        </div>
      </section>

      {/* ==================== SECTION 4: Templates DM/Comentario ==================== */}
      <section className="bg-surface border border-border rounded-2xl shadow-card p-6" aria-labelledby="section-templates-heading">
        <div className="flex items-center justify-between mb-5">
          <h2 id="section-templates-heading" className="text-sm font-semibold text-foreground">Templates DM / Comentario</h2>
          <div className="flex items-center gap-2">
            <ModeSwitch rapidMode={rapidMode} onToggle={setRapidMode} />
            {!rapidMode && (
              <Button variant="outline" size="sm" onClick={handleAddTemplate} leftIcon={<PlusIcon className="w-3.5 h-3.5" />}>
                Agregar Template
              </Button>
            )}
          </div>
        </div>

        {rapidMode ? (
          /* ---- Modo Copy/Paste ---- */
          <div className="space-y-4">
            {templates.map((template) => {
              const rendered = renderTemplate(template.content, templateVars)
              const isCopied = copiedId === template.id
              return (
                <div key={template.id} className="border border-border rounded-xl overflow-hidden" role="article" aria-label={`Template renderizado: ${template.name}`}>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-accent-50 border-b border-border">
                    <span className="text-xs font-semibold text-accent-700">{template.name}</span>
                    <button
                      onClick={() => copyToClipboard(rendered, template.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isCopied
                          ? 'bg-green-100 text-green-700'
                          : 'bg-accent-100 text-accent-700 hover:bg-accent-200'
                      }`}
                      aria-label={`Copiar template ${template.name}`}
                    >
                      {isCopied
                        ? <><CheckIcon className="w-3.5 h-3.5" /> Copiado</>
                        : <><CopyIcon className="w-3.5 h-3.5" /> Copiar</>
                      }
                    </button>
                  </div>
                  <div className="p-4 bg-background">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{rendered}</p>
                  </div>
                </div>
              )
            })}

            {templates.length === 0 && (
              <p className="text-sm text-foreground-muted text-center py-8">No hay templates definidos.</p>
            )}

            {templates.length > 1 && (
              <button
                onClick={copyAllTemplates}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  copiedId === 'all'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-accent-50 border-accent-300 text-accent-700 hover:bg-accent-100'
                }`}
                aria-label="Copiar todos los templates al portapapeles"
              >
                {copiedId === 'all'
                  ? <><CheckIcon className="w-4 h-4" /> Todos copiados</>
                  : <><CopyIcon className="w-4 h-4" /> Copiar Todos</>
                }
              </button>
            )}
          </div>
        ) : (
          /* ---- Modo Variables ---- */
          <div className="space-y-4">
            {templates.map((template) => {
              const isPreview = previewMode[template.id] ?? false
              const rendered = renderTemplate(template.content, templateVars)
              const isCopied = copiedId === template.id
              const isConfirmingDelete = deleteConfirmId === template.id

              return (
                <div key={template.id} className="border border-border rounded-xl overflow-hidden" role="article" aria-label={`Template: ${template.name}`}>
                  {/* Template header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-border">
                    <input
                      type="text"
                      value={template.name}
                      onChange={(e) => handleUpdateTemplate(template.id, 'name', e.target.value)}
                      className="flex-1 text-sm font-medium text-foreground bg-transparent border-none outline-none focus:ring-1 focus:ring-accent-500 rounded px-1 py-0.5"
                      aria-label="Nombre del template"
                    />
                    <button
                      onClick={() => setPreviewMode((prev) => ({ ...prev, [template.id]: !prev[template.id] }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${isPreview ? 'bg-accent-100 text-accent-700 hover:bg-accent-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      aria-pressed={isPreview}
                      aria-label={isPreview ? 'Mostrar template raw' : 'Vista previa del template'}
                    >
                      {isPreview ? 'Raw' : 'Preview'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(rendered, template.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      aria-label={`Copiar template ${template.name} al portapapeles`}
                      title="Copiar version renderizada"
                    >
                      {isCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5" role="group" aria-label="Confirmar eliminacion">
                        <button onClick={() => handleDeleteTemplate(template.id)}
                          className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                          aria-label="Confirmar eliminacion del template">
                          Eliminar
                        </button>
                        <button onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          aria-label="Cancelar eliminacion">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(template.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label={`Eliminar template ${template.name}`}>
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Template body */}
                  <div className="p-4">
                    {isPreview ? (
                      <div
                        className="text-sm text-foreground bg-accent-50 border border-accent-100 rounded-lg p-3 leading-relaxed whitespace-pre-wrap"
                        aria-label="Vista previa renderizada del template"
                      >
                        {rendered}
                      </div>
                    ) : (
                      <textarea
                        value={template.content}
                        onChange={(e) => handleUpdateTemplate(template.id, 'content', e.target.value)}
                        rows={3}
                        placeholder="Escribe el template con {{variables}}..."
                        className={`${TEXTAREA_BASE} font-mono`}
                        aria-label={`Contenido del template ${template.name}`}
                      />
                    )}
                    {!isPreview && (
                      <p className="mt-2 text-xs text-foreground-muted">
                        Variables:{' '}
                        {TEMPLATE_VARS_HINT.map((v) => (
                          <code key={v} className="mx-0.5 px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{v}</code>
                        ))}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            {templates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <p className="text-sm text-foreground-muted">No hay templates definidos.</p>
                <Button variant="outline" size="sm" onClick={handleAddTemplate} leftIcon={<PlusIcon className="w-3.5 h-3.5" />}>
                  Agregar primer template
                </Button>
              </div>
            )}
          </div>
        )}

        {templates.length > 0 && !rapidMode && (
          <div className="mt-5 pt-4 border-t border-border">
            <Button variant="primary" size="sm" onClick={handleSaveTemplates} isLoading={isSavingTemplates}>
              Guardar Templates
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
