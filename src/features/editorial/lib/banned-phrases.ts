/**
 * PRP-012 Fase 4: Banned phrases + substitution table
 *
 * Reportadas como "olor a IA / brochure corporativo" en research 2025-2026.
 * Reframe (research): el algoritmo NO penaliza léxico exacto — penaliza patrones
 * templados. Estas frases son INDICADORES de calidad (correlacionan con genérico),
 * no claim algorítmico de penalty directo.
 *
 * Uso:
 *   - RecipeValidator.tsx: detección + warning visual
 *   - audit-naturalidad endpoint: enviadas al system prompt como "evita estas"
 *   - PostEditor: highlight inline (futuro)
 */

export interface BannedPhrase {
  pattern: string             // lowercase, sin acentos para matching robusto
  display: string             // versión legible para mostrar al usuario
  category: 'corporate' | 'ai-cliche' | 'filler' | 'hype'
  substitution: string | null // sugerencia concreta (null si no hay)
}

export const BANNED_PHRASES: BannedPhrase[] = [
  // ====== Corporate (brochure) ======
  {
    pattern: 'transformacion digital',
    display: 'transformación digital',
    category: 'corporate',
    substitution: 'Concretar: qué exactamente está pasando de X a Y (ej: "pasar de 300 alarmas a 5 prioridades accionables")',
  },
  {
    pattern: 'soluciones integrales',
    display: 'soluciones integrales',
    category: 'corporate',
    substitution: 'Una solución específica que resuelve un problema concreto',
  },
  {
    pattern: 'optimizar procesos',
    display: 'optimizar procesos',
    category: 'corporate',
    substitution: 'Ordenar [recurso específico] por [criterio económico] para decidir [acción concreta]',
  },
  {
    pattern: 'impulsar la transformacion',
    display: 'impulsar la transformación',
    category: 'corporate',
    substitution: 'Pasar de [estado A] a [estado B] (con dato concreto)',
  },
  {
    pattern: 'ecosistema digital',
    display: 'ecosistema digital',
    category: 'corporate',
    substitution: 'Stack técnico específico (SCADA, CMMS, Power BI, etc.)',
  },
  {
    pattern: 'sinergia',
    display: 'sinergia',
    category: 'corporate',
    substitution: 'Cómo X y Y trabajan juntos concretamente',
  },

  // ====== AI/hype clichés ======
  {
    pattern: 'revolucionar',
    display: 'revolucionar',
    category: 'hype',
    substitution: 'Cambiar [proceso específico] de [X] a [Y] (sin "revolucionar")',
  },
  {
    pattern: 'game changer',
    display: 'game changer',
    category: 'hype',
    substitution: 'Qué exactamente cambia + por qué importa para tu lector',
  },
  {
    pattern: 'aprovechar el poder',
    display: 'aprovechar el poder',
    category: 'hype',
    substitution: 'Usar [herramienta] para [decisión específica]',
  },
  {
    pattern: 'desbloquear el potencial',
    display: 'desbloquear el potencial',
    category: 'hype',
    substitution: 'Qué se logra concretamente cuando funciona',
  },
  {
    pattern: 'potenciar',
    display: 'potenciar',
    category: 'hype',
    substitution: 'Usar verbos concretos: acelerar, ordenar, priorizar, traducir',
  },
  {
    pattern: 'el futuro de',
    display: 'el futuro de',
    category: 'hype',
    substitution: 'Lo que está pasando HOY en [contexto específico]',
  },
  {
    pattern: 'aprovechar la ia',
    display: 'aprovechar la IA',
    category: 'hype',
    substitution: 'Usar [técnica específica de IA] para [decisión concreta]',
  },
  {
    pattern: 'innovador',
    display: 'innovador/innovadora',
    category: 'hype',
    substitution: 'Concreto: qué hace diferente. Si no puedes explicarlo, no es innovador',
  },

  // ====== AI cliché openers ======
  {
    pattern: 'en el mundo de',
    display: '"En el mundo de..."',
    category: 'ai-cliche',
    substitution: 'Empezar con una escena concreta, un número específico o una contradicción real',
  },
  {
    pattern: 'en el dinamico mundo',
    display: '"En el dinámico mundo..."',
    category: 'ai-cliche',
    substitution: 'Empezar con tensión específica del lector',
  },
  {
    pattern: 'hoy quiero hablar',
    display: '"Hoy quiero hablar..."',
    category: 'ai-cliche',
    substitution: 'Decir DIRECTAMENTE el problema o la observación',
  },
  {
    pattern: 'hoy les comparto',
    display: '"Hoy les comparto..."',
    category: 'ai-cliche',
    substitution: 'Mostrar la cosa concreta sin anuncio previo',
  },
  {
    pattern: 'quiero compartir',
    display: '"Quiero compartir..."',
    category: 'ai-cliche',
    substitution: 'Compartir directamente, sin meta-anuncio',
  },
  {
    pattern: 'es bien sabido',
    display: '"Es bien sabido que..."',
    category: 'ai-cliche',
    substitution: 'Si es bien sabido, no necesita post. Mostrar el ángulo que NO es bien sabido',
  },
  {
    pattern: 'como todos sabemos',
    display: '"Como todos sabemos..."',
    category: 'ai-cliche',
    substitution: 'Lo opuesto: lo que TODOS dan por hecho pero NO siempre es cierto',
  },

  // ====== AI formatting indicators ======
  {
    pattern: '\u2014',
    display: 'Guion largo (\u2014)',
    category: 'ai-cliche',
    substitution: 'Usar punto seguido, coma, o dos puntos. El guion largo es indicador de IA',
  },

  // ====== Filler ======
  {
    pattern: 'en conclusion',
    display: '"En conclusión..."',
    category: 'filler',
    substitution: 'Ir directo a la pregunta final o la idea de cierre, sin etiqueta',
  },
  {
    pattern: 'es importante destacar',
    display: '"Es importante destacar..."',
    category: 'filler',
    substitution: 'Decir el dato directamente. Si es importante, no necesita anuncio',
  },
  {
    pattern: 'cabe mencionar',
    display: '"Cabe mencionar..."',
    category: 'filler',
    substitution: 'Mencionar directamente sin frase de transición',
  },
  {
    pattern: 'sin duda alguna',
    display: '"Sin duda alguna..."',
    category: 'filler',
    substitution: 'Afirmar con dato concreto, sin intensificador de incertidumbre disfrazado',
  },
]

/**
 * Detecta banned phrases en un texto. Returns matches con contexto.
 * Case-insensitive, ignora acentos (matching por substring).
 */
export interface BannedPhraseMatch {
  phrase: BannedPhrase
  positions: number[]  // posiciones (índices de inicio) en el texto original
  count: number
}

export function detectBannedPhrases(text: string): BannedPhraseMatch[] {
  if (!text) return []
  // Normalize: lowercase + strip accents
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

  const matches: BannedPhraseMatch[] = []
  for (const phrase of BANNED_PHRASES) {
    const positions: number[] = []
    let idx = 0
    while ((idx = normalized.indexOf(phrase.pattern, idx)) !== -1) {
      positions.push(idx)
      idx += phrase.pattern.length
    }
    if (positions.length > 0) {
      matches.push({ phrase, positions, count: positions.length })
    }
  }
  return matches
}

/**
 * Returns a compact string of banned phrases for injection into system prompts.
 */
export function getBannedPhrasesForPrompt(): string {
  return BANNED_PHRASES.map((p) => `- "${p.display}"`).join('\n')
}
