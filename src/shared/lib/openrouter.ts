import { createOpenAI } from '@ai-sdk/openai'

/**
 * OpenRouter provider (OpenAI-compatible).
 * Used as fallback when Gemini is unavailable.
 * For per-workspace keys (BYOK), use createOpenRouterProvider().
 */
export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
})

/** Creates an OpenRouter provider with a custom API key (BYOK). */
export function createOpenRouterProvider(apiKey: string) {
  return createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  })
}

/** Legacy model ID on OpenRouter */
export const OPENROUTER_GEMINI_MODEL = 'google/gemini-2.5-flash' as const
