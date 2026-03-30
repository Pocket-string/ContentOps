import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { weeklyBriefSchema } from '@/shared/types/content-ops'
import { getModel } from '@/shared/lib/ai-router'
import { FUNNEL_STAGE_GUIDE } from '@/shared/lib/funnel-stage-guide'
import type { FunnelStage } from '@/shared/types/content-ops'

// Zod schema for single variant evaluation
const variantEvalSchema = z.object({
  variant: z.string(),
  score: z.object({
    detener: z.number().min(0).max(5),
    ganar: z.number().min(0).max(5),
    provocar: z.number().min(0).max(5),
    iniciar: z.number().min(0).max(5),
    receta: z.number().min(0).max(5).default(0),
    total: z.number().min(0).max(25),
  }),
  findings: z.array(z.object({
    category: z.string(),
    severity: z.enum(['blocker', 'warning', 'suggestion']),
    description: z.string(),
  })),
  suggestions: z.array(z.string()).max(3),
  verdict: z.enum(['pass', 'needs_work', 'rewrite']),
})

// Full critic output — evaluates ALL variants and recommends the best
const criticOutputSchema = z.object({
  evaluations: z.array(variantEvalSchema).min(1),
  recommended_variant: z.string(),
  recommendation_reason: z.string(),
})

export type CriticCopyOutput = z.infer<typeof criticOutputSchema>

// Input schema — can receive single or multiple variants
const variantInputSchema = z.object({
  variant: z.string().min(1),
  content: z.string().min(1),
})

const inputSchema = z.object({
  variants: z.array(variantInputSchema).min(1).max(3),
  funnel_stage: z.string().min(1),
  weekly_brief: weeklyBriefSchema.optional(),
  keyword: z.string().optional(),
  topic: z.string().optional(),
  context: z.string().optional(),
  previous_hooks: z.array(z.string()).optional(),
  pillar_name: z.string().optional(),
  pillar_description: z.string().optional(),
})

export async function POST(request: Request): Promise<Response> {
  // 1. Auth
  const user = await requireAuth()

  // 2. Rate limit (10 req/min per user)
  const rateLimitResult = aiRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  // 3. Validate input with Zod
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

  // 4. Get workspace context
  const workspaceId = await getWorkspaceId()

  // 5. Evaluate with AI (text-based JSON)
  try {
    const { variants, funnel_stage, weekly_brief, keyword, topic, context, previous_hooks, pillar_name, pillar_description } = parsed.data

    // Funnel-stage-specific evaluation criteria
    const stageConfig = FUNNEL_STAGE_GUIDE[funnel_stage as FunnelStage]

    const variantLabels: Record<string, string> = {
      contrarian: 'Revelacion Tecnica',
      story: 'Historia de Terreno',
      data_driven: 'Framework Accionable',
    }

    const variantsBlock = variants.map((v, i) => {
      const label = variantLabels[v.variant] ?? v.variant
      return `--- VARIANTE ${i + 1}: ${label} (${v.variant}) ---\n${v.content}`
    }).join('\n\n')

    const result = await generateText({
      model: await getModel('critic-copy', workspaceId),
      system: `Eres un critico experto de copy LinkedIn para O&M fotovoltaico.
Eres exigente pero justo. Tu mision: que cada post sea excelente antes de publicarse.
Evaluas con la rubrica D/G/P/I/R — la R es RECETA, que mide cumplimiento del estilo "Ingeniero Poeta" de Jonathan.

## CONTEXTO DEL AUTOR
Jonathan Navarrete (@jnavarreter) — Co-Founder en Bitalize, optimiza performance en plantas FV con datos.
Audiencia: O&M Managers, Asset Managers, ingenieros solares en LATAM/Espana.
Pilares: perdidas ocultas en FV, Data/SCADA/IA para O&M, herramientas Bitalize.
Estilo: "Ingeniero Poeta" — fusiona rigor tecnico con literatura de suspenso. Posts ganadores siguen el Framework Solar Story de 9 pasos.

## RUBRICA D/G/P/I/R (basada en senales reales de LinkedIn + receta ganadora)
- **Detener (D, 0-5)**: Hook detiene el scroll? NO empieza con emoji? NO usa frases genericas ("En el mundo de...", "Hoy quiero...")? Usa dato concreto, contradiccion, escena o pregunta provocadora? El hook contradice una expectativa (estado ideal vs problema oculto)?
- **Ganar (G, 0-5)**: Mantendria al lector hasta el final? (potencial de dwell time alto) Aporta valor real, insights unicos del sector FV? La narrativa tiene TENSION que obliga a llegar al final?
- **Provocar (P, 0-5)**: Genera comentarios SUSTANTIVOS (no "buen post" o "interesante")? Provoca debate tecnico real donde la audiencia quiera compartir su experiencia?
- **Iniciar (I, 0-5)**: CTA apropiado al funnel stage${stageConfig ? ` (esperado: ${stageConfig.cta_type})` : ''}? Genera accion medible? ${stageConfig ? stageConfig.critic_penalty : 'Es una pregunta abierta genuina (no "comenta SI o NO")?'} La pregunta final es ESPECIFICA (no "que piensas?")?
- **Receta (R, 0-5)**: Cumple la receta "Ingeniero Poeta" / Framework Solar Story? Evalua presencia de estos elementos:
  - Hook contradictorio (paradoja estado ideal vs problema oculto) — 1 punto
  - Humanizacion de componente tecnico (diodo, string, inversor con agencia humana) — 1 punto
  - Escena sensorial (detalles de campo: sudor, cursor, calor, polvo, silencio) — 1 punto
  - Dato de shock con fuente citada (Raptor Maps, PV Magazine, no "estudios dicen") — 1 punto
  - Triple leccion guardable (lista de 3+ items con ▪ o numerados) — 1 punto
  Si faltan 3+ elementos, el post NO suena como Jonathan y debe mejorar.

## PROBLEMAS QUE DETECTAS
- **generico**: Contenido que podria ser de cualquier sector, sin vocabulario especifico de O&M/FV
- **sin_evidencia**: Afirmaciones sin datos ni fuentes del contexto
- **jerga**: Jerga tecnica excesiva sin explicacion para la audiencia
- **cta_debil**: CTA vago, ausente, o que no genera accion real
- **hook_debil**: Primera linea que no detiene el scroll o usa formulas gastadas
- **hook_bot**: Hook que empieza con emoji o usa patrones tipicos de IA generica
- **longitud**: Fuera del rango optimo 1500-2200 chars (>2800 o <1000)
- **formato**: Parrafos >2 lineas, exceso de emojis (>2), sin espaciado
- **baja_guardabilidad**: Post sin framework, lista, checklist, o insight accionable que motive a guardarlo
- **sin_diversificacion**: Las variantes son demasiado similares entre si en estructura, hook, o argumento central
- **anti_bot**: Lenguaje que suena a IA generica (frases como "en el mundo de", "hoy quiero compartir", estructuras identicas entre variantes, exceso de emojis)
- **repeticion_campana**: Hook o argumento central muy similar a un post previo de la misma campana semanal
- **cta_incongruente**: CTA no apropiado para la etapa del funnel${stageConfig ? `. ${stageConfig.critic_penalty}` : ''}
- **desalineacion_pilar**: El contenido no se alinea con el pilar tematico asignado
- **recipe_violation**: El post no sigue la receta "Ingeniero Poeta" / Framework Solar Story. Le faltan elementos clave como: hook contradictorio, humanizacion de componente, escena sensorial, dato con fuente, o triple leccion
${stageConfig ? `
## EVALUACION POR ETAPA DEL FUNNEL (${funnel_stage})
- **Objetivo esperado**: ${stageConfig.objective}
- **Tono esperado**: ${stageConfig.tone}
- **CTA esperado**: ${stageConfig.cta_type}
- **Penalizar si**: ${stageConfig.critic_penalty}
Si el CTA no es apropiado para esta etapa, reportar "cta_incongruente" como warning o blocker segun severidad.
` : ''}
${pillar_name ? `
## PILAR TEMATICO
Este post pertenece al pilar **"${pillar_name}"**${pillar_description ? `: ${pillar_description}` : ''}.
Evalua si el contenido esta alineado tematicamente con este pilar. Si no lo esta, reporta como warning.
` : ''}
Reglas:
- MAXIMO 3 findings por variante (los mas impactantes)
- MAXIMO 3 suggestions por variante (cambios concretos, accionables)
- Severity: blocker (debe corregirse), warning (recomendado), suggestion (opcional)
- Verdict: pass (score >= 20), needs_work (12-19), rewrite (< 12)
- total = detener + ganar + provocar + iniciar + receta
- SIEMPRE recomienda la MEJOR variante con razon clara
- Si las variantes son demasiado similares, reporta "sin_diversificacion" como blocker
- Si un hook es muy similar a un hook previo de la campana, reporta "repeticion_campana" como blocker

IMPORTANTE: Responde UNICAMENTE con un JSON valido, sin markdown, sin backticks, sin texto adicional.`,
      prompt: `Evalua estas variantes de un post de LinkedIn:

**Etapa del funnel**: ${funnel_stage}
${keyword ? `**Keyword**: ${keyword}` : ''}
${topic ? `**Tema**: ${topic}` : ''}
${context ? `**Contexto**: ${context}` : ''}
${weekly_brief ? `**Brief semanal**: Tema: ${weekly_brief.tema}, Enemigo silencioso: ${weekly_brief.enemigo_silencioso ?? 'N/A'}, Anti-mito: ${weekly_brief.anti_mito ?? 'N/A'}` : ''}
${previous_hooks && previous_hooks.length > 0 ? `
**Hooks de posts previos en esta campana** (los nuevos hooks DEBEN ser diferentes):
${previous_hooks.map((h, i) => `${i + 1}. "${h}"`).join('\n')}` : ''}

${variantsBlock}

Responde con este JSON exacto:
{
  "evaluations": [
    {
      "variant": "contrarian",
      "score": { "detener": 4, "ganar": 3, "provocar": 4, "iniciar": 3, "receta": 3, "total": 17 },
      "findings": [
        { "category": "hook_debil", "severity": "warning", "description": "El hook podria ser mas provocador" }
      ],
      "suggestions": ["Agregar un dato especifico en el hook", "Hacer el CTA mas directo"],
      "verdict": "needs_work"
    }
  ],
  "recommended_variant": "contrarian",
  "recommendation_reason": "Mejor hook y mayor provocacion para esta etapa del funnel"
}`,
    })

    // Parse JSON from text response
    let jsonText = result.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    let parsed_ai: unknown
    try {
      parsed_ai = JSON.parse(jsonText)
    } catch {
      console.error('[critic-copy] Failed to parse AI JSON:', jsonText.slice(0, 500))
      return Response.json(
        { error: 'Error al parsear la evaluacion. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const validated = criticOutputSchema.safeParse(parsed_ai)
    if (!validated.success) {
      console.error('[critic-copy] Zod validation failed:', validated.error.issues)
      return Response.json(
        { error: 'La IA genero un formato invalido. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    return Response.json({ data: validated.data })
  } catch (error) {
    console.error('[critic-copy] AI error:', error)
    return Response.json(
      { error: 'Error al evaluar el contenido. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
