'use client'

interface RecipeValidatorProps {
  content: string
  keyword?: string
  funnelStage?: string
}

// Stage-specific CTA keywords for funnel alignment validation
const STAGE_CTA_KEYWORDS: Record<string, string[]> = {
  tofu_problem: ['comenta', 'crees', 'opinion', 'guarda', 'experiencia', 'has visto', 'te ha pasado'],
  mofu_problem: ['comenta', 'experiencia', 'sigueme', 'has medido', 'en tu planta', 'crees'],
  tofu_solution: ['guarda', 'quieres saber', 'comenta', 'framework', 'guardar'],
  mofu_solution: ['DM', 'mensaje', 'descarga', 'link', 'recurso', 'guia', 'enviame'],
  bofu_conversion: ['agenda', 'demo', 'contacta', 'link', 'DM', 'mensaje', 'descarga', 'diagnostico'],
}

const STAGE_CTA_LABELS: Record<string, string> = {
  tofu_problem: 'TOFU Problema: pregunta abierta o guardar',
  mofu_problem: 'MOFU Problema: comentar experiencia',
  tofu_solution: 'TOFU Solucion: guardar o explorar',
  mofu_solution: 'MOFU Solucion: DM o recurso',
  bofu_conversion: 'BOFU Conversion: demo o contacto',
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

export function runChecks(content: string, keyword?: string, funnelStage?: string): CheckResult[] {
  const checks: CheckResult[] = []
  const trimmed = content.trim()

  // 1. Hook presente — First line < 120 chars, has ? or number
  const firstLine = trimmed.split('\n')[0] ?? ''
  const hookShort = firstLine.length > 0 && firstLine.length <= 120
  const hookHasGancho = /\?/.test(firstLine) || /\d/.test(firstLine)
  const hookPresent = hookShort && hookHasGancho
  checks.push({
    id: 'hook',
    label: 'Hook presente',
    passed: hookPresent,
    severity: 'error',
    detail: hookPresent
      ? `Hook efectivo (${firstLine.length} chars)`
      : !hookShort
        ? `Primera linea muy larga (${firstLine.length} chars). Maximo 120 para captar atencion`
        : 'Incluye una pregunta (?) o un dato numerico para detener el scroll',
  })

  // 2. Hook anti-bot — No empieza con emoji ni usa frases genericas
  const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u
  const startsWithEmoji = emojiRegex.test(firstLine)
  const genericPhrases = ['en el mundo de', 'hoy quiero', 'hoy les comparto', 'quiero compartir', 'es bien sabido', 'como todos sabemos']
  const firstLineLower = firstLine.toLowerCase()
  const hasGenericPhrase = genericPhrases.some(p => firstLineLower.includes(p))
  const hookAntiBot = !startsWithEmoji && !hasGenericPhrase
  checks.push({
    id: 'hook-antibot',
    label: 'Hook anti-bot',
    passed: hookAntiBot,
    severity: 'error',
    detail: startsWithEmoji
      ? 'No empezar con emoji (patron detectado como bot por LinkedIn)'
      : hasGenericPhrase
        ? 'Evitar frases genericas en el hook. Usa dato concreto, pregunta o escena'
        : 'Hook no usa patrones de bot',
  })

  // 3. Sin links externos — No http/https in content
  const hasLinks = /https?:\/\//i.test(trimmed)
  checks.push({
    id: 'no-links',
    label: 'Sin links externos',
    passed: !hasLinks,
    severity: 'error',
    detail: hasLinks ? 'Elimina los links del cuerpo del post' : 'Sin links detectados',
  })

  // 4. Keyword presente — Campaign keyword in text
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

  // 5. Parrafos cortos — No paragraph > 2 lines (optimizado para dwell time movil)
  const paragraphs = trimmed.split(/\n\n+/).filter(Boolean)
  const allShort = paragraphs.every(p => p.split('\n').length <= 2)
  checks.push({
    id: 'short-paragraphs',
    label: 'Parrafos cortos',
    passed: allShort,
    severity: 'warning',
    detail: allShort ? 'Todos los parrafos tienen <= 2 lineas' : 'Algun parrafo tiene mas de 2 lineas. Partir para mejor lectura movil',
  })

  // 6. CTA presente — Last section has CTA keywords
  const ctaKeywords = ['comenta', 'comparte', 'guarda', 'sigueme', 'descarga', 'link', 'DM', 'mensaje', 'opinion', 'experiencia', 'crees', 'harias', 'tu planta', 'tu caso', 'has visto']
  const lastParagraph = (paragraphs[paragraphs.length - 1] ?? '').toLowerCase()
  const hasCta = ctaKeywords.some(kw => lastParagraph.includes(kw))
  checks.push({
    id: 'cta',
    label: 'CTA presente',
    passed: hasCta,
    severity: 'warning',
    detail: hasCta ? 'CTA detectado al final' : 'Agrega un call-to-action en el ultimo parrafo',
  })

  // 7. Longitud optima — 1500-2200 characters (evidencia de dwell time optimo)
  const len = trimmed.length
  const optimalLength = len >= 1500 && len <= 2200
  const acceptableLength = len >= 1000 && len <= 2800
  checks.push({
    id: 'length',
    label: 'Longitud optima',
    passed: optimalLength,
    severity: optimalLength ? 'warning' : acceptableLength ? 'warning' : 'error',
    detail: optimalLength
      ? `${len} chars (optimo)`
      : `${len} chars (optimo: 1500-2200${len < 1000 ? ', muy corto' : len > 2800 ? ', muy largo' : ''})`,
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

  // 9. Emojis moderados — Max 2 emojis (evidencia: exceso = patron bot)
  const emojiCount = (trimmed.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu) ?? []).length
  const emojisOk = emojiCount <= 2
  checks.push({
    id: 'emojis',
    label: 'Emojis moderados',
    passed: emojisOk,
    severity: 'warning',
    detail: emojisOk
      ? `${emojiCount} emoji${emojiCount !== 1 ? 's' : ''} (max 2)`
      : `${emojiCount} emojis detectados (max 2). Reducir para evitar patron bot`,
  })

  // 10. Guardabilidad — Tiene framework, lista, o estructura accionable
  const hasFramework = /\d+\s*(pasos?|señales?|senales?|errores?|claves?|reglas?|puntos?|formas?|razones?|tips?)/i.test(trimmed)
  const bulletCount = (trimmed.match(/^\s*[-•✅❌→▸\d]+[.):\s]/gm) ?? []).length
  const hasListStructure = bulletCount >= 3
  const guardable = hasFramework || hasListStructure
  checks.push({
    id: 'guardability',
    label: 'Guardabilidad',
    passed: guardable,
    severity: 'warning',
    detail: guardable
      ? 'Contiene framework o lista accionable (optimizado para Saves)'
      : 'Considera agregar una lista, framework o regla practica para que el lector quiera guardarlo',
  })

  // 11. Estructura D/G/P/I — 4+ bloques
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

  // 12. CTA alineado con funnel — stage-specific CTA keywords
  if (funnelStage && STAGE_CTA_KEYWORDS[funnelStage]) {
    const expectedKeywords = STAGE_CTA_KEYWORDS[funnelStage]
    const stageLabel = STAGE_CTA_LABELS[funnelStage] ?? funnelStage
    const ctaAligned = expectedKeywords.some(kw => lastParagraph.includes(kw))
    checks.push({
      id: 'funnel-cta',
      label: 'CTA alineado al funnel',
      passed: ctaAligned,
      severity: 'warning',
      detail: ctaAligned
        ? `CTA alineado con ${stageLabel}`
        : `CTA no alineado con etapa ${stageLabel}. Ajustar el call-to-action`,
    })
  }

  return checks
}

export function RecipeValidator({ content, keyword, funnelStage }: RecipeValidatorProps) {
  if (!content.trim()) {
    return null
  }

  const checks = runChecks(content, keyword, funnelStage)
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
