import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { createClient } from '@/lib/supabase/server'
import { hasRequiredApiKeys } from '@/features/settings/services/api-key-service'
import { ApiKeysBanner } from '@/features/settings/components/ApiKeysBanner'

export const metadata = {
  title: 'Dashboard | LinkedIn ContentOps',
}

// ISR: revalidate every 5 minutes to reduce Supabase hits
export const revalidate = 300

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_progress: 'En Progreso',
  ready: 'Lista',
  published: 'Publicada',
  archived: 'Archivada',
}
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos dias'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createClient()
  const workspaceId = await getWorkspaceId()

  const [
    { count: activeCampaigns },
    { data: draftPostsData },
    { data: scoreData },
    { data: recentCampaigns },
    hasKeys,
  ] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .in('status', ['draft', 'in_progress']),
    supabase
      .from('posts')
      .select('id, campaigns!inner(workspace_id)')
      .eq('status', 'draft')
      .eq('campaigns.workspace_id', workspaceId),
    supabase
      .from('post_versions')
      .select('score_json, posts!inner(campaigns!inner(workspace_id))')
      .eq('posts.campaigns.workspace_id', workspaceId)
      .not('score_json', 'is', null),
    supabase
      .from('campaigns')
      .select('id, week_start, keyword, status, topics(title)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(3),
    hasRequiredApiKeys(workspaceId),
  ])

  let avgScore = 0
  let hasScores = false
  if (scoreData && scoreData.length > 0) {
    const scores = scoreData
      .map(s => {
        const json = s.score_json as Record<string, unknown> | null
        return typeof json?.total === 'number' ? json.total : null
      })
      .filter((s): s is number => s !== null)
    if (scores.length > 0) {
      avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      hasScores = true
    }
  }

  const greeting = getGreeting()
  const displayName = user.full_name ?? user.email.split('@')[0]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {displayName}
        </h1>
        <p className="text-foreground-secondary mt-1">Tu centro de operaciones de contenido LinkedIn</p>
      </div>

      {!hasKeys && <ApiKeysBanner />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Campanas Activas" value={String(activeCampaigns ?? 0)} subtitle="draft + in_progress" />
        <StatCard
          title="Posts en Borrador"
          value={String(draftPostsData?.length ?? 0)}
          subtitle="pendientes de revision"
        />
        <StatCard
          title="Score Promedio"
          value={hasScores ? `${avgScore.toFixed(1)}/20` : '--'}
          subtitle="D/G/P/I"
        />
        <div className="bg-surface border border-border shadow-card rounded-2xl p-6">
          <p className="text-sm text-foreground-secondary">Pipeline</p>
          <p className="text-xs font-medium text-foreground mt-2 leading-relaxed">
            Research &rarr; Topics &rarr; Campaigns &rarr; Posts &rarr; Export
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Acciones Rapidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction label="Nueva Investigacion" href="/research/new" />
          <QuickAction label="Nuevo Tema" href="/topics/new" />
          <QuickAction label="Nueva Campana" href="/campaigns/new" />
          <QuickAction label="Ver Campanas" href="/campaigns" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Campanas Recientes</h2>
        {recentCampaigns && recentCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentCampaigns.map(campaign => {
              const topic = Array.isArray(campaign.topics) ? campaign.topics[0] : campaign.topics
              const topicTitle = (topic as { title?: string } | null)?.title ?? 'Sin tema'
              const statusLabel = STATUS_LABELS[campaign.status] ?? campaign.status
              const statusColor = STATUS_COLORS[campaign.status] ?? 'bg-gray-100 text-gray-700'
              return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="block group">
                  <div className="bg-surface border border-border shadow-card rounded-2xl p-5 group-hover:border-primary transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{topicTitle}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-secondary">Semana: {campaign.week_start ?? '--'}</p>
                    {campaign.keyword && (
                      <p className="text-xs text-foreground-secondary mt-0.5">Keyword: {campaign.keyword}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-surface border border-border shadow-card rounded-2xl p-8 text-center">
            <p className="text-foreground-secondary mb-4">Aun no tienes campanas. Crea la primera para comenzar.</p>
            <Link
              href="/campaigns/new"
              className="inline-block text-sm font-medium text-primary hover:underline"
            >
              Crear primera campana
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="bg-surface border border-border shadow-card rounded-2xl p-6">
      <p className="text-sm text-foreground-secondary">{title}</p>
      <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      <p className="text-xs text-foreground-secondary mt-1">{subtitle}</p>
    </div>
  )
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="block">
      <div className="bg-surface border border-border shadow-card rounded-2xl p-5 hover:border-primary transition-colors text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
    </Link>
  )
}
