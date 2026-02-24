# Plan de Mejoras V3: Gemini-Centric + ChatGPT Reviewer

> **APIs confirmadas y verificadas (2026-02-24)**:
> - Google AI Studio API Key: OK — 38+ modelos incluyendo Nano Banana Pro, Deep Research, Imagen 4
> - OpenAI API Key: OK — gpt-4o, o3-pro, o3-deep-research, o4-mini

> **Roles definidos**:
> - **Gemini**: Motor principal — genera contenido (copy, visual JSON, imagenes)
> - **ChatGPT (OpenAI)**: Cerebro estrategico — genera prompts optimizados + revisa/critica lo que Gemini produce
> - **OpenRouter**: Eliminado como provider principal. Solo fallback de ultimo recurso.

---

## Diagnostico: Flujo Actual vs. Flujo Objetivo

### Como funciona la App HOY

```
Pegar texto Perplexity → [OpenRouter] Sintetizar → Topics → Campaign L-V
→ [OpenRouter] 3 variantes copy → [OpenRouter] Critico copy
→ [OpenRouter] Conceptos visuales → [OpenRouter] JSON prompt
→ [OpenRouter] Critico visual → Export Pack
→ Copiar JSON → Ir a Gemini manualmente → Generar imagen → Descargar
```

**~35-45 llamadas AI por campana, todas via OpenRouter (tokens de pago).**
**Imagenes 100% manual fuera de la app.**

### Flujo Objetivo V3

```
[ChatGPT o4-mini] Genera prompt de investigacion optimizado
→ [Gemini Deep Research] Investigacion autonoma con fuentes (~10 min)
→ [Parser local] Extraer topics (0 tokens)
→ [Gemini Flash] Genera 3 variantes copy
→ [ChatGPT gpt-4o-mini] Revisa y mejora la mejor variante
→ [QA Rules] Validacion D/G/P/I (0 tokens)
→ [Gemini Flash] Genera conceptos visuales + JSON prompt
→ [ChatGPT gpt-4o-mini] Revisa coherencia copy-visual
→ [Nano Banana Pro] Genera imagen 4K in-app
→ [QA Rules] Validacion brand (0 tokens)
→ Export Pack con imagen incluida
```

**Resultado**: Pipeline completo sin salir de la app. ChatGPT eleva la calidad como revisor. Gemini ejecuta el trabajo pesado gratis.

---

## Inventario Completo de Modelos (Verificado)

### Gemini (Google AI Studio) — Motor de Produccion

| Modelo | ID | Rol en la App | Free Tier |
|--------|----|---------------|-----------|
| **Gemini 2.5 Flash** | `gemini-2.5-flash` | Generacion de copy, visual JSON, synthesis | 10 RPM / 250 RPD |
| **Gemini 2.5 Pro** | `gemini-2.5-pro` | Tareas complejas que Flash no resuelve | 5 RPM / 100 RPD |
| **Nano Banana** | `gemini-2.5-flash-image` | Imagenes rapidas, iteraciones | 10 RPM / 250 RPD |
| **Nano Banana Pro** | `gemini-3-pro-image-preview` | Imagenes 4K, texto legible, produccion final | Preview tier |
| **Deep Research** | `deep-research-pro-preview-12-2025` | Investigacion autonoma con web search | $2-5/research |
| **Imagen 4** | `imagen-4.0-generate-001` | Imagenes standalone (sin texto conversacional) | Paid |
| **Imagen 4 Ultra** | `imagen-4.0-ultra-generate-001` | Imagenes ultra-calidad | Paid |
| **Gemini 3 Pro** | `gemini-3-pro-preview` | Texto avanzado (alternativa a 2.5 Pro) | Preview |
| **Gemini 3.1 Pro** | `gemini-3.1-pro-preview` | Ultima version texto | Preview |

### OpenAI (ChatGPT) — Cerebro Estrategico + Reviewer

| Modelo | ID | Rol en la App | Costo estimado |
|--------|----|---------------|----------------|
| **GPT-4o mini** | `gpt-4o-mini` | Generador de prompts, reviewer rapido | ~$0.15/1M input |
| **GPT-4o** | `gpt-4o` | Reviewer de calidad premium | ~$2.50/1M input |
| **o4-mini** | `o4-mini` | Razonamiento para prompts complejos | ~$1.10/1M input |
| **o3-deep-research** | `o3-deep-research` | Research alternativo a Gemini Deep Research | Por consumo |

---

## Arquitectura V3: Gemini Produce, ChatGPT Revisa

```
┌──────────────────────────────────────────────────────────────────┐
│                      LINKEDIN CONTENTOPS V3                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CAPA 1: INTELIGENCIA (ChatGPT — "El Director")                 │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  gpt-4o-mini / o4-mini                                   │     │
│  │  - Genera prompts optimizados para Gemini                │     │
│  │  - Revisa copy generado (D/G/P/I compliance)             │     │
│  │  - Revisa coherencia copy ↔ visual                       │     │
│  │  - Sugiere mejoras basado en patrones exitosos            │     │
│  └─────────────────────────────────────────────────────────┘     │
│                          │ prompts ↓        ↑ review            │
│  CAPA 2: PRODUCCION (Gemini — "La Fabrica")                     │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐     │     │
│  │  │  Deep     │  │  Flash   │  │  Nano Banana      │     │     │
│  │  │ Research  │  │  2.5     │  │  / Pro             │     │     │
│  │  │(Investig.)│  │(Texto)   │  │(Imagenes)          │     │     │
│  │  └──────────┘  └──────────┘  └───────────────────┘     │     │
│  └─────────────────────────────────────────────────────────┘     │
│                          │                                       │
│  CAPA 3: VALIDACION (Local — "Quality Control")                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  QA Rules Engine (0 tokens)                              │     │
│  │  - D/G/P/I structure checker                             │     │
│  │  - Brand compliance (colores, logo, tipografia)          │     │
│  │  - Copy length, hook length, CTA detection               │     │
│  │  - Visual JSON schema validation                         │     │
│  └─────────────────────────────────────────────────────────┘     │
│                          │                                       │
│  CAPA 4: FALLBACK (OpenRouter — "Emergencia")                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Solo si Gemini Y ChatGPT fallan (rate limit, downtime)  │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Flujo por Paso del Pipeline

| Paso | ChatGPT (Director) | Gemini (Fabrica) | QA Rules |
|------|-------------------|------------------|----------|
| **Research** | Genera prompt de investigacion optimizado | Deep Research ejecuta (~10 min) | Parser extrae topics |
| **Copy (3 vars)** | — | Flash genera 3 variantes | — |
| **Copy review** | Revisa mejor variante, sugiere mejoras | — | Valida D/G/P/I structure |
| **Copy iterate** | — | Flash aplica mejoras sugeridas | — |
| **Visual concepts** | — | Flash genera 3 conceptos | — |
| **Visual JSON** | Revisa coherencia JSON ↔ copy ↔ brand | Flash genera JSON prompt | Valida brand colors, logo |
| **Image gen** | — | Nano Banana Pro genera imagen | Valida aspect ratio |
| **Image iterate** | Analiza imagen, sugiere correcciones | Nano Banana regenera | — |
| **Final QA** | Review final (opcional) | — | Score card completo |

### Por que ChatGPT como Reviewer funciona mejor

1. **Perspectiva diferente**: ChatGPT no genero el contenido, asi que lo revisa con ojos frescos
2. **gpt-4o-mini es baratisimo**: ~$0.15/1M tokens. Revisar 5 posts cuesta ~$0.001
3. **Mejor en evaluacion critica**: GPT-4o es excelente para analisis y critica de texto
4. **Prompts de review mas simples**: "Revisa este copy contra estos criterios" es mas directo que "Genera y auto-evalua"
5. **Separation of concerns**: El generador no se auto-evalua (sesgo de confirmacion)

---

## Fases de Mejora (V3 — Revisadas)

### FASE 1: Gemini Provider + AI Router Base
**Impacto**: Critico | **Esfuerzo**: Medio | **Sprint**: A

Crear el cliente Gemini SDK y migrar los 8 endpoints existentes de OpenRouter a Gemini.

**Implementacion**:

1. **Instalar SDK**: `pnpm add @google/genai`
2. **Gemini Client** (`src/shared/lib/gemini.ts`)
   - Singleton con `GOOGLE_AI_API_KEY`
   - `generateText(model, prompt, schema?)` — para copy, synthesis, concepts
   - `generateJSON(model, prompt, schema)` — para visual JSON con schema Zod
   - `generateImage(model, prompt, config)` — para Nano Banana
   - Rate limit handling (429 → exponential backoff)
   - Token usage logging

3. **OpenAI Client** (`src/shared/lib/openai.ts`)
   - Instalar: `pnpm add openai`
   - `reviewContent(content, criteria)` — revisa output de Gemini
   - `generatePrompt(context, taskType)` — genera prompts optimizados
   - Modelo default: `gpt-4o-mini` (barato)

4. **AI Router** (`src/shared/lib/ai-router.ts`)
   ```typescript
   const ROUTE_TABLE = {
     // Produccion (Gemini)
     research:          { primary: 'gemini-deep-research', fallback: 'openrouter' },
     synthesize:        { primary: 'gemini-flash', fallback: 'openrouter' },
     generate_copy:     { primary: 'gemini-flash', fallback: 'openrouter' },
     generate_concepts: { primary: 'gemini-flash', fallback: 'openrouter' },
     generate_json:     { primary: 'gemini-flash', fallback: 'openrouter' },
     generate_image:    { primary: 'nano-banana-pro', fallback: 'nano-banana' },

     // Review (ChatGPT)
     review_copy:       { primary: 'gpt-4o-mini', fallback: 'gemini-flash' },
     review_visual:     { primary: 'gpt-4o-mini', fallback: 'gemini-flash' },
     generate_prompt:   { primary: 'gpt-4o-mini', fallback: 'gemini-flash' },

     // Iteracion (Gemini, con instrucciones de ChatGPT)
     iterate_copy:      { primary: 'gemini-flash', fallback: 'openrouter' },
     iterate_visual:    { primary: 'gemini-flash', fallback: 'openrouter' },
   }
   ```

5. **Migrar 8 endpoints** en `src/app/api/ai/*/route.ts`
   - Cambiar `openrouter.chat.completions.create()` → `gemini.generateText()`
   - Mantener mismos prompts y schemas Zod
   - Agregar token logging

6. **Env validation** (`src/lib/env.ts`)
   - Agregar `GOOGLE_AI_API_KEY` (required)
   - Agregar `OPENAI_API_KEY` (optional, para reviewer)
   - Hacer `OPENROUTER_API_KEY` optional (ya no es primary)

**Archivos**:
- `src/shared/lib/gemini.ts` (nuevo)
- `src/shared/lib/openai-client.ts` (nuevo)
- `src/shared/lib/ai-router.ts` (nuevo)
- `src/shared/lib/ai-providers/` (directorio con adapters)
- Modificar 8 archivos en `src/app/api/ai/*/route.ts`
- Modificar `src/lib/env.ts`

---

### FASE 2: ChatGPT como Generador de Prompts + Reviewer
**Impacto**: Alto | **Esfuerzo**: Medio | **Sprint**: A

Implementar el rol de ChatGPT como "director creativo" que genera prompts y revisa outputs.

**Implementacion**:

1. **Prompt Generator Service** (`src/features/prompts/services/prompt-generator.ts`)
   ```typescript
   // ChatGPT genera prompts optimizados para cada tarea
   async function generateResearchPrompt(input: {
     tema: string, buyerPersona: string, region: string, fitBitalize: string
   }): Promise<string>
   // → Llama a gpt-4o-mini con el mega-template + contexto
   // → Retorna prompt listo para Deep Research

   async function generateCopyBrief(input: {
     topic: string, funnelStage: string, weeklyBrief: WeeklyBrief,
     brandRules: BrandProfile, topPatterns: Pattern[]
   }): Promise<string>
   // → Llama a gpt-4o-mini con contexto rico
   // → Retorna brief detallado para que Gemini genere copy

   async function generateVisualBrief(input: {
     copy: string, format: '1:1' | '4:5', brandProfile: BrandProfile,
     style: 'editorial' | 'dashboard'
   }): Promise<string>
   // → Retorna brief visual para Gemini
   ```

2. **Content Reviewer Service** (`src/features/qa/services/ai-reviewer.ts`)
   ```typescript
   // ChatGPT revisa lo que Gemini produjo
   async function reviewCopy(input: {
     copy: string, criteria: DGPICriteria, brandTone: string,
     topPatterns: Pattern[], previousFeedback?: string[]
   }): Promise<ReviewResult>
   // → gpt-4o-mini analiza copy vs criterios
   // → Retorna: score, fortalezas, debilidades, sugerencias concretas

   async function reviewVisualJSON(input: {
     json: VisualJSON, copy: string, brandProfile: BrandProfile
   }): Promise<ReviewResult>
   // → Verifica coherencia copy ↔ visual ↔ marca

   async function reviewImage(input: {
     imageBase64: string, json: VisualJSON, brandProfile: BrandProfile
   }): Promise<ReviewResult>
   // → gpt-4o (vision) analiza imagen generada vs JSON prompt
   ```

3. **UI: Review inline**
   - Despues de generar copy → aparece review de ChatGPT automaticamente
   - Badge: "ChatGPT Review: 8.5/10" con detalle expandible
   - Sugerencias de mejora como chips clickeables → "Aplicar sugerencia"
   - Si aplica sugerencia → Gemini regenera con la correccion

**Archivos**:
- `src/features/prompts/services/prompt-generator.ts` (nuevo)
- `src/features/qa/services/ai-reviewer.ts` (nuevo)
- `src/features/qa/components/AIReviewBadge.tsx` (nuevo)
- Integrar en `CopyEditor`, `VisualEditor`, `CriticPanel`

---

### FASE 3: Generacion de Imagenes In-App (Nano Banana)
**Impacto**: Muy Alto | **Esfuerzo**: Medio | **Sprint**: B

Generar imagenes directamente desde la app usando Nano Banana / Nano Banana Pro.

**Modelos confirmados disponibles**:
- `gemini-2.5-flash-image` (Nano Banana) — rapido, free tier
- `gemini-3-pro-image-preview` (Nano Banana Pro) — 4K, texto legible, 131K context
- `imagen-4.0-generate-001` (Imagen 4) — standalone image gen
- `imagen-4.0-ultra-generate-001` (Imagen 4 Ultra) — maxima calidad

**Implementacion**:

1. **Image Generation Endpoint** (`/api/ai/generate-image`)
   ```typescript
   // Input: JSON prompt existente + modelo preferido
   const response = await ai.models.generateContent({
     model: "gemini-2.5-flash-image", // o gemini-3-pro-image-preview
     contents: jsonPrompt.prompt_overall,
     config: {
       responseModalities: ['TEXT', 'IMAGE'],
       imageConfig: {
         imageSize: "2K", // "1K", "2K", "4K" (4K solo en Pro)
         aspectRatio: "1:1" // o "4:5" para carrusel
       }
     }
   })
   // Response: base64-encoded image
   ```

2. **Image Iteration Endpoint** (`/api/ai/iterate-image`)
   - Multi-turn: mantiene historial de generacion
   - Input: feedback de ChatGPT reviewer o del usuario
   - Gemini regenera con contexto previo preservado

3. **Image Preview + Storage**
   - Preview inline en VisualEditor
   - Guardar en Supabase Storage (bucket `visual-assets`)
   - Asociar URL a `visual_versions`
   - Incluir automaticamente en Export Pack

4. **Modelo recomendado por caso**:
   | Caso | Modelo | Por que |
   |------|--------|---------|
   | Iteraciones rapidas | Nano Banana | Gratis, rapido |
   | Infografia con texto preciso | Nano Banana Pro | Mejor texto legible |
   | Carousel slides 4:5 | Nano Banana Pro | 4K + text quality |
   | Standalone sin conversacion | Imagen 4 | Calidad fotografica |

**Archivos**:
- `src/app/api/ai/generate-image/route.ts` (nuevo)
- `src/app/api/ai/iterate-image/route.ts` (nuevo)
- `src/features/visuals/components/ImageGenerator.tsx` (nuevo)
- `src/features/visuals/components/ImagePreview.tsx` (nuevo)
- `src/features/visuals/services/image-service.ts` (modificar)
- Modificar `VisualEditor.tsx` — boton "Generar Imagen" + preview
- Migration: Supabase Storage bucket + `image_url` en `visual_versions`

---

### FASE 4: Deep Research Integration
**Impacto**: Alto | **Esfuerzo**: Medio | **Sprint**: C

Investigacion automatizada desde la app. ChatGPT genera el prompt, Gemini Deep Research ejecuta.

**Implementacion**:

1. **Deep Research Client** (`src/shared/lib/gemini-deep-research.ts`)
   ```typescript
   // Interactions API (asincrona)
   async function startDeepResearch(prompt: string): Promise<string> // interaction_id
   async function pollStatus(id: string): Promise<'in_progress' | 'completed' | 'failed'>
   async function getResult(id: string): Promise<{ markdown: string, citations: Citation[] }>
   ```

2. **Flujo**:
   ```
   Usuario ingresa tema
   → [ChatGPT gpt-4o-mini] Genera prompt de investigacion optimizado
   → [Gemini Deep Research] Ejecuta investigacion (~10 min)
   → [Parser local] Extrae topics, hooks, fuentes (0 tokens)
   → Topics populados en la app
   ```

3. **UI: Research con progreso**
   - Input: tema + buyer persona + region
   - Boton "Investigar con Deep Research"
   - Progress indicator: "Investigando... (5 de ~15 min estimados)"
   - Polling cada 30s al backend
   - Resultado: reporte markdown + topics extraidos

4. **Alternativa gratuita**: Tab "Manual" con prompt template para copiar a Perplexity Pro

**Archivos**:
- `src/shared/lib/gemini-deep-research.ts` (nuevo)
- `src/app/api/research/deep-research/route.ts` (nuevo)
- `src/features/research/components/DeepResearchPanel.tsx` (nuevo)
- Modificar pagina research/new

---

### FASE 5: QA Rule-Based Engine
**Impacto**: Medio | **Esfuerzo**: Bajo | **Sprint**: C

Validaciones deterministas que complementan (no reemplazan) la review de ChatGPT.

**Implementacion**:

1. **Copy Rules** — deteccion instantanea sin AI
   - `hasDGPIStructure()` — las 4 secciones presentes
   - `checkCopyLength()` — 1300-3000 chars optimo
   - `checkHookLength()` — primera linea max 15 palabras
   - `hasCTA()` — patron "Comenta [KEYWORD]"
   - `detectLinkInBody()` — LinkedIn penaliza links
   - `hasHashtags()` — 5-7 hashtags

2. **Visual JSON Rules**
   - `validateBrandColors()`, `checkLogoPlacement()`, `checkBottomRightEmpty()`
   - `checkTextDensity()`, `validateAspectRatio()`

3. **Score Card**: mostrar compliance % antes de la review AI
   - >= 85%: "OK para publicar. Review AI opcional."
   - < 85%: "Problemas detectados. Review AI recomendada."

**Archivos**:
- `src/features/qa/rules/copy-rules.ts` (nuevo)
- `src/features/qa/rules/visual-rules.ts` (nuevo)
- `src/features/qa/components/QAScoreCard.tsx` (nuevo)

---

### FASE 6: Prompt Templates + Import Bridge
**Impacto**: Medio | **Esfuerzo**: Bajo | **Sprint**: D

Fallback manual para usar ChatGPT Pro / Perplexity Pro directamente cuando se prefiere no gastar API tokens.

**Implementacion**:

1. **Templates** (0 tokens — string interpolation)
   - Research: mega-prompt parametrizado
   - Copy: brief para Custom GPT
   - Visual: brief para pedir JSON
   - Botones "Copiar Prompt"

2. **Import Bridge** (parsers rule-based)
   - Pegar markdown de Perplexity → parser extrae topics
   - Pegar 3 variantes de ChatGPT → parser extrae copy
   - Pegar JSON visual → validar contra schema
   - Drag & drop archivos .md / .json

**Archivos**:
- `src/features/prompts/templates/` (3 templates)
- `src/features/import/parsers/` (3 parsers)
- `src/features/import/components/ManualImportTab.tsx`

---

### FASE 7: Agente Critico + Feedback Loop + Dashboard
**Impacto**: Medio-Alto | **Esfuerzo**: Medio | **Sprint**: E

Mejora continua basada en datos + tracking de tokens.

**Implementacion**:

1. **Feedback Loop**
   - Cuando usuario aprueba post → guardar como "patron exitoso"
   - Cuando rechaza → guardar motivo como "anti-patron"
   - Reviews futuras inyectan estos patrones como contexto

2. **Token Usage Log**
   ```sql
   CREATE TABLE ai_usage_log (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     workspace_id UUID NOT NULL,
     campaign_id UUID,
     task_type TEXT NOT NULL,
     provider TEXT NOT NULL,
     model TEXT,
     input_tokens INT DEFAULT 0,
     output_tokens INT DEFAULT 0,
     estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
     duration_ms INT,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

3. **Dashboard** en `/insights`
   - Tokens por provider, campana, tarea
   - Costo estimado acumulado
   - Distribucion Gemini vs ChatGPT vs Rules vs OpenRouter

---

## Routing Final por Tarea

| Tarea | Genera (Gemini) | Revisa (ChatGPT) | Valida (Rules) |
|-------|----------------|-------------------|----------------|
| **Research** | Deep Research | gpt-4o-mini genera prompt | Parser extrae topics |
| **Copy (3 vars)** | Flash 2.5 | — | — |
| **Copy review** | — | gpt-4o-mini analiza D/G/P/I | Copy rules score |
| **Copy iterate** | Flash 2.5 (con sugerencias de ChatGPT) | — | — |
| **Visual concepts** | Flash 2.5 | — | — |
| **Visual JSON** | Flash 2.5 | gpt-4o-mini revisa coherencia | Brand rules check |
| **Image gen** | Nano Banana Pro | — | Aspect ratio check |
| **Image review** | — | gpt-4o (vision) analiza imagen | — |
| **Image iterate** | Nano Banana (rapido) | — | — |
| **Final QA** | — | gpt-4o-mini review global | Full score card |

---

## Costo Estimado por Campana (V3)

### 1 campana semanal (5 posts, 5 imagenes)

| Concepto | Antes (OpenRouter) | V3 (Gemini + ChatGPT) |
|----------|-------------------|----------------------|
| Research | ~$0.05 | $0 (ChatGPT prompt) + ~$3 (Deep Research) |
| Copy gen (5 posts) | ~$0.15 | $0 (Gemini free tier) |
| Copy review | ~$0.10 | ~$0.001 (gpt-4o-mini) |
| Visual concepts | ~$0.10 | $0 (Gemini free tier) |
| Visual JSON | ~$0.10 | $0 (Gemini free tier) |
| Visual review | ~$0.10 | ~$0.001 (gpt-4o-mini) |
| Image gen | $0 (manual) | $0 (Nano Banana free tier) |
| Iterations | ~$0.20 | $0 (Gemini free tier) |
| **TOTAL/campana** | **~$0.80 + trabajo manual** | **~$0.002 + ~$3 Deep Research** |
| **Sin Deep Research** | | **~$0.002 (practicamente gratis)** |

**Deep Research es opcional** — si usas Perplexity Pro manual + Import Bridge, el costo de AI cae a ~$0.

---

## FASE 0: Performance + Deploy ✅ COMPLETADO

### Problema Detectado

```
Hardware: Intel i7-10750H (6C/12T) + 8 GB RAM
RAM libre: ~1.7 GB (de 8 GB)
Next.js dev server (Turbopack) + VSCode + Claude Code + navegador = RAM agotada
```

La app consume demasiados recursos corriendo localmente. Hay 3 causas principales y 2 soluciones.

### Causas

1. **Turbopack** — Compila mas rapido que Webpack pero usa mas RAM (~500-800 MB)
2. **`mcpServer: true`** en `next.config.ts` — Feature experimental que levanta un servidor MCP adicional junto al dev server. Innecesario para desarrollo normal.
3. **31 rutas** — Turbopack pre-procesa todas al arrancar, consumiendo memoria proporcional

### Solucion Inmediata: Optimizar Dev Server

**Impacto**: Alto | **Esfuerzo**: 5 minutos

1. **Desactivar MCP Server experimental** en `next.config.ts`:
   ```typescript
   // ANTES
   experimental: { mcpServer: true }
   // DESPUES
   experimental: {}
   // Ahorro: ~100-200 MB RAM
   ```

2. **Desactivar Turbopack** en `package.json` (usar Webpack):
   ```json
   // ANTES
   "dev": "next dev --turbopack"
   // DESPUES
   "dev": "next dev"
   // Ahorro: ~200-400 MB RAM. Compilacion mas lenta pero menor uso de memoria.
   // Alternativa: mantener Turbopack pero cerrar VSCode/Chrome tabs innecesarias
   ```

3. **Limitar watchers de Next.js** en `next.config.ts`:
   ```typescript
   webpack: (config) => {
     config.watchOptions = {
       poll: 1000,
       aggregateTimeout: 300,
       ignored: ['**/node_modules', '**/.git', '**/.next']
     }
     return config
   }
   ```

### Solucion Definitiva: Deploy a Dokploy (VPS) ✅ COMPLETADO

**Impacto**: Critico | **Esfuerzo**: Medio | **Completado**: 2026-02-24

Con 8 GB de RAM, correr el dev server localmente siempre sera ajustado. La solucion real es **deploy a Dokploy** (self-hosted PaaS) y usar la app desde el navegador.

**Ventajas vs Vercel**:
- **0 RAM local** — solo necesitas un tab del navegador (~200 MB vs ~1.5 GB del dev server)
- **Acceso desde cualquier dispositivo** — celular, tablet, otra PC
- **HTTPS nativo** — Let's Encrypt automatico via Traefik
- **Sin limites de serverless** — Docker container corriendo 24/7
- **Sin costos de hosting adicionales** — ya pagamos el VPS (72.60.143.251)
- **Auto-deploy** — push a main → deploy automatico
- **Control total** — acceso al servidor, logs, containers

**Infraestructura desplegada**:

| Componente | Valor |
|------------|-------|
| **URL produccion** | https://contentops.jonadata.cloud |
| **GitHub repo** | https://github.com/Pocket-string/ContentOps.git |
| **Branch** | `main` (auto-deploy on push) |
| **Dokploy Panel** | https://dokploy.jonadata.cloud |
| **App ID** | `T5h12sWPliBOeXYVLC75h` |
| **Build** | Dockerfile multi-stage (node:20-alpine) |
| **Output** | Next.js standalone (~44 MB) |
| **SSL** | Let's Encrypt via Traefik |
| **DNS** | Cloudflare (Proxied + Full strict SSL) |

**Archivos creados/modificados**:
- `Dockerfile` — Multi-stage build (base → deps → builder → runner)
- `.dockerignore` — Excluye node_modules, .next, .env, docs, e2e
- `next.config.ts` — `output: 'standalone'`, desactivado mcpServer, CSP actualizado
- `.env.example` — Actualizado con GOOGLE_AI_API_KEY, OPENAI_API_KEY
- `.gitignore` — Agregado .playwright-mcp/, nul, tsconfig.tsbuildinfo

**Env vars configuradas en Dokploy**:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` (build args)
- `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`, `NODE_ENV=production`

**Flujo de desarrollo post-deploy**:
```
Desarrollo local (solo cuando editas codigo):
  pnpm run dev → prueba cambios → git push → Dokploy auto-deploy (~3 min)

Uso diario (crear contenido):
  Abrir https://contentops.jonadata.cloud → usar la app → 0 recursos locales
```

---

## Sprints de Ejecucion (Revisados)

### Sprint 0: Performance + Deploy (Fase 0) — ✅ COMPLETADO (2026-02-24)
- ~~Optimizar next.config.ts (desactivar mcpServer)~~ ✅
- ~~Deploy a Dokploy (Docker + standalone)~~ ✅
- ~~Configurar env vars + dominio + SSL~~ ✅
- **Resultado**: App en https://contentops.jonadata.cloud — 0 RAM local

### Sprint A: Core (Fases 1 + 2) — CRITICO
- Gemini SDK + OpenAI SDK + AI Router
- Migrar 8 endpoints a Gemini
- ChatGPT como prompt generator + reviewer
- **Resultado**: 0 tokens OpenRouter, review de calidad incluida

### Sprint B: Imagenes (Fase 3)
- Generacion de imagenes in-app con Nano Banana
- Preview + iteracion + storage
- **Resultado**: Elimina flujo manual (mayor ganancia de productividad)

### Sprint C: Research + QA (Fases 4 + 5)
- Deep Research integrado
- QA rules engine
- **Resultado**: Pipeline end-to-end sin salir de la app

### Sprint D: Templates + Import (Fase 6)
- Fallback manual optimizado
- **Resultado**: Flexibilidad total (API o manual)

### Sprint E: Feedback + Dashboard (Fase 7)
- Mejora continua + tracking de costos
- **Resultado**: La app aprende de cada campana

---

## Fuentes

- [Gemini Deep Research API](https://ai.google.dev/gemini-api/docs/deep-research?hl=es-419)
- [Gemini Image Generation (Nano Banana)](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Gemini API Models](https://ai.google.dev/gemini-api/docs/models)
- [Interactions API](https://ai.google.dev/gemini-api/docs/interactions)
