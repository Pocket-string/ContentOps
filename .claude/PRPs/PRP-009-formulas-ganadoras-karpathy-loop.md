# PRP-009: Plan de Mejoras ContentOps — Formulas Ganadoras + Loop de Karpathy

> **Fecha**: 2026-03-30
> **Fases**: 5 secuenciales (1-2 paralelas, 3-5 secuenciales)
> **Objetivo**: Mejorar drasticamente el rendimiento de publicaciones LinkedIn generadas por la App, replicando formulas ganadoras del perfil de Jonathan y automatizando la mejora continua via el loop de Karpathy.

---

## Context

Las publicaciones generadas por ContentOps tienen rendimiento pobre en LinkedIn comparado con las publicaciones manualmente creadas por Jonathan Navarrete. El analisis revela 5 problemas raiz:

1. **Prompts genericos** — siguen reglas estandar de copywriting pero NO la receta unica "Ingeniero Poeta" de Jonathan (hook contradictorio + personificacion de componente + escena sensorial + dato de shock)
2. **Sin feedback loop** — las metricas reales de LinkedIn (impresiones, comentarios, saves, shares) no retroalimentan al sistema de generacion
3. **Sin extraccion de patrones ganadores** — la pattern library existe pero requiere curation manual; no aprende de los posts exitosos
4. **Evaluacion desconectada de realidad** — D/G/P/I scores son estimaciones AI, no correlacionadas con engagement real
5. **Carruseles infrautilizados** — 278% mas engagement que videos, pero no priorizados

**Investigacion clave**:
- Contenido AI recibe 47% MENOS alcance organico en LinkedIn
- Carruseles: 24.42% engagement promedio (mejor formato)
- Posts con historia: 38% mas engagement, 5x mas comentarios
- Hooks contra-intuitivos: +49% alcance
- Saves y comentarios sustantivos > likes para el algoritmo
- Loop de Karpathy: mejoras de 0.5% por iteracion se componen en mejoras transformacionales (11%+ despues de 100 iteraciones)

---

## Analisis de Estilo: Publicaciones Ganadoras de Jonathan Navarrete

> Fuente: `docs/Contenido/Análisis de Estilo_ Publicaciones de Jonathan Nava.md`

### Estructura Narrativa: "El Ciclo del Problema Silencioso" (5 actos)

Jonathan ha perfeccionado una estructura de 5 actos que se repite en sus posts virales:

1. **Gancho de Contradiccion** (Lineas 1-3): Paradoja que desestabiliza. Ej: "Hoy todas tus alarmas pueden estar en verde. Y aun asi, uno de tus strings podria estar perdiendo cerca de un 10% de su energia anual."
2. **Humanizacion del Componente** (Lineas 4-8): Componente tecnico se convierte en personaje con arco narrativo. Ej: "El protagonista es el diodo de derivacion. Su funcion es simple... Cuando se degrada... se vuelve un problema silencioso."
3. **Escalado de Dimension**: Conecta lo micro (un string) con lo macro (P&L del fondo) via multiplicadores numericos tangibles. Ej: "Un solo string... Demasiado pequeño para mover la aguja. Lo suficientemente grande para importar cuando empiezas a sumar."
4. **Revelacion del Metodo**: Solucion como descubrimiento compartido, no venta. Ej: "La diferencia aparece cuando dejas de mirar solo el total de la planta y comparas string contra string. Strings 'gemelos'."
5. **Llamada a Conversacion**: Pregunta de respuesta abierta. Ej: "En tu experiencia, como se manifesto primero este tipo de problema?"

### Tono: "Ingeniero Poeta"

Fusion unica de rigor tecnico + literatura de suspenso:

| Elemento | Caracteristica | Ejemplo |
|----------|---------------|---------|
| Voz narrativa | Primera persona con tension dramatica | "Lo vi con mis ojos: El operador refresco el dashboard por decima vez. El cursor temblo." |
| Ritmo | Frases cortas (3-5 palabras) para tension, oraciones largas para explicacion tecnica | "Un solo string. Uno entre cientos. Demasiado pequeño..." |
| Metaforas industriales | Lenguaje corporal a objetos inanimados | "Strings que se despegan del comportamiento del grupo" |
| Temporalidad | Marcas de tiempo para urgencia | "En 48 horas se nos fueron MWh... y nadie vio el agujero" |

### Densidad de Datos (3x superior al promedio)

- **Datos macro**: US$10.000M/ano, 278 km2, US$5.720/MW/ano
- **Datos micro**: "10-11% de perdida anual por string", "2.000 strings", "27.000 kWh menos en 3 semanas"
- **Fuentes especificas**: Raptor Maps 2025, PV Magazine, URLs cortas (bit.ly)
- **Clave**: No simplifica los datos; los HUMANIZA. Un string no es abstracto, es "uno entre cientos" con un "drama individual".

### Metricas Reales del Perfil

| Metrica | Promedio | Maximo | Minimo |
|---------|---------|--------|--------|
| Impresiones | 2,558 | 3,200 (post diodo) | 1,800 (post ETMday) |
| Reacciones | 18 | 51 (post ETMday) | 7 (post SAM) |
| Comentarios | 3.5 | 8 (post ETMday) | 1 (post perdida US$10B) |
| Shares | 2.3 | 3 (post ETMday) | 1 (post diodo) |

**Patron detectado**: Posts con narrativa de suspenso + dato macro + pregunta abierta generan **2.5x mas comentarios**.

### Triggers Emocionales (uso en 85% de posts)

| Trigger | Frecuencia | Ejemplo | Efecto |
|---------|-----------|---------|--------|
| Miedo a perdida invisible | 100% | "pierde energia en silencio" | Urgencia sin alarma |
| Paralisis por analisis | 70% | "Donde empiezo?" | Empatia con decisor |
| Culpa compartida | 60% | "nadie vio el agujero" | No culpa al lector |
| Orgullo tecnico | 50% | "la literatura tecnica recoge" | Valida expertise |
| Esperanza cuantificable | 80% | "mejoras de 1-2% en semanas" | Promesa creible |

### El Personaje del Operador (Avatar Recurrente)

Operador frente al dashboard, paralizado por sobrecarga de datos. Tres funciones:
1. **Proxy del lector**: Asset manager se ve en el operador; tecnico se siente validado
2. **Culpa compartida**: Problema = falta de herramientas, no incompetencia (abre puerta a solucion)
3. **Urgencia emocional**: "Gota de sudor" y "cursor temblando" MUESTRAN tension mejor que KPIs

### Carruseles como "Curso Acelerado" (no infografia condensada)

Estructura de 11 slides:
1. Titulo provocador + imagen del problema
2-3. Contexto macro (pilares financiero, tecnico, operativo)
4-8. Deep dive tecnico con formulas (PR, KPIs)
9-10. Trends IA/IoT + ESG
11. Pregunta de engagement + CTA

**Diferenciador**: La mayoria usa carruseles como "infografia condensada". Jonathan los usa como "curso acelerado" que fuerza al lector a pasar por cada slide para entender el cliffhanger final.

### Receta Replicable: "Framework Solar Story" (9 pasos, 250-350 palabras)

```
1. HOOK CONTRADICTORIO (15 palabras)
   "Hoy [estado ideal], pero [problema oculto]..."

2. PERSONIFICACION DEL COMPONENTE (30 palabras)
   "El protagonista es [componente]. Su mision: [funcion].
   Cuando esta bien: [normal]. Cuando falla: [dramatico]."

3. ESCALADO NUMERICO (25 palabras)
   "Un [micro] no importa. Pero [numero] de ellos = [impacto macro en $/MW]."

4. ESCENA SENSORIAL (40 palabras)
   "Lo vi: [personaje] + [accion fisica] + [detalle sensorial].
   '[dialogo interno]', penso, mientras [numero] de [componentes] pedian ayuda."

5. REVELACION DEL METODO (50 palabras)
   "La clave: [metodo tecnico granular].
   No [competencia], sino [tu enfoque diferenciado]."

6. DATO DE SHOCK CON FUENTE (20 palabras)
   "[Numero] segun [fuente] ([URL corta])."

7. TRIPLE PUNTO DE LECCION (30 palabras)
   "▪ Si no [accion], [consecuencia].
    ▪ Comparamos [pares iguales].
    ▪ Un agente que [beneficio cuantificado] cambia todo."

8. CALL TO CONVERSATION (15 palabras)
   "En tu experiencia, como [pregunta especifica]? Dejalo en comentarios."

9. HASHTAGS MIXTOS (5-7)
   2 de nicho (#StringLevel) + 2 genericos (#EnergiaSolar) + 1 de marca (#Bitalize)
```

### Checklist de Calidad Navarrete

- [ ] Hook contradice expectativa (estado ideal vs problema oculto)
- [ ] Personaje tecnico con nombre (componente, proceso, avatar)
- [ ] Escena sensorial (5 sentidos: vista, sonido, tacto, tiempo)
- [ ] Dato con fuente URL (no "estudios dicen", sino "Raptor Maps 2025")
- [ ] Pregunta final especifica (no "que piensas", sino "como lo detectaste tu?")
- [ ] Hashtags mixtos (2 nicho + 2 generico + 1 marca)

### La Receta Secreta (Conclusion del Analisis)

La viralidad de Jonathan NO viene de ser el mas tecnico ni el mas storyteller, sino de **fusionar ambos en "tension educativa"**:
1. **Tecnico**: Profundidad que solo 5% de LinkedIn puede validar (papers, numeros especificos)
2. **Storyteller**: Drama que 95% puede sentir (personajes, miedo, esperanza)
3. **Tension**: Lector entre "entiendo lo tecnico" y "me importa el drama", forzandolo a COMPARTIR (validar expertise) y COMENTAR (expresar empatia)

---

## Fase 1: LinkedIn Performance Analytics (Semana 1-2)

### Objetivo
Cerrar el feedback loop conectando metricas reales de LinkedIn a cada post, variante, hook y patron visual.

### 1.1 Migracion DB: `024_performance_analytics.sql`

Extender tabla `metrics` existente:
- `weighted_engagement_rate` numeric — calculado como: `((comments * 3 + saves * 2 + shares * 2 + reactions) / NULLIF(impressions, 0)) * 100`
- `performance_label` text — 'top_performer' | 'average' | 'underperformer' (calculado por app, NO GENERATED ALWAYS para evitar issues INSERT/UPDATE documentados en CLAUDE.md)

Crear funcion `compute_performance_percentile(workspace_id uuid)` para etiquetar posts por percentil dentro del workspace.

Crear vista `winning_posts_view` uniendo metrics + posts + post_versions + campaigns.

### 1.2 Servicio: `src/features/analytics/services/performance-analyzer.ts`

- `getWinningPosts(workspaceId, limit)` — top posts con contenido completo, hook, CTA, variante, funnel stage, metricas
- `getPerformanceByVariant(workspaceId)` — que tipo de variante (contrarian/story/data_driven) rinde mejor
- `getPerformanceByFunnelStage(workspaceId)` — que etapa del funnel genera mas engagement
- `getPerformanceByHookType(workspaceId)` — categorizar hooks y correlacionar con rendimiento
- `getAIvsRealCorrelation(workspaceId)` — correlacionar D/G/P/I scores AI con metricas reales (CRITICO para validar/invalidar el critic)

### 1.3 Dashboard extendido

Agregar paneles a `InsightsDashboard`:
- "Top 10 Posts Ganadores" con metricas reales
- "Comparacion de Variantes" bar chart
- "Tipo de Hook vs Engagement" scatter plot
- "Score AI vs Performance Real" correlacion

### Archivos criticos
- MODIFICAR: `src/features/analytics/services/analytics-service.ts`
- MODIFICAR: `src/features/insights/components/InsightsDashboard.tsx`
- CREAR: `src/features/analytics/services/performance-analyzer.ts`
- CREAR: migracion `024_performance_analytics.sql`

### Verificacion
- [ ] Weighted engagement rate calculado para cada post con metricas
- [ ] Performance labels asignados basados en percentiles del workspace
- [ ] Dashboard muestra datos reales segmentados por variante, funnel, tipo de hook
- [ ] Correlacion AI score vs metricas reales visible

---

## Fase 2: Extraccion de Formulas Ganadoras (Semana 2-3)

### Objetivo
Analizar automaticamente los posts ganadores de Jonathan (tanto generados por app como manuales) para extraer patrones concretos de copywriting y visual replicables.

### 2.1 Receta "Ingeniero Poeta" — 8 pasos

Definida en la investigacion del usuario:

1. **Hook contradictorio** (max 15 palabras) — Contradiccion que rompe asunciones
2. **Personificacion del componente** (30 palabras) — Un componente habla en primera persona o se le atribuye agencia
3. **Escalado numerico** (25 palabras) — Del componente individual al portafolio completo
4. **Escena sensorial** (40 palabras) — El lector "ve" la planta, huele el polvo, siente el calor
5. **Revelacion del metodo** (50 palabras) — Como detectar/resolver esto (sin vender)
6. **Dato de shock con fuente** (20 palabras) — Cifra verificable + fuente citada
7. **Triple punto de leccion** (30 palabras) — 3 takeaways en formato lista
8. **Llamada a conversacion** (15 palabras) — Pregunta que invite a compartir experiencia

### 2.2 Migracion DB: `025_pattern_extraction.sql`

Extender `pattern_library`:
- `recipe_step` text — paso de la receta ('hook_contradictorio', 'personificacion_componente', etc.)
- `effectiveness_score` numeric — del weighted engagement rate del post fuente
- `extracted_by` text — 'manual' | 'ai_auto'
- `source_post_content` text — texto completo del post fuente
- `content_type` text — 'alcance' | 'nutricion' | 'conversion'

Crear tabla `golden_templates`:
- `id` uuid PK, `workspace_id` uuid FK
- `content_type` text ('alcance', 'nutricion', 'conversion')
- `template_content` text (post completo como ejemplar)
- `metrics_snapshot` jsonb (metricas al momento de captura)
- `recipe_analysis` jsonb (desglose AI de la receta)
- `is_active` boolean, `created_at` timestamp

### 2.3 API: `src/app/api/ai/extract-patterns/route.ts`

Input: contenido del post + datos de metricas + funnel stage
Output:
```json
{
  "recipe_steps": [
    { "step": "hook_contradictorio", "content": "...", "word_count": 15 },
    { "step": "personificacion_componente", "content": "...", "word_count": 30 }
  ],
  "tone_markers": ["tecnico_cercano", "dato_verificable"],
  "hook_formula": "resultado_inesperado_detalle_especifico",
  "cta_style": "pregunta_experiencia_propia",
  "data_usage": { "has_specific_numbers": true, "sources_cited": 1 },
  "sensory_language_score": 0.8,
  "content_type": "alcance"
}
```

### 2.4 Servicio: `src/features/patterns/services/pattern-extractor.ts`

- `extractPatternsFromPost(postId)` — extrae patrones y guarda en pattern_library
- `buildGoldenTemplate(workspaceId, contentType)` — top 3 posts por tipo de contenido -> golden template
- `getGoldenTemplates(workspaceId, contentType)` — templates activos para inyectar en prompts

### 2.5 Auto-extraccion

Despues de guardar metricas, si el post califica como top performer, trigger automatico de extraccion de patrones. La pattern library crece organicamente.

### 2.6 Accion manual "Marcar como Golden"

En el editor de post o vista de analytics, permitir marcar cualquier post (incluyendo manuales importados) como golden template.

### Archivos criticos
- CREAR: `src/app/api/ai/extract-patterns/route.ts`
- CREAR: `src/features/patterns/services/pattern-extractor.ts`
- MODIFICAR: `src/features/patterns/services/pattern-service.ts`
- MODIFICAR: `src/features/analytics/services/analytics-service.ts` (trigger auto-extraccion)
- CREAR: migracion `025_pattern_extraction.sql`

### Verificacion
- [ ] Extraccion identifica correctamente los 8 pasos de la receta Ingeniero Poeta
- [ ] Golden templates creados automaticamente de top performers
- [ ] Pattern library crece organicamente cuando se ingresan metricas
- [ ] Posts manuales ganadores pueden importarse y analizarse

---

## Fase 3: Upgrade de Prompt Engineering (Semana 3-4)

### Objetivo
Reescribir los prompts de generacion de copy y visual para incorporar la receta Ingeniero Poeta, golden templates como few-shot examples, y el sistema Alcance/Nutricion/Conversion.

### 3.1 Reescribir system prompt en `generate-copy/route.ts`

El system prompt debe codificar el **"Framework Solar Story" de 9 pasos** documentado en el analisis de estilo (`docs/Contenido/Análisis de Estilo_ Publicaciones de Jonathan Nava.md`), incluyendo el word count target por paso y los triggers emocionales.

Cambios mayores:
- Agregar seccion `## RECETA "INGENIERO POETA" (OBLIGATORIA)` con los 9 pasos, word counts, y ejemplos del analisis de estilo
- Agregar seccion `## TRIGGERS EMOCIONALES` con los 5 triggers documentados (miedo a perdida invisible, paralisis por analisis, culpa compartida, orgullo tecnico, esperanza cuantificable) y sus frecuencias
- Agregar seccion `## EL PERSONAJE DEL OPERADOR` describiendo el avatar recurrente y sus 3 funciones (proxy del lector, culpa compartida, urgencia emocional)
- Agregar seccion `## GOLDEN TEMPLATES` inyectando 1-2 posts ganadores como few-shot examples (del golden_templates table)
- Reemplazar estructura generica "Brick by Brick" con el Framework Solar Story de 9 pasos
- Agregar instrucciones por tipo de contenido:
  - **Alcance**: SIN solucion. Termina con pregunta abierta. Destabiliza y genera curiosidad.
  - **Nutricion**: Metodo paso a paso. Solucion generica (no Bitalize). Educativo.
  - **Conversion**: ROI explicito. Formula: "Esto cuesta X, genera Y en Z meses". CTA directo.
- Reforzar instrucciones anti-deteccion-AI (47% menos alcance para contenido AI)

### 3.2 Actualizar variantes en `buildVariantInstructions()`

Para etapas problem:
1. **Ingeniero Poeta** (variant: "contrarian"): Receta completa de 8 pasos. La variante flagship.
2. **Terreno Sensorial** (variant: "story"): Enfasis en pasos 2 y 4 (personificacion + escena sensorial). Narrativa primera persona.
3. **Dato Revelacion** (variant: "data_driven"): Enfasis en pasos 3 y 6 (escalado numerico + dato de shock). Los numeros hacen el trabajo.

### 3.3 Upgrade RecipeValidator con Checklist de Calidad Navarrete

Implementar los 6 checks del "Checklist de Calidad Navarrete" del analisis de estilo como validaciones automatizadas, mas checks adicionales derivados de los 9 pasos del Framework Solar Story:

**Del Checklist Navarrete (documentado en analisis)**:
- `recipe_hook_contradicts` — Hook contradice expectativa (estado ideal vs problema oculto)
- `recipe_named_character` — Personaje tecnico con nombre (componente, proceso, avatar)
- `recipe_sensory_scene` — Escena sensorial presente (verbos: ver, tocar, sentir, escuchar, oler; sustantivos: sudor, cursor, calor, polvo, silencio)
- `recipe_sourced_data` — Dato con fuente citada (no "estudios dicen", sino "Raptor Maps 2025", URL)
- `recipe_specific_question` — Pregunta final especifica (no "que piensas", sino "como lo detectaste tu?")
- `recipe_mixed_hashtags` — Hashtags mixtos (nicho + generico + marca) — NOTA: solo si la regla de no-hashtags se desactiva

**Del Framework Solar Story (pasos)**:
- `recipe_escalado_numerico` — Contiene al menos 2 numeros especificos (no redondos) que escalan de micro a macro
- `recipe_triple_lesson` — Contiene lista de 3 items o framework guardable
- `recipe_personification` — Lenguaje atribuyendo agencia a componente/sistema (patron: "[componente] que [verbo humano]")

### 3.4 Upgrade CopyCritic

Agregar nueva dimension al rubric: **"Recipe Compliance (R, 0-5)"**
- Total: D/G/P/I/R = 0-25 (antes 0-20)
- Nuevo finding category: `recipe_violation`
- Inyectar golden templates en el prompt del critic para que sepa como se ve "bueno"

### 3.5 Upgrade visual generation para carruseles recipe-mapped

Para posts carousel, mapear pasos de la receta a slides:
- Slide 1: Hook contradictorio (visual impactante)
- Slides 2-3: Personificacion + escalado (infografia tecnica)
- Slide 4: Escena sensorial (foto editorial)
- Slides 5-6: Revelacion + dato de shock (data viz)
- Slide 7: Triple leccion (checklist visual)
- Slide 8: CTA (brand card con pregunta)

### Archivos criticos
- MODIFICAR: `src/app/api/ai/generate-copy/route.ts` (reescritura mayor del system prompt)
- MODIFICAR: `src/features/prompts/templates/copy-template.ts` (framework receta)
- MODIFICAR: `src/features/posts/components/RecipeValidator.tsx` (nuevos checks)
- MODIFICAR: `src/app/api/ai/critic-copy/route.ts` (dimension R + recipe compliance)
- MODIFICAR: `src/app/api/ai/generate-visual-json/route.ts` (recipe-to-carousel mapping)
- MODIFICAR: `src/shared/types/content-ops.ts` (schema score 0-25, variantes)

### Verificacion
- [ ] Posts generados siguen la receta de 8 pasos
- [ ] RecipeValidator reporta cumplimiento de receta (nuevos checks)
- [ ] CopyCritic puntua dimension R
- [ ] Golden templates inyectados como few-shot examples
- [ ] Carruseles mapean pasos de receta a slides
- [ ] `pnpm exec tsc --noEmit` = 0 errores

---

## Fase 4: Loop de Karpathy — Autoresearch para Prompts (Semana 4-6)

### Objetivo
Implementar un loop de optimizacion automatizada de prompts que mejora continuamente la calidad del copy basandose en metricas reales de LinkedIn, siguiendo el patron Karpathy autoresearch.

### 4.1 Arquitectura del Loop

Basado en la investigacion del repo `karpathy/autoresearch`:

```
3 componentes fundamentales:

1. ARCHIVO MODIFICABLE (prompt_versions table)
   → El system prompt de generacion de copy
   → UNICO elemento que el agente puede editar
   → Versionado en DB para rollback y A/B testing

2. HARNESS DE EVALUACION (binary evals inmutables)
   → 6 evaluaciones binarias derivadas de metricas REALES
   → El agente NO puede modificar los criterios
   → Previene gaming

3. INSTRUCCIONES (constraints del agente)
   → Que puede/no puede cambiar
   → Criterio de parada
   → Una mutacion por iteracion (aislamiento de variables)
```

### 4.2 Evaluaciones Binarias (el harness)

6 evals, todas derivadas de metricas reales de LinkedIn:

1. El post obtuvo impresiones por encima de la mediana del workspace? (si/no)
2. El post obtuvo al menos 1 comentario sustantivo? (si/no)
3. El post obtuvo al menos 1 save? (si/no)
4. El weighted engagement rate esta por encima de la mediana? (si/no)
5. El post sigue la receta Ingeniero Poeta? (si/no — del RecipeValidator)
6. El AI critic score >= 20/25? (si/no)

Score = % de evals pasadas (0-100%)

### 4.3 Migracion DB: `026_prompt_optimization.sql`

Crear `prompt_versions`:
- `id` uuid PK, `workspace_id` uuid FK
- `prompt_type` text ('copy_system', 'visual_system', etc.)
- `version` integer, `content` text (prompt completo)
- `is_active` boolean, `performance_score` numeric
- `posts_generated` integer, `created_at` timestamp

Crear `prompt_optimization_log`:
- `id` uuid PK, `workspace_id` uuid FK
- `iteration` integer, `prompt_version_id` uuid FK
- `hypothesis` text, `change_description` text
- `eval_results` jsonb, `score` numeric, `previous_score` numeric
- `status` text ('keep', 'discard', 'baseline')
- `created_at` timestamp

Crear `post_prompt_version` (junction):
- `post_id` uuid FK, `prompt_version_id` uuid FK

### 4.4 Servicio: `src/features/prompts/services/prompt-version-service.ts`

- `getActivePrompt(workspaceId, promptType)` — prompt activo; fallback a hardcoded default
- `createPromptVersion(workspaceId, promptType, content, hypothesis)` — nueva version
- `activatePromptVersion(versionId)` — activa y desactiva anterior
- `recordPostGeneration(postId, promptVersionId)` — registra junction
- `getPromptPerformance(versionId)` — computa binary eval score

### 4.5 Modificar `generate-copy/route.ts` para prompts versionados

```typescript
const activePrompt = await getActivePrompt(workspaceId, 'copy_system')
const systemPrompt = activePrompt?.content ?? buildDefaultSystemPrompt(...)
// ... genera copy ...
await recordPostGeneration(postId, activePrompt.id)
```

### 4.6 API: `src/app/api/ai/mutate-prompt/route.ts`

Input: prompt actual + datos de performance + historial de optimizacion
Output: prompt mutado con exactamente UN cambio + hipotesis

Reglas de mutacion:
- Analizar que binary evals fallan mas
- Mirar los posts de menor rendimiento generados por esta version
- Proponer EXACTAMENTE un cambio
- NUNCA agregar texto de criterios de evaluacion al prompt (anti-gaming)
- Preferir eliminar complejidad sobre agregar

### 4.7 Servicio: `src/features/prompts/services/prompt-optimizer.ts`

El loop central:
```
runOptimizationCycle(workspaceId):
  1. Obtener prompt activo + su performance
  2. Si performance < target → llamar mutate-prompt API
  3. Crear nueva version de prompt
  4. Activarla para los proximos N posts
  5. Despues de N posts con metricas → computar eval score
  6. Si mejor: KEEP. Si peor: REVERT a version anterior.
  7. Registrar resultado en optimization_log
```

Diseñado para ejecutarse on-demand (manual o via cron), NO continuamente. Cada ciclo requiere suficientes posts publicados con metricas.

### 4.8 Dashboard de Optimizacion

Nueva ruta `/settings/prompt-optimization`:
- Version actual del prompt + score
- Timeline del log de optimizacion
- Que cambios mejoraron vs degradaron performance
- Trigger manual para ciclo de optimizacion
- Capacidad de ver/revertir cualquier version de prompt

### Archivos criticos
- MODIFICAR: `src/app/api/ai/generate-copy/route.ts` (prompts versionados)
- CREAR: `src/features/prompts/services/prompt-version-service.ts`
- CREAR: `src/features/prompts/services/prompt-optimizer.ts`
- CREAR: `src/app/api/ai/mutate-prompt/route.ts`
- CREAR: migracion `026_prompt_optimization.sql`
- CREAR: `src/app/(main)/settings/prompt-optimization/page.tsx`

### Verificacion
- [ ] Versiones de prompt almacenadas y rastreadas en DB
- [ ] Cada post generado vinculado a su version de prompt
- [ ] Binary evals computan correctamente de metricas reales
- [ ] Sistema de mutacion propone cambios validos y unitarios
- [ ] Logica keep/discard funciona correctamente
- [ ] Dashboard muestra historial de optimizacion

---

## Fase 5: Pipeline Agentico Mejorado (Semana 6-8)

### Objetivo
Enhancer el pipeline existente para incluir generacion performance-aware, iteracion automatizada, y A/B testing.

### 5.1 Nuevas herramientas del orquestador

En `specialist-tools.ts`:
- `analyzePerformance(campaignId)` — analiza rendimiento, identifica ganadores/perdedores, extrae patrones
- `triggerPromptOptimization(workspaceId)` — inicia ciclo de optimizacion
- `getGoldenTemplateForContentType(workspaceId, contentType)` — retorna mejor golden template

### 5.2 Pipeline flow mejorado

```
ANTES: Research -> Topic -> Campaign -> Copy -> Visual -> Review -> Complete

AHORA: Research -> Topic -> Campaign -> Golden Template Retrieval ->
       Copy (con prompt versionado + golden templates) ->
       Recipe Validation (auto) -> Visual (recipe-mapped carousel) ->
       CopyCritic (mejorado) -> Review -> Performance Tracking ->
       Complete -> [Despues de metricas] Auto-Extract Patterns ->
       Trigger Optimization
```

### 5.3 Framework de A/B Testing

Migracion `027_ab_testing.sql`:

Crear `ab_test_experiments`:
- `id` uuid PK, `workspace_id` uuid FK
- `name` text
- `prompt_version_a` uuid FK, `prompt_version_b` uuid FK
- `status` text ('running', 'complete', 'cancelled')
- `winner` text ('a', 'b', 'tie')
- `results_json` jsonb
- `created_at`, `completed_at` timestamps

Cuando un A/B test esta corriendo, el sistema alterna entre versiones de prompt para posts consecutivos y etiqueta cada post con su grupo experimental.

Minimo 10 posts por variante antes de evaluar (dado el volumen bajo de 3-5 posts/semana, los tests corren por varias semanas).

### 5.4 Dashboard de mejora continua

Extender insights o crear pagina "Optimizacion":
- Timeline de versiones de prompt con scores
- Resultados de A/B tests
- Crecimiento de pattern library
- Tendencias de cumplimiento de receta
- Engagement real vs score AI critic a lo largo del tiempo
- Resumen "Que mejora" / "Que empeora"

### Archivos criticos
- MODIFICAR: `src/features/orchestrator/tools/specialist-tools.ts`
- MODIFICAR: `src/shared/types/content-ops.ts` (nuevos stages pipeline, tipos AB test)
- MODIFICAR: `src/features/insights/components/InsightsDashboard.tsx`
- CREAR: migracion `027_ab_testing.sql`
- CREAR: `src/features/prompts/services/ab-test-service.ts`

### Verificacion
- [ ] Pipeline automaticamente recupera golden templates antes de generar
- [ ] Recipe validation corre automaticamente despues de copy generation
- [ ] Performance tracking trigger extraccion de patrones para top performers
- [ ] A/B testing divide correctamente trafico entre versiones de prompt
- [ ] Dashboard visualiza el loop de mejora continua

---

## Orden de Ejecucion

```
Fase 1 (Analytics) ──────┐
                          ├──→ Fase 3 (Prompts) → Fase 4 (Karpathy Loop) → Fase 5 (Pipeline)
Fase 2 (Extraccion) ─────┘
```

Fases 1-2 son semi-independientes (Fase 2 depende de labels de Fase 1).
Fase 3 depende de Fase 2 (golden templates para few-shot injection).
Fase 4 depende de Fases 1+3 (binary evals de metricas reales + prompts upgradeados como baseline).
Fase 5 integra todo.

---

## Riesgos y Mitigaciones

1. **Datos insuficientes para binary evals** — Mitigation: Usar D/G/P/I AI scores como proxy hasta acumular 20+ posts con metricas reales.
2. **Over-fitting al estilo pasado de Jonathan** — Golden templates rotan; templates viejos se depriorizan. El sistema de mutacion nunca copia criterios de eval al prompt.
3. **generateObject falla con Gemini en prompts largos** — Continuar usando `generateText` + JSON parse manual + Zod validation (documentado en CLAUDE.md).
4. **Migracion de prompt versions rompe funcionalidad** — Fallback a prompt hardcoded cuando no existe version activa. Sistema funciona identico a hoy hasta el primer ciclo de optimizacion.
5. **A/B testing con volumen bajo (3-5 posts/semana)** — Tests corren por varias semanas. Minimo 10 posts por variante antes de evaluar.

---

## Tabla Resumen de Archivos

| Archivo | Fase | Accion |
|---------|------|--------|
| `src/features/analytics/services/performance-analyzer.ts` | 1 | CREAR |
| `src/features/analytics/services/analytics-service.ts` | 1,2 | MODIFICAR |
| `src/features/insights/components/InsightsDashboard.tsx` | 1,5 | MODIFICAR |
| migracion `024_performance_analytics.sql` | 1 | CREAR |
| `src/app/api/ai/extract-patterns/route.ts` | 2 | CREAR |
| `src/features/patterns/services/pattern-extractor.ts` | 2 | CREAR |
| `src/features/patterns/services/pattern-service.ts` | 2 | MODIFICAR |
| migracion `025_pattern_extraction.sql` | 2 | CREAR |
| `src/app/api/ai/generate-copy/route.ts` | 3,4 | MODIFICAR (reescritura mayor) |
| `src/features/prompts/templates/copy-template.ts` | 3 | MODIFICAR |
| `src/features/posts/components/RecipeValidator.tsx` | 3 | MODIFICAR |
| `src/app/api/ai/critic-copy/route.ts` | 3 | MODIFICAR |
| `src/app/api/ai/generate-visual-json/route.ts` | 3 | MODIFICAR |
| `src/shared/types/content-ops.ts` | 3,5 | MODIFICAR |
| `src/features/prompts/services/prompt-version-service.ts` | 4 | CREAR |
| `src/features/prompts/services/prompt-optimizer.ts` | 4 | CREAR |
| `src/app/api/ai/mutate-prompt/route.ts` | 4 | CREAR |
| migracion `026_prompt_optimization.sql` | 4 | CREAR |
| `src/app/(main)/settings/prompt-optimization/page.tsx` | 4 | CREAR |
| `src/features/orchestrator/tools/specialist-tools.ts` | 5 | MODIFICAR |
| migracion `027_ab_testing.sql` | 5 | CREAR |
| `src/features/prompts/services/ab-test-service.ts` | 5 | CREAR |

---

## Gotchas (Auto-Blindaje)

- `generateText` siempre (nunca `generateObject`) para prompts largos con Gemini
- Zod `.nullable().optional()` para inputs de API
- Prompt versioning fallback a hardcoded default si no hay version activa
- Max 2 auto-regeneration attempts por post (evitar loops infinitos)
- Binary evals son INMUTABLES — el agente de optimizacion NO puede modificarlas
- Una mutacion por iteracion (aislamiento de variables, principio Karpathy)
- Golden templates rotan para evitar over-fitting
- A/B tests: minimo 10 posts por variante antes de declarar ganador
- `maxDuration = 120` en endpoints combinados
