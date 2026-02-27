import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt, getKeyHint } from '@/shared/lib/encryption'

export type ApiKeyProvider = 'google' | 'openai' | 'openrouter'

export interface ApiKeyInfo {
  id: string
  provider: ApiKeyProvider
  keyHint: string
  isValid: boolean
  lastUsedAt: string | null
  updatedAt: string
}

export interface WorkspaceKeys {
  google?: string
  openai?: string
  openrouter?: string
}

// In-memory cache: workspaceId -> { keys, expiresAt }
const keyCache = new Map<string, { keys: WorkspaceKeys; expiresAt: number }>()
const CACHE_TTL_MS = 60_000 // 60 seconds

/**
 * Get decrypted API keys for a workspace.
 * Results are cached in-memory for 60s to avoid repeated DB+decrypt calls.
 */
export async function getWorkspaceApiKeys(workspaceId: string): Promise<WorkspaceKeys> {
  const cached = keyCache.get(workspaceId)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.keys
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('api_keys')
    .select('provider, encrypted_key')
    .eq('workspace_id', workspaceId)
    .eq('is_valid', true)

  if (error || !data) {
    return {}
  }

  const keys: WorkspaceKeys = {}
  for (const row of data) {
    try {
      const decrypted = decrypt(row.encrypted_key)
      keys[row.provider as ApiKeyProvider] = decrypted
    } catch {
      console.warn(`[api-keys] Failed to decrypt ${row.provider} key for workspace ${workspaceId}`)
    }
  }

  keyCache.set(workspaceId, { keys, expiresAt: Date.now() + CACHE_TTL_MS })
  return keys
}

/**
 * Invalidate the cache for a workspace (after save/delete).
 */
export function invalidateKeyCache(workspaceId: string): void {
  keyCache.delete(workspaceId)
}

/**
 * Get key metadata (hints, status) for display in the UI.
 * Never returns decrypted keys.
 */
export async function getWorkspaceKeyInfo(workspaceId: string): Promise<ApiKeyInfo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, provider, key_hint, is_valid, last_used_at, updated_at')
    .eq('workspace_id', workspaceId)
    .order('provider')

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    provider: row.provider as ApiKeyProvider,
    keyHint: row.key_hint,
    isValid: row.is_valid,
    lastUsedAt: row.last_used_at,
    updatedAt: row.updated_at,
  }))
}

/**
 * Save (upsert) an API key for a workspace.
 */
export async function setWorkspaceApiKey(
  workspaceId: string,
  provider: ApiKeyProvider,
  plainKey: string
): Promise<{ error?: string }> {
  const encryptedKey = encrypt(plainKey)
  const hint = getKeyHint(plainKey)

  const supabase = await createClient()
  const { error } = await supabase
    .from('api_keys')
    .upsert(
      {
        workspace_id: workspaceId,
        provider,
        encrypted_key: encryptedKey,
        key_hint: hint,
        is_valid: true,
        last_used_at: null,
      },
      { onConflict: 'workspace_id,provider' }
    )

  if (error) return { error: error.message }

  invalidateKeyCache(workspaceId)
  return {}
}

/**
 * Delete an API key for a workspace.
 */
export async function deleteWorkspaceApiKey(
  workspaceId: string,
  provider: ApiKeyProvider
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)

  if (error) return { error: error.message }

  invalidateKeyCache(workspaceId)
  return {}
}

/**
 * Mark a key as invalid (e.g., after an API call failure due to auth error).
 */
export async function markKeyInvalid(
  workspaceId: string,
  provider: ApiKeyProvider
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('api_keys')
    .update({ is_valid: false })
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)

  invalidateKeyCache(workspaceId)
}

/**
 * Update last_used_at timestamp for a key.
 */
export async function touchKeyUsage(
  workspaceId: string,
  provider: ApiKeyProvider
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)
}

/**
 * Check whether a workspace has at least one valid API key configured.
 * Used by the onboarding banner to prompt users who have not set up keys yet.
 */
export async function hasRequiredApiKeys(workspaceId: string): Promise<boolean> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('is_valid', true)

  return (count ?? 0) > 0
}
