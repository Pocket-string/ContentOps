'use client'

interface RecipeValidatorProps {
  content: string
  keyword?: string
}

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

export function runChecks(content: string, keyword?: string): CheckResult[] {
  const checks: CheckResult[] = []
  const trimmed = content.trim()

  // 1. Hook presente — First line < 120 chars, has ? or number
  const firstLine = trimmed.split('\n')[0] ?? ''
  const hookPresent = firstLine.length > 0 && firstLine.length <= 120 && (/\?/.test(firstLine) || /\d/.test(firstLine))
  checks.push({
    id: 'hook',
    label: 'Hook presente',
    passed: hookPresent,
    severity: 'error',
    detail: hookPresent ? 'Primera linea con gancho' : 'Primera linea debe tener < 120 chars y contener ? o numero',
  })

  // 2. Sin links externos — No http/https in content
  const hasLinks = /https?:\/\//i.test(trimmed)
  checks.push({
    id: 'no-links',
    label: 'Sin links externos',
    passed: !hasLinks,
    severity: 'error',
    detail: hasLinks ? 'Elimina los links del cuerpo del post' : 'Sin links detectados',
  })

  // 3. Keyword presente — Campaign keyword in text
  if (keyword) {
    const hasKw = trimmed.toLowerCase().includes(keyword.toLowerCase())
    checks.push({
      id: 'keyword',
      label: 'Keyword presente',
      passed: hasKw,
      severity: 'warning',
      detail: hasKw ? `"${keyword}" encontrado` : `"${keyword}" no encontrado en el texto`,
    })
  }

  // 4. Parrafos cortos — No paragraph > 3 lines
  const paragraphs = trimmed.split(/\n\n+/).filter(Boolean)
  const allShort = paragraphs.every(p => p.split('\n').length <= 3)
  checks.push({
    id: 'short-paragraphs',
    label: 'Parrafos cortos',
    passed: allShort,
    severity: 'warning',
    detail: allShort ? 'Todos los parrafos tienen <= 3 lineas' : 'Algun parrafo tiene mas de 3 lineas',
  })

  // 5. CTA presente — Last section has CTA keywords
  const ctaKeywords = ['comenta', 'comparte', 'guarda', 'sigueme', 'descarga', 'link', 'DM', 'mensaje', 'opinion', 'experiencia', 'crees', 'harias']
  const lastParagraph = (paragraphs[paragraphs.length - 1] ?? '').toLowerCase()
  const hasCta = ctaKeywords.some(kw => lastParagraph.includes(kw))
  checks.push({
    id: 'cta',
    label: 'CTA presente',
    passed: hasCta,
    severity: 'warning',
    detail: hasCta ? 'CTA detectado al final' : 'Agrega un call-to-action en el ultimo parrafo',
  })

  // 6. Longitud optima — 1500-2800 characters
  const len = trimmed.length
  const optimalLength = len >= 1500 && len <= 2800
  checks.push({
    id: 'length',
    label: 'Longitud optima',
    passed: optimalLength,
    severity: 'warning',
    detail: `${len} chars (optimo: 1500-2800)`,
  })

  // 7. Hashtags correctos — 3-5 hashtags at end
  const hashtagMatches = trimmed.match(/#\w+/g) ?? []
  const correctHashtags = hashtagMatches.length >= 3 && hashtagMatches.length <= 5
  checks.push({
    id: 'hashtags',
    label: 'Hashtags correctos',
    passed: correctHashtags,
    severity: 'warning',
    detail: `${hashtagMatches.length} hashtags (optimo: 3-5)`,
  })

  // 8. Legibilidad movil — No paragraph > 280 chars
  const mobileReadable = paragraphs.every(p => p.length <= 280)
  checks.push({
    id: 'mobile',
    label: 'Legibilidad movil',
    passed: mobileReadable,
    severity: 'warning',
    detail: mobileReadable ? 'Todos los parrafos son legibles en movil' : 'Algun parrafo supera 280 caracteres',
  })

  // 9. Estructura D/G/P/I — 4 bloques: Hook (Detener) + Contexto (Ganar) + Provocacion (Provocar) + CTA (Iniciar)
  const hasHookBlock = firstLine.length > 0 && firstLine.length <= 120
  const hasCtaBlock = hasCta
  const blockCount = paragraphs.length
  const hasEnoughBlocks = blockCount >= 4
  const dgpiPassed = hasHookBlock && hasCtaBlock && hasEnoughBlocks
  checks.push({
    id: 'dgpi-structure',
    label: 'Estructura D/G/P/I',
    passed: dgpiPassed,
    severity: 'warning',
    detail: dgpiPassed
      ? 'Estructura completa: Hook + Contexto + Provocacion + CTA'
      : `${blockCount} bloques detectados (minimo 4). ${!hasHookBlock ? 'Falta hook claro. ' : ''}${!hasCtaBlock ? 'Falta CTA al final.' : ''}`,
  })

  return checks
}

export function RecipeValidator({ content, keyword }: RecipeValidatorProps) {
  if (!content.trim()) {
    return null
  }

  const checks = runChecks(content, keyword)
  const passed = checks.filter(c => c.passed).length
  const total = checks.length

  const scoreColor = passed === total
    ? 'text-green-600'
    : passed >= total - 2
      ? 'text-yellow-600'
      : 'text-red-500'

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Recipe Validator</h2>
        <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>
          {passed}/{total} reglas
        </span>
      </div>

      <ul className="space-y-2" aria-label="Validacion de receta">
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
