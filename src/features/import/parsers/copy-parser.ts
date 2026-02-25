export interface ParsedVariant {
  variant: 'contrarian' | 'story' | 'data_driven' | 'unknown'
  content: string
  hook: string
  cta: string
}

export interface ParseResult {
  variants: ParsedVariant[]
  errors: string[]
}

const VARIANT_PATTERNS: Array<{ pattern: RegExp; variant: ParsedVariant['variant'] }> = [
  { pattern: /contrarian/i, variant: 'contrarian' },
  { pattern: /story|historia|narrativ/i, variant: 'story' },
  { pattern: /data[_-]?driven|datos|estadistic|shock|impacto/i, variant: 'data_driven' },
]

function detectVariant(header: string): ParsedVariant['variant'] {
  for (const { pattern, variant } of VARIANT_PATTERNS) {
    if (pattern.test(header)) return variant
  }
  return 'unknown'
}

function extractHook(content: string): string {
  const firstLine = content.trim().split('\n')[0] ?? ''
  return firstLine.replace(/^#+\s*/, '').trim()
}

function extractCta(content: string): string {
  const paragraphs = content.trim().split(/\n\n+/).filter(Boolean)
  const lastParagraph = paragraphs[paragraphs.length - 1] ?? ''
  // Check if last paragraph before hashtags looks like a CTA
  const withoutHashtags = lastParagraph.replace(/#\w+/g, '').trim()
  if (withoutHashtags.length > 0 && withoutHashtags.length < 200) {
    return withoutHashtags
  }
  // If last is all hashtags, try second-to-last
  if (paragraphs.length >= 2) {
    return paragraphs[paragraphs.length - 2]?.trim() ?? ''
  }
  return ''
}

/**
 * Parses copy text containing multiple variants into structured objects.
 * Handles various ChatGPT output formats:
 * - "Variant 1: Contrarian" blocks
 * - "## 1. Contrarian" markdown headers
 * - "---" separators between variants
 * - Numbered sections "1." "2." "3."
 */
export function parseCopyVariants(text: string): ParseResult {
  const errors: string[] = []
  const trimmed = text.trim()

  if (!trimmed) {
    return { variants: [], errors: ['El texto esta vacio'] }
  }

  // Strategy 1: Split by markdown headers (## Variant, ### 1., etc.)
  const headerPattern = /^(?:#{1,3}\s*)?(?:variant(?:e)?\s*\d+[:\s]*|(?:\d+)[.\)]\s*\*{0,2})/gim
  const headerMatches = [...trimmed.matchAll(headerPattern)]

  let blocks: string[] = []

  if (headerMatches.length >= 2) {
    // Split by detected headers
    for (let i = 0; i < headerMatches.length; i++) {
      const start = headerMatches[i].index!
      const end = i + 1 < headerMatches.length ? headerMatches[i + 1].index! : trimmed.length
      blocks.push(trimmed.slice(start, end).trim())
    }
  } else {
    // Strategy 2: Split by "---" separators
    const dashBlocks = trimmed.split(/\n-{3,}\n/).filter(b => b.trim().length > 50)
    if (dashBlocks.length >= 2) {
      blocks = dashBlocks.map(b => b.trim())
    } else {
      // Strategy 3: Treat entire text as a single variant
      blocks = [trimmed]
    }
  }

  const variants: ParsedVariant[] = blocks.map((block, i) => {
    // Try to detect variant type from the first line
    const firstLine = block.split('\n')[0] ?? ''
    const variant = detectVariant(firstLine)

    // Clean the content: remove the header line if it's just a label
    const lines = block.split('\n')
    const isHeaderOnly = /^(?:#{1,3}\s*)?(?:variant|variante|\d+[.\)])[\s:*]/i.test(lines[0] ?? '')
    const content = isHeaderOnly ? lines.slice(1).join('\n').trim() : block.trim()

    if (content.length < 20) {
      errors.push(`Variante ${i + 1}: contenido muy corto (${content.length} caracteres)`)
    }

    return {
      variant: variant === 'unknown' && i < 3
        ? (['contrarian', 'story', 'data_driven'] as const)[i]
        : variant,
      content,
      hook: extractHook(content),
      cta: extractCta(content),
    }
  })

  if (variants.length === 0) {
    errors.push('No se detectaron variantes en el texto')
  }

  return { variants, errors }
}
