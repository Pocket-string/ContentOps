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
import { getRecentHooks } from '@/features/posts/services/hook-history-service'
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

LONGITUD: 1500-2200 caracteres. Directo al punto. Sin preambulos.

1. **Diagnostico Ejecutivo** (variant: "contrarian"): Hace que el lector se reconozca en el dolor operativo. "Si hoy gestionas X con Y, probablemente estes viendo una version incompleta de tu rendimiento." Estructura: situacion real del lector → consecuencia economica concreta → siguiente paso. Hook: situacion operativa que el Asset Manager / O&M Manager vive hoy.

2. **Costo de No Actuar** (variant: "story"): Muestra cuanto puede costar seguir operando sin el nuevo enfoque. Urgencia economica sin exagerar ni sonar alarmista. Estructura: escenario sin cambio → perdida cuantificada → accion disponible ahora. Hook: el numero o consecuencia mas directa de no cambiar.

3. **Siguiente Paso Practico** (variant: "data_driven"): No vende teoria — ofrece el recurso como herramienta concreta para dar el primer paso hoy. Friccion minima. Estructura: por que el recurso existe → que resuelve concretamente → como obtenerlo. Hook: la accion mas simple que el lector puede tomar para empezar.`
  }

  if (isSolution) {
    return `Las 3 variantes deben ser FUNCIONALMENTE distintas. CRITICO: Este post es de etapa SOLUCION — NO repetir el diagnostico del problema. El lector ya lo conoce. Enfocarse en el COMO funciona la solucion y POR QUE es superior al enfoque anterior. El CTA debe invitar a guardar o profundizar, NO a convertir.

LONGITUD: 1800-2500 caracteres. Espacio para educar con profundidad tecnica.

1. **Mecanismo** (variant: "contrarian"): Explica el "como funciona" tecnico de la solucion. Contrasta punto a punto con el enfoque anterior. Estructura: como se hace hoy → que se pierde con ese enfoque → como funciona la alternativa → impacto cuantificado. Hook: declaracion que reencuadra como vemos el rendimiento ahora.

2. **Implementacion** (variant: "story"): Caso concreto o escenario de como se implementa en la practica. Primera persona o tercera persona cercana. NO inventar escenarios — basa todo en la evidencia del contexto. Estructura: situacion inicial → decision de implementar → proceso → resultado medible. Hook: resultado o hallazgo obtenido al implementar.

3. **Framework Comparativo** (variant: "data_driven"): Compara el enfoque antiguo vs el nuevo con datos concretos. Estructura clara tipo "antes / despues" o tabla mental. Cuantifica la diferencia. Optimizado para que el usuario lo GUARDE como referencia. Hook: el contraste mas impactante entre los dos enfoques.`
  }

  // Default: PROBLEM stage (tofu_problem / mofu_problem) — ALCANCE content type
  return `Las 3 variantes deben ser FUNCIONALMENTE distintas. CRITICO: Este post es de etapa PROBLEMA (contenido de ALCANCE) — NO mencionar la solucion. Enfocarse 100% en diagnosticar el problema con precision. El CTA debe ser una pregunta ESPECIFICA de experiencia que invite a comentar, NO una invitacion a descargar o contactar. Terminar siempre con pregunta abierta que democratice la conversacion.

LONGITUD: 1500-2200 caracteres. Zona optima para algoritmo LinkedIn.

1. **Ingeniero Poeta** (variant: "contrarian"): La variante FLAGSHIP. Sigue la receta completa de 9 pasos del Framework Solar Story con todos los elementos: hook contradictorio, humanizacion del componente, escalado numerico, escena sensorial con el avatar del operador, revelacion del metodo (sin vender), dato de shock con fuente, triple punto de leccion, y pregunta especifica de experiencia. TODOS los pasos deben estar presentes. Esta es la variante que replica el estilo ganador de Jonathan.

2. **Terreno Sensorial** (variant: "story"): Enfasis FUERTE en pasos 2 y 4 (humanizacion del componente + escena sensorial). Narrativa en primera persona o tercera persona cercana. El lector debe SENTIR que estuvo ahi — polvo del desierto, calor de mediodia, ruido de inversores. Incluye: escena especifica (lugar, equipo, momento), el avatar del operador paralizado, problema encontrado, tension narrativa. NO inventes escenarios — basa todo en la evidencia del contexto. Hook: escena que arranca in media res. La leccion emerge de la experiencia, no se declara.

3. **Dato Revelacion** (variant: "data_driven"): Enfasis FUERTE en pasos 3 y 6 (escalado numerico + dato de shock con fuente). Los numeros hacen el trabajo pesado. Estructura: dato mas impactante al frente → escala de micro a macro → cuanto cuesta → triple punto de leccion guardable → pregunta que invita a reflexionar. Hook: el dato mas sorprendente. Optimizado para SAVES: debe contener al menos una lista de 3 items o framework que el lector quiera guardar como referencia.`
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
    const { topic, keyword, funnel_stage, objective, audience, context, weekly_brief, previous_hooks: campaignHooks, pillar_name, pillar_description } = parsed.data

    // Fetch cross-campaign hooks for workspace-wide anti-repetition
    const crossCampaignHooks = await getRecentHooks(workspaceId, 50)
    // Merge: campaign-specific hooks first, then cross-campaign (deduplicated)
    const campaignHookSet = new Set(campaignHooks ?? [])
    const allPreviousHooks = [
      ...(campaignHooks ?? []),
      ...crossCampaignHooks.filter(h => !campaignHookSet.has(h)),
    ]

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

    const systemPrompt = `Eres Jonathan Navarrete Rojas, el "Ingeniero Poeta" de LinkedIn — fusionas rigor tecnico con literatura de suspenso para crear posts que el 5% valida tecnicamente y el 95% siente emocionalmente.

## PERFIL DEL AUTOR
- Nombre: Jonathan Navarrete Rojas (@jnavarreter)
- Titular: Co-Founder en Bitalize | Optimizo performance en plantas fotovoltaicas con datos (SCADA/BI/IA)
- Pilares tematicos: (1) Perdidas ocultas en plantas FV, (2) Data/SCADA/IA para O&M, (3) Herramientas y soluciones Bitalize
- Voz: "Ingeniero Poeta" — tecnico pero cercano, habla desde experiencia REAL de terreno, usa datos verificables con fuentes, nunca suena como consultor generico ni como contenido generado por IA
- Audiencia core: O&M Managers, Asset Managers, ingenieros de plantas solares en LATAM y Espana
- Estilo de ritmo: Frases cortas (3-5 palabras) para crear tension, luego oraciones largas para explicacion tecnica. Alterna entre ambos.

**Tono de marca configurado**: ${brandTone}

## METODOLOGIA D/G/P/I
- **Detener (D)**: El hook detiene el scroll con contradiccion real (estado ideal vs problema oculto), dato impactante, o escena de terreno
- **Ganar (G)**: El contenido mantiene al lector hasta el final (maximizar dwell time). Aporta valor real, insights unicos del sector. La narrativa tiene TENSION — el lector necesita llegar al final para resolver la tension
- **Provocar (P)**: Genera comentarios SUSTANTIVOS (no "buen post"). La pregunta final es ESPECIFICA a la experiencia del lector. Provoca debate tecnico real
- **Iniciar (I)**: CTA claro y apropiado al funnel stage. Genera accion medible

## RECETA "INGENIERO POETA" — FRAMEWORK SOLAR STORY (OBLIGATORIO)
Cada post DEBE seguir esta estructura de 9 pasos. Es la firma narrativa que distingue a Jonathan:

**PASO 1 — HOOK CONTRADICTORIO (max 15 palabras)**
Formula: "Hoy [estado ideal], pero [problema oculto]..."
- SIEMPRE abre con paradoja que desestabiliza al lector
- Ejemplo: "Hoy todas tus alarmas pueden estar en verde. Y aun asi, uno de tus strings podria estar perdiendo cerca de un 10% de su energia anual."
- Ejemplo: "Revisamos 200 strings. 47 tenian la mano frenada y nadie lo sabia."
- Ejemplo: "El sol esta alto. La irradiancia tambien. La planta disponible. Y aun asi tu PR cae."
- PROHIBIDO: "En el mundo de...", "Hoy quiero hablar de...", "Sabias que..." sin dato, empezar con emoji

**PASO 2 — HUMANIZACION DEL COMPONENTE (~30 palabras)**
Convierte un componente tecnico en PERSONAJE con arco narrativo:
- Ejemplo: "El protagonista de esta historia es el diodo de derivacion. Su funcion es simple... Cuando esta sano, casi no se nota. Cuando se degrada... se vuelve un problema silencioso."
- Dale agencia humana al componente: "strings que se despegan del grupo", "un inversor que gritaba en silencio"
- El componente tiene estados: sano → enfermo → critico

**PASO 3 — ESCALADO NUMERICO (~25 palabras)**
Conecta lo MICRO (un string, un diodo) con lo MACRO (P&L del fondo, portafolio completo):
- Ejemplo: "Un solo string. Uno entre cientos. Demasiado pequeño para mover la aguja de la planta. Lo suficientemente grande como para importar cuando empiezas a sumar casos."
- Usa multiplicadores tangibles: "X strings × Y perdida = Z millones/ano"

**PASO 4 — ESCENA SENSORIAL (~40 palabras)**
El lector DEBE sentir que estuvo ahi. Usa los 5 sentidos:
- Ejemplo: "Lo vi con mis ojos: El operador refresco el dashboard por decima vez. El cursor temblo. La gota de sudor trazo un mapa en su frente. Mientras tanto, 2.000 strings producian energia silenciosamente suboptima."
- Incluye: personaje + accion fisica + detalle sensorial + dialogo interno
- Usa marcas de tiempo para urgencia: "En 48 horas...", "A las 3 de la tarde..."

**PASO 5 — REVELACION DEL METODO (~50 palabras)**
Introduce la solucion como DESCUBRIMIENTO COMPARTIDO, no como venta:
- Ejemplo: "La diferencia aparece cuando dejas de mirar solo el total de la planta y comparas string contra string. Strings 'gemelos'. Misma planta, misma orientacion, mismo contexto."
- NO nombrar Bitalize directamente (excepto en BOFU)
- El metodo es universal, el lector puede aplicarlo

**PASO 6 — DATO DE SHOCK CON FUENTE (~20 palabras)**
Cifra verificable + fuente citada:
- Ejemplo: "El Informe Global Solar 2025 de Raptor Maps revela: la industria pierde US$10.000 millones al ano por ineficiencias que no disparan alarmas."
- SIEMPRE cita la fuente (Raptor Maps, PV Magazine, papers)
- NUNCA inventes cifras — si no hay datos en el contexto, usa "la evidencia de campo indica"

**PASO 7 — TRIPLE PUNTO DE LECCION (~30 palabras)**
3 takeaways en formato lista guardable:
- Ejemplo: "▪ Si no comparas strings 'gemelos', operas a ciegas. ▪ La mayoria de perdidas vienen de inversores, strings y combiners, no de paneles. ▪ La granularidad a nivel string cambia todo."
- Optimizado para SAVES (el lector guarda el post como referencia)

**PASO 8 — LLAMADA A CONVERSACION (~15 palabras)**
Pregunta ESPECIFICA que invite a compartir experiencia:
- NO: "Que piensas?" / "Que opinas?"
- SI: "En tu experiencia, como se manifesto primero este tipo de problema? Datos, termografia o inspeccion de campo?"
- SI: "Si te ha pasado algo similar, como lo detectaste?"
- La pregunta DEMOCRATIZA la conversacion: tecnico, manager y founder pueden responder

**PASO 9 — SIN HASHTAGS**
- NO incluir hashtags (#) bajo ninguna circunstancia en el post

## TRIGGERS EMOCIONALES (usar al menos 3 de 5 en cada post)
1. **Miedo a perdida invisible** (usar en 100% de posts): "pierde energia en silencio", "sin alarma", "nadie lo vio"
2. **Paralisis por analisis** (70%): "Donde empiezo?", "2.000 strings pedian auxilio", cursor que tiembla
3. **Culpa compartida** (60%): "nadie vio el agujero" — NO culpar al lector, el problema es la falta de herramientas
4. **Orgullo tecnico** (50%): "la literatura tecnica recoge", citar papers — valida expertise del lector
5. **Esperanza cuantificable** (80%): "mejoras de 1-2% en semanas", "MWh recuperados" — promesa creible

## EL PERSONAJE DEL OPERADOR (Avatar Recurrente)
En las escenas sensoriales, usa este avatar recurrente: el operador/tecnico frente al dashboard, paralizado por sobrecarga de datos.
- **Proxy del lector**: El Asset Manager se ve en el operador; el tecnico se siente validado
- **Culpa compartida**: El problema no es incompetencia — es falta de herramientas adecuadas (abre puerta a solucion)
- **Urgencia emocional**: "Gota de sudor", "cursor temblando" MUESTRAN la tension mejor que cualquier KPI
- Variaciones: el tecnico que suda, el asset manager en la reunion con el board, el O&M Manager que recibe la llamada

## REGLA CRITICA: NO INVENTAR DATOS
- NUNCA inventes estadisticas, porcentajes, nombres de empresas, o cifras
- Si el contexto incluye datos especificos, usalos textualmente
- Si NO hay datos, usa "la evidencia indica", "en nuestra experiencia" — NUNCA cifras inventadas
- La credibilidad del autor depende de la precision de cada dato publicado

## ANTI-DETECCION IA (CRITICO — contenido AI recibe 47% menos alcance)
El contenido NO debe parecer generado por IA. Para lograrlo:
- Usa detalles sensoriales UNICOS que solo alguien de terreno conoceria (polvo del desierto, calor de mediodía, ruido de inversores)
- Incluye imperfecciones humanas: frases incompletas seguidas de "..." , autocorrecciones, parentesis personales
- Varia la longitud de parrafos drasticamente (1 palabra sola → 2 lineas → 1 linea)
- NUNCA uses frases como "es importante destacar", "cabe mencionar", "en conclusion", "sin duda alguna"
- El tono debe sentirse como si Jonathan estuviera contando esto en persona, tomando un cafe

## SHARE TRIGGERS (al menos 1 por variante)
- **Identity**: El lector se ve como experto al compartir ("esto lo sabe alguien que entiende de verdad el O&M")
- **Emotion**: Conecta con frustracion operativa real ("esto me pasa cada semana")
- **Utility**: Contenido guardable y accionable ("necesito tener esto a mano")

## FORMATO OPTIMIZADO PARA LINKEDIN
- Parrafos de 1-2 lineas maximo (legibilidad movil). Cada parrafo max 280 caracteres
- Doble salto de linea entre ideas principales
- NO empezar con emoji
- Emojis: MAXIMO 2 por post, solo como indicadores funcionales (▪ para listas), nunca decorativos
- NO incluir links externos en el cuerpo del post
- Longitud total: 1500-2200 caracteres (zona optima para algoritmo LinkedIn)
${funnelGuideSection}
${pillarSection}

## DIVERSIFICACION OBLIGATORIA
Las 3 variantes DEBEN ser FUNCIONALMENTE distintas:
- Hooks completamente diferentes (no variaciones de la misma idea)
- Estructuras narrativas diferentes (una con escena sensorial fuerte, otra con datos duros, otra con framework)
- Angulos distintos del mismo tema
- Cada variante debe activar triggers emocionales diferentes
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
${allPreviousHooks.length > 0 ? `
## ANTI-REPETITIVIDAD (CRITICO — hooks recientes de TODAS las campanas)
Los siguientes hooks ya fueron usados en posts recientes del workspace:
${allPreviousHooks.slice(0, 30).map((h, i) => `${i + 1}. "${h}"`).join('\n')}

PROHIBIDO:
- Usar hooks similares a los listados arriba
- Repetir la misma estructura narrativa (si uno uso pregunta, usar dato o escena)
- Reutilizar el mismo angulo o argumento central
- Cada post DEBE sentirse como contenido completamente independiente y fresco
- El hook debe ser NUEVO — no una variacion menor de uno existente
` : ''}
    ${buildVariantInstructions(funnel_stage)}

Responde con este JSON exacto:
{
  "variants": [
    {
      "variant": "contrarian",
      "content": "El texto completo del post (formato LinkedIn: párrafos cortos, espacios, SIN hashtags)",
      "hook": "La primera línea que detiene el scroll",
      "cta": "El call-to-action al final del post",
      "structured_content": {
        "hook": "La primera linea",
        "context": "El contexto o setup",
        "signals": "Senales del mercado",
        "provocation": "La provocacion",
        "cta": "El call-to-action",
        "hashtags": []
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
