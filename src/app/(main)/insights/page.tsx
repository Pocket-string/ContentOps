import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { getInsightsData } from '@/features/insights/services/insights-service'
import { InsightsDashboard } from '@/features/insights/components/InsightsDashboard'

export const metadata = {
  title: 'Insights | LinkedIn ContentOps',
}

export default async function InsightsPage() {
  await requireAuth()
  const workspaceId = await getWorkspaceId()
  const result = await getInsightsData(workspaceId)

  if (result.error) {
    return (
      <div className="p-6">
        <p className="text-red-500">Error: {result.error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Insights</h1>
        <p className="text-sm text-foreground-secondary mt-1">
          Motor de mejora continua — patrones exitosos y tendencias
        </p>
      </div>
      <InsightsDashboard data={result.data!} />
    </div>
  )
}
