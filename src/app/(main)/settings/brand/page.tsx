import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { getBrandProfiles } from '@/features/brand/services/brand-service'
import { BrandSettingsClient } from './client'

export const metadata = {
  title: 'Marca | ContentOps',
}

export default async function BrandSettingsPage() {
  await requireAuth()

  const workspaceId = await getWorkspaceId()
  const result = await getBrandProfiles(workspaceId)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Perfil de Marca</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configura los lineamientos visuales y de tono que se usan en la generacion de contenido con IA.
        </p>
      </div>

      {result.error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">
          Error al cargar perfiles: {result.error}
        </div>
      ) : (
        <BrandSettingsClient profiles={result.data ?? []} />
      )}
    </div>
  )
}
