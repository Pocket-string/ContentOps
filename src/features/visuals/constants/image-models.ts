import type { VisualFormat } from './brand-rules'

export const IMAGE_MODELS = {
  'gemini-2.5-flash-image': {
    id: 'gemini-2.5-flash-image' as const,
    label: 'Nano Banana (Flash)',
    description: 'Rapido, gratis (10 RPM)',
    tier: 'free',
  },
  'gemini-3-pro-image-preview': {
    id: 'gemini-3-pro-image-preview' as const,
    label: 'Nano Banana Pro',
    description: '4K, mejor texto legible',
    tier: 'pro',
  },
} as const

export type ImageModelId = keyof typeof IMAGE_MODELS

export const DEFAULT_IMAGE_MODEL: ImageModelId = 'gemini-2.5-flash-image'

/**
 * Maps our visual formats to supported image generation aspect ratios.
 * 4:5 is NOT natively supported — mapped to closest vertical 3:4.
 */
export const FORMAT_TO_ASPECT_RATIO: Record<VisualFormat, `${number}:${number}`> = {
  '1:1': '1:1',
  '4:5': '3:4',
  '16:9': '16:9',
  '9:16': '9:16',
}
