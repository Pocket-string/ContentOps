'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ResearchReport } from '@/shared/types/content-ops'

interface ResearchListProps {
  reports: ResearchReport[]
  allTags: string[]
}

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
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

function DocumentIcon({ className }: { className?: string }) {
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
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ResearchList({ reports, allTags }: ResearchListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        report.title.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesTags =
        activeTags.length === 0 ||
        activeTags.every((tag) => report.tags_json.includes(tag))

      return matchesSearch && matchesTags
    })
  }, [reports, searchQuery, activeTags])

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function handleCardClick(id: string) {
    router.push(`/research/${id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Research</h1>
          <p className="text-sm text-foreground-secondary mt-0.5">
            {reports.length} {reports.length === 1 ? 'reporte' : 'reportes'} en total
          </p>
        </div>
        <Button
          onClick={() => router.push('/research/new')}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          Nuevo Research
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
          <SearchIcon className="w-4 h-4" />
        </span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por titulo..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface text-foreground border border-border
            rounded-xl placeholder:text-foreground-muted transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
            hover:border-border-dark"
          aria-label="Buscar reportes de research"
        />
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por etiquetas">
          {allTags.map((tag) => {
            const isActive = activeTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={isActive}
                className={`
                  inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                  transition-all duration-150 border
                  ${
                    isActive
                      ? 'bg-accent-500 text-white border-accent-500 shadow-sm'
                      : 'bg-surface text-foreground-secondary border-border hover:border-accent-300 hover:text-accent-600'
                  }
                `}
              >
                {tag}
              </button>
            )
          })}
          {activeTags.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTags([])}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                text-foreground-muted hover:text-foreground transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Reports grid */}
      {filteredReports.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
          {filteredReports.map((report) => (
            <li key={report.id}>
              <Card
                clickable
                onClick={() => handleCardClick(report.id)}
                className="h-full flex flex-col group"
                role="article"
                aria-label={`Reporte: ${report.title}`}
              >
                <CardContent className="flex flex-col h-full gap-3">
                  {/* Title */}
                  <h2 className="font-semibold text-foreground group-hover:text-accent-600
                    transition-colors line-clamp-2 leading-snug">
                    {report.title}
                  </h2>

                  {/* Source */}
                  {report.source && (
                    <p className="text-xs text-foreground-muted truncate">
                      <span className="font-medium text-foreground-secondary">Fuente:</span>{' '}
                      {report.source}
                    </p>
                  )}

                  {/* Preview text */}
                  <p className="text-sm text-foreground-secondary line-clamp-3 flex-1">
                    {report.raw_text.slice(0, 150)}
                    {report.raw_text.length > 150 && '...'}
                  </p>

                  {/* Tags */}
                  {report.tags_json.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Etiquetas">
                      {report.tags_json.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="default">
                          {tag}
                        </Badge>
                      ))}
                      {report.tags_json.length > 4 && (
                        <Badge variant="default">+{report.tags_json.length - 4}</Badge>
                      )}
                    </div>
                  )}

                  {/* Footer: date */}
                  <p className="text-xs text-foreground-muted mt-auto pt-2 border-t border-border">
                    {formatDate(report.created_at)}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
            <DocumentIcon className="w-8 h-8 text-primary-400" />
          </div>
          {reports.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sin reportes de research todavia
              </h3>
              <p className="text-sm text-foreground-secondary mb-6 max-w-sm">
                Crea tu primer reporte para comenzar a acumular conocimiento que impulse tus temas de contenido.
              </p>
              <Button
                onClick={() => router.push('/research/new')}
                leftIcon={<PlusIcon className="w-4 h-4" />}
              >
                Crear primer Research
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sin resultados
              </h3>
              <p className="text-sm text-foreground-secondary mb-4">
                Ningún reporte coincide con tu busqueda o filtros actuales.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setActiveTags([])
                }}
              >
                Limpiar filtros
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
