'use client'

import { BRAND_STYLE, type VisualFormat } from '../constants/brand-rules'

interface CheckResult {
  id: string
  label: string
  passed: boolean
  severity: 'error' | 'warning'
  detail?: string
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

const BRAND_COLORS = Object.values(BRAND_STYLE.colors).map(c => c.toLowerCase())

function deepStringSearch(obj: unknown, searchFn: (str: string) => boolean): boolean {
  if (typeof obj === 'string') return searchFn(obj)
  if (Array.isArray(obj)) return obj.some(item => deepStringSearch(item, searchFn))
  if (obj !== null && typeof obj === 'object') {
    return Object.values(obj).some(val => deepStringSearch(val, searchFn))
  }
  return false
}

function countTextElements(obj: unknown): number {
  let count = 0
  if (typeof obj === 'string' && obj.length > 0) count++
  if (Array.isArray(obj)) {
    for (const item of obj) count += countTextElements(item)
  }
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const val of Object.values(obj)) count += countTextElements(val)
  }
  return count
}

export function runVisualChecks(promptJson: Record<string, unknown>, format: VisualFormat): CheckResult[] {
  const checks: CheckResult[] = []
  const jsonStr = JSON.stringify(promptJson).toLowerCase()

  // 1. Brand colors — at least 2 brand colors referenced
  const colorsFound = BRAND_COLORS.filter(color => jsonStr.includes(color))
  const hasBrandColors = colorsFound.length >= 2
  checks.push({
    id: 'brand-colors',
    label: 'Colores de marca',
    passed: hasBrandColors,
    severity: 'warning',
    detail: hasBrandColors
      ? `${colorsFound.length} colores de marca detectados`
      : `Solo ${colorsFound.length} color(es) de marca. Usa al menos 2 de: ${BRAND_COLORS.join(', ')}`,
  })

  // 2. Logo placement — mentions bottom-right or esquina inferior derecha
  const logoPatterns = ['bottom-right', 'bottom right', 'esquina inferior derecha', 'inferior derecha', 'lower right']
  const hasLogo = logoPatterns.some(p => jsonStr.includes(p))
  checks.push({
    id: 'logo-placement',
    label: 'Logo posicionado',
    passed: hasLogo,
    severity: 'warning',
    detail: hasLogo
      ? 'Logo en esquina inferior derecha'
      : 'El logo debe estar en la esquina inferior derecha',
  })

  // 3. Text density — warn if too much text overlay
  const textOverlay = promptJson['text_overlay'] ?? promptJson['text'] ?? promptJson['texto']
  const textCount = textOverlay ? countTextElements(textOverlay) : 0
  const goodDensity = textCount <= 4
  checks.push({
    id: 'text-density',
    label: 'Densidad de texto',
    passed: goodDensity,
    severity: 'warning',
    detail: goodDensity
      ? `${textCount} elementos de texto (max recomendado: 4)`
      : `${textCount} elementos de texto — demasiado. Reduce a max 4`,
  })

  // 4. Format specified — the JSON should reference the correct format
  const formatStr = format.replace(':', '')
  const hasFormat = jsonStr.includes(format) || jsonStr.includes(formatStr) ||
    deepStringSearch(promptJson['format'], (s) => s.includes(format))
  checks.push({
    id: 'format',
    label: 'Formato especificado',
    passed: hasFormat,
    severity: 'error',
    detail: hasFormat
      ? `Formato ${format} detectado`
      : `Formato ${format} no encontrado en el prompt`,
  })

  // 5. No negative prompt terms in positive descriptions
  const negativeTerms = ['borroso', 'ilegible', 'pixelado', 'neon', 'caricatura', 'infantil', 'marca de agua', 'deformado']
  const negativeFound = negativeTerms.filter(term => {
    const withoutNeg = { ...promptJson }
    delete withoutNeg['negative_prompts']
    delete withoutNeg['negative']
    return JSON.stringify(withoutNeg).toLowerCase().includes(term)
  })
  const noNegativeTerms = negativeFound.length === 0
  checks.push({
    id: 'no-negative-terms',
    label: 'Sin terminos negativos',
    passed: noNegativeTerms,
    severity: 'warning',
    detail: noNegativeTerms
      ? 'Sin terminos negativos en descripciones'
      : `Terminos negativos encontrados: ${negativeFound.join(', ')}`,
  })

  return checks
}

interface VisualValidatorProps {
  promptJson: Record<string, unknown>
  format: VisualFormat
}

export function VisualValidator({ promptJson, format }: VisualValidatorProps) {
  if (Object.keys(promptJson).length === 0) return null

  const checks = runVisualChecks(promptJson, format)
  const passed = checks.filter(c => c.passed).length
  const total = checks.length

  const scoreColor = passed === total
    ? 'text-green-600'
    : passed >= total - 1
      ? 'text-yellow-600'
      : 'text-red-500'

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Visual Validator</h2>
        <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>
          {passed}/{total} reglas
        </span>
      </div>

      <ul className="space-y-2" aria-label="Validacion visual">
        {checks.map(check => (
          <li key={check.id} className="flex items-start gap-2">
            {check.passed ? (
              <CheckIcon className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            ) : check.severity === 'error' ? (
              <XIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <XIcon className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <span className={`text-xs font-medium ${
                check.passed ? 'text-green-700' : check.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {check.label}
              </span>
              {check.detail && (
                <p className="text-xs text-foreground-muted mt-0.5">{check.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
