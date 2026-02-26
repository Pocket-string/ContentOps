import { generateObject } from 'ai'
import type { LanguageModel, ImageModel } from 'ai'
import type { ZodType } from 'zod'
import { google, createGeminiProvider, GEMINI_MODEL } from './gemini'
import { openrouter, createOpenRouterProvider, OPENROUTER_GEMINI_MODEL } from './openrouter'
import { createOpenAIProvider } from './openai-client'
import { getWorkspaceApiKeys } from '@/features/settings/services/api-key-service'

export type AITask =
  | 'generate-copy'
  | 'critic-copy'
  | 'iterate'
  | 'synthesize-research'
  | 'generate-visual-concepts'
  | 'generate-visual-json'
  | 'critic-visual'
  | 'iterate-visual'
  | 'generate-image'
  | 'orchestrator'

/**
 * Returns the Google provider for a workspace (BYOK) or the global default.
 * Use this when you need the raw provider (e.g., for google() or google.image()).
 */
export async function getGoogleProvider(workspaceId?: string) {
  if (workspaceId) {
    const keys = await getWorkspaceApiKeys(workspaceId)
    if (keys.google) return createGeminiProvider(keys.google)
  }
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('NO_API_KEY: Configura tu Google AI API Key en Configuracion > API Keys')
  }
  return google
}

/**
 * Returns the OpenAI provider for a workspace (BYOK) or null.
 */
export async function getOpenAIProvider(workspaceId?: string) {
  if (workspaceId) {
    const keys = await getWorkspaceApiKeys(workspaceId)
    if (keys.openai) return createOpenAIProvider(keys.openai)
  }
  if (process.env.OPENAI_API_KEY) {
    const { openai } = await import('./openai-client')
    return openai
  }
  return null
}

/**
 * Returns the primary model for a given AI task.
 * Supports BYOK: if workspaceId is provided, uses workspace-specific key.
 */
export async function getModel(task: AITask, workspaceId?: string): Promise<LanguageModel> {
  const provider = await getGoogleProvider(workspaceId)
  return provider(GEMINI_MODEL)
}

/**
 * Returns an image model for a workspace (BYOK) or the global default.
 */
export async function getImageModel(modelId: string, workspaceId?: string): Promise<ImageModel> {
  const provider = await getGoogleProvider(workspaceId)
  return provider.image(modelId)
}

/**
 * Returns the fallback model (OpenRouter).
 * Supports BYOK: checks workspace keys first, then env var.
 */
async function getFallbackModel(workspaceId?: string): Promise<LanguageModel | null> {
  if (workspaceId) {
    const keys = await getWorkspaceApiKeys(workspaceId)
    if (keys.openrouter) return createOpenRouterProvider(keys.openrouter)(OPENROUTER_GEMINI_MODEL)
  }
  if (!process.env.OPENROUTER_API_KEY) return null
  return openrouter(OPENROUTER_GEMINI_MODEL)
}

/**
 * Wraps generateObject with automatic fallback.
 * Tries Gemini first → falls back to OpenRouter → throws original error.
 * Supports BYOK via optional workspaceId.
 */
export async function generateObjectWithFallback<T extends ZodType>(options: {
  task: AITask
  schema: T
  system: string
  prompt: string
  workspaceId?: string
}) {
  const primaryModel = await getModel(options.task, options.workspaceId)

  try {
    return await generateObject({
      model: primaryModel,
      schema: options.schema,
      system: options.system,
      prompt: options.prompt,
    })
  } catch (primaryError) {
    console.warn(
      `[ai-router] Primary provider failed for ${options.task}:`,
      primaryError instanceof Error ? primaryError.message : primaryError
    )

    const fallbackModel = await getFallbackModel(options.workspaceId)
    if (!fallbackModel) {
      throw primaryError
    }

    console.info(`[ai-router] Falling back to OpenRouter for ${options.task}`)

    try {
      return await generateObject({
        model: fallbackModel,
        schema: options.schema,
        system: options.system,
        prompt: options.prompt,
      })
    } catch (fallbackError) {
      console.error(
        `[ai-router] Fallback also failed for ${options.task}:`,
        fallbackError instanceof Error ? fallbackError.message : fallbackError
      )
      throw primaryError
    }
  }
}

/**
 * Guard: ensures workspace has access to AI features.
 * Throws with a clear message if no Google key is available.
 */
export async function requireAIAccess(workspaceId: string): Promise<void> {
  const keys = await getWorkspaceApiKeys(workspaceId)
  const hasGlobalKey = !!process.env.GOOGLE_AI_API_KEY
  if (!keys.google && !hasGlobalKey) {
    throw new Error('NO_API_KEY: Configura tu Google AI API Key en Configuracion > API Keys')
  }
}
