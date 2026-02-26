'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import {
  setWorkspaceApiKey,
  deleteWorkspaceApiKey,
  type ApiKeyProvider,
} from '@/features/settings/services/api-key-service'

interface ActionResult<T = undefined> {
  data?: T
  error?: string
}

const providerSchema = z.enum(['google', 'openai', 'openrouter'])

const saveApiKeySchema = z.object({
  provider: providerSchema,
  apiKey: z.string().min(10, 'La API key debe tener al menos 10 caracteres'),
})

const deleteApiKeySchema = z.object({
  provider: providerSchema,
})

const testApiKeySchema = z.object({
  provider: providerSchema,
  apiKey: z.string().min(10),
})

/**
 * Save an API key for the current workspace.
 * 4-step pattern: Auth(admin) → Validate → Execute → Side effects
 */
export async function saveApiKeyAction(
  input: { provider: string; apiKey: string }
): Promise<ActionResult> {
  // Step 1: Auth (admin only)
  const user = await requireAuth()
  if (user.role !== 'admin') {
    return { error: 'Solo administradores pueden gestionar API keys' }
  }

  // Step 2: Validate
  const parsed = saveApiKeySchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute
  const workspaceId = await getWorkspaceId()
  const result = await setWorkspaceApiKey(
    workspaceId,
    parsed.data.provider as ApiKeyProvider,
    parsed.data.apiKey
  )
  if (result.error) return { error: result.error }

  // Step 4: Side effects
  revalidatePath('/settings/api-keys')

  return { data: undefined }
}

/**
 * Delete an API key for the current workspace.
 */
export async function deleteApiKeyAction(
  input: { provider: string }
): Promise<ActionResult> {
  // Step 1: Auth (admin only)
  const user = await requireAuth()
  if (user.role !== 'admin') {
    return { error: 'Solo administradores pueden gestionar API keys' }
  }

  // Step 2: Validate
  const parsed = deleteApiKeySchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute
  const workspaceId = await getWorkspaceId()
  const result = await deleteWorkspaceApiKey(
    workspaceId,
    parsed.data.provider as ApiKeyProvider
  )
  if (result.error) return { error: result.error }

  // Step 4: Side effects
  revalidatePath('/settings/api-keys')

  return { data: undefined }
}

/**
 * Test an API key by making a lightweight API call.
 * Does NOT save the key — just validates it works.
 */
export async function testApiKeyAction(
  input: { provider: string; apiKey: string }
): Promise<ActionResult<{ valid: boolean; message: string }>> {
  // Step 1: Auth
  const user = await requireAuth()
  if (user.role !== 'admin') {
    return { error: 'Solo administradores pueden gestionar API keys' }
  }

  // Step 2: Validate
  const parsed = testApiKeySchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Test the key
  const { provider, apiKey } = parsed.data

  try {
    if (provider === 'google') {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google')
      const { generateText } = await import('ai')
      const google = createGoogleGenerativeAI({ apiKey })
      await generateText({
        model: google('gemini-2.5-flash'),
        prompt: 'Respond with OK',
      })
    } else if (provider === 'openai') {
      const { createOpenAI } = await import('@ai-sdk/openai')
      const { generateText } = await import('ai')
      const openai = createOpenAI({ apiKey })
      await generateText({
        model: openai('gpt-4o-mini'),
        prompt: 'Respond with OK',
      })
    } else if (provider === 'openrouter') {
      const { createOpenAI } = await import('@ai-sdk/openai')
      const { generateText } = await import('ai')
      const openrouter = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey,
      })
      await generateText({
        model: openrouter('google/gemini-2.5-flash'),
        prompt: 'Respond with OK',
      })
    }

    return { data: { valid: true, message: 'API key valida' } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { data: { valid: false, message: `API key invalida: ${message}` } }
  }
}
