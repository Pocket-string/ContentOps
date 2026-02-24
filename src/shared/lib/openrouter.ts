import { createOpenAI } from '@ai-sdk/openai'

/**
 * OpenRouter provider (OpenAI-compatible).
 * Used as fallback when Gemini is unavailable.
 */
export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
})

/** Legacy model ID on OpenRouter */
export const OPENROUTER_GEMINI_MODEL = 'google/gemini-2.0-flash-001' as const
