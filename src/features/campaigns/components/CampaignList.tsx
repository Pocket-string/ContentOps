'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CAMPAIGN_STATUSES } from '@/shared/types/content-ops'
import type { Campaign, CampaignStatus } from '@/shared/types/content-ops'

// ---- Types ----

type CampaignWithTopic = Campaign & { topic_title?: string }

interface CampaignListProps {
  campaigns: CampaignWithTopic[]
}

// ---- Icons ----

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

function CalendarIcon({ className }: { className?: string }) {
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function CampaignEmptyIcon({ className }: { className?: string }) {
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
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

// ---- Label & style maps ----

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Borrador',
  in_progress: 'En Progreso',
  ready: 'Lista',
  published: 'Publicada',
  archived: 'Archivada',
}

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-warning-100 text-warning-700',
  ready: 'bg-primary-100 text-primary-700',
  published: 'bg-success-100 text-success-700',
  archived: 'bg-gray-100 text-gray-500',
}

// ---- Utilities ----

function formatWeekStart(dateString: string): string {
  const date = new Date(dateString)
  // Adjust for timezone offset so the date stays consistent
  const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return utcDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ---- Sub-components ----

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

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

interface CampaignCardProps {
  campaign: CampaignWithTopic
  onClick: () => void
}

function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const postCount = 5 // campaigns always have 5 posts (Mon-Fri)

  return (
    <Card
      clickable
      onClick={onClick}
      role="article"
      aria-label={`Campana semana del ${formatWeekStart(campaign.week_start)}`}
      className="group"
    >
      <CardContent className="flex flex-col gap-3">
        {/* Top row: week + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarIcon className="w-4 h-4 text-foreground-muted shrink-0" />
            <span className="text-sm font-semibold text-foreground truncate">
              Semana del {formatWeekStart(campaign.week_start)}
            </span>
          </div>
          <StatusBadge status={campaign.status} />
        </div>

        {/* Topic + keyword row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-foreground-secondary">
            {campaign.topic_title ?? 'Sin tema'}
          </span>
          {campaign.keyword && (
            <Badge className="bg-accent-100 text-accent-700">
              {campaign.keyword}
            </Badge>
          )}
        </div>

        {/* Footer: post count */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-foreground-muted">
            {postCount} posts &middot; L &ndash; V
          </span>
          <span
            className="text-xs font-medium text-accent-600
              opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            aria-hidden="true"
          >
            Ver campana &rarr;
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Main component ----

type StatusFilter = CampaignStatus | 'all'

export function CampaignList({ campaigns }: CampaignListProps) {
  const router = useRouter()
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all')

  const filteredCampaigns = useMemo(() => {
    if (activeStatus === 'all') return campaigns
    return campaigns.filter((c) => c.status === activeStatus)
  }, [campaigns, activeStatus])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campanas</h1>
          <p className="text-sm text-foreground-secondary mt-0.5">
            {campaigns.length} {campaigns.length === 1 ? 'campana' : 'campanas'} en total
          </p>
        </div>
        <Button
          onClick={() => router.push('/campaigns/new')}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          Nueva Campana
        </Button>
      </div>

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
          label="Todas"
          isActive={activeStatus === 'all'}
          onClick={() => setActiveStatus('all')}
        />
        {CAMPAIGN_STATUSES.map((s) => (
          <FilterButton
            key={s}
            label={STATUS_LABELS[s]}
            isActive={activeStatus === s}
            onClick={() => setActiveStatus(s)}
          />
        ))}
      </div>

      {/* Campaign grid or empty state */}
      {filteredCampaigns.length > 0 ? (
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          role="list"
          aria-label="Lista de campanas"
        >
          {filteredCampaigns.map((campaign) => (
            <li key={campaign.id}>
              <CampaignCard
                campaign={campaign}
                onClick={() => router.push(`/campaigns/${campaign.id}`)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
            <CampaignEmptyIcon className="w-8 h-8 text-primary-400" />
          </div>
          {campaigns.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sin campanas todavia
              </h3>
              <p className="text-sm text-foreground-secondary mb-6 max-w-sm">
                Crea tu primera campana para comenzar a planificar tu contenido semanal.
              </p>
              <Button
                onClick={() => router.push('/campaigns/new')}
                leftIcon={<PlusIcon className="w-4 h-4" />}
              >
                Crear primera Campana
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sin resultados
              </h3>
              <p className="text-sm text-foreground-secondary mb-4">
                Ninguna campana coincide con el filtro seleccionado.
              </p>
              <Button variant="outline" onClick={() => setActiveStatus('all')}>
                Ver todas
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
