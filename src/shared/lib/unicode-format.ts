/**
 * Unicode formatting utilities for LinkedIn posts.
 * Maps ASCII characters to Mathematical Unicode blocks that render
 * as bold/italic/monospace on LinkedIn (which doesn't support markdown).
 */

// Mathematical Bold: U+1D400 (A) to U+1D419 (Z), U+1D41A (a) to U+1D433 (z), U+1D7CE (0) to U+1D7D7 (9)
const BOLD_UPPER_START = 0x1D400
const BOLD_LOWER_START = 0x1D41A
const BOLD_DIGIT_START = 0x1D7CE

// Mathematical Italic: U+1D434 (A) to U+1D44D (Z), U+1D44E (a) to U+1D467 (z)
const ITALIC_UPPER_START = 0x1D434
const ITALIC_LOWER_START = 0x1D44E

// Mathematical Bold Italic: U+1D468 (A) to U+1D481 (Z), U+1D482 (a) to U+1D49B (z)
const BOLD_ITALIC_UPPER_START = 0x1D468
const BOLD_ITALIC_LOWER_START = 0x1D482

// Mathematical Monospace: U+1D670 (A) to U+1D689 (Z), U+1D68A (a) to U+1D6A3 (z), U+1D7F6 (0) to U+1D7FF (9)
const MONO_UPPER_START = 0x1D670
const MONO_LOWER_START = 0x1D68A
const MONO_DIGIT_START = 0x1D7F6

// Combining Strikethrough: U+0336
const STRIKETHROUGH_CHAR = '\u0336'

function mapChar(
  ch: string,
  upperStart: number,
  lowerStart: number,
  digitStart?: number,
): string {
  const code = ch.charCodeAt(0)
  if (code >= 65 && code <= 90) {
    return String.fromCodePoint(upperStart + (code - 65))
  }
  if (code >= 97 && code <= 122) {
    return String.fromCodePoint(lowerStart + (code - 97))
  }
  if (digitStart !== undefined && code >= 48 && code <= 57) {
    return String.fromCodePoint(digitStart + (code - 48))
  }
  return ch
}

/** Convert text to Unicode Mathematical Bold */
export function toUnicodeBold(text: string): string {
  return Array.from(text)
    .map(ch => mapChar(ch, BOLD_UPPER_START, BOLD_LOWER_START, BOLD_DIGIT_START))
    .join('')
}

/** Convert text to Unicode Mathematical Italic */
export function toUnicodeItalic(text: string): string {
  return Array.from(text)
    .map(ch => mapChar(ch, ITALIC_UPPER_START, ITALIC_LOWER_START))
    .join('')
}

/** Convert text to Unicode Mathematical Bold Italic */
export function toUnicodeBoldItalic(text: string): string {
  return Array.from(text)
    .map(ch => mapChar(ch, BOLD_ITALIC_UPPER_START, BOLD_ITALIC_LOWER_START))
    .join('')
}

/** Convert text to Unicode Mathematical Monospace */
export function toUnicodeMonospace(text: string): string {
  return Array.from(text)
    .map(ch => mapChar(ch, MONO_UPPER_START, MONO_LOWER_START, MONO_DIGIT_START))
    .join('')
}

/** Add combining strikethrough to each character */
export function toStrikethrough(text: string): string {
  return Array.from(text)
    .map(ch => ch + STRIKETHROUGH_CHAR)
    .join('')
}

/**
 * Clear Unicode formatting — reverse-map Mathematical Unicode blocks back to ASCII.
 * Also removes combining strikethrough characters.
 */
export function clearUnicodeFormatting(text: string): string {
  // Remove combining strikethrough
  let result = text.replace(/\u0336/g, '')

  // Reverse-map each code point
  const chars: string[] = []
  for (const ch of result) {
    const cp = ch.codePointAt(0)!

    // Bold uppercase
    if (cp >= BOLD_UPPER_START && cp < BOLD_UPPER_START + 26) {
      chars.push(String.fromCharCode(65 + (cp - BOLD_UPPER_START)))
    }
    // Bold lowercase
    else if (cp >= BOLD_LOWER_START && cp < BOLD_LOWER_START + 26) {
      chars.push(String.fromCharCode(97 + (cp - BOLD_LOWER_START)))
    }
    // Bold digits
    else if (cp >= BOLD_DIGIT_START && cp < BOLD_DIGIT_START + 10) {
      chars.push(String.fromCharCode(48 + (cp - BOLD_DIGIT_START)))
    }
    // Italic uppercase
    else if (cp >= ITALIC_UPPER_START && cp < ITALIC_UPPER_START + 26) {
      chars.push(String.fromCharCode(65 + (cp - ITALIC_UPPER_START)))
    }
    // Italic lowercase
    else if (cp >= ITALIC_LOWER_START && cp < ITALIC_LOWER_START + 26) {
      chars.push(String.fromCharCode(97 + (cp - ITALIC_LOWER_START)))
    }
    // Bold Italic uppercase
    else if (cp >= BOLD_ITALIC_UPPER_START && cp < BOLD_ITALIC_UPPER_START + 26) {
      chars.push(String.fromCharCode(65 + (cp - BOLD_ITALIC_UPPER_START)))
    }
    // Bold Italic lowercase
    else if (cp >= BOLD_ITALIC_LOWER_START && cp < BOLD_ITALIC_LOWER_START + 26) {
      chars.push(String.fromCharCode(97 + (cp - BOLD_ITALIC_LOWER_START)))
    }
    // Monospace uppercase
    else if (cp >= MONO_UPPER_START && cp < MONO_UPPER_START + 26) {
      chars.push(String.fromCharCode(65 + (cp - MONO_UPPER_START)))
    }
    // Monospace lowercase
    else if (cp >= MONO_LOWER_START && cp < MONO_LOWER_START + 26) {
      chars.push(String.fromCharCode(97 + (cp - MONO_LOWER_START)))
    }
    // Monospace digits
    else if (cp >= MONO_DIGIT_START && cp < MONO_DIGIT_START + 10) {
      chars.push(String.fromCharCode(48 + (cp - MONO_DIGIT_START)))
    }
    else {
      chars.push(ch)
    }
  }

  result = chars.join('')
  return result
}

/** Convert selected text lines to bullet list with • prefix */
export function toBulletList(text: string): string {
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `• ${line.replace(/^[•▪▸►●○\-]\s*/, '')}`)
    .join('\n')
}

/** Convert selected text lines to numbered list */
export function toNumberedList(text: string): string {
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line, i) => `${i + 1}. ${line.replace(/^\d+\.\s*/, '')}`)
    .join('\n')
}

/** All available formatting actions */
export type UnicodeFormatAction = 'bold' | 'italic' | 'bold-italic' | 'monospace' | 'strikethrough' | 'clear' | 'bullets' | 'numbered'

/** Apply a formatting action to text */
export function applyUnicodeFormat(text: string, action: UnicodeFormatAction): string {
  switch (action) {
    case 'bold': return toUnicodeBold(text)
    case 'italic': return toUnicodeItalic(text)
    case 'bold-italic': return toUnicodeBoldItalic(text)
    case 'monospace': return toUnicodeMonospace(text)
    case 'strikethrough': return toStrikethrough(text)
    case 'clear': return clearUnicodeFormatting(text)
    case 'bullets': return toBulletList(text)
    case 'numbered': return toNumberedList(text)
  }
}
