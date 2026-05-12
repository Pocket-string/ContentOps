# Sistema AI -- LinkedIn ContentOps

> Gemini 2.5 Flash (primario) + GPT-4o-mini (reviewer) + OpenRouter (fallback)

Referencia completa del sistema de inteligencia artificial de ContentOps. Cubre arquitectura, modelos, endpoints, patrones de desarrollo y quirks conocidos.

---

## 1. Arquitectura

```
                                    +------------------+
                                    |   Brand Profile  |
                                    |   + Patterns DB  |
                                    +--------+---------+
                                             |
                                    (contexto paralelo)
                                             |
+----------+     +-----------+     +---------v---------+     +------------------+
|  Usuario |---->| API Route |---->|    Rate Limiter    |---->|    ai-router     |
| (client) |     | (Next.js) |     | (in-memory, /user)|     | getModel(task)   |
+----------+     +-----------+     +-------------------+     +--------+---------+
                                                                       |
                                                              +--------v---------+
                                                              |  Gemini 2.5 Flash |
                                                              |  (primario)       |
                                                              +--------+---------+
                                                                       |
                                                            falla?     |   exito
                                                          +----+-------+-------+
                                                          |                    |
                                                 +--------v---------+  +------v-----------+
                                                 |   OpenRouter     |  | GPT-4o-mini      |
                                                 |   (fallback)     |  | (reviewer, opt.) |
                                                 +------------------+  +------+------------+
                                                                              |
                                                                     +--------v---------+
                                                                     |   JSON Response   |
                                                                     | { data, review? } |
                                                                     +------------------+
```

**Flujo resumido:**

1. El cliente envia un request a un API Route de Next.js (`/api/ai/*` o `/api/chat`).
2. El route ejecuta `requireAuth()` y el rate limiter correspondiente.
3. Valida el input con Zod (falla rapido si los datos son invalidos).
4. Fetch paralelo de contexto: brand profile activo y patrones exitosos del workspace.
5. Llama al modelo primario (Gemini 2.5 Flash) via `ai-router`.
6. Si Gemini falla, `generateObjectWithFallback` intenta OpenRouter como fallback.
7. Opcionalmente, envia el resultado a GPT-4o-mini para una segunda opinion (review).
8. Retorna `{ data, review? }` al cliente.

---

## 2. Modelos en Uso

| Modelo | ID | Provider | SDK | Rol | Rate Limit |
|--------|----|----------|-----|-----|------------|
| Gemini 2.5 Flash | `gemini-2.5-flash` | Google AI | `@ai-sdk/google` | Generacion de texto: copy, critic, iterate, synthesis, visual JSON, visual concepts, orchestrator | Segun endpoint (ver seccion 5) |
| Gemini 2.5 Flash Image | `gemini-2.5-flash-image` | Google AI | `@ai-sdk/google` (`.image()`) | Generacion de imagenes (default) | 10 req/min (`aiRateLimiter`) |
| Gemini 3 Pro Image Preview | `gemini-3-pro-image-preview` | Google AI | `@ai-sdk/google` (`.image()`) | Generacion de imagenes (calidad superior) | 10 req/min (`aiRateLimiter`) |
| GPT-4o-mini | `gpt-4o-mini` | OpenAI | `@ai-sdk/openai` | Reviewer de copy y visual JSON (segunda opinion) | N/A (no tiene rate limiter propio) |
| Gemini 2.5 Flash (OpenRouter) | `google/gemini-2.5-flash` | OpenRouter | `@ai-sdk/openai` (baseURL custom) | Fallback cuando Gemini directo falla | Hereda del endpoint que lo invoca |

### Archivos de configuracion de providers

| Archivo | Exporta | Env var requerida |
|---------|---------|-------------------|
| `src/shared/lib/gemini.ts` | `google`, `GEMINI_MODEL`, `GEMINI_IMAGE_MODEL`, `GEMINI_IMAGE_MODEL_PRO` | `GOOGLE_AI_API_KEY` |
| `src/shared/lib/openai-client.ts` | `openai`, `OPENAI_REVIEW_MODEL` | `OPENAI_API_KEY` (opcional) |
| `src/shared/lib/openrouter.ts` | `openrouter`, `OPENROUTER_GEMINI_MODEL` | `OPENROUTER_API_KEY` (opcional) |

---

## 3. AI Router (`ai-router.ts`)

**Ubicacion:** `src/shared/lib/ai-router.ts`

### `getModel(task: AITask): LanguageModel`

Retorna el modelo primario para cualquier tarea AI. Actualmente todas las tareas usan el mismo modelo: `google(GEMINI_MODEL)` (Gemini 2.5 Flash).

```typescript
type AITask =
  | 'generate-copy'
  | 'critic-copy'
  | 'iterate'
  | 'synthesize-research'
  | 'generate-visual-concepts'
  | 'generate-visual-json'
  | 'critic-visual'
  | 'iterate-visual'
  | 'generate-image'
  | 'orchestrator'
```

El parametro `task` existe para permitir routing futuro por tarea (ej. usar un modelo mas grande para critic), pero hoy todas resuelven al mismo modelo.

### `generateObjectWithFallback<T>(options): Promise<GenerateObjectResult<T>>`

Wrapper sobre `generateObject` del Vercel AI SDK con fallback automatico:

1. Intenta Gemini directo (`google(GEMINI_MODEL)`).
2. Si falla, verifica si `OPENROUTER_API_KEY` esta configurada.
3. Si esta disponible, reintenta con `openrouter(OPENROUTER_GEMINI_MODEL)`.
4. Si el fallback tambien falla, lanza el error original de Gemini.

```typescript
generateObjectWithFallback({
  task: 'generate-visual-concepts',
  schema: conceptOutputSchema,     // Zod schema
  system: '...',                    // System prompt
  prompt: '...',                    // User prompt
})
```

### Por que `generateText` + JSON parse en vez de `generateObject`

**Aprendizaje critico:** Gemini 2.5 Flash **falla consistentemente** con `generateObject` cuando el input (system + user prompt) supera ~5000 caracteres. El error es un rechazo silencioso o un timeout.

**Solucion adoptada en la mayoria de endpoints:**

1. Usar `generateText()` con instruccion en el system prompt: "Responde UNICAMENTE con un JSON valido, sin markdown, sin backticks."
2. Limpiar la respuesta: strip markdown fences, encontrar el objeto JSON con regex.
3. `JSON.parse()` el texto limpio.
4. Validar con Zod `.safeParse()`.

Los endpoints que usan `generateObjectWithFallback` (visual concepts, visual JSON, critic visual, iterate visual) lo hacen porque sus inputs son mas cortos y predecibles. Los endpoints de copy, critic-copy, iterate y synthesis usan el patron `generateText` + manual parse.

---

## 4. AI Reviewer (`ai-reviewer.ts`)

**Ubicacion:** `src/shared/lib/ai-reviewer.ts`

Sistema de segunda opinion usando GPT-4o-mini. Es **completamente opcional** -- si `OPENAI_API_KEY` no esta configurada, las funciones retornan `null` sin error.

### `reviewCopy(content, variant, funnelStage): Promise<CopyReview | null>`

Envia el contenido de la primera variante generada a GPT-4o-mini para evaluacion.

**Output (`CopyReview`):**

```typescript
{
  overall_score: number       // 0-10
  strengths: string[]         // max 3
  weaknesses: string[]        // max 3
  recommendation: 'publish' | 'minor_edits' | 'major_rewrite'
  one_line_summary: string
}
```

**Usado por:** `POST /api/ai/generate-copy`

### `reviewVisualJson(promptJson, postContent): Promise<VisualReview | null>`

Revisa la coherencia del JSON visual generado contra el contenido del post.

**Output (`VisualReview`):**

```typescript
{
  coherence_score: number     // 0-10
  brand_alignment: 'strong' | 'adequate' | 'weak'
  issues: string[]            // max 3
  recommendation: 'ready' | 'needs_adjustments' | 'rebuild'
  one_line_summary: string
}
```

**Usado por:** `POST /api/ai/generate-visual-json`

### Comportamiento ante fallos

Ambas funciones estan envueltas en try/catch. Si GPT-4o-mini falla o no responde, retornan `null` y loguean un warning. El endpoint principal sigue funcionando sin la review.

---

## 5. Endpoints AI (tabla completa)

La app expone 12 endpoints AI, organizados en 4 categorias: Copy, Visual, Research y Orchestrator.

### Copy Pipeline

| Ruta | Input (campos principales) | Output | Rate Limit | Modelo | Patron |
|------|---------------------------|--------|------------|--------|--------|
| `POST /api/ai/generate-copy` | `topic`, `keyword?`, `funnel_stage`, `objective?`, `audience?`, `context?`, `weekly_brief?` | `{ data: { variants[3] }, review? }` | 10 req/min (`aiRateLimiter`) | Gemini 2.5 Flash | `generateText` + JSON parse |
| `POST /api/ai/critic-copy` | `variants[]` (variant + content), `funnel_stage`, `weekly_brief?`, `keyword?`, `topic?`, `context?` | `{ data: { evaluations[], recommended_variant, recommendation_reason } }` | 10 req/min (`aiRateLimiter`) | Gemini 2.5 Flash | `generateText` + JSON parse |
| `POST /api/ai/iterate` | `current_content`, `feedback`, `variant`, `score?` | `{ data: { content, hook, cta, changes_made[] } }` | 10 req/min (`aiRateLimiter`) | Gemini 2.5 Flash | `generateText` + JSON parse |

### Visual Pipeline

| Ruta | Input (campos principales) | Output | Rate Limit | Modelo | Patron |
|------|---------------------------|--------|------------|--------|--------|
| `POST /api/ai/generate-visual-concepts` | `post_content`, `funnel_stage`, `topic?`, `keyword?`, `weekly_brief?` | `{ data: { concepts[3] } }` | 10 req/min (`aiRateLimiter`) | Gemini 2.5 Flash | `generateObjectWithFallback` |
| `POST /api/ai/generate-visual-json` | `post_content`, `funnel_stage`, `format`, `topic?`, `keyword?`, `additional_instructions?`, `weekly_brief?` | `{ data: VisualPromptJson, review? }` | 10 req/min (`aiRateLimiter`) | Gemini 2.5 Flash | `generateObjectWithFallback` |
| `POST /api/ai/critic-visual` | `prompt_json`, `post_content`, `concept_type?`, `format` | `{ data: { findings[], suggestions[], mobile_readability, brand_consistency, verdict } }` | 10 req/min (`aiRateLimiter`) | Gemini 2.5 Flash | `generateObjectWithFallback` |
| `POST /api/ai/iterate-visual` | `current_prompt_json`, `feedback` | `{ data: { prompt: VisualPromptJson, changes_made[] } }` | 10 req/min (`aiRateLimiter`) | Gemini 2.5 Flash | `generateObjectWithFallback` |
| `POST /api/ai/generate-image` | `visual_version_id`, `prompt_json`, `format` (1:1/4:5/16:9/9:16), `model_id?` | `{ data: { image_url, model_id } }` | 10 req/min (`aiRateLimiter`) | Gemini 2.5 Flash Image o Gemini 3 Pro Image | `generateImage` |
| `POST /api/ai/generate-carousel` | `visual_version_id`, `slide` (id, slide_index, headline?, body_text?, prompt_json), `topic`, `total_slides`, `model_id?` | `{ data: { slide_index, image_url, model_id } }` | 10 req/min (`aiRateLimiter`) | Gemini 2.5 Flash Image o Gemini 3 Pro Image | `generateImage` |

### Research Pipeline

| Ruta | Input (campos principales) | Output | Rate Limit | Modelo | Patron |
|------|---------------------------|--------|------------|--------|--------|
| `POST /api/ai/synthesize-research` | `research_id`, `raw_text`, `key_takeaways[]`, `title?`, `market_region?`, `buyer_persona?` | `{ data: { summary, bullets[] } }` | 10 req/min (`aiRateLimiter`) | Gemini 2.5 Flash | `generateText` + JSON parse |
| `POST /api/research/grounded-research` | `tema`, `buyer_persona?`, `region?`, `research_id?` | `{ data: { summary, key_findings[], suggested_topics[], market_context? }, research_id? }` | 3 req/min (`researchRateLimiter`) | Gemini 2.5 Flash + Google Search | 2 pasos (ver seccion 8) |

### Orchestrator

| Ruta | Input (campos principales) | Output | Rate Limit | Modelo | Patron |
|------|---------------------------|--------|------------|--------|--------|
| `POST /api/chat` | `message`, `context` (module, path, IDs), `history[]`, `sessionId?` | Streaming text (tool calls embebidos) | 30 req/min (`chatRateLimiter`) | Gemini 2.5 Flash | `streamText` + tool calling |

### Rate Limiters definidos

Todos en `src/lib/rate-limit.ts`, usando un store in-memory con cleanup cada 5 minutos:

| Instancia | Max Requests | Ventana | Endpoints que la usan |
|-----------|-------------|---------|----------------------|
| `aiRateLimiter` | 10 | 60s | Todos los `/api/ai/*` |
| `researchRateLimiter` | 3 | 60s | `/api/research/grounded-research` |
| `chatRateLimiter` | 30 | 60s | `/api/chat` |
| `imageRateLimiter` | 5 | 60s | (reservado, no asignado actualmente) |
| `exportRateLimiter` | 5 | 60s | Endpoints de exportacion |

---

## 6. Patron Comun de Endpoint AI

Todos los endpoints AI siguen un patron de 6 pasos. Ejemplo de referencia: `POST /api/ai/generate-copy`.

### Paso 1: Auth + Rate Limit

```typescript
const user = await requireAuth()                    // Lanza 401 si no autenticado

const rateLimitResult = aiRateLimiter.check(user.id) // Por user ID
if (!rateLimitResult.success) {
  return Response.json({ error: '...' }, { status: 429 })
}
```

### Paso 2: Zod Input Validation

```typescript
let body: unknown
try {
  body = await request.json()
} catch {
  return Response.json({ error: 'Cuerpo invalido' }, { status: 400 })
}

const parsed = inputSchema.safeParse(body)
if (!parsed.success) {
  return Response.json(
    { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
    { status: 400 }
  )
}
```

### Paso 3: Fetch Contexto Paralelo

```typescript
const workspaceId = await getWorkspaceId()
const [brandResult, hookPatterns, ctaPatterns] = await Promise.all([
  getActiveBrandProfile(workspaceId),
  getTopPatterns(workspaceId, 'hook', parsed.data.funnel_stage, 5),
  getTopPatterns(workspaceId, 'cta', undefined, 5),
])
```

No todos los endpoints necesitan los 3 fetches. `generate-copy` y `generate-visual-json` usan brand profile y patterns. Los demas solo usan los datos del input.

### Paso 4: AI Call

**Variante A -- `generateText` + JSON parse (copy, critic-copy, iterate, synthesize):**

```typescript
const result = await generateText({
  model: getModel('generate-copy'),
  system: systemPrompt,   // Incluye "Responde UNICAMENTE con JSON valido"
  prompt: userPrompt,
})

// Limpiar markdown fences
let jsonText = result.text.trim()
if (jsonText.startsWith('```')) {
  jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
}

// Parse + validar
const parsed_ai = JSON.parse(jsonText)
const validated = outputSchema.safeParse(parsed_ai)
```

**Variante B -- `generateObjectWithFallback` (visual concepts, visual JSON, critic visual, iterate visual):**

```typescript
const result = await generateObjectWithFallback({
  task: 'generate-visual-json',
  schema: visualPromptSchema,
  system: systemPrompt,
  prompt: userPrompt,
})
// result.object ya viene tipado y validado
```

**Variante C -- `generateImage` (generate-image, generate-carousel):**

```typescript
const result = await generateImage({
  model: google.image(model_id),    // gemini-2.5-flash-image o gemini-3-pro-image-preview
  prompt: textPrompt,
  aspectRatio,                       // '1:1', '3:4', '16:9', '9:16'
  providerOptions: {
    google: { personGeneration: 'allow_adult' },
  },
})
```

**Variante D -- `streamText` (orchestrator/chat):**

```typescript
const result = streamText({
  model: getModel('orchestrator'),
  system: systemPrompt,
  messages,
  tools: specialistTools,
  stopWhen: stepCountIs(3),
})
return result.toTextStreamResponse()
```

### Paso 5: Reviewer Opcional

Solo `generate-copy` y `generate-visual-json` invocan al reviewer:

```typescript
// Copy review (primera variante solamente)
const review = await reviewCopy(firstVariant.content, firstVariant.variant, funnelStage)

// Visual review
const review = await reviewVisualJson(result.object, postContent)
```

### Paso 6: Response

```typescript
return Response.json({ data: validated.data, review })
```

En caso de error, todos los endpoints siguen el mismo patron:

```typescript
return Response.json(
  { error: 'Mensaje descriptivo para el usuario.' },
  { status: 500 }
)
```

---

## 7. Orchestrator (Sistema de Chat)

### Vista General

El orchestrator es un asistente conversacional integrado en la app que guia al usuario por todo el flujo de content operations: research, topics, campaigns, posts y visuals.

### ChatWidget

- Boton flotante posicionado en `bottom-right`, con `z-50`
- Presente en todas las paginas autenticadas
- Store Zustand: `src/features/orchestrator/store/chat-store.ts`
- Historial: ultimos 10 mensajes enviados al modelo (eficiencia de tokens)

### API

- **Ruta:** `POST /api/chat`
- **Streaming:** via `streamText()` del Vercel AI SDK, retorna `result.toTextStreamResponse()`
- **Rate limit:** 30 req/min por usuario (`chatRateLimiter`)
- **Modelo:** Gemini 2.5 Flash (via `getModel('orchestrator')`)

### Context-Aware

El chat auto-detecta el contexto del usuario desde el pathname:

```typescript
// Input del client
{
  message: "...",
  context: {
    module: "campaigns",           // Auto-detectado del pathname
    path: "/campaigns/abc-123",
    campaignId?: "abc-123",        // Extraido del URL
    postId?: "...",
    topicId?: "...",
    researchId?: "...",
    dayOfWeek?: 3,
    funnelStage?: "tofu_solution"
  },
  history: [...],                   // Ultimos mensajes (max 10)
  sessionId?: "..."
}
```

### 9 Specialist Tools

Definidos en `src/features/orchestrator/tools/specialist-tools.ts`. El modelo puede invocarlos via function calling de Gemini.

| # | Tool | Descripcion |
|---|------|-------------|
| 1 | `getCampaignStatus` | Obtiene estado de una campana: posts generados, scores D/G/P/I, estado de cada dia |
| 2 | `getPostContent` | Obtiene contenido de un post especifico con sus variantes y scores |
| 3 | `getResearchSummary` | Obtiene resumen de una investigacion con hallazgos clave y fit score |
| 4 | `getTopicDetails` | Detalles completos de un tema: hipotesis, evidencia, senales, enemigo silencioso |
| 5 | `listRecentCampaigns` | Lista campanas recientes del workspace (configurable, default 5) |
| 6 | `getTopPatterns` | Patrones exitosos del workspace (hooks, CTAs, content_structure) |
| 7 | `suggestNavigation` | Sugiere al usuario navegar a otra pagina de la app |
| 8 | `recordLearning` | Registra un aprendizaje o insight del usuario en `orchestrator_learnings` |
| 9 | `runGroundedResearch` | Ejecuta investigacion con Gemini + Google Search, guarda resultado en BD |

### Limites de ejecucion

- **Max 3 tool calls por turno:** `stopWhen: stepCountIs(3)`
- Cada tool call se registra en la tabla `orchestrator_actions` (fire-and-forget via `onStepFinish`)

### Session Persistence

- Tabla: `orchestrator_sessions`
- Ventana activa: 24 horas
- Learnings: tabla `orchestrator_learnings` con tipos de feedback: `positive`, `negative`, `refinement`
- Los ultimos 5 learnings del workspace se inyectan en el system prompt del orchestrator

### System Prompt

El orchestrator recibe un system prompt extenso que incluye:

- Rol y contexto del dominio (O&M fotovoltaico)
- Conceptos clave: Keyword CTA, Funnel Stages (5 dias), Metodologia D/G/P/I, 3 Variantes, Weekly Brief
- Descripcion de herramientas disponibles clasificadas en Acciones, Consultas y Utilidades
- Reglas criticas: nunca inventar datos, usar herramientas para consultar datos reales
- Learnings del workspace (dinamico)
- Contexto actual (modulo, IDs detectados)

---

## 8. Grounded Research

### Endpoint

`POST /api/research/grounded-research`

### Rate Limit

3 req/min por usuario (`researchRateLimiter`) -- el mas restrictivo de toda la app porque implica llamadas a Google Search.

### Flujo de 2 Pasos

```
                  +--------------------+
                  | buildResearchPrompt|  (optimiza el prompt del usuario)
                  +---------+----------+
                            |
                  +---------v----------+
  Paso 1:        | generateText()     |
  Grounded       | + google.tools.    |
  Search         |   googleSearch({}) |
                  | modelo: gemini-    |
                  |   2.5-flash        |
                  +---------+----------+
                            |
                   groundedText (texto libre con datos de Google)
                            |
                  +---------v----------+
  Paso 2:        | generateText()     |
  Structuring    | system: "Responde  |
                  |   SOLO JSON"       |
                  | modelo: gemini-    |
                  |   2.5-flash        |
                  +---------+----------+
                            |
                   JSON estructurado
                            |
                  +---------v----------+
                  | JSON.parse +       |
                  | Zod safeParse      |
                  +---------+----------+
                            |
                  +---------v----------+
                  | Guardar en BD      |
                  | research_reports   |
                  +--------------------+
```

**Paso 1 -- Busqueda grounded:** Usa `generateText` con `google.tools.googleSearch({})` como herramienta. Gemini busca en Google en tiempo real y produce texto libre con datos frescos.

**Paso 2 -- Estructuracion:** Toma el texto del paso 1 (truncado a 6000 chars) y pide a Gemini convertirlo en JSON estructurado.

### Output Schema

```typescript
{
  summary: string                           // Resumen ejecutivo (1-3 parrafos)
  key_findings: Array<{                     // 3-10 hallazgos
    finding: string
    relevance: string
    source_hint?: string
  }>
  suggested_topics: Array<{                 // 3-8 topics sugeridos
    title: string
    angle: string
    hook_idea: string
  }>
  market_context?: string                   // Contexto de mercado
}
```

### Persistencia

- Si se envia `research_id`, actualiza el registro existente en `research_reports.ai_synthesis`.
- Si no se envia, crea automaticamente un nuevo `research_report` con source `'AI Research (Gemini + Google Search)'`.
- El auto-save es no-fatal: si falla, el resultado AI se retorna de todas formas.

### Acceso desde el Orchestrator

El tool `runGroundedResearch` del orchestrator replica la misma logica de 2 pasos, permitiendo al usuario lanzar investigaciones directamente desde el chat.

---

## 9. Quirks y Workarounds

Lecciones aprendidas durante el desarrollo, documentadas para evitar repetir errores.

### 9.1 `generateObject` falla con inputs largos en Gemini 2.5 Flash

**Problema:** Cuando el prompt combinado (system + user) supera ~5000 caracteres, `generateObject` del Vercel AI SDK con Gemini 2.5 Flash produce errores silenciosos, timeouts, o respuestas malformadas.

**Solucion:** Usar `generateText()` con instruccion explicita en el system prompt:

```
Responde UNICAMENTE con un JSON valido, sin markdown, sin backticks, sin texto adicional.
```

Luego parsear manualmente:

```typescript
let jsonText = result.text.trim()
if (jsonText.startsWith('```')) {
  jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
}
const parsed = JSON.parse(jsonText)
const validated = schema.safeParse(parsed)
```

**Afecta a:** `generate-copy`, `critic-copy`, `iterate`, `synthesize-research`, `grounded-research`.

**No afecta a:** Los endpoints visual (`generate-visual-concepts`, `generate-visual-json`, `critic-visual`, `iterate-visual`) porque sus inputs son mas cortos y usan `generateObjectWithFallback`.

### 9.2 Google Search Grounding

**Problema:** La documentacion de Google sugiere usar `maxSteps` con Google Search, pero en la practica no es necesario.

**Solucion:** Pasar `google.tools.googleSearch({})` como herramienta sin configuracion especial de maxSteps:

```typescript
const { text } = await generateText({
  model: google(GEMINI_MODEL),
  tools: {
    google_search: google.tools.googleSearch({}),
  },
  system: '...',
  prompt: '...',
})
```

### 9.3 Zod `.nullable().optional()` para inputs del client

**Problema:** El cliente JavaScript envia `null` para campos faltantes, pero Zod `.optional()` solo acepta `undefined`. Resultado: validation error inesperado.

**Solucion:** Usar `.nullable().optional()` en schemas de input para campos opcionales:

```typescript
const inputSchema = z.object({
  title: z.string().nullable().optional(),       // acepta string, null, o undefined
  market_region: z.string().nullable().optional(),
  buyer_persona: z.string().nullable().optional(),
})
```

**Afecta a:** `synthesize-research` y cualquier endpoint cuyos campos opcionales vengan del client.

### 9.4 Dos formatos de `ai_synthesis` coexisten

**Problema:** La columna `ai_synthesis` (JSONB) en `research_reports` almacena datos en dos formatos distintos segun su origen:

| Origen | Formato |
|--------|---------|
| Grounded Research (`/api/research/grounded-research` y orchestrator tool `runGroundedResearch`) | `{ summary, key_findings[], suggested_topics[], market_context? }` |
| Synthesis API (`/api/ai/synthesize-research`) | `{ summary, bullets[] }` |

**Solucion:** La funcion `parseSynthesis` en el frontend debe manejar ambos formatos. Al leer `ai_synthesis`, verificar si contiene `key_findings` (formato grounded) o `bullets` (formato synthesis).

### 9.5 OpenAI Reviewer es opcional

**Problema:** Algunos entornos no tienen `OPENAI_API_KEY` configurada.

**Solucion:** Las funciones `reviewCopy()` y `reviewVisualJson()` verifican la presencia de `OPENAI_API_KEY` como primera linea. Si no existe, retornan `null` inmediatamente. La app funciona completamente sin el reviewer -- simplemente no habra segunda opinion en la respuesta.

```typescript
export async function reviewCopy(...): Promise<CopyReview | null> {
  if (!process.env.OPENAI_API_KEY) return null
  // ...
}
```

**Variables de entorno relevantes:**

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `GOOGLE_AI_API_KEY` | Si | API key de Google AI Studio para Gemini |
| `OPENAI_API_KEY` | No | API key de OpenAI para GPT-4o-mini reviewer |
| `OPENROUTER_API_KEY` | No | API key de OpenRouter para fallback |
