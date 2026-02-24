import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { getPatterns } from '@/features/patterns/services/pattern-service'
import { PatternsClient } from './client'

export const metadata = {
  title: 'Patrones | ContentOps',
}

export default async function PatternsPage() {
  await requireAuth()

  const workspaceId = await getWorkspaceId()
  const result = await getPatterns(workspaceId)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Biblioteca de Patrones</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Guarda hooks, CTAs y estructuras que han funcionado bien. La IA los usa como referencia al generar nuevo contenido.
        </p>
      </div>

      {result.error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">
          Error al cargar patrones: {result.error}
        </div>
      ) : (
        <PatternsClient initialPatterns={result.data ?? []} />
      )}
    </div>
  )
}
