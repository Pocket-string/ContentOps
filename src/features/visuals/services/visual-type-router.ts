/**
 * PRP-011 Phase 7: Visual Type Router
 * Centralizes visual flow decisions so infographic and carousel
 * never accidentally cross paths.
 */

import {
  QA_CHECKLIST,
  CAROUSEL_QA_CHECKLIST,
  CAROUSEL_CONFIG,
  type VisualFormat,
  type QACheckItem,
} from '../constants/brand-rules'

export type VisualType = 'infographic' | 'carousel'
export type GenerationMode = 'single_image' | 'storyboard_slides'
export type PromptStrategy = 'single_prompt' | 'storyboard_then_slides'

export interface VisualFlow {
  type: VisualType
  generationMode: GenerationMode
  format: VisualFormat
  qaChecklist: QACheckItem[]
  promptStrategy: PromptStrategy
  isCarousel: boolean
  slideCount: number | null
}

/**
 * Returns the complete visual flow configuration based on user selection.
 * Ensures carousel never uses single_image mode and vice versa.
 */
export function getVisualFlow(
  visualType: string,
  format: VisualFormat,
  slideCount?: number,
): VisualFlow {
  if (visualType === 'carousel') {
    return {
      type: 'carousel',
      generationMode: 'storyboard_slides',
      format: CAROUSEL_CONFIG.format, // Always 4:5 for carousels
      qaChecklist: [...QA_CHECKLIST, ...CAROUSEL_QA_CHECKLIST],
      promptStrategy: 'storyboard_then_slides',
      isCarousel: true,
      slideCount: slideCount ?? CAROUSEL_CONFIG.defaultSlides,
    }
  }

  return {
    type: 'infographic',
    generationMode: 'single_image',
    format,
    qaChecklist: QA_CHECKLIST,
    promptStrategy: 'single_prompt',
    isCarousel: false,
    slideCount: null,
  }
}
