import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { structuredContentSchema } from '@/shared/types/content-ops'
import { getActiveBrandProfile } from '@/features/brand/services/brand-service'
import { getTopPatterns } from '@/features/patterns/services/pattern-service'
import { getModel } from '@/shared/lib/ai-router'
import { reviewCopy } from '@/shared/lib/ai-reviewer'
import { FUNNEL_STAGE_GUIDE } from '@/shared/lib/funnel-stage-guide'
import { ensureParagraphBreaks } from '@/shared/lib/format-copy'
import { getRecentHooks } from '@/features/posts/services/hook-history-service'
import { getValidatorRulesSummary } from '@/features/posts/services/validator-rules'
import { createClient } from '@/lib/supabase/server'
import type { FunnelStage } from '@/shared/types/content-ops'

// Zod schema for the AI output (MUST parse AI responses with Zod — never use `as MyType`)
const variantSchema = z.object({
  variant: z.enum(['contrarian', 'story', 'data_driven']),
  content: z.string().min(1),
  hook: z.string().default(''),
  cta: z.string().default(''),
  structured_content: structuredContentSchema.optional(),
})

const generatedCopySchema = z.object({
  variants: z.array(variantSchema).min(1),
})

export type GeneratedCopy = z.infer<typeof generatedCopySchema>

// Input schema — validated before touching the AI
const siblingSchema = z.object({
  day_of_week: z.coerce.string(),
  funnel_stage: z.string(),
  content_preview: z.string(),
})

// Lenient weekly_brief schema: coerce all fields to strings to handle DB JSONB quirks
const lenientWeeklyBriefSchema = z.object({
  tema: z.coerce.string().min(1),
  enemigo_silencioso: z.coerce.string().optional(),
  evidencia_clave: z.coerce.string().optional(),
  senales_mercado: z.array(z.coerce.string()).default([]),
  anti_mito: z.coerce.string().optional(),
  buyer_persona: z.coerce.string().optional(),
  keyword: z.coerce.string().optional(),
  recurso: z.coerce.string().optional(),
  restriccion_links: z.boolean().default(true),
  tone_rules: z.coerce.string().optional(),
})

const inputSchema = z.object({
  topic: z.string().min(1, 'El tema es requerido'),
  keyword: z.string().optional(),
  funnel_stage: z.string().min(1, 'La etapa del funnel es requerida'),
  day_of_week: z.coerce.number().min(1).max(7).optional(),
  objective: z.string().optional(),
  audience: z.string().optional(),
  context: z.string().optional(),
  weekly_brief: lenientWeeklyBriefSchema.optional(),
  previous_hooks: z.array(z.coerce.string()).optional(),
  sibling_summaries: z.array(siblingSchema).optional(),
  pillar_name: z.coerce.string().optional(),
  pillar_description: z.coerce.string().optional(),
  // PRP-012: Editorial layer (resolved context strings, not IDs)
  editorial_pillar_context: z.string().nullable().optional(),
  audience_angle: z.string().nullable().optional(),
  structure_blueprint: z.string().nullable().optional(),
  structure_name: z.string().nullable().optional(),
})

// Stage-aware variant instructions injected into userPrompt
function buildVariantInstructions(funnelStage: string): string {
  if (funnelStage === 'bofu_conversion') {
    return `Las 3 variantes deben ser FUNCIONALMENTE distintas.

TONO BOFU CONVERSION: El lector ya decidio. Necesita el ULTIMO empujon.
- CERO educacion — ir directo al costo de NO actuar
- Urgencia economica sin alarmismo (numeros reales, no inflados)
- UN SOLO CTA directo y medible
- El lector debe pensar: "ya lo pense suficiente, necesito dar el paso"

LONGITUD: 1500-2200 caracteres. Directo al punto. Sin preambulos.

1. **Diagnostico Ejecutivo** (variant: "contrarian"): Hace que el lector se reconozca en el dolor operativo. Estructura: situacion real del lector → consecuencia economica concreta → siguiente paso.

2. **Costo de No Actuar** (variant: "story"): Muestra cuanto puede costar seguir operando sin el nuevo enfoque. Urgencia economica sin exagerar. Estructura: escenario sin cambio → perdida cuantificada → accion disponible ahora.

3. **Siguiente Paso Practico** (variant: "data_driven"): Ofrece el recurso como herramienta concreta. Friccion minima. Estructura: por que el recurso existe → que resuelve → como obtenerlo.

CTA OBLIGATORIO (cada variante DEBE usar uno de estos):
- "Escribeme por DM: '[KEYWORD]'. Te respondo en 24h con [recurso concreto]."
- "Agenda una evaluacion de [X] — link en el primer comentario."
- "Comenta '[KEYWORD]' y te envio [recurso de diagnostico concreto]."
PROHIBIDO: multiples CTAs, "que opinas?", preguntas abiertas sin accion medible.`
  }

  if (funnelStage === 'mofu_solution') {
    return `Las 3 variantes deben ser FUNCIONALMENTE distintas. NO repetir diagnostico del problema.

TONO MOFU SOLUCION: El lector evalua opciones. Quiere EVIDENCIA de que funciona.
- Caso de estudio concreto con datos medibles (antes vs despues)
- Framework paso a paso que el lector pueda GUARDAR
- Comparacion tecnica viejo enfoque vs nuevo enfoque con datos
- El lector debe pensar: "esto es aplicable a mi planta, necesito explorarlo"

LONGITUD: 1800-2500 caracteres.

1. **Mecanismo** (variant: "contrarian"): Contrasta punto a punto enfoque anterior vs alternativa. Hook: declaracion que reencuadra como vemos el rendimiento.

2. **Implementacion** (variant: "story"): Caso concreto de implementacion en la practica. NO inventar escenarios. Estructura: situacion inicial → decision → proceso → resultado medible.

3. **Framework Comparativo** (variant: "data_driven"): Antes/despues con datos concretos. Optimizado para GUARDAR como referencia.

CTA OBLIGATORIO:
- "Enviame un DM con '[KEYWORD]' y te comparto [recurso especifico]."
- "Guarda este post como referencia para cuando [situacion del lector]."
- "Comenta '[KEYWORD]' y te envio [recurso concreto] sin costo."`
  }

  if (funnelStage === 'tofu_solution') {
    return `Las 3 variantes deben ser FUNCIONALMENTE distintas. NO repetir diagnostico del problema.

TONO TOFU SOLUCION: El lector conoce el problema. Ahora descubre que HAY solucion.
- Presentar la solucion como REVELACION, no como venta
- Mostrar el mecanismo de deteccion/mitigacion sin jerga comercial
- Ejemplo de implementacion real pero sin presionar
- El lector debe pensar: "ah, entonces SI se puede detectar/prevenir"

LONGITUD: 1800-2500 caracteres.

1. **Mecanismo** (variant: "contrarian"): Explica el "como funciona" tecnico. Hook: declaracion que reencuadra el problema desde la solucion.

2. **Implementacion** (variant: "story"): Escenario de implementacion. Primera persona cercana. Estructura: situacion → accion → resultado inesperado.

3. **Framework Comparativo** (variant: "data_driven"): Viejo enfoque vs nuevo con datos. Optimizado para SAVES.

CTA: Pregunta que invite a explorar la solucion o guardar el post como referencia.`
  }

  if (funnelStage === 'mofu_problem') {
    return `Las 3 variantes deben ser FUNCIONALMENTE distintas. NO mencionar la solucion.

TONO MOFU PROBLEMA: El lector YA SABE que el problema existe. Ahora quiere ENTENDER.
- PROFUNDIZAR en el mecanismo tecnico (como funciona, por que ocurre)
- Senales operacionales concretas: como se manifiesta en datos de planta?
- Trampas del monitoreo: por que el SCADA no lo ve?
- Comparacion con problemas similares (LeTID vs LID vs PID)
- MENOS narrativa sensorial, MAS PATRON RECONOCIBLE
- El lector debe pensar: "esto me puede estar pasando y no lo estoy viendo"

LONGITUD: 1500-2200 caracteres.

1. **Ingeniero Analista** (variant: "contrarian"): Usa Framework Solar Story pasos 1, 3, 5, 6, 7, 8. Mas analitico que poetico. Hook contradictorio basado en DATO, no en escena. Estructura: dato que desestabiliza → mecanismo tecnico → por que el monitoreo falla → triple leccion → pregunta especifica.

2. **Terreno Diagnostico** (variant: "story"): Narrativa de terreno CORTA enfocada en el momento de descubrimiento. No repetir el "sol quema, polvo, sudor" — enfocarse en la SEÑAL que alerto al tecnico. Hook: el hallazgo operacional, no el paisaje.

3. **Dato Comparativo** (variant: "data_driven"): Compara este problema vs otros similares con datos. LeTID vs LID vs PID. Estructura tipo tabla mental. Optimizado para SAVES.

CTA: Pregunta ESPECIFICA que invite a compartir experiencia de deteccion en planta.`
  }

  // Default: TOFU PROBLEM — primera exposicion al problema
  return `Las 3 variantes deben ser FUNCIONALMENTE distintas. NO mencionar la solucion.

TONO TOFU PROBLEMA: Primera exposicion al problema. El lector NO conoce el fenomeno.
- Gancho emocional fuerte pero sin exagerar
- UNA sola idea central, desarrollada con profundidad
- Escena de terreno vivida pero creible (sin apocalipsis)
- Terminar con curiosidad, no con miedo
- El lector debe pensar: "no sabia que esto existia, quiero saber mas"

LONGITUD: 1500-2200 caracteres.

1. **Ingeniero Poeta** (variant: "contrarian"): La variante FLAGSHIP. Sigue la receta completa de 9 pasos del Framework Solar Story. TODOS los pasos presentes. Esta es la variante que replica el estilo ganador de Jonathan.

2. **Terreno Sensorial** (variant: "story"): Enfasis en pasos 2 y 4 (humanizacion + escena sensorial). Narrativa en primera persona. El lector debe SENTIR que estuvo ahi. Hook: escena que arranca in media res. La leccion emerge de la experiencia.

3. **Dato Revelacion** (variant: "data_driven"): Enfasis en pasos 3 y 6 (escalado numerico + dato shock). Los numeros hacen el trabajo pesado. Optimizado para SAVES: lista de 3+ items guardable.

CTA: Pregunta ESPECIFICA de experiencia que democratice la conversacion.`
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
    const issue = parsed.error.issues[0]
    const path = issue?.path?.join('.') || 'unknown'
    return Response.json(
      { error: `${issue?.message ?? 'Datos invalidos'} (field: ${path})` },
      { status: 400 }
    )
  }

  // 4. Fetch active brand profile, top patterns, and golden templates
  const workspaceId = await getWorkspaceId()

  // Map funnel stage to content_type for golden template lookup
  const funnelToContentType: Record<string, string> = {
    tofu_problem: 'alcance', mofu_problem: 'alcance',
    tofu_solution: 'nutricion', mofu_solution: 'nutricion',
    bofu_conversion: 'conversion',
  }
  const contentTypeForStage = funnelToContentType[parsed.data.funnel_stage] ?? 'alcance'

  // Fetch golden templates (non-fatal if it fails)
  let goldenResult: { data: Array<{ template_content: string; content_type: string }> | null } = { data: null }
  try {
    const supabase = await createClient()
    goldenResult = await supabase
      .from('golden_templates')
      .select('template_content, content_type')
      .eq('workspace_id', workspaceId)
      .eq('content_type', contentTypeForStage)
      .eq('is_active', true)
      .limit(2)
  } catch (goldenErr) {
    console.error('[generate-copy] Golden templates fetch failed (continuing):', goldenErr)
  }

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
  // Build golden template examples section
  const goldenTemplates = goldenResult.data ?? []
  const goldenSection = goldenTemplates.length > 0
    ? `\n\n## EJEMPLOS DE POSTS GANADORES (few-shot)\nEstos posts tuvieron alto rendimiento real. Usa como referencia de estilo y estructura:\n\n${goldenTemplates.map((t, i) => `### Ejemplo ${i + 1} (${t.content_type}):\n${(t.template_content as string).slice(0, 1500)}`).join('\n\n')}`
    : ''

  // Build validator rules section (PRP-010: validator-aware generation)
  const validatorRulesSection = `\n\n${getValidatorRulesSummary()}`

  const patternSection =
    patternContext.length > 0
      ? `\n${patternContext.join('\n')}\n\nUsa estos patrones como inspiracion para generar hooks y CTAs mas efectivos.`
      : ''

  // 5. Generate with AI (text-based JSON — generateObject fails with Gemini on long prompts)
  try {
    const {
      topic, keyword, funnel_stage, day_of_week, objective, audience, context, weekly_brief,
      previous_hooks: campaignHooks, sibling_summaries, pillar_name, pillar_description,
      // PRP-012
      editorial_pillar_context, audience_angle, structure_blueprint, structure_name,
    } = parsed.data

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

    // PRP-012: Editorial pillar context (taxonomia fija Bitalize)
    const editorialPillarSection = editorial_pillar_context ? `

## PILAR EDITORIAL (Bitalize)
${editorial_pillar_context}

CRITICO: Toda la pieza debe servir al ARGUMENTO CENTRAL del pilar editorial. Si el contenido no apoya el pilar, NO lo incluyas.` : ''

    // PRP-012: Audience angle (ICP-specific)
    const audienceAngleSection = audience_angle ? `

## ANGULO POR AUDIENCIA (ICP)
${audience_angle}

CRITICO: Habla EN EL LENGUAJE Y DOLOR de esta audiencia especifica. No mezcles con otros perfiles. Si un termino tecnico no resuena con esta audiencia, traducelo o no lo uses.` : ''

    // PRP-012: Structure blueprint (post-archetype editorial)
    const structureBlueprintSection = (structure_blueprint && structure_name && structure_name !== 'default') ? `

## ESTRUCTURA EDITORIAL ASIGNADA: ${structure_name}
${structure_blueprint}

CRITICO: La pieza DEBE seguir el flujo de esta estructura editorial. Es el "molde" de este post, no opcional. Si no puedes producir un post con esta estructura por falta de input real (ej: feature_kill sin decision real), reporta el problema en \`review.warning\` en vez de inventar.` : ''

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

## RECETA "INGENIERO POETA" — FRAMEWORK SOLAR STORY (REFERENCIA)
Esta es la firma narrativa de Jonathan. Su uso depende de la variante:
- **Contrarian (Revelacion)**: Seguir los 9 pasos COMPLETOS (es la variante flagship)
- **Story (Terreno)**: Solo pasos 1, 2, 4, 7, 8 (hook, humanizacion, escena, lecciones, pregunta)
- **Data_driven (Framework)**: Solo pasos 1, 3, 6, 7, 8 (hook, escalado, dato shock, lecciones, pregunta)
- **SOLUCION y BOFU**: Usar como CONTEXTO de estilo pero NO obligatorio — cada stage tiene sus propias instrucciones

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

## REGLAS DE CREDIBILIDAD TECNICA (OBLIGATORIO)
- Usa lenguaje CONDICIONAL: "puede exceder", "hasta un X%", "en condiciones de..."
- NUNCA absolutos: no "siempre", no "todos", no "imposible", no "casi no hay recuperacion"
- Cita fuentes ESPECIFICAS: "IEA-PVPS Task 13 Report 2025", "PV Magazine", no "estudios documentados"
- LeTID afecta "modulos p-type PERC susceptibles", NO "todos los modulos PERC"
- Perdidas "pueden exceder el 10%", NO "siempre 20%"
- Recuperacion "depende del tipo de modulo y condiciones", NO "casi nula"
- Tono DIDACTICO, no alarmista. El lector debe APRENDER, no solo asustarse

## SHARE TRIGGERS (al menos 1 por variante)
- **Identity**: El lector se ve como experto al compartir ("esto lo sabe alguien que entiende de verdad el O&M")
- **Emotion**: Conecta con frustracion operativa real ("esto me pasa cada semana")
- **Utility**: Contenido guardable y accionable ("necesito tener esto a mano")

## FORMATO OPTIMIZADO PARA LINKEDIN (CRITICO — SEGUIR AL PIE DE LA LETRA)
- USA el marcador ⏎⏎ para separar cada bloque narrativo. El sistema lo convierte a saltos de linea.
- USA ⏎ (simple) para separar lineas dentro de un bloque (ej: items de lista)
- Parrafos de 1-2 lineas maximo. Cada parrafo max 280 caracteres
- Minimo 6 bloques separados por ⏎⏎ (hook, desarrollo, escena, dato, leccion, CTA)
- NO empezar con emoji
- Emojis: MAXIMO 2 por post, solo como indicadores funcionales (▪ para listas), nunca decorativos
- NO incluir links externos en el cuerpo del post
- Longitud total: 1500-2200 caracteres (zona optima para algoritmo LinkedIn)

## COMILLAS (CRITICO — REGLA DE ESPAÑOL)
- En español SOLO se usan comillas DOBLES ("texto") para citar, enfatizar o resaltar un termino.
- NUNCA uses comillas simples ('texto') como signos de citacion o enfasis. Esto es un error en español formal.
- Las comillas simples se reservan SOLO para apostrofos legitimos en palabras o nombres extranjeros (ej: d'Arc, O'Brien).
- Ejemplo INCORRECTO: trackers 'activos', numeros 'verdes', SCADA 'operativos'.
- Ejemplo CORRECTO: trackers "activos", numeros "verdes", SCADA "operativos".
- TOKENS Y KEYWORDS: si necesitas citar un keyword o token tecnico (ej: TRACKER, on/off, PR mensual), usa comillas DOBLES "TRACKER" o MAYUSCULAS sin comillas TRACKER. NUNCA 'TRACKER' ni 'on/off' ni ningun token entre comillas simples.

EJEMPLO DE FORMATO CORRECTO (usa ⏎⏎ entre bloques + comillas dobles):
"Tu planta reporta un PR aceptable. Pero un 15% de potencia se esfuma en silencio.⏎⏎El modulo PERC, ese soldado silencioso, lleva meses cediendo eficiencia.⏎⏎Lo vi en Atacama. El Asset Manager, con el cuello mojado de sudor, miraba la tablet. Los numeros "verdes" no sumaban.⏎⏎El LeTID ataca con fuerza: hasta un 20% en 2-3 anos. (Fuente: PV Magazine 2025).⏎⏎▪ El LeTID roba hasta 20% de potencia⏎▪ Temperaturas de LATAM lo aceleran⏎▪ Tu SCADA no lo detecta⏎⏎Si te ha tocado ver esta brecha entre lo proyectado y lo real, cual fue la primera pista?"

CRITICO: Sin ⏎⏎ entre bloques, el post es ILEGIBLE en movil y falla la validacion.
${funnelGuideSection}
${pillarSection}
${editorialPillarSection}
${audienceAngleSection}
${structureBlueprintSection}

## DIVERSIFICACION OBLIGATORIA
Las 3 variantes DEBEN ser FUNCIONALMENTE distintas:
- Hooks completamente diferentes (no variaciones de la misma idea)
- Estructuras narrativas diferentes (una con escena sensorial fuerte, otra con datos duros, otra con framework)
- Angulos distintos del mismo tema
- Cada variante debe activar triggers emocionales diferentes
- Si una usa pregunta retorica, otra usa escena de terreno, otra usa lista/framework

IMPORTANTE: Responde UNICAMENTE con un JSON valido, sin markdown, sin backticks, sin texto adicional.
${validatorRulesSection}${goldenSection}`

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
${sibling_summaries && sibling_summaries.length > 0 ? `
## POSTS HERMANOS EN ESTA CAMPAÑA (PROHIBIDO repetir contenido, angulos o estructura)
${sibling_summaries.map(s => `- ${s.day_of_week} (${s.funnel_stage}): "${s.content_preview.slice(0, 200)}..."`).join('\n')}

CRITICO: Tu post debe sentirse COMPLETAMENTE diferente a los hermanos listados.
- Diferente angulo narrativo
- Diferente estructura (si uno uso escena sensorial, usa datos; si uno uso datos, usa framework)
- Diferentes datos citados (no reusar el mismo %)
- Diferente apertura/hook
` : ''}
${day_of_week ? `
## ROTACION DE DATOS (dia ${day_of_week} de 5)
Cada dia de la semana debe PRIORIZAR datos de un tipo diferente:
- Dia 1 (Lunes): Datos de ESCALA (% plantas afectadas, MW totales)
- Dia 2 (Martes): Datos de MECANISMO (como funciona tecnicamente el problema)
- Dia 3 (Miercoles): Datos ECONOMICOS (USD perdidos, ROI impactado, LCOE)
- Dia 4 (Jueves): Datos de COMPARACION (antes vs despues, con vs sin, tecnologia A vs B)
- Dia 5 (Viernes): Datos de URGENCIA/TIMELINE (anos de vida util, velocidad de degradacion)
Si los datos disponibles no cubren esa prioridad, usa los que haya pero desde un ANGULO diferente al de los dias anteriores.
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
      // Attempt to repair truncated JSON from Gemini (close open brackets/braces)
      let repaired = jsonText.replace(/,\s*"[^"]*":\s*"[^"]*$/, '').replace(/,\s*"[^"]*$/, '')
      const openBrackets = (repaired.match(/\[/g) ?? []).length - (repaired.match(/\]/g) ?? []).length
      const openBraces = (repaired.match(/\{/g) ?? []).length - (repaired.match(/\}/g) ?? []).length
      repaired += ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces))
      try {
        parsed_ai = JSON.parse(repaired)
        console.warn('[generate-copy] JSON was truncated but repaired successfully')
      } catch {
        console.error('[generate-copy] Failed to parse AI JSON (even after repair). Length:', result.text.length, 'Preview:', jsonText.slice(0, 500))
        return Response.json(
          { error: 'Error al parsear la respuesta de la IA. Intenta de nuevo.' },
          { status: 500 }
        )
      }
    }

    const validated = generatedCopySchema.safeParse(parsed_ai)
    if (!validated.success) {
      const firstIssue = validated.error.issues[0]
      const issuePath = firstIssue?.path?.join('.') || 'unknown'
      const issueMsg = firstIssue?.message || 'unknown'
      console.error('[generate-copy] Zod validation failed:', JSON.stringify(validated.error.issues.slice(0, 3)))
      console.error('[generate-copy] AI response keys:', Object.keys(parsed_ai as Record<string, unknown>))
      return Response.json(
        { error: `La IA genero un formato invalido (${issuePath}: ${issueMsg}). Intenta de nuevo.` },
        { status: 500 }
      )
    }

    // 5b. Post-process: ensure paragraph breaks + strip hashtags (safety net)
    for (const variant of validated.data.variants) {
      variant.content = ensureParagraphBreaks(variant.content).replace(/#\w+/g, '').trim()
      if (variant.hook) variant.hook = variant.hook.replace(/#\w+/g, '').trim()
      if (variant.cta) variant.cta = variant.cta.replace(/#\w+/g, '').trim()
      if (variant.structured_content?.hashtags) {
        variant.structured_content.hashtags = []
      }
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
