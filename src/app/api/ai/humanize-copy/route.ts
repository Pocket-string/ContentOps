/**
 * PRP-012 Fase 3: Capa 1 — Humanizer
 *
 * POST /api/ai/humanize-copy
 *
 * Toma un draft (AI-generated o humano) y lo reescribe con voz founder-técnico,
 * eliminando frases corporativas/genéricas, agregando escena/dato/decisión real.
 *
 * Returns: { humanized_content, changes_summary[], risks[] }
 */

import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { getModel } from '@/shared/lib/ai-router'
import { ensureParagraphBreaks } from '@/shared/lib/format-copy'

const humanizationResultSchema = z.object({
  humanized_content: z.string().min(1),
  changes_summary: z.array(z.string()).min(1),
  risks: z.array(z.string()).default([]),
})

export type HumanizationResult = z.infer<typeof humanizationResultSchema>

const inputSchema = z.object({
  draft_content: z.string().min(50, 'Draft demasiado corto para humanizar'),
  variant: z.enum(['contrarian', 'story', 'data_driven']).optional(),
  audience_role: z.string().nullable().optional(),
  pillar_name: z.string().nullable().optional(),
  structure_name: z.string().nullable().optional(),
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
    const { draft_content, variant, audience_role, pillar_name, structure_name } = parsed.data

    const contextBits: string[] = []
    if (variant) contextBits.push(`Variante: ${variant}`)
    if (audience_role) contextBits.push(`Audiencia: ${audience_role}`)
    if (pillar_name) contextBits.push(`Pilar editorial: ${pillar_name}`)
    if (structure_name) contextBits.push(`Estructura editorial: ${structure_name}`)
    const contextBlock = contextBits.length > 0 ? `\n\nContexto del post:\n${contextBits.join('\n')}` : ''

    const systemPrompt = `Actúa como editor senior de copywriting B2B SaaS técnico para LinkedIn especializado en O&M fotovoltaico.

Vas a HUMANIZAR un borrador para Bitalize (startup early-stage de software/analítica para O&M FV).

Contexto Bitalize:
Bitalize ayuda a detectar pérdidas invisibles, analizar datos SCADA, priorizar backlog por impacto económico y traducir problemas técnicos a decisiones de O&M.

Audiencias: Asset Managers, Heads of O&M, O&M contractors, analistas de performance, dueños de activos solares LatAm.

Tu tarea:
Reescribe el post para que suene humano, técnico-conversacional, propio de un fundador construyendo desde problemas reales. NO suene a consultora genérica de IA NI a brochure corporativo.

## REGLAS DE HUMANIZACIÓN

1. **Una sola idea central** — si hay 2, descarta la más débil.
2. **Hook con tensión concreta** — NO genérico ("En el mundo de...", "Hoy quiero hablar de...", "Es importante destacar..."). Empieza con escena, dato específico, contradicción o decisión.
3. **Escena, dato O decisión REAL** — al menos uno de los tres en el cuerpo.
4. **Elimina frases corporativas** prohibidas:
   - "transformación digital", "revolucionar", "potenciar", "aprovechar el poder de", "desbloquear el potencial"
   - "soluciones integrales", "innovadoras", "optimizar procesos", "impulsar la transformación"
   - "en conclusión", "es importante destacar", "cabe mencionar", "sin duda alguna"
   - "el futuro de", "game changer", "ecosistema digital", "sinergia"
5. **Frases cortas mezcladas con frases medias** — alternar ritmo.
6. **Términos técnicos OK cuando aportan**: PR, SCADA, availability, curtailment, clipping, tracker, string, CMMS, backlog, soiling.
7. **Traduce técnico a impacto operativo o económico** — PR → $/día, alarmas → priorización, datos → decisión.
8. **NO promesas de ROI garantizado** — usar "estimamos", "podría representar", "en este escenario", "depende del contrato".
9. **CTA específico** — pregunta concreta de experiencia, NO "¿qué opinas?".
10. **Tono**: ingeniero cercano, claro, criterioso y honesto. NO gurú. NO corporativo. NO consultora genérica.

## FORMATO

- Usa el marcador ⏎⏎ entre cada bloque narrativo.
- Mínimo 4 bloques separados por ⏎⏎.
- 1500-2200 caracteres total (zona óptima LinkedIn).
- Max 2 emojis (solo funcionales).
- NO hashtags (#).
- NO links externos en el cuerpo.

## BULLETS DE SAVEABILITY (CRÍTICO — PRESERVAR)
- Si el borrador tiene un bloque de bullets (▪, •, *, -, o numerados) cerca del final, PRESÉRVALO como bullets. NO conviertas bullets en párrafo narrativo.
- Sweet spot: 3 bullets antes del CTA. Aceptable: 2-4. Más de 4 = exagerado, baja legibilidad mobile.
- Si el borrador NO tiene bullets, AGREGA un bloque de 3 bullets accionables (regla, framework, o insights guardables) ANTES del CTA. Los bullets son lo que el lector screenshot-ea y guarda — saves pondera más que likes en el algoritmo Feed-SR de LinkedIn.
- Mantén el carácter de bullet del original (▪, •, *) si existe.

## NUNCA FABRICAR ESPECÍFICOS (CRÍTICO — AUTENTICIDAD FOUNDER-LED)
- NO inventes fechas específicas ("Octubre de 2023", "Marzo pasado") que no estén en el borrador original.
- NO inventes plantas con MW exacto ("50 MW en Atacama") si no estaban en el original.
- NO inventes diálogos literales atribuidos al autor o a personas reales ("El operador me dijo: 'Jonathan, mira...'").
- NO inventes nombres propios de personas que no aparecen en el borrador.
- Si necesitas reforzar la escena, usa anclajes GENÉRICOS verificables: "una planta del norte chileno, hace un par de años", "un Asset Manager con el que conversé", "en una visita a campo, el operador apuntó algo que no encajaba", "hablando con un equipo de O&M de un fondo en LATAM".
- REGLA: si el borrador tiene escena genérica, mejórala SIN agregar específicos fabricados. Si tiene específicos verificables (de Jonathan), preserva tal cual.
- Publicar ficción presentándola como experiencia destruye el moat de autenticidad founder-led.

## COMILLAS (CRÍTICO — REGLA DE ESPAÑOL)
- En español SOLO se usan comillas DOBLES ("texto") para citar, enfatizar o resaltar.
- NUNCA uses comillas simples ('texto') como signos de citación o énfasis. Es un error en español formal.
- Las comillas simples se reservan SOLO para apóstrofos en palabras/nombres extranjeros (d'Arc, O'Brien).
- Si el borrador original tiene 'palabras' entre comillas simples, REEMPLÁZALAS por "palabras" en la versión humanizada.

## TOKENS EN MAYÚSCULAS (REGLA ANTI-AI)
- Si el borrador repite una keyword en MAYÚSCULAS entre comillas dobles ("TRACKER", "SCADA", "PR"), QUITA las comillas: las mayúsculas ya marcan el token. Repetir comillas en cada mención es señal de copy generado por IA.
- INCORRECTO: el "TRACKER" responde al ping, la disponibilidad del "TRACKER" cae, el "SCADA" reporta...
- CORRECTO: el TRACKER responde al ping, la disponibilidad del TRACKER cae, el SCADA reporta...
- Mantén comillas dobles SOLO si: (a) citas literalmente una frase, (b) sentido irónico, (c) el token NO está en mayúsculas y necesita marcarse ("on/off", "backtracking"). Máximo 1-2 frases entrecomilladas por post.

IMPORTANTE: Responde UNICAMENTE con un JSON válido, sin markdown, sin backticks, sin texto adicional.`

    const userPrompt = `Borrador a humanizar:${contextBlock}

---
${draft_content}
---

Reescribe el borrador aplicando todas las reglas. Devuelve JSON exacto:
{
  "humanized_content": "El texto completo humanizado con ⏎⏎ entre bloques",
  "changes_summary": ["Cambio 1 con razón breve", "Cambio 2 con razón breve", "..."],
  "risks": ["Riesgo 1 si lo detectas (opcional, puede ser array vacío)"]
}`

    const result = await generateText({
      model: await getModel('iterate', workspaceId),
      system: systemPrompt,
      prompt: userPrompt,
    })

    // Parse JSON from text response
    let jsonText = result.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    let aiParsed: unknown
    try {
      aiParsed = JSON.parse(jsonText)
    } catch {
      console.error('[humanize-copy] Failed to parse AI JSON:', jsonText.slice(0, 500))
      return Response.json(
        { error: 'Error al parsear la respuesta de la IA. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const validated = humanizationResultSchema.safeParse(aiParsed)
    if (!validated.success) {
      console.error('[humanize-copy] Zod validation failed:', validated.error.issues)
      return Response.json(
        { error: 'La IA genero un formato invalido. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    // Post-process: ensure paragraph breaks + strip any hashtags that might have slipped through
    validated.data.humanized_content = ensureParagraphBreaks(validated.data.humanized_content)
      .replace(/#\w+/g, '')
      .trim()

    return Response.json({ data: validated.data })
  } catch (error) {
    console.error('[humanize-copy] AI error:', error)
    return Response.json(
      { error: 'Error al humanizar el contenido. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
