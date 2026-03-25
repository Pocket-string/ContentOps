import { getWorkspaceId } from '@/lib/workspace'
import { getPillarList } from '@/features/pillars/services/pillar-service'
import { GenerateWeekWizard } from '@/features/pipeline/components/GenerateWeekWizard'

export const metadata = { title: 'Generar Semana | ContentOps' }

export default async function GenerateWeekPage() {
  const workspaceId = await getWorkspaceId()
  const pillarResult = await getPillarList(workspaceId)

  const pillars = (pillarResult.data ?? [])
    .filter(p => p.is_active)
    .map(p => ({ id: p.id, name: p.name }))

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Generar Semana</h1>
      <p className="text-gray-500 mb-8">
        Pipeline agentico: genera 5 posts completos (copy + visual) listos para revision.
      </p>
      <GenerateWeekWizard pillars={pillars} />
    </div>
  )
}
