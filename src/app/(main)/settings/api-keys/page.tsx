import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { getWorkspaceKeyInfo } from '@/features/settings/services/api-key-service'
import { ApiKeyManager } from '@/features/settings/components/ApiKeyManager'

export const metadata = {
  title: 'API Keys | ContentOps',
}

export default async function ApiKeysPage() {
  await requireAuth()

  const workspaceId = await getWorkspaceId()
  const keyInfo = await getWorkspaceKeyInfo(workspaceId)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">API Keys</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configura tus API keys para los modelos de IA
        </p>
      </div>

      <ApiKeyManager keyInfo={keyInfo} />
    </div>
  )
}
