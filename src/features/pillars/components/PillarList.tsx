'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { ContentPillar } from '@/shared/types/content-ops'

interface PillarListProps {
  pillars: ContentPillar[]
  onDelete?: (id: string) => Promise<{ success?: true; error?: string }>
  onToggleActive?: (id: string, isActive: boolean) => Promise<{ success?: true; error?: string }>
}

function PlusIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

export function PillarList({ pillars, onDelete, onToggleActive }: PillarListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleDelete(pillar: ContentPillar) {
    const confirmed = window.confirm(
      `¿Eliminar el pilar "${pillar.name}"? Esta accion no se puede deshacer.`
    )
    if (!confirmed || !onDelete) return

    setActionError(null)
    setDeletingId(pillar.id)
    try {
      const result = await onDelete(pillar.id)
      if (result?.error) setActionError(result.error)
    } catch {
      setActionError('Ocurrio un error inesperado al eliminar.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleActive(pillar: ContentPillar) {
    if (!onToggleActive) return
    setActionError(null)
    setTogglingId(pillar.id)
    try {
      const result = await onToggleActive(pillar.id, !pillar.is_active)
      if (result?.error) setActionError(result.error)
    } catch {
      setActionError('Ocurrio un error inesperado al actualizar el pilar.')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pilares de Contenido</h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            {pillars.length} {pillars.length === 1 ? 'pilar configurado' : 'pilares configurados'}
          </p>
        </div>
        <Link href="/pillars/new" aria-label="Crear nuevo pilar de contenido">
          <Button leftIcon={<PlusIcon className="w-4 h-4" />}>
            Nuevo Pilar
          </Button>
        </Link>
      </div>

      {/* Action error */}
      {actionError && (
        <div
          role="alert"
          className="rounded-xl bg-error-50 border border-error-500 px-4 py-3"
        >
          <p className="text-sm text-error-700">{actionError}</p>
        </div>
      )}

      {/* Empty state */}
      {pillars.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
            <LayersIcon className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No hay pilares configurados
          </h2>
          <p className="text-sm text-foreground-muted mb-6 max-w-sm">
            Los pilares organizan tu contenido en categorias tematicas. Crea el primero para
            empezar a estructurar tu estrategia.
          </p>
          <Link href="/pillars/new">
            <Button leftIcon={<PlusIcon className="w-4 h-4" />}>
              Crear primer Pilar
            </Button>
          </Link>
        </div>
      ) : (
        /* Pillar cards */
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
          {pillars.map((pillar) => (
            <li key={pillar.id}>
              <article
                className={`
                  bg-surface border border-border rounded-2xl shadow-card p-5
                  flex flex-col gap-3 h-full
                  transition-opacity duration-200
                  ${!pillar.is_active ? 'opacity-60' : ''}
                `}
                aria-label={`Pilar: ${pillar.name}`}
              >
                {/* Card header: color dot + name + badge */}
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-border"
                    style={{ backgroundColor: pillar.color }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-foreground leading-snug truncate">
                      {pillar.name}
                    </h2>
                  </div>
                  <span
                    className={`
                      flex-shrink-0 inline-flex items-center px-2 py-0.5
                      rounded-full text-xs font-medium
                      ${pillar.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'}
                    `}
                    aria-label={pillar.is_active ? 'Pilar activo' : 'Pilar inactivo'}
                  >
                    {pillar.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Description */}
                {pillar.description ? (
                  <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                    {pillar.description}
                  </p>
                ) : (
                  <p className="text-xs text-foreground-muted italic">Sin descripcion</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
                  {onToggleActive && (
                    <button
                      type="button"
                      onClick={() => handleToggleActive(pillar)}
                      disabled={togglingId === pillar.id}
                      aria-label={pillar.is_active ? `Desactivar pilar ${pillar.name}` : `Activar pilar ${pillar.name}`}
                      className="
                        flex-1 px-3 py-1.5 text-xs font-medium rounded-lg
                        border border-border text-foreground-muted
                        hover:border-accent-400 hover:text-accent-600 hover:bg-accent-50
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors duration-200
                      "
                    >
                      {togglingId === pillar.id
                        ? 'Actualizando...'
                        : pillar.is_active
                        ? 'Desactivar'
                        : 'Activar'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(pillar)}
                      disabled={deletingId === pillar.id}
                      aria-label={`Eliminar pilar ${pillar.name}`}
                      className="
                        p-1.5 rounded-lg border border-border text-foreground-muted
                        hover:border-error-400 hover:text-error-500 hover:bg-error-50
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors duration-200
                      "
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
