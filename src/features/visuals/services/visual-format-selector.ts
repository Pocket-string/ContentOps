import type { VisualFormat } from '../constants/brand-rules'

/**
 * Auto-select visual format based on funnel stage and content analysis.
 * Used by the simplified "Generar Visual" flow to pick the best format
 * without requiring user input.
 */
export function selectVisualFormat(
  funnelStage: string,
  postContent: string
): VisualFormat {
  // Count bullet-like items (lines starting with -, *, numbers, or emoji)
  const lines = postContent.split('\n').filter((l) => l.trim())
  const bulletCount = lines.filter((l) =>
    /^\s*[-*\d•►▸▹◆]/.test(l.trim())
  ).length

  // BOFU with 4+ structured items could benefit from carousel
  // but default to 1:1 for single image flow
  if (funnelStage === 'bofu_conversion') {
    return '1:1' // comparison / direct format
  }

  if (funnelStage === 'tofu_problem' || funnelStage === 'mofu_problem') {
    return '1:1' // infographic format for problem awareness
  }

  if (funnelStage === 'tofu_solution' || funnelStage === 'mofu_solution') {
    // Solution posts with many bullets → data chart / framework
    if (bulletCount >= 4) {
      return '1:1' // structured data chart
    }
    return '1:1' // default for solution
  }

  return '1:1' // safe default
}

/**
 * Determine if content should suggest a carousel instead of single image.
 */
export function shouldSuggestCarousel(
  postContent: string
): boolean {
  const lines = postContent.split('\n').filter((l) => l.trim())
  const bulletCount = lines.filter((l) =>
    /^\s*[-*\d•►▸▹◆▪]/.test(l.trim())
  ).length

  return bulletCount >= 4
}

/**
 * Auto-select concept type (single image vs carousel) based on funnel stage and content.
 * Carousel for data-heavy/structured posts (MOFU/BOFU with lists, steps, data points).
 * Single image for narrative/emotional posts (TOFU problema with sensory scenes).
 */
export function selectConceptType(
  funnelStage: string,
  postContent: string
): 'single' | 'carousel_4x5' {
  const lines = postContent.split('\n').filter((l) => l.trim())
  const bulletCount = lines.filter((l) =>
    /^\s*[-*\d•►▸▹◆▪]/.test(l.trim())
  ).length

  const hasSteps = /paso \d|step \d/i.test(postContent)
  const dataPointCount = (postContent.match(/\d[\d.,]*\s*(%|MW|kWh|US\$|\$|GW)/gi) ?? []).length
  const isStructuredStage = ['mofu_solution', 'mofu_problem', 'bofu_conversion'].includes(funnelStage)

  // Carousel for structured/data-heavy content
  if (isStructuredStage && (bulletCount >= 4 || hasSteps || dataPointCount >= 4)) {
    return 'carousel_4x5'
  }

  // Single image for narrative content
  return 'single'
}
