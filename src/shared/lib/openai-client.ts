import { createOpenAI } from '@ai-sdk/openai'

/**
 * OpenAI provider for ChatGPT.
 * Used as a REVIEWER, not a generator.
 * For per-workspace keys (BYOK), use createOpenAIProvider().
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
})

/** Creates an OpenAI provider with a custom API key (BYOK). */
export function createOpenAIProvider(apiKey: string) {
  return createOpenAI({ apiKey })
}

/** Model for review tasks (fast, cheap, good at evaluation) */
export const OPENAI_REVIEW_MODEL = 'gpt-4o-mini' as const
