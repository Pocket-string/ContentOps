/**
 * PRP-012 Fase 4: Capa 2 — Auditor "Naturalidad" 0-50
 *
 * POST /api/ai/audit-naturalidad
 *
 * Evalúa una o varias variantes con 10 criterios (cada uno 1-5).
 * Score total /50. Detecta frases problemáticas + sugiere mejoras.
 * SOLO ADVIERTE (no bloquea publicación — confirmed con Jonathan).
 */

import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { getModel } from '@/shared/lib/ai-router'
import { getBannedPhrasesForPrompt, detectBannedPhrases } from '@/features/editorial/lib/banned-phrases'

const criterionScoreSchema = z.object({
  especificidad_tecnica: z.number().min(1).max(5),
  humanidad_voz_natural: z.number().min(1).max(5),
  claridad_problema: z.number().min(1).max(5),
  escena_dato_decision: z.number().min(1).max(5),
  relevancia_audiencia: z.number().min(1).max(5),
  traduccion_tecnico_negocio: z.number().min(1).max(5),
  ausencia_cliches_ia: z.number().min(1).max(5),
  fuerza_hook: z.number().min(1).max(5),
  calidad_cta: z.number().min(1).max(5),
  probabilidad_comentarios: z.number().min(1).max(5),
})

const variantEvaluationSchema = z.object({
  variant_id: z.string(),
  score_total: z.number().min(0).max(50),
  scores_per_criteria: criterionScoreSchema,
  diagnostico: z.string(),
  frases_genericas: z.array(z.string()).default([]),
  frases_humanas: z.array(z.string()).default([]),
  mejoras_prioritarias: z.array(z.string()).default([]),
})

const auditResultSchema = z.object({
  evaluations: z.array(variantEvaluationSchema).min(1),
})

export type NaturalidadAuditResult = z.infer<typeof auditResultSchema>

const inputSchema = z.object({
  variants: z.array(z.object({
    id: z.string().min(1),
    label: z.string().optional(),
    content: z.string().min(50),
  })).min(1).max(5),
  pillar_name: z.string().nullable().optional(),
  audience_role: z.string().nullable().optional(),
})

export async function POST(request: Request): Promise<Response> {
  const user = await requireAuth()

  const rateLimitResult = aiRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo de la solicitud invalido' }, { status: 400 })
  }

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  const workspaceId = await getWorkspaceId()

  try {
    const { variants, pillar_name, audience_role } = parsed.data

    // Pre-detect banned phrases (deterministic, fast) — feed to AI for context
    const localDetections = variants.map((v) => ({
      id: v.id,
      hits: detectBannedPhrases(v.content),
    }))

    const contextBits: string[] = []
    if (audience_role) contextBits.push(`Audiencia objetivo: ${audience_role}`)
    if (pillar_name) contextBits.push(`Pilar editorial: ${pillar_name}`)
    const contextBlock = contextBits.length > 0 ? `\n${contextBits.join('\n')}\n` : ''

    const systemPrompt = `Actúa como auditor editorial experto en LinkedIn B2B técnico, contenido SaaS vertical y detección de copy genérico generado con IA.

Contexto: Bitalize (software/analítica para O&M fotovoltaico). El contenido debe sonar a fundador técnico que entiende pérdidas invisibles, SCADA, PR, backlog, curtailment, clipping, soiling, trackers, priorización económica.${contextBlock}

Vas a evaluar ${variants.length} variante(s) de un post.

## CRITERIOS DE EVALUACIÓN (1-5 cada uno; score total /50)

1. **especificidad_tecnica**: ¿Términos técnicos correctos y aterrizados (PR, SCADA, $/día), no jerga vacía?
2. **humanidad_voz_natural**: ¿Suena humano, conversacional, ritmo variado? ¿O suena a brochure/IA-genérico?
3. **claridad_problema**: ¿Se entiende QUÉ duele al lector específicamente?
4. **escena_dato_decision**: ¿Contiene AL MENOS UNA: escena real, número específico, o decisión concreta?
5. **relevancia_audiencia**: ¿Habla en el lenguaje del ICP asignado (Asset Manager / Head O&M / Analista / CEO-CFO)?
6. **traduccion_tecnico_negocio**: ¿Traduce métricas técnicas a impacto operativo o económico ($/día, MWh, decisión)?
7. **ausencia_cliches_ia**: ¿Evita frases tipo "transformación digital", "revolucionar", "aprovechar el poder", "en conclusión", "es importante destacar"?
8. **fuerza_hook**: ¿La primera línea detiene el scroll con contradicción, dato o escena? NO genérica.
9. **calidad_cta**: ¿Pregunta final específica de experiencia (NO "¿qué opinas?", NO "¿qué piensas?")?
10. **probabilidad_comentarios**: ¿Genera comentarios sustantivos (tensión técnica, contradicción), no solo likes?

## REGLAS DE EVALUACIÓN

- Penaliza fuerte cualquier frase banned (lista abajo).
- Penaliza simetría perfecta y párrafos demasiado redondos (olor a IA).
- Premia imperfecciones humanas (frases cortas + medias mezcladas).
- NO recompenses elegancia; recompensa CREDIBILIDAD.

## FRASES BANNED (penalizar fuerte si aparecen)
${getBannedPhrasesForPrompt()}

## CONDICIONES MÍNIMAS (independiente del score)
- Tiene UNA idea central clara
- Tiene AL MENOS UNA señal de experiencia real
- Tiene pregunta final específica

IMPORTANTE: Responde UNICAMENTE con un JSON válido, sin markdown, sin backticks, sin texto adicional.`

    const variantsBlock = variants.map((v) => {
      const detections = localDetections.find((d) => d.id === v.id)?.hits ?? []
      const detectionsText = detections.length > 0
        ? `\n[DETECTIONS LOCALES: ${detections.map(d => `"${d.phrase.display}" (x${d.count})`).join(', ')}]`
        : ''
      return `### Variante ${v.id}${v.label ? ` (${v.label})` : ''}${detectionsText}\n${v.content}`
    }).join('\n\n---\n\n')

    const userPrompt = `Audita estas ${variants.length} variante(s):

${variantsBlock}

Responde con JSON exacto:
{
  "evaluations": [
    {
      "variant_id": "id de la variante",
      "score_total": número 0-50 (suma de los 10 criterios),
      "scores_per_criteria": {
        "especificidad_tecnica": 1-5,
        "humanidad_voz_natural": 1-5,
        "claridad_problema": 1-5,
        "escena_dato_decision": 1-5,
        "relevancia_audiencia": 1-5,
        "traduccion_tecnico_negocio": 1-5,
        "ausencia_cliches_ia": 1-5,
        "fuerza_hook": 1-5,
        "calidad_cta": 1-5,
        "probabilidad_comentarios": 1-5
      },
      "diagnostico": "1-2 oraciones sobre el estado general",
      "frases_genericas": ["frase textual 1 (con contexto breve)", "..."],
      "frases_humanas": ["frase que SI funciona y conviene mantener", "..."],
      "mejoras_prioritarias": ["mejora concreta 1", "mejora concreta 2", "mejora concreta 3"]
    }
  ]
}`

    const result = await generateText({
      model: await getModel('critic-copy', workspaceId),
      system: systemPrompt,
      prompt: userPrompt,
    })

    let jsonText = result.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    let aiParsed: unknown
    try {
      aiParsed = JSON.parse(jsonText)
    } catch {
      console.error('[audit-naturalidad] Failed to parse AI JSON:', jsonText.slice(0, 500))
      return Response.json(
        { error: 'Error al parsear la respuesta del auditor. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const validated = auditResultSchema.safeParse(aiParsed)
    if (!validated.success) {
      console.error('[audit-naturalidad] Zod validation failed:', validated.error.issues)
      return Response.json(
        { error: 'El auditor genero un formato invalido. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    return Response.json({ data: validated.data })
  } catch (error) {
    console.error('[audit-naturalidad] AI error:', error)
    return Response.json(
      { error: 'Error al auditar el contenido. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
