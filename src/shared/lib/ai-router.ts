import { generateObject } from 'ai'
import type { LanguageModel } from 'ai'
import type { ZodType } from 'zod'
import { google, GEMINI_MODEL } from './gemini'
import { openrouter, OPENROUTER_GEMINI_MODEL } from './openrouter'

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

/**
 * Returns the primary model for a given AI task.
 * Currently all tasks use the same Gemini model.
 */
export function getModel(_task: AITask): LanguageModel {
  return google(GEMINI_MODEL)
}

/**
 * Returns the fallback model (OpenRouter).
 * Returns null if OPENROUTER_API_KEY is not configured.
 */
function getFallbackModel(): LanguageModel | null {
  if (!process.env.OPENROUTER_API_KEY) return null
  return openrouter(OPENROUTER_GEMINI_MODEL)
}

/**
 * Wraps generateObject with automatic fallback.
 * Tries Gemini first → falls back to OpenRouter → throws original error.
 */
export async function generateObjectWithFallback<T extends ZodType>(options: {
  task: AITask
  schema: T
  system: string
  prompt: string
}) {
  const primaryModel = getModel(options.task)

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

    const fallbackModel = getFallbackModel()
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
