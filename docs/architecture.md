# Arquitectura -- LinkedIn ContentOps (Bitalize)

> **Fecha original**: 2026-02-23 | Correcciones: 2026-02-26
> **Fuente**: requerimiento S8 + analisis del codebase existente
> **Nota**: Tech stack y deploy corregidos a 2026-02-26. Ver [current-state.md](current-state.md) para estado completo.

---

## 1. Visión General

LinkedIn ContentOps es una app interna que transforma investigación semanal en paquetes completos de contenido para LinkedIn, siguiendo la metodología **Detener → Ganar → Provocar → Iniciar** y la arquitectura semanal **TOFU/MOFU/BOFU**.

### Flujo Principal
```
Research (Perplexity) → Topic Backlog → Campaign (L-V) → Posts (3 variantes + D/G/P/I) → Visuals (JSON) → Export Pack → Métricas
```

---

## 2. Tech Stack

| Capa | Tecnología | Versión |
|------|------------|---------|
| Package Manager | **pnpm** | Symlinks + store global (previene phantom deps) |
| Framework | Next.js + React + TypeScript | 16 / 19 / 5.7 |
| Estilos | Tailwind CSS + shadcn/ui | 3.4 |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) | SSR Client (3 clientes) |
| Estado | Zustand | 5.x |
| Validación | Zod | runtime + compile-time (env, inputs, AI responses) |
| AI Primario | Vercel AI SDK + Gemini 2.5 Flash | v6 (`ai@^6.0.97`) |
| AI Reviewer | OpenAI GPT-4o-mini | Opcional (review copy/visual) |
| AI Fallback | OpenRouter | Cuando Gemini falla |
| Testing | Playwright | 1.58 (config presente, tests pendientes) |
| Deploy | Docker (4-stage) -> Dokploy -> VPS | Ver [deployment.md](deployment.md) |

---

## 3. Arquitectura Feature-First

```
src/
├── app/                          # Next.js 16 App Router (solo routing)
│   ├── (auth)/                   # Login, Signup
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (main)/                   # Rutas protegidas
│   │   ├── dashboard/page.tsx
│   │   ├── research/
│   │   │   ├── page.tsx          # Lista
│   │   │   ├── new/page.tsx      # Crear
│   │   │   └── [id]/page.tsx     # Detalle
│   │   ├── topics/page.tsx       # Backlog
│   │   ├── campaigns/
│   │   │   ├── page.tsx          # Lista
│   │   │   ├── new/page.tsx      # Crear
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Builder L-V
│   │   │       ├── posts/
│   │   │       │   └── [day]/page.tsx  # Editor post
│   │   │       ├── visuals/page.tsx    # JSON generator
│   │   │       ├── export/page.tsx     # Campaign pack
│   │   │       └── metrics/page.tsx    # Tracking
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── ai/                   # Endpoints AI (generar copy, JSON)
│   │   └── export/               # Generar pack
│   └── layout.tsx
│
├── features/                     # Lógica de negocio (Feature-First)
│   ├── auth/                     # Reutilizado del proyecto base
│   ├── research/
│   │   ├── components/           # UI específica de research
│   │   ├── services/             # CRUD Supabase
│   │   ├── types/                # Interfaces + Zod schemas
│   │   └── store/                # Zustand store (si aplica)
│   ├── topics/
│   ├── campaigns/
│   ├── posts/
│   ├── visuals/
│   ├── conversion/
│   ├── export/
│   ├── analytics/
│   └── settings/
│
├── shared/
│   ├── components/               # UI reutilizable (shadcn wrappers)
│   ├── lib/
│   │   ├── supabase/             # 3 clientes: server.ts, client.ts, middleware.ts
│   │   ├── ai/                   # AI SDK helpers
│   │   ├── env.ts                # Validación env con Zod (P0)
│   │   ├── auth.ts               # requireAuth, getProfile, requireAdmin
│   │   ├── rate-limit.ts         # createRateLimiter() compartido
│   │   └── tracking.ts           # Funnel tracking fire-and-forget
│   ├── utils/                    # Funciones puras
│   └── types/                    # Tipos compartidos
│
├── actions/                      # Next.js Server Actions
│   ├── research.ts
│   ├── topics.ts
│   ├── campaigns.ts
│   ├── posts.ts
│   ├── visuals.ts
│   └── metrics.ts
│
└── config/
    └── site-config.ts            # Metadata, SEO
```

---

## 4. Modelo de Datos (Supabase PostgreSQL)

### Diagrama de Relaciones

```
workspaces ─┬─ workspace_members (user_id, role)
             ├─ research_reports
             ├─ topics ──── campaigns ──┬── posts ──┬── post_versions
             │                          │           ├── visual_versions
             │                          │           └── metrics
             │                          └── learnings
             └─ assets
```

### Tablas Principales

**workspaces**
- Aísla datos por organización
- Toda query filtra por `workspace_id`

**research_reports**
- `raw_text`: contenido de Perplexity (texto libre)
- `tags_json`: array de tags `[{key, value}]`

**topics**
- `hypothesis`: qué queremos probar
- `evidence`: datos/señales que lo soportan
- `anti_myth`: qué creencia desafía
- `signals_json`: señales verificables `[{signal, source}]`
- `fit_score`: 0-10 (fit con core Bitalize)

**campaigns**
- `week_start`: fecha del lunes
- `topic_id`: FK a topics
- `keyword`: CTA keyword de la semana
- `resource_json`: `{type, url, description}`
- `audience_json`: `{persona, pain, goal}`

**posts**
- `day_of_week`: 1-5 (L-V)
- `funnel_stage`: 'tofu' | 'mofu' | 'bofu'
- `status`: 'draft' | 'review' | 'approved' | 'published'

**post_versions**
- `version`: numérico incremental
- `content`: texto del copy
- `score_json`: `{detener: 0-5, ganar: 0-5, provocar: 0-5, iniciar: 0-5, total: 0-20, notes: {}}`
- `is_current`: boolean

**visual_versions**
- `format`: '1:1' | '4:5'
- `prompt_json`: JSON completo para Nano Banana Pro
- `qa_json`: resultado del checklist QA
- `image_url`: URL del asset subido

---

## 5. Seguridad (8 capas — basado en aprendizajes Soiling Calculator)

### Capa 1: Validación de Entorno
```
src/lib/env.ts → Zod schema que valida al arrancar (no al usar)
.env.example   → Contrato del equipo (actualizar con cada variable nueva)
```

### Capa 2: Security Headers (`next.config.ts`)
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: ajustado para APIs AI externas
poweredByHeader: false
```

### Capa 3: Input Validation (Zod)
- Toda entrada de usuario validada con Zod schemas
- Toda respuesta de AI parseada con Zod (nunca `as MyType`)
- Toda data de Supabase parseada con Zod en boundaries

### Capa 4: RLS (Row Level Security)
- **SIEMPRE en la misma migración** que crea la tabla
- Policies basadas en `workspace_members`:
```sql
CREATE POLICY "workspace_isolation" ON [tabla]
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));
```
- **Roles**: admin (CRUD completo), editor (CRUD campañas/posts), collaborator (lectura + borradores)

### Capa 5: Rate Limiting
```
src/lib/rate-limit.ts → createRateLimiter({ maxRequests, windowMs })
```
- Aplicar en: `/api/ai/*` (10 req/min), `/api/export/*` (5 req/min)

### Capa 6: Auth Middleware
```
src/middleware.ts → Rutas públicas configurables + session refresh
src/lib/auth.ts  → requireAuth(), getProfile(), requireAdmin()
```

### Capa 7: Secrets & .gitignore Blindado
```gitignore
.env / .env.local / .env*.local
.claude/settings.local.json
*.mcp.json
!.env.example / !example.mcp.json
```

### Capa 8: Sanitización
- Filenames en Content-Disposition (Export Pack)
- `name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')`

---

## 6. Integracion AI

> **Nota (2026-02-26)**: Esta seccion describe el patron original con 3 endpoints.
> El sistema ahora tiene 12 endpoints AI + orchestrator con 9 tools.
> Ver [ai-system.md](ai-system.md) para la referencia completa y actualizada.

### Generacion de Copy (Vercel AI SDK)
- **Endpoint**: `POST /api/ai/generate-copy`
- **Rate limit**: 10 req/min por IP
- **Input**: topic, funnel_stage, day_of_week, campaign context
- **System prompt**: inyecta reglas de la metodología (D/G/P/I, estilo Bitalize, estructura de post)
- **Output**: 3 variantes `{contrarian, historia, data_driven}`
- **Validación**: parsear respuesta con Zod schema `GeneratedCopySchema` (nunca `as`)

### Generación de JSON Visual
- **Endpoint**: `POST /api/ai/generate-visual-json`
- **Rate limit**: 10 req/min por IP
- **Input**: copy aprobado, brand rules, formato
- **System prompt**: reglas de marca + negative prompts + estilo editorial
- **Output**: JSON estructurado para Nano Banana Pro
- **Validación**: parsear con Zod schema `VisualPromptSchema`

### Iteración con Feedback
- **Endpoint**: `POST /api/ai/iterate`
- **Rate limit**: 10 req/min por IP
- **Input**: contenido actual (copy o JSON) + feedback textual (3-5 cambios)
- **Output**: versión mejorada
- **Validación**: parsear con Zod

### Patrón de API Route con AI
```typescript
// 1. Rate limit
const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 })
// 2. Auth
const user = await requireAuth()
// 3. Validate input (Zod)
const parsed = generateCopySchema.safeParse(body)
// 4. Call AI
const result = await generateText({ model, system, prompt })
// 5. Validate output (Zod — nunca `as`)
const validated = generatedCopyOutputSchema.parse(result)
// 6. Return
return NextResponse.json(validated)
```

---

## 7. Patrón Server Actions (4 pasos — aprendizaje Soiling Calculator)

Toda Server Action sigue este patrón estandarizado:

```typescript
export async function createEntity(formData: FormData) {
  // 1. Auth
  const user = await requireAuth()

  // 2. Validar con Zod (nunca confiar en FormData crudo)
  const parsed = entitySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  // 3. Ejecutar
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entities')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()
  if (error) return { error: error.message }

  // 4. Side effects (fire-and-forget)
  track('ENTITY_CREATED', { userId: user.id })
  revalidatePath('/entities')
  return { data: { id: data.id } }
}
```

---

## 8. Boundaries y Módulos

### Boundaries de Datos
- Cada feature solo accede a sus propias tablas vía su `service.ts`
- Cross-feature: se hace por ID (ej: campaign referencia topic_id, no importa los datos del topic)
- Los tipos compartidos viven en `shared/types/`

### Boundaries de UI
- Cada feature tiene sus propios componentes en `features/[feature]/components/`
- Componentes compartidos (Button, Card, etc.) en `shared/components/`
- Layout (sidebar, header) en `src/components/layout/`

### Boundaries de Estado
- Zustand stores son por feature, no globales
- Server state > Client state (preferir server actions + revalidation)
- Zustand solo para UI state complejo (ej: wizard multi-step, editor state)

---

## 9. Estrategia MVP vs v2

> **Nota (2026-02-26)**: La mayoria de features "v2" ya estan implementadas.
> Ver [current-state.md](current-state.md) para el estado real.

### MVP (completado)
- Ingesta manual de research (pegar texto)
- Generacion AI de copy y JSON
- Scoring manual D/G/P/I
- Upload manual de imagenes
- Export como ZIP
- Metricas manuales

### v2 (estado actual)
- ~~Integracion Perplexity API~~ -> Grounded Research con Gemini + Google Search (implementado)
- Publicacion directa a LinkedIn API (pendiente)
- ~~Generacion de imagenes con API Nano Banana Pro~~ -> Gemini image generation in-app (implementado)
- ~~Analytics automatico~~ -> XLSX import bridge (implementado)
- ~~Scoring asistido por AI~~ -> CriticPanel con D/G/P/I automatico (implementado)
- ~~Templates de campanas reutilizables~~ -> Pattern Library (implementado)
- Calendario editorial visual (pendiente)
- Colaboracion en tiempo real (pendiente)
