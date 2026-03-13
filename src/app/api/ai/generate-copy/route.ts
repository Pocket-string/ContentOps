import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { weeklyBriefSchema, structuredContentSchema } from '@/shared/types/content-ops'
import { getActiveBrandProfile } from '@/features/brand/services/brand-service'
import { getTopPatterns } from '@/features/patterns/services/pattern-service'
import { getModel } from '@/shared/lib/ai-router'
import { reviewCopy } from '@/shared/lib/ai-reviewer'
import { FUNNEL_STAGE_GUIDE } from '@/shared/lib/funnel-stage-guide'
import type { FunnelStage } from '@/shared/types/content-ops'

// Zod schema for the AI output (MUST parse AI responses with Zod — never use `as MyType`)
const generatedCopySchema = z.object({
  variants: z
    .array(
      z.object({
        variant: z.enum(['contrarian', 'story', 'data_driven']),
        content: z.string().min(1),
        hook: z.string().min(1),
        cta: z.string().min(1),
        structured_content: structuredContentSchema.optional(),
      })
    )
    .min(3),
})

export type GeneratedCopy = z.infer<typeof generatedCopySchema>

// Input schema — validated before touching the AI
const inputSchema = z.object({
  topic: z.string().min(1, 'El tema es requerido'),
  keyword: z.string().optional(),
  funnel_stage: z.string().min(1, 'La etapa del funnel es requerida'),
  objective: z.string().optional(),
  audience: z.string().optional(),
  context: z.string().optional(),
  weekly_brief: weeklyBriefSchema.optional(),
  previous_hooks: z.array(z.string()).optional(),
  pillar_name: z.string().optional(),
  pillar_description: z.string().optional(),
})

// Stage-aware variant instructions injected into userPrompt
function buildVariantInstructions(funnelStage: string): string {
  const isBofu = funnelStage === 'bofu_conversion'
  const isSolution = funnelStage === 'tofu_solution' || funnelStage === 'mofu_solution'

  if (isBofu) {
    return `Las 3 variantes deben ser FUNCIONALMENTE distintas. CRITICO: Este es el post de CIERRE — NO es educativo ni de awareness. El lector ya conoce el problema y la solucion. Ahora debe tomar una accion concreta. UN solo CTA principal. NO mezclar multiples CTAs.

1. **Diagnostico Ejecutivo** (variant: "contrarian"): Hace que el lector se reconozca en el dolor operativo. "Si hoy gestionas X con Y, probablemente estes viendo una version incompleta de tu rendimiento." Estructura: situacion real del lector → consecuencia economica concreta → siguiente paso. Hook: situacion operativa que el Asset Manager / O&M Manager vive hoy.

2. **Costo de No Actuar** (variant: "story"): Muestra cuanto puede costar seguir operando sin el nuevo enfoque. Urgencia economica sin exagerar ni sonar alarmista. Estructura: escenario sin cambio → perdida cuantificada → accion disponible ahora. Hook: el numero o consecuencia mas directa de no cambiar.

3. **Siguiente Paso Practico** (variant: "data_driven"): No vende teoria — ofrece el recurso como herramienta concreta para dar el primer paso hoy. Friccion minima. Estructura: por que el recurso existe → que resuelve concretamente → como obtenerlo. Hook: la accion mas simple que el lector puede tomar para empezar.`
  }

  if (isSolution) {
    return `Las 3 variantes deben ser FUNCIONALMENTE distintas. CRITICO: Este post es de etapa SOLUCION — NO repetir el diagnostico del problema. El lector ya lo conoce. Enfocarse en el COMO funciona la solucion y POR QUE es superior al enfoque anterior. El CTA debe invitar a guardar o profundizar, NO a convertir.

1. **Mecanismo** (variant: "contrarian"): Explica el "como funciona" tecnico de la solucion. Contrasta punto a punto con el enfoque anterior. Estructura: como se hace hoy → que se pierde con ese enfoque → como funciona la alternativa → impacto cuantificado. Hook: declaracion que reencuadra como vemos el rendimiento ahora.

2. **Implementacion** (variant: "story"): Caso concreto o escenario de como se implementa en la practica. Primera persona o tercera persona cercana. NO inventar escenarios — basa todo en la evidencia del contexto. Estructura: situacion inicial → decision de implementar → proceso → resultado medible. Hook: resultado o hallazgo obtenido al implementar.

3. **Framework Comparativo** (variant: "data_driven"): Compara el enfoque antiguo vs el nuevo con datos concretos. Estructura clara tipo "antes / despues" o tabla mental. Cuantifica la diferencia. Optimizado para que el usuario lo GUARDE como referencia. Hook: el contraste mas impactante entre los dos enfoques.`
  }

  // Default: PROBLEM stage (tofu_problem / mofu_problem)
  return `Las 3 variantes deben ser FUNCIONALMENTE distintas. CRITICO: Este post es de etapa PROBLEMA — NO mencionar la solucion. Enfocarse 100% en diagnosticar el problema con precision. El CTA debe ser una pregunta abierta que invite a comentar, NO una invitacion a descargar o contactar.

1. **Revelacion Tecnica** (variant: "contrarian"): Desafia una creencia instalada en O&M con un mecanismo tecnico que la audiencia no ha identificado. Estructura: Mito o asuncion erronea → Mecanismo real que lo contradice → Impacto en kWh/USD → Insight accionable. Hook: contradiccion o dato que rompe la asuncion.

2. **Historia de Terreno** (variant: "story"): Recrea una experiencia REAL de campo con detalle sensorial y tension narrativa. El lector debe sentir que estuvo ahi. Incluye: escena especifica (lugar, equipo, momento), problema encontrado, decision tomada, resultado. NO inventes escenarios — basa todo en la evidencia del contexto. Hook: escena que arranca in media res.

3. **Datos Duros** (variant: "data_driven"): Estadisticas, cifras y hechos que prueban que el problema es real y costoso. Los numeros hacen el trabajo. Estructura: dato mas impactante → por que existe el problema → cuanto cuesta → pregunta que invita a reflexionar. Hook: el dato mas sorprendente al frente.`
}

export async function POST(request: Request): Promise<Response> {
  // 1. Auth — redirect if unauthenticated (requireAuth throws/redirects)
  const user = await requireAuth()

  // 2. Rate limit (10 req/min per user)
  const rateLimitResult = aiRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  // 3. Validate input with Zod — fail fast on bad data
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

  // 4. Fetch active brand profile for tone injection + top patterns for retrieval
  const workspaceId = await getWorkspaceId()
  const [brandResult, hookPatterns, ctaPatterns] = await Promise.all([
    getActiveBrandProfile(workspaceId),
    getTopPatterns(workspaceId, 'hook', parsed.data.funnel_stage, 5),
    getTopPatterns(workspaceId, 'cta', undefined, 5),
  ])
  const brandTone = brandResult.data?.tone ?? 'profesional, tecnico pero accesible, confiable'

  // Build pattern context block for AI prompt injection
  const patternContext: string[] = []
  if (hookPatterns.data && hookPatterns.data.length > 0) {
    patternContext.push('**Hooks exitosos previos:**')
    for (const p of hookPatterns.data) {
      const score = p.performance.dgpi_score != null ? ` (D/G/P/I: ${p.performance.dgpi_score}/20)` : ''
      patternContext.push(`- "${p.content}"${score}`)
    }
  }
  if (ctaPatterns.data && ctaPatterns.data.length > 0) {
    patternContext.push('\n**CTAs exitosos previos:**')
    for (const p of ctaPatterns.data) {
      const rate = p.performance.engagement_rate != null ? ` (engagement: ${p.performance.engagement_rate}%)` : ''
      patternContext.push(`- "${p.content}"${rate}`)
    }
  }
  const patternSection =
    patternContext.length > 0
      ? `\n${patternContext.join('\n')}\n\nUsa estos patrones como inspiracion para generar hooks y CTAs mas efectivos.`
      : ''

  // 5. Generate with AI (text-based JSON — generateObject fails with Gemini on long prompts)
  try {
    const { topic, keyword, funnel_stage, objective, audience, context, weekly_brief, previous_hooks, pillar_name, pillar_description } = parsed.data

    // Build pillar context section
    const pillarSection = pillar_name ? `

## PILAR TEMATICO
Este post pertenece al pilar **"${pillar_name}"**${pillar_description ? `: ${pillar_description}` : ''}.
El contenido debe alinearse tematicamente con este pilar. Mantén coherencia con la narrativa del pilar.` : ''

    // Funnel-stage-specific copywriting instructions
    const stageConfig = FUNNEL_STAGE_GUIDE[funnel_stage as FunnelStage]
    const funnelGuideSection = stageConfig ? `

## GUIA POR ETAPA DEL FUNNEL (${funnel_stage})
- **Objetivo del post**: ${stageConfig.objective}
- **Tono**: ${stageConfig.tone}
- **Estilo de hook optimo**: ${stageConfig.hook_style}
- **Tipo de CTA esperado**: ${stageConfig.cta_type}
- **Profundidad del contenido**: ${stageConfig.content_depth}
- **Ejemplo de CTA**: ${stageConfig.example_cta}

CRITICO: El hook, tono, y CTA DEBEN alinearse con esta etapa del funnel. Un post TOFU no debe tener CTA comercial. Un post BOFU debe tener CTA directo.` : ''

    const systemPrompt = `Eres un experto en copywriting para LinkedIn especializado en O&M fotovoltaico.

## PERFIL DEL AUTOR
- Nombre: Jonathan Navarrete Rojas (@jnavarreter)
- Titular: Co-Founder en Bitalize | Optimizo performance en plantas fotovoltaicas con datos (SCADA/BI/IA)
- Pilares tematicos: (1) Perdidas ocultas en plantas FV, (2) Data/SCADA/IA para O&M, (3) Herramientas y soluciones Bitalize
- Voz: Tecnico pero cercano. Habla desde experiencia real de terreno. Usa datos verificables. Nunca suena como consultor generico.
- Audiencia core: O&M Managers, Asset Managers, ingenieros de plantas solares en LATAM y Espana

**Tono de marca configurado**: ${brandTone}

## METODOLOGIA D/G/P/I
- **Detener (D)**: El hook detiene el scroll con datos concretos, contradicciones reales, o escenas de terreno
- **Ganar (G)**: El contenido mantiene al lector hasta el final (maximizar tiempo de lectura). Aporta valor real, insights unicos, o perspectivas no obvias del sector
- **Provocar (P)**: Genera comentarios SUSTANTIVOS (no "buen post"). Provoca debate tecnico real
- **Iniciar (I)**: CTA claro y apropiado al funnel stage. Genera accion medible

## HOOK (CRITICO — determina si el post se distribuye)
El hook DEBE usar una de estas formulas probadas:
1. DATO IMPACTANTE: "Una planta de 100MW pierde $X/ano por algo que nadie mide."
2. PREGUNTA PROVOCADORA: "Tu PR global esta OK? Puede haber strings con la mano frenada."
3. ESCENA DE TERRENO: "Conectamos el 100% del PMGD. A las horas, un inversor de 200kW estaba inutilizable."
4. CONTRADICCION: "El sol esta alto. La irradiancia tambien. La planta disponible. Y aun asi tu PR cae."

PROHIBIDO en hooks:
- "En el mundo de la energia solar..."
- "Hoy quiero hablar de..." / "Hoy quiero compartir..."
- "Sabias que..." sin dato concreto inmediato despues
- Empezar con emoji (patron detectado como bot por LinkedIn)
- Frases que podrian ser de cualquier sector

## REGLA CRITICA: NO INVENTAR DATOS
- NUNCA inventes estadisticas, porcentajes, nombres de empresas, o cifras
- Si el contexto incluye datos especificos, usalos textualmente
- Si NO hay datos, usa "la evidencia indica", "en nuestra experiencia" — NUNCA cifras inventadas
- La credibilidad del autor depende de la precision de cada dato publicado

## FORMATO OPTIMIZADO PARA LINKEDIN (basado en evidencia de algoritmo)
- Longitud optima: 1500-2200 caracteres (maximiza dwell time sin perder atencion)
- Parrafos de 1-2 lineas maximo (legibilidad movil)
- Doble salto de linea entre ideas principales
- NO empezar con emoji
- Emojis: MAXIMO 2 por post, solo como indicadores funcionales, nunca decorativos
- NO incluir links externos en el cuerpo del post
- CTA al final, antes de hashtags
- 3-4 hashtags relevantes al final (no mas)
${funnelGuideSection}
${pillarSection}

## DIVERSIFICACION OBLIGATORIA
Las 3 variantes DEBEN ser FUNCIONALMENTE distintas:
- Hooks completamente diferentes (no variaciones de la misma idea)
- Estructuras narrativas diferentes
- Angulos distintos del mismo tema
- Si una usa pregunta retorica, otra usa escena de terreno, otra usa lista/framework

IMPORTANTE: Responde UNICAMENTE con un JSON valido, sin markdown, sin backticks, sin texto adicional.`

    const userPrompt = `Genera 3 variantes de un post de LinkedIn con estos parámetros:

**Tema**: ${topic}
**Palabra clave**: ${keyword ?? 'No especificada'}
**Etapa del funnel**: ${funnel_stage}
**Objetivo del post**: ${objective ?? 'Engagement general'}
**Audiencia**: ${audience ?? 'Profesionales de energía solar y O&M fotovoltaico'}
${context ? `
## DATOS VERIFICADOS DEL TOPICO (usar EXCLUSIVAMENTE estos datos en el copy)

${context}

IMPORTANTE: Todos los datos, cifras, y afirmaciones en el copy DEBEN provenir de esta seccion. No inventes datos adicionales.` : ''}
${weekly_brief ? `
**Brief de la semana**:
- Tema: ${weekly_brief.tema}
- Enemigo silencioso: ${weekly_brief.enemigo_silencioso ?? 'No definido'}
- Evidencia clave: ${weekly_brief.evidencia_clave ?? 'No definida'}
- Senales del mercado: ${weekly_brief.senales_mercado?.join(', ') || 'No definidas'}
- Anti-mito: ${weekly_brief.anti_mito ?? 'No definido'}
- Buyer persona: ${weekly_brief.buyer_persona ?? 'No definido'}
- Keyword: ${weekly_brief.keyword ?? 'No definida'}
- Recurso CTA: ${weekly_brief.recurso ?? 'No definido'}
- Restriccion links: ${weekly_brief.restriccion_links ? 'NO incluir links' : 'Links permitidos'}
- Reglas de tono: ${weekly_brief.tone_rules ?? 'No definidas'}` : ''}
${patternSection}
${previous_hooks && previous_hooks.length > 0 ? `
## ANTI-REPETITIVIDAD (CRITICO — posts previos en esta campana)
Los siguientes hooks ya fueron usados en otros posts de esta misma campana semanal:
${previous_hooks.map((h, i) => `${i + 1}. "${h}"`).join('\n')}

PROHIBIDO:
- Usar hooks similares a los listados arriba
- Repetir la misma estructura narrativa (si uno usó pregunta, usar dato o escena)
- Reutilizar el mismo angulo o argumento central
- Cada post de la campana DEBE sentirse como contenido completamente independiente
` : ''}
    ${buildVariantInstructions(funnel_stage)}

Responde con este JSON exacto:
{
  "variants": [
    {
      "variant": "contrarian",
      "content": "El texto completo del post (formato LinkedIn: párrafos cortos, espacios, hashtags al final)",
      "hook": "La primera línea que detiene el scroll",
      "cta": "El call-to-action al final del post",
      "structured_content": {
        "hook": "La primera linea",
        "context": "El contexto o setup",
        "signals": "Senales del mercado",
        "provocation": "La provocacion",
        "cta": "El call-to-action",
        "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
      }
    },
    {
      "variant": "story",
      "content": "...",
      "hook": "...",
      "cta": "...",
      "structured_content": { "hook": "...", "context": "...", "signals": "...", "provocation": "...", "cta": "...", "hashtags": [] }
    },
    {
      "variant": "data_driven",
      "content": "...",
      "hook": "...",
      "cta": "...",
      "structured_content": { "hook": "...", "context": "...", "signals": "...", "provocation": "...", "cta": "...", "hashtags": [] }
    }
  ]
}`

    const result = await generateText({
      model: await getModel('generate-copy', workspaceId),
      system: systemPrompt,
      prompt: userPrompt,
    })

    // Parse JSON from text response (strip markdown fences if present)
    let jsonText = result.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    let parsed_ai: unknown
    try {
      parsed_ai = JSON.parse(jsonText)
    } catch {
      console.error('[generate-copy] Failed to parse AI JSON:', jsonText.slice(0, 500))
      return Response.json(
        { error: 'Error al parsear la respuesta de la IA. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const validated = generatedCopySchema.safeParse(parsed_ai)
    if (!validated.success) {
      console.error('[generate-copy] Zod validation failed:', validated.error.issues)
      return Response.json(
        { error: 'La IA genero un formato invalido. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    // 6. ChatGPT review (optional — runs on first variant, non-blocking on failure)
    const firstVariant = validated.data.variants[0]
    const review = await reviewCopy(
      firstVariant.content,
      firstVariant.variant,
      parsed.data.funnel_stage,
      workspaceId
    )

    return Response.json({ data: validated.data, review })
  } catch (error) {
    console.error('[generate-copy] AI error:', error)
    return Response.json(
      { error: 'Error al generar el contenido. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
