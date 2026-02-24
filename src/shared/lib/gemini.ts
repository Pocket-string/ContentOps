import { createGoogleGenerativeAI } from '@ai-sdk/google'

/**
 * Google Gemini provider via @ai-sdk/google.
 * Primary AI provider for all generation tasks.
 */
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY ?? '',
})

/** Default model for all generation/evaluation tasks */
export const GEMINI_MODEL = 'gemini-2.0-flash' as const

/** Image generation models */
export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image' as const
export const GEMINI_IMAGE_MODEL_PRO = 'gemini-3-pro-image-preview' as const
