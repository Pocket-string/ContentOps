'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import { Button } from '@/components/ui/button'
import {
  generateBriefMarkdown,
  generatePlanMarkdown,
  generateDMTemplatesMarkdown,
} from '@/features/export/services/export-generators'

// ---- Types ----

interface WeeklyBrief {
  tema: string
  enemigo_silencioso?: string
  evidencia_clave?: string
  senales_mercado?: string[]
  anti_mito?: string
  buyer_persona?: string
  keyword?: string
  recurso?: string
  restriccion_links?: boolean
  tone_rules?: string
}

interface ExportPanelProps {
  data: {
    campaignName: string
    weekStart: string
    topicTitle: string | null
    keyword: string | null
    resource: { type: string; url: string; name: string; description: string } | null
    templates: { name: string; content: string }[]
    posts: {
      dayOfWeek: number
      dayLabel: string
      funnelStage: string
      status: string
      currentVersion: { variant: string; content: string; score_total: number | null } | null
      visualPrompts: { version: number; format: string; promptJson: Record<string, unknown> }[]
      hasApprovedVisual: boolean
    }[]
    checklist: {
      id: string
      label: string
      checked: boolean
      severity: 'required' | 'recommended'
    }[]
    weeklyBrief: WeeklyBrief | null
    publishingPlan: Record<string, { suggested_time?: string; notes?: string }> | null
  }
}

// ---- Constants ----

const FUNNEL_LABELS: Record<string, string> = {
  tofu_problem: 'TOFU Problema',
  mofu_problem: 'MOFU Problema',
  tofu_solution: 'TOFU Solucion',
  mofu_solution: 'MOFU Solucion',
  bofu_conversion: 'BOFU Conversion',
}

// ---- Utilities ----

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function funnelLabel(stage: string): string {
  return FUNNEL_LABELS[stage] ?? stage
}

// ---- Markdown generators ----

function generateCopyMd(
  posts: ExportPanelProps['data']['posts'],
  weekStart: string
): string {
  const lines: string[] = [`# Campaign Copy — Semana del ${weekStart}`, '']

  for (const post of posts) {
    if (!post.currentVersion) continue
    const { variant, content, score_total } = post.currentVersion
    lines.push(`## ${post.dayLabel} — ${funnelLabel(post.funnelStage)}`)
    lines.push(`**Variante**: ${variant}`)
    lines.push(`**Score D/G/P/I**: ${score_total ?? 'N/A'}/20`)
    lines.push('')
    lines.push(content)
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

function generateChecklistMd(checklist: ExportPanelProps['data']['checklist']): string {
  const lines: string[] = ['# Checklist de Publicacion', '']

  const required = checklist.filter((i) => i.severity === 'required')
  const recommended = checklist.filter((i) => i.severity === 'recommended')

  if (required.length > 0) {
    lines.push('## Requeridos')
    for (const item of required) {
      lines.push(`- [${item.checked ? 'x' : ' '}] ${item.label}`)
    }
    lines.push('')
  }

  if (recommended.length > 0) {
    lines.push('## Recomendados')
    for (const item of recommended) {
      lines.push(`- [${item.checked ? 'x' : ' '}] ${item.label}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function generateLinksMd(
  keyword: string | null,
  resource: ExportPanelProps['data']['resource'],
  templates: ExportPanelProps['data']['templates']
): string {
  const lines: string[] = ['# Links y Conversion', '']

  if (keyword) {
    lines.push(`## Keyword CTA`)
    lines.push(`**Keyword**: #${keyword}`)
    lines.push('')
  }

  if (resource?.name) {
    lines.push('## Recurso de Conversion')
    lines.push(`**Nombre**: ${resource.name}`)
    if (resource.type) lines.push(`**Tipo**: ${resource.type}`)
    if (resource.url) lines.push(`**URL**: ${resource.url}`)
    if (resource.description) lines.push(`**Descripcion**: ${resource.description}`)
    lines.push('')
  }

  if (templates.length > 0) {
    lines.push('## Templates DM / Comentario')
    for (const tpl of templates) {
      lines.push(`### ${tpl.name}`)
      lines.push(tpl.content)
      lines.push('')
    }
  }

  return lines.join('\n')
}

// ---- Inline SVG Icons ----

function svgProps(className?: string) {
  return {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  )
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg {...svgProps(className)}>
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  )
}

// ---- Sub-components ----

function ChecklistItem({
  label,
  checked,
  severity,
}: {
  label: string
  checked: boolean
  severity: 'required' | 'recommended'
}) {
  const isBlocker = severity === 'required' && !checked

  return (
    <li className={`flex items-center gap-3 py-2 border-b border-border last:border-0 ${isBlocker ? 'text-red-600' : 'text-foreground'}`}>
      {checked ? (
        <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" />
      ) : (
        <XCircleIcon className={`w-4 h-4 shrink-0 ${isBlocker ? 'text-red-500' : 'text-gray-400'}`} />
      )}
      <span className="text-sm leading-snug">{label}</span>
      {isBlocker && (
        <span className="ml-auto text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full shrink-0">
          Requerido
        </span>
      )}
    </li>
  )
}

function PackPreviewCard({
  icon,
  title,
  subtitle,
  detail,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  detail?: React.ReactNode
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 text-primary-600">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <p className="text-xs text-foreground-muted">{subtitle}</p>
        </div>
      </div>
      {detail && <div className="mt-1">{detail}</div>}
    </div>
  )
}

// ---- Main Component ----

export function ExportPanel({ data }: ExportPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')

  // ---- Derived state ----

  const requiredItems = data.checklist.filter((i) => i.severity === 'required')
  const recommendedItems = data.checklist.filter((i) => i.severity === 'recommended')
  const pendingRequired = requiredItems.filter((i) => !i.checked)
  const checkedTotal = data.checklist.filter((i) => i.checked).length
  const isReady = pendingRequired.length === 0

  const postsWithContent = data.posts.filter((p) => p.currentVersion !== null)
  const totalVisualPrompts = data.posts.reduce((acc, p) => acc + p.visualPrompts.length, 0)
  const visualFormats = [...new Set(data.posts.flatMap((p) => p.visualPrompts.map((vp) => vp.format)))]

  // ---- Handlers ----

  async function handleDownload() {
    setError('')
    setIsDownloading(true)
    try {
      const zip = new JSZip()

      zip.file('copy.md', generateCopyMd(data.posts, data.weekStart))

      const visualsFolder = zip.folder('visual_prompts')
      data.posts.forEach((post) => {
        post.visualPrompts.forEach((vp) => {
          const filename =
            sanitizeFilename(`dia-${post.dayOfWeek}-${post.funnelStage}-v${vp.version}`) + '.json'
          visualsFolder?.file(filename, JSON.stringify(vp.promptJson, null, 2))
        })
      })

      zip.file('checklist_publicacion.md', generateChecklistMd(data.checklist))
      zip.file('links.md', generateLinksMd(data.keyword, data.resource, data.templates))

      // New Phase 10 files
      zip.file('weekly_brief.md', generateBriefMarkdown(data.weeklyBrief, data.weekStart))
      zip.file('publishing_plan.md', generatePlanMarkdown(data.publishingPlan))
      zip.file(
        'dm_templates.md',
        generateDMTemplatesMarkdown(data.templates, data.keyword, data.resource),
      )

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campaign-pack-${sanitizeFilename(data.weekStart)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al generar el ZIP')
      console.error('[export] ZIP generation error:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl"
        >
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError('')}
            className="shrink-0 hover:text-red-900 transition-colors text-lg leading-none"
            aria-label="Cerrar error"
          >
            &times;
          </button>
        </div>
      )}

      {/* ==================== SECTION 1: Checklist ==================== */}
      <section
        className="bg-surface border border-border rounded-2xl shadow-card p-6"
        aria-labelledby="section-checklist-heading"
      >
        {/* Header with readiness indicator */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2
              id="section-checklist-heading"
              className="text-sm font-semibold text-foreground"
            >
              Checklist Pre-Publicacion
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              {checkedTotal} de {data.checklist.length} items completados
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
              isReady
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}
            aria-live="polite"
          >
            {isReady ? (
              <>
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Listo para exportar
              </>
            ) : (
              <>
                <XCircleIcon className="w-3.5 h-3.5" />
                {pendingRequired.length} item{pendingRequired.length !== 1 ? 's' : ''} pendiente{pendingRequired.length !== 1 ? 's' : ''}
              </>
            )}
          </div>
        </div>

        {/* Required items */}
        {requiredItems.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-2">
              Requeridos
            </p>
            <ul aria-label="Items requeridos">
              {requiredItems.map((item) => (
                <ChecklistItem
                  key={item.id}
                  label={item.label}
                  checked={item.checked}
                  severity={item.severity}
                />
              ))}
            </ul>
          </div>
        )}

        {/* Recommended items */}
        {recommendedItems.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-2">
              Recomendados
            </p>
            <ul aria-label="Items recomendados">
              {recommendedItems.map((item) => (
                <ChecklistItem
                  key={item.id}
                  label={item.label}
                  checked={item.checked}
                  severity={item.severity}
                />
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ==================== SECTION 2: Pack Preview + Download ==================== */}
      <section
        className="bg-surface border border-border rounded-2xl shadow-card p-6"
        aria-labelledby="section-pack-heading"
      >
        <div className="mb-5">
          <h2
            id="section-pack-heading"
            className="text-sm font-semibold text-foreground"
          >
            Campaign Pack
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Contenido que se incluira en el ZIP descargable
          </p>
        </div>

        {/* 4-card grid preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* copy.md */}
          <PackPreviewCard
            icon={<FileIcon className="w-4 h-4" />}
            title="copy.md"
            subtitle={`${postsWithContent.length} post${postsWithContent.length !== 1 ? 's' : ''} con contenido`}
            detail={
              postsWithContent.length > 0 ? (
                <ul className="space-y-1">
                  {postsWithContent.slice(0, 3).map((post) => (
                    <li key={post.dayOfWeek} className="text-xs text-foreground-muted leading-snug">
                      <span className="font-medium text-foreground">{post.dayLabel}</span>
                      {' — '}
                      {post.currentVersion!.content.slice(0, 100)}
                      {post.currentVersion!.content.length > 100 ? '...' : ''}
                    </li>
                  ))}
                  {postsWithContent.length > 3 && (
                    <li className="text-xs text-foreground-muted italic">
                      +{postsWithContent.length - 3} mas...
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-foreground-muted italic">Sin posts con contenido aun</p>
              )
            }
          />

          {/* visual_prompts/ */}
          <PackPreviewCard
            icon={<FolderIcon className="w-4 h-4" />}
            title="visual_prompts/"
            subtitle={`${totalVisualPrompts} prompt${totalVisualPrompts !== 1 ? 's' : ''} JSON`}
            detail={
              visualFormats.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {visualFormats.map((fmt) => (
                    <span
                      key={fmt}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-foreground-muted italic">Sin prompts visuales aun</p>
              )
            }
          />

          {/* checklist_publicacion.md */}
          <PackPreviewCard
            icon={<FileIcon className="w-4 h-4" />}
            title="checklist_publicacion.md"
            subtitle={`${checkedTotal}/${data.checklist.length} items marcados`}
            detail={
              <div className="flex items-center gap-1.5">
                <div
                  className="h-1.5 rounded-full bg-gray-200 flex-1 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={checkedTotal}
                  aria-valuemin={0}
                  aria-valuemax={data.checklist.length}
                  aria-label="Progreso del checklist"
                >
                  <div
                    className={`h-full rounded-full transition-all ${isReady ? 'bg-green-500' : 'bg-yellow-400'}`}
                    style={{
                      width: data.checklist.length > 0
                        ? `${(checkedTotal / data.checklist.length) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
                <span className="text-xs text-foreground-muted shrink-0">
                  {data.checklist.length > 0
                    ? Math.round((checkedTotal / data.checklist.length) * 100)
                    : 0}%
                </span>
              </div>
            }
          />

          {/* links.md */}
          <PackPreviewCard
            icon={<FileIcon className="w-4 h-4" />}
            title="links.md"
            subtitle="Keywords y recursos de conversion"
            detail={
              <div className="space-y-1">
                {data.keyword ? (
                  <p className="text-xs text-foreground">
                    <span className="text-foreground-muted">Keyword: </span>
                    <span className="font-medium">#{data.keyword}</span>
                  </p>
                ) : (
                  <p className="text-xs text-foreground-muted italic">Sin keyword definida</p>
                )}
                {data.resource?.name ? (
                  <p className="text-xs text-foreground">
                    <span className="text-foreground-muted">Recurso: </span>
                    <span className="font-medium">{data.resource.name}</span>
                  </p>
                ) : (
                  <p className="text-xs text-foreground-muted italic">Sin recurso configurado</p>
                )}
              </div>
            }
          />

          {/* weekly_brief.md */}
          <PackPreviewCard
            icon={<FileIcon className="w-4 h-4" />}
            title="weekly_brief.md"
            subtitle="Brief estrategico de la semana"
            detail={
              data.weeklyBrief ? (
                <div className="space-y-1">
                  <p className="text-xs text-foreground">
                    <span className="text-foreground-muted">Tema: </span>
                    <span className="font-medium">
                      {data.weeklyBrief.tema.length > 80
                        ? `${data.weeklyBrief.tema.slice(0, 80)}...`
                        : data.weeklyBrief.tema}
                    </span>
                  </p>
                  {data.weeklyBrief.buyer_persona && (
                    <p className="text-xs text-foreground">
                      <span className="text-foreground-muted">Buyer Persona: </span>
                      <span className="font-medium">
                        {data.weeklyBrief.buyer_persona.length > 60
                          ? `${data.weeklyBrief.buyer_persona.slice(0, 60)}...`
                          : data.weeklyBrief.buyer_persona}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-foreground-muted italic">Sin brief definido</p>
              )
            }
          />

          {/* publishing_plan.md */}
          <PackPreviewCard
            icon={<FileIcon className="w-4 h-4" />}
            title="publishing_plan.md"
            subtitle="Horario de publicacion diario"
            detail={
              data.publishingPlan && Object.keys(data.publishingPlan).length > 0 ? (
                <ul className="space-y-1">
                  {Object.entries(data.publishingPlan)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([day, entry]) => {
                      const dayNames: Record<string, string> = {
                        '1': 'Lun',
                        '2': 'Mar',
                        '3': 'Mie',
                        '4': 'Jue',
                        '5': 'Vie',
                      }
                      return (
                        <li key={day} className="text-xs text-foreground flex items-center gap-1.5">
                          <span className="font-medium text-foreground shrink-0">
                            {dayNames[day] ?? `Dia ${day}`}:
                          </span>
                          <span className="text-foreground-muted">
                            {entry.suggested_time ?? 'Sin hora definida'}
                          </span>
                        </li>
                      )
                    })}
                </ul>
              ) : (
                <p className="text-xs text-foreground-muted italic">Sin plan definido</p>
              )
            }
          />

          {/* dm_templates.md */}
          <PackPreviewCard
            icon={<FileIcon className="w-4 h-4" />}
            title="dm_templates.md"
            subtitle={`${data.templates.length} template${data.templates.length !== 1 ? 's' : ''} configurado${data.templates.length !== 1 ? 's' : ''}`}
            detail={
              data.templates.length > 0 ? (
                <ul className="space-y-1">
                  {data.templates.slice(0, 3).map((tpl) => (
                    <li key={tpl.name} className="text-xs text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                      <span className="font-medium truncate">{tpl.name}</span>
                    </li>
                  ))}
                  {data.templates.length > 3 && (
                    <li className="text-xs text-foreground-muted italic">
                      +{data.templates.length - 3} mas...
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-foreground-muted italic">Sin templates configurados</p>
              )
            }
          />
        </div>

        {/* Download button */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleDownload}
          isLoading={isDownloading}
          leftIcon={!isDownloading ? <DownloadIcon className="w-5 h-5" /> : undefined}
          className="w-full"
          aria-label={`Descargar Campaign Pack para la semana del ${data.weekStart}`}
        >
          {isDownloading ? 'Generando ZIP...' : 'Descargar Campaign Pack (.zip)'}
        </Button>

        {!isReady && (
          <p className="mt-3 text-xs text-yellow-600 text-center" role="note">
            Hay items requeridos pendientes. Puedes exportar igualmente, pero revisa el checklist antes de publicar.
          </p>
        )}
      </section>
    </div>
  )
}
