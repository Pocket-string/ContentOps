'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { TOPIC_STATUSES, TOPIC_PRIORITIES } from '@/shared/types/content-ops'
import type { Topic, TopicStatus, TopicPriority } from '@/shared/types/content-ops'

interface TopicListProps {
  topics: Topic[]
  onStatusChange?: (id: string, status: string) => Promise<{ error?: string } | void>
}

// ---- Icon helpers (inline SVG, no external dependency) ----

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

function TopicsEmptyIcon({ className }: { className?: string }) {
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
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  )
}

// ---- Label maps ----

const STATUS_LABELS: Record<TopicStatus, string> = {
  backlog: 'Backlog',
  selected: 'Seleccionado',
  used: 'Usado',
  archived: 'Archivado',
}

const PRIORITY_LABELS: Record<TopicPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

// ---- Badge helpers ----

function StatusBadge({ status }: { status: TopicStatus }) {
  const styles: Record<TopicStatus, string> = {
    backlog: 'bg-gray-100 text-gray-700',
    selected: 'bg-primary-100 text-primary-700',
    used: 'bg-success-100 text-success-700',
    archived: 'bg-gray-100 text-gray-500',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: TopicPriority }) {
  const styles: Record<TopicPriority, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-warning-100 text-warning-700',
    high: 'bg-error-100 text-error-700',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

function FitScoreBadge({ score }: { score: number | null }) {
  if (score == null) {
    return <span className="text-xs text-foreground-muted">—</span>
  }

  let colorClass: string
  if (score <= 3) {
    colorClass = 'bg-error-100 text-error-700'
  } else if (score <= 6) {
    colorClass = 'bg-warning-100 text-warning-700'
  } else {
    colorClass = 'bg-success-100 text-success-700'
  }

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${colorClass}`}
      aria-label={`Fit Score: ${score}`}
    >
      {score}
    </span>
  )
}

// ---- Utilities ----

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ---- Status change options ----

const STATUS_CHANGE_OPTIONS = TOPIC_STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}))

// ---- TopicRow ----

interface TopicRowProps {
  topic: Topic
  onTitleClick: (id: string) => void
  onStatusChange?: (id: string, status: string) => Promise<{ error?: string } | void>
}

function TopicRow({ topic, onTitleClick, onStatusChange }: TopicRowProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [rowError, setRowError] = useState('')

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    if (!onStatusChange || newStatus === topic.status) return
    setRowError('')
    setIsChangingStatus(true)
    try {
      const result = await onStatusChange(topic.id, newStatus)
      if (result?.error) setRowError(result.error)
    } finally {
      setIsChangingStatus(false)
    }
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-primary-50/40 transition-colors duration-150 group">
      {/* Title */}
      <td className="py-3.5 px-4 max-w-xs">
        <button
          type="button"
          onClick={() => onTitleClick(topic.id)}
          className="text-sm font-medium text-foreground group-hover:text-accent-600
            transition-colors text-left line-clamp-2 leading-snug
            focus-visible:outline-none focus-visible:underline"
        >
          {topic.title}
        </button>
        {rowError && (
          <p className="text-xs text-error-500 mt-1">{rowError}</p>
        )}
      </td>

      {/* Fit Score */}
      <td className="py-3.5 px-4 text-center">
        <FitScoreBadge score={topic.fit_score} />
      </td>

      {/* Priority */}
      <td className="py-3.5 px-4">
        <PriorityBadge priority={topic.priority} />
      </td>

      {/* Status */}
      <td className="py-3.5 px-4">
        <StatusBadge status={topic.status} />
      </td>

      {/* Quick status change */}
      <td className="py-3.5 px-4">
        {onStatusChange ? (
          <Select
            options={STATUS_CHANGE_OPTIONS}
            value={topic.status}
            onChange={handleStatusChange}
            disabled={isChangingStatus}
            aria-label={`Cambiar estado de ${topic.title}`}
            className="text-xs py-1.5 min-w-[130px]"
          />
        ) : (
          <StatusBadge status={topic.status} />
        )}
      </td>

      {/* Date */}
      <td className="py-3.5 px-4 text-xs text-foreground-muted whitespace-nowrap">
        {formatDate(topic.created_at)}
      </td>
    </tr>
  )
}

// ---- TopicCard (mobile) ----

interface TopicCardProps {
  topic: Topic
  onTitleClick: (id: string) => void
  onStatusChange?: (id: string, status: string) => Promise<{ error?: string } | void>
}

function TopicCard({ topic, onTitleClick, onStatusChange }: TopicCardProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [cardError, setCardError] = useState('')

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    if (!onStatusChange || newStatus === topic.status) return
    setCardError('')
    setIsChangingStatus(true)
    try {
      const result = await onStatusChange(topic.id, newStatus)
      if (result?.error) setCardError(result.error)
    } finally {
      setIsChangingStatus(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3" role="article" aria-label={`Tema: ${topic.title}`}>
      <CardContent className="flex flex-col gap-3">
        {/* Title */}
        <button
          type="button"
          onClick={() => onTitleClick(topic.id)}
          className="text-sm font-semibold text-foreground hover:text-accent-600
            transition-colors text-left leading-snug
            focus-visible:outline-none focus-visible:underline"
        >
          {topic.title}
        </button>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <FitScoreBadge score={topic.fit_score} />
          <PriorityBadge priority={topic.priority} />
          <StatusBadge status={topic.status} />
        </div>

        {/* Status change + date */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
          <p className="text-xs text-foreground-muted">{formatDate(topic.created_at)}</p>
          {onStatusChange && (
            <Select
              options={STATUS_CHANGE_OPTIONS}
              value={topic.status}
              onChange={handleStatusChange}
              disabled={isChangingStatus}
              aria-label={`Cambiar estado de ${topic.title}`}
              className="text-xs py-1 min-w-[130px]"
            />
          )}
        </div>

        {cardError && (
          <p className="text-xs text-error-500">{cardError}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---- Filter button ----

interface FilterButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
}

function FilterButton({ label, isActive, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      {label}
    </button>
  )
}

// ---- Main component ----

type StatusFilter = TopicStatus | 'all'
type PriorityFilter = TopicPriority | 'all'

export function TopicList({ topics, onStatusChange }: TopicListProps) {
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all')
  const [activePriority, setActivePriority] = useState<PriorityFilter>('all')

  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        topic.title.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = activeStatus === 'all' || topic.status === activeStatus

      const matchesPriority = activePriority === 'all' || topic.priority === activePriority

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [topics, searchQuery, activeStatus, activePriority])

  function clearFilters() {
    setSearchQuery('')
    setActiveStatus('all')
    setActivePriority('all')
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' || activeStatus !== 'all' || activePriority !== 'all'

  function handleTitleClick(id: string) {
    router.push(`/topics/${id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Topics</h1>
          <p className="text-sm text-foreground-secondary mt-0.5">
            {topics.length} {topics.length === 1 ? 'tema' : 'temas'} en total
          </p>
        </div>
        <Button
          onClick={() => router.push('/topics/new')}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          Nuevo Tema
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
          aria-label="Buscar temas"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status filters */}
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filtrar por estado"
        >
          <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
            Estado:
          </span>
          <FilterButton
            label="Todos"
            isActive={activeStatus === 'all'}
            onClick={() => setActiveStatus('all')}
          />
          {TOPIC_STATUSES.map((s) => (
            <FilterButton
              key={s}
              label={STATUS_LABELS[s]}
              isActive={activeStatus === s}
              onClick={() => setActiveStatus(s)}
            />
          ))}
        </div>

        {/* Priority filters */}
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filtrar por prioridad"
        >
          <span className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
            Prioridad:
          </span>
          <FilterButton
            label="Todas"
            isActive={activePriority === 'all'}
            onClick={() => setActivePriority('all')}
          />
          {TOPIC_PRIORITIES.map((p) => (
            <FilterButton
              key={p}
              label={PRIORITY_LABELS[p]}
              isActive={activePriority === p}
              onClick={() => setActivePriority(p)}
            />
          ))}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-foreground-muted hover:text-foreground transition-colors self-center"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Content */}
      {filteredTopics.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
            <table className="w-full text-sm" role="table" aria-label="Lista de temas">
              <thead>
                <tr className="border-b border-border bg-gray-50/60">
                  <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                    Titulo
                  </th>
                  <th scope="col" className="py-3 px-4 text-center text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                    Fit Score
                  </th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                    Prioridad
                  </th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                    Estado
                  </th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                    Cambiar estado
                  </th>
                  <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                    Creado
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTopics.map((topic) => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    onTitleClick={handleTitleClick}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-3 md:hidden" role="list">
            {filteredTopics.map((topic) => (
              <li key={topic.id}>
                <TopicCard
                  topic={topic}
                  onTitleClick={handleTitleClick}
                  onStatusChange={onStatusChange}
                />
              </li>
            ))}
          </ul>
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
            <TopicsEmptyIcon className="w-8 h-8 text-primary-400" />
          </div>
          {topics.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sin temas todavia
              </h3>
              <p className="text-sm text-foreground-secondary mb-6 max-w-sm">
                Crea tu primer tema para comenzar a construir tu backlog de contenido.
              </p>
              <Button
                onClick={() => router.push('/topics/new')}
                leftIcon={<PlusIcon className="w-4 h-4" />}
              >
                Crear primer Tema
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sin resultados
              </h3>
              <p className="text-sm text-foreground-secondary mb-4">
                Ningun tema coincide con tu busqueda o filtros actuales.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
