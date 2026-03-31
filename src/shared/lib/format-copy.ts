/**
 * Post-processes AI-generated LinkedIn copy to ensure proper paragraph breaks.
 * Gemini often ignores formatting instructions and outputs a wall of text.
 * RecipeValidator splits on /\n\n+/ — without double-newlines, everything is 1 paragraph.
 */

// Transition words that signal a new narrative block
const TRANSITION_PATTERNS = [
  /(?<=\. )(?=Pero )/g,
  /(?<=\. )(?=Sin embargo[, ])/g,
  /(?<=\. )(?=La clave )/g,
  /(?<=\. )(?=El resultado )/g,
  /(?<=\. )(?=La soluc)/g,
  /(?<=\. )(?=La diferencia )/g,
  /(?<=\. )(?=Lo vi )/g,
  /(?<=\. )(?=Lo he visto )/g,
  /(?<=\. )(?=Descubr)/g,
  /(?<=\. )(?=Recuerdo )/g,
  /(?<=\. )(?=Imagina )/g,
  /(?<=\. )(?=Esta degradac)/g,
  /(?<=\. )(?=Este ['"]?ladr)/g,
  /(?<=\. )(?=Nuestr)/g,
  /(?<=\. )(?=Multiplic)/g,
  /(?<=\. )(?=Tu SCADA)/g,
  /(?<=\. )(?=Hablamos )/g,
]

// CTA keywords that signal the final paragraph
const CTA_KEYWORDS = [
  'comenta', 'comparte', 'guarda', 'experiencia', 'crees',
  'harias', 'DM', 'mensaje', 'enviame', 'agenda',
  'en tu planta', 'has visto', 'te ha pasado', 'has notado',
  'han sentido', 'compartan',
]

// Bullet patterns that should be on their own line
const BULLET_REGEX = /(?<=[.!?])\s*(?=[▪•►▸\-]\s)/g
const NUMBERED_BULLET_REGEX = /(?<=[.!?])\s*(?=\d+\.\s)/g

/**
 * Ensures LinkedIn copy has proper paragraph breaks (\n\n) between narrative blocks.
 * If copy already has 4+ paragraphs, returns unchanged.
 */
export function ensureParagraphBreaks(content: string): string {
  if (!content?.trim()) return content

  // Normalize existing line breaks
  let text = content.replace(/\r\n/g, '\n')

  // Check if already well-formatted (4+ paragraphs)
  const existingParagraphs = text.split(/\n\n+/).filter(Boolean)
  if (existingParagraphs.length >= 4) {
    // Already formatted — just clean up excessive newlines
    return text.replace(/\n{3,}/g, '\n\n').trim()
  }

  // Step 1: Insert breaks before bullet lists
  text = text.replace(BULLET_REGEX, '\n\n')
  text = text.replace(NUMBERED_BULLET_REGEX, '\n\n')

  // Step 2: Ensure each bullet item (▪) is on its own line
  text = text.replace(/([^\n])(\s*▪\s)/g, '$1\n$2')

  // Step 3: Insert breaks before transition words
  for (const pattern of TRANSITION_PATTERNS) {
    text = text.replace(pattern, '\n\n')
  }

  // Step 4: Insert break before CTA (last sentence with CTA keywords)
  const lines = text.split('\n')
  const lastLines = lines.slice(-3).join(' ').toLowerCase()
  const hasCta = CTA_KEYWORDS.some(kw => lastLines.includes(kw))
  if (hasCta && lines.length > 2) {
    // Find the CTA sentence and ensure it has a break before it
    for (let i = lines.length - 1; i >= 1; i--) {
      const lineLower = lines[i].toLowerCase()
      if (CTA_KEYWORDS.some(kw => lineLower.includes(kw))) {
        // Ensure double newline before this line
        if (lines[i - 1]?.trim() !== '') {
          lines.splice(i, 0, '')
        }
        break
      }
    }
    text = lines.join('\n')
  }

  // Step 5: Split paragraphs that exceed 280 chars
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  const splitParagraphs: string[] = []
  for (const para of paragraphs) {
    if (para.length <= 280) {
      splitParagraphs.push(para)
    } else {
      // Split at sentence boundaries
      const sentences = para.split(/(?<=\.)\s+/)
      let current = ''
      for (const sentence of sentences) {
        if (current && (current + ' ' + sentence).length > 280) {
          splitParagraphs.push(current.trim())
          current = sentence
        } else {
          current = current ? current + ' ' + sentence : sentence
        }
      }
      if (current.trim()) {
        splitParagraphs.push(current.trim())
      }
    }
  }

  // Step 6: Rejoin with double newlines and clean up
  text = splitParagraphs.join('\n\n')
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}
