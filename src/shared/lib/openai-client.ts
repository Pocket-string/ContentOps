import { createOpenAI } from '@ai-sdk/openai'

/**
 * OpenAI provider for ChatGPT.
 * Used as a REVIEWER, not a generator.
 * Reviews copy quality and visual JSON coherence.
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
})

/** Model for review tasks (fast, cheap, good at evaluation) */
export const OPENAI_REVIEW_MODEL = 'gpt-4o-mini' as const
