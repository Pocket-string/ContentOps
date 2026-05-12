# Plan de Accion -- LinkedIn ContentOps (Bitalize)

> **Estado**: COMPLETADO (2026-02-26) | Build: `af6775c`
> Todas las fases (0-9) implementadas. Para el estado actual ver [current-state.md](current-state.md)
>
> **Version**: 3.0 (definitiva)
> **Fecha original**: 2026-02-23
>
> **Fuentes**:
> - Metodología de copy Bitalize (`reporte_metodologia_...md`)
> - Requerimiento de producto (`requerimiento_app_...md`)
> - 19 mejoras universales del proyecto Soiling Calculator
> - Documentación arquitectura (`docs/architecture.md`) y features (`docs/features.md`)

---

## 1. Punto de Partida

### Infraestructura reutilizable (ya existe)
| Componente | Estado |
|------------|--------|
| Next.js 16 + React 19 + TypeScript 5.7 | Configurado |
| Tailwind CSS + shadcn/ui (Button, Card, Input, Badge, Select) | Funcional |
| Supabase Auth (Email/Password) | Funcional |
| Layout dashboard (sidebar + header) | Funcional |
| Feature-first (`src/features/`) | Estructura operativa |
| Server Actions (`src/actions/`) | Patrón establecido |
| Vercel deploy | Pipeline listo |

### Lo que se debe construir
El dominio completo ContentOps: **Research → Topics → Campaigns → Posts → Visuals → Export → Metrics**.

### Decisión previa requerida

El repo contiene código de **LexAgenda** (app legal). Recomendación:

**Opción A (recomendada):** Limpiar LexAgenda, conservar solo infraestructura (auth, layout, UI, Supabase client).
**Opción B:** Mantener ambos dominios como features separadas.

---

## 2. Fases de Implementación

### Fase 0 — Setup, Limpieza y Hardening

**Objetivo**: Base limpia, blindada desde el día 0.

| # | Tarea | Origen | DoD |
|---|-------|--------|-----|
| 0.1 | **Inicializar git** con `.gitignore` blindado (`.env*`, `.mcp.json`, `settings.local.json`) | Soiling P0 | `git status` limpio, secrets excluidos |
| 0.2 | **Migrar a pnpm** (`pnpm import`, eliminar `package-lock.json`, commitear `pnpm-lock.yaml`) | Soiling: supply chain | `pnpm run build` pasa |
| 0.3 | **Validación de entorno** — crear `src/lib/env.ts` con Zod schema que valide `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY` al arrancar | Soiling P0 | App falla al arrancar sin variables obligatorias |
| 0.4 | **Security headers** en `next.config.ts` — X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, CSP, `poweredByHeader: false` | Soiling P0 | `curl -I` confirma headers |
| 0.5 | **Rate limiter** — crear `src/lib/rate-limit.ts` con `createRateLimiter({ maxRequests, windowMs })` | Soiling P0 | Utility importable desde cualquier endpoint |
| 0.6 | **3 clientes Supabase** — verificar/crear `server.ts`, `client.ts`, `middleware.ts` en `src/lib/supabase/` | Soiling P0 | Importaciones consistentes en todo el proyecto |
| 0.7 | **Auth middleware** — `src/middleware.ts` con rutas públicas configurables + refresh de sesión | Soiling P1 | Rutas protegidas redirigen a `/login` |
| 0.8 | **Auth helpers** — `src/lib/auth.ts` con `requireAuth()`, `getProfile()`, `requireAdmin()` adaptados a roles `admin` / `editor` / `collaborator` | Soiling P1 | Helpers tipados y reutilizables |
| 0.9 | **Limpiar LexAgenda** — eliminar `appointments/`, `lawyers/`, `booking/`, `projects/`, `qr/`, `payments/`, `chatbot/` y rutas/actions asociadas | Decisión Opción A | `pnpm run build` sin errores, 0 código legal |
| 0.10 | **Adaptar sidebar y layout** — secciones: Dashboard, Research, Topics, Campaigns, Settings | Requerimiento | Sidebar navega correctamente |
| 0.11 | **Crear `.env.example`** como contrato del equipo | Soiling P0 | Archivo con todas las keys (sin valores) |

**Validación**: `pnpm run build` OK, git con `.gitignore` blindado, env validation activa, security headers presentes, sidebar ContentOps funcional.

---

### Fase 1 — Modelo de Datos y Migraciones

**Objetivo**: Schema completo en Supabase con RLS desde el día 0.

**Reglas** (aprendizajes Soiling):
- RLS en la **misma migración** que crea la tabla.
- Trigger `updated_at` automático en tablas mutables.
- Nunca incluir columnas `GENERATED ALWAYS` en INSERT/UPDATE.
- Migraciones **antes** de deploy, nunca al revés.

| # | Tarea | DoD |
|---|-------|-----|
| 1.1 | Crear función reutilizable `update_updated_at()` | Función existe, trigger aplicable a cualquier tabla |
| 1.2 | Crear **migración única** `001_content_ops.sql` con todas las tablas + RLS + triggers + índices | SQL ejecuta sin errores, RLS activo en todas las tablas |
| 1.3 | Generar tipos TypeScript + Zod schemas en `src/shared/types/content-ops.ts` | `pnpm exec tsc --noEmit` con 0 errores |

**Tablas** (11):

```
workspaces                → id, name, created_at, updated_at
workspace_members          → workspace_id, user_id, role, joined_at
research_reports           → id, workspace_id, title, source, raw_text, tags_json, created_by, created_at, updated_at
topics                     → id, workspace_id, title, hypothesis, evidence, anti_myth, signals_json, fit_score, priority, status, created_by, created_at, updated_at
campaigns                  → id, workspace_id, week_start, topic_id, keyword, resource_json, audience_json, status, created_by, created_at, updated_at
posts                      → id, campaign_id, day_of_week, funnel_stage, objective, status, created_at, updated_at
post_versions              → id, post_id, version, content, score_json, notes, is_current, created_by, created_at
visual_versions            → id, post_id, version, format, prompt_json, qa_json, image_url, status, created_by, created_at
assets                     → id, workspace_id, type, url, metadata_json, created_at
metrics                    → id, post_id, impressions, comments, saves, shares, leads, notes, captured_at
learnings                  → id, campaign_id, summary, bullets_json, created_by, created_at
```

**RLS pattern**:
```sql
CREATE POLICY "workspace_isolation" ON [tabla]
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
```

**Validación**: Tablas creadas, RLS activo en todas, triggers `updated_at` funcionando, tipos compilando.

---

### Fase 2 — Research y Topic Backlog

**Objetivo**: Ingestar investigaciones de Perplexity y gestionar backlog de temas.

**Patrón de Server Actions** (4 pasos, aplicar en toda la app):
```
1. Auth     → requireAuth()
2. Validar  → schema.safeParse(data)
3. Ejecutar → supabase.from(...).insert(...)
4. Side fx  → track('EVENT'), revalidatePath()
```

| # | Tarea | Ruta | DoD |
|---|-------|------|-----|
| 2.1 | **Research CRUD** — formulario (pegar texto / upload .txt/.md), lista con filtros, vista detalle | `/research`, `/research/new`, `/research/[id]` | CRUD completo con validación Zod |
| 2.2 | **Sistema de tags** — chips con autocompletado (tema, dolor, buyer persona, geografía, urgencia) | integrado en research | Puedo agregar/quitar tags y filtrar |
| 2.3 | **Topic Backlog CRUD** — título, hipótesis, evidencias, anti-mito, señales, fit score, prioridad, status | `/topics` | CRUD completo, tabla con sorting/filtros |
| 2.4 | **Research → Topic** — botón "Derivar Tema" pre-llena formulario | desde `/research/[id]` | Topic creado con datos del research |
| 2.5 | **Funnel tracking** — crear `src/lib/tracking.ts` fire-and-forget | `src/lib/tracking.ts` | Eventos registrados sin afectar flujo |

**Estructura**:
```
src/features/research/  → components/ services/ types/ store/
src/features/topics/    → components/ services/ types/ store/
```

**Validación**: Flujo Research → Topics funcional, datos en Supabase, tracking activo.

---

### Fase 3 — Campaign Builder

**Objetivo**: Campañas semanales con plan L–V y asignación TOFU/MOFU/BOFU.

| # | Tarea | Ruta | DoD |
|---|-------|------|-----|
| 3.1 | **Campaign CRUD** — formulario con Zod (semana, topic, keyword, recurso, buyer persona) | `/campaigns`, `/campaigns/new` | Puedo crear y listar campañas |
| 3.2 | **Auto-generar plan L–V** — 5 posts con funnel stage: L=TOFU/Prob, Ma=MOFU/Prob, Mi=TOFU/Sol, J=MOFU/Sol, V=BOFU/Conv | al crear campaña | 5 posts creados con stage correcto |
| 3.3 | **Vista Campaign Builder** — grid 5 columnas, cada card con día/stage/status/preview, click → Post Editor | `/campaigns/[id]` | Builder visual funcional |
| 3.4 | **Estados de campaña** — Draft → In Progress → Ready → Published → Archived (solo admin publica) | integrado | Transiciones con permisos |

**Estructura**: `src/features/campaigns/ → components/ services/ types/ store/`

**Validación**: Campaña creada desde topic, plan L-V visible, navegación a cada post.

---

### Fase 4 — Post Editor, Copy y Rubrica D/G/P/I

**Objetivo**: Editor de copy con 3 variantes AI, scoring D/G/P/I, versionado y estados.

**Reglas de seguridad para AI** (aprendizajes Soiling):
- Rate limiting: `createRateLimiter({ maxRequests: 10, windowMs: 60_000 })`
- Parsear respuestas AI con Zod (nunca `as GeneratedCopy`)

| # | Tarea | Ruta | DoD |
|---|-------|------|-----|
| 4.1 | **Post Editor** — textarea + contador caracteres + preview mobile LinkedIn + reglas en vivo (link externo, keyword CTA, largo párrafos) | `/campaigns/[id]/posts/[day]` | Editor funcional con validaciones visuales |
| 4.2 | **3 variantes** — tabs Contrarian / Historia / Data-driven, cada una como `post_version`, botón "Set as Current" | integrado | Puedo crear/ver/seleccionar variantes |
| 4.3 | **Generación AI** — endpoint `POST /api/ai/generate-copy` con rate limiting, system prompt con metodología D/G/P/I, output parseado con Zod | endpoint + UI | 3 variantes coherentes al pulsar "Generar" |
| 4.4 | **Rubrica D/G/P/I** — panel lateral con 4 sliders (0–5 cada uno), score total (0–20), notas por criterio | integrado | Score guardado en `score_json` |
| 4.5 | **Versionado + estados** — timeline de versiones, máquina Draft → Review → Approved → Published, historial con autor/timestamp | integrado | Cambios auditables |
| 4.6 | **Iteración AI** — endpoint `POST /api/ai/iterate` con rate limiting, input = copy + feedback textual, output parseado con Zod | endpoint + UI | Nueva versión generada desde feedback |

**Estructura**: `src/features/posts/ → components/ services/ types/ store/`

**Validación**: Flujo generar → evaluar → iterar → aprobar funcional. Rate limiting activo.

---

### Fase 5 — Visual Generator (JSON para Nano Banana Pro)

**Objetivo**: Prompts JSON con reglas de marca, iteración y QA visual.

| # | Tarea | Ruta | DoD |
|---|-------|------|-----|
| 5.1 | **Brand rules** como constantes tipadas — formato 1:1 default, estilo editorial, logo, tipografía, negative prompts | `src/features/visuals/constants/brand-rules.ts` | Constantes accesibles |
| 5.2 | **Generación JSON** — endpoint `POST /api/ai/generate-visual-json` con rate limiting, output parseado con Zod schema `VisualPromptSchema` | endpoint + UI | JSON válido con todas las secciones |
| 5.3 | **Editor JSON** — syntax highlighting + validación Zod en vivo + preview formateada | `/campaigns/[id]/visuals` | Puedo editar con validación |
| 5.4 | **Iteración JSON** — feedback 3–5 cambios → nueva versión, historial con diff semántico | integrado | Historial visible |
| 5.5 | **Upload imagen + QA** — drag & drop, checklist (formato, estilo, texto, logo), status Pending QA → Approved | integrado | Imagen subida y QA completado |

**Estructura**: `src/features/visuals/ → components/ services/ types/ constants/ store/`

**Validación**: JSON generado, editable, iterable. Imagen con QA aprobado.

---

### Fase 6 — Conversión (Keyword + CTA + Recursos)

**Objetivo**: Operación de conversión sin link externo en el post.

| # | Tarea | DoD |
|---|-------|-----|
| 6.1 | **Keyword CTA** por campaña (ej: SCADA, ALBEDO) visible en post editor | Keyword guardada y mostrada |
| 6.2 | **Registro de recurso** — formulario Zod (tipo, URL, descripción) asociado a campaña | CRUD funcional |
| 6.3 | **Templates DM/comentario** — editor copiar/pegar, variables `{{keyword}}` `{{recurso_nombre}}`, botón copiar | Templates guardados y copiables |

**Estructura**: `src/features/conversion/ → components/ services/ types/`

**Validación**: Keyword + recurso + template configurados por campaña.

---

### Fase 7 — Export "Campaign Pack"

**Objetivo**: Paquete ZIP listo para publicar.

**Regla de seguridad** (Soiling): sanitizar todos los filenames:
```typescript
const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
```

| # | Tarea | Ruta | DoD |
|---|-------|------|-----|
| 7.1 | **Generar pack** — `copy.md` (posts aprobados) + `visual_prompts/*.json` + `checklist_publicacion.md` + `links.md`, filenames sanitizados | `/campaigns/[id]/export` | Archivos correctos |
| 7.2 | **Preview** — indicadores de completitud, alertas si falta contenido | integrado | Preview muestra estado real |
| 7.3 | **Descarga ZIP** — JSZip client-side, nombre sanitizado, rate limiting | integrado | ZIP descarga correctamente |
| 7.4 | **Checklist pre-publicación** — posts aprobados, imágenes con QA, keyword, recurso, templates | integrado | Checklist dinámico |

**Estructura**: `src/features/export/ → components/ services/ types/`

**Validación**: ZIP exportado con filenames sanitizados, preview funcional.

---

### Fase 8 — Métricas y Aprendizajes

**Objetivo**: Tracking de performance y mejora continua.

| # | Tarea | Ruta | DoD |
|---|-------|------|-----|
| 8.1 | **Métricas por post** — formulario Zod (impresiones, comentarios, guardados, shares, leads, notas) | `/campaigns/[id]/metrics` | Registro funcional |
| 8.2 | **Resumen semanal** — totales, promedios, gráficos recharts, comparación con semanas anteriores | integrado | Dashboard con gráficos |
| 8.3 | **Weekly Learnings** — editor 3–5 bullets (hook, visual, CTA, fricción, oportunidades) | integrado | Aprendizajes por campaña |

**Estructura**: `src/features/analytics/ → components/ services/ types/`

**Validación**: Métricas registradas, dashboard funcional, aprendizajes persistidos.

---

### Fase 9 — QA Final, Seguridad y Polish

**Objetivo**: Sistema validado end-to-end, blindado, listo para producción.

| # | Tarea | DoD |
|---|-------|-----|
| 9.1 | **Test E2E** — Research → Topic → Campaign → Posts → Visual JSON → Export → Metrics en < 30 minutos | Flujo completo sin errores |
| 9.2 | **Checklist de seguridad** (ver abajo) | Todos los items checked |
| 9.3 | **Responsive** — todas las vistas funcionales en tablet y desktop, preview mobile del post editor | Sin breakages |
| 9.4 | **Build + Types** — `pnpm exec tsc --noEmit` 0 errores, `pnpm run build` exitoso, `pnpm run lint` limpio | Pipeline green |
| 9.5 | **Permisos** — RLS verificado en todas las tablas, roles admin/editor/collaborator testeados | Test pasa para cada rol |
| 9.6 | **UX polish** — loading states, error handling claro, toasts, empty states con CTAs | UI consistente, sin flashes |

**Checklist de seguridad**:
```
[ ] pnpm exec tsc --noEmit → 0 errores
[ ] Security headers presentes (curl -I https://app.url)
[ ] .env.local NO está en git (git ls-files .env.local → vacío)
[ ] RLS habilitado en TODAS las tablas (Supabase advisor)
[ ] Rate limiting activo en /api/ai/* y /api/export/*
[ ] Variables de entorno validadas al arrancar (env.ts)
[ ] No hay secrets hardcodeados en scripts ni código
[ ] Filenames sanitizados en export
```

---

## 3. Mapa de Dependencias

```
Fase 0 (Setup + Hardening)
  └── Fase 1 (Modelo de Datos)
        ├── Fase 2 (Research + Topics)
        │     └── Fase 3 (Campaign Builder)
        │           ├── Fase 4 (Post Editor + AI)
        │           │     ├── Fase 5 (Visual Generator)  ─┐
        │           │     └─────────────────────────────── ├── Fase 7 (Export Pack)
        │           ├── Fase 6 (Conversión)  ──────────── ┘
        │           └── Fase 8 (Métricas)
        └──────────────────────────────── Fase 9 (QA Final)
```

**Paralelizables** una vez completada Fase 4: Fases 5, 6 y 8 son independientes entre sí.

---

## 4. Mejoras del Soiling Calculator Integradas

### Trazabilidad completa

| # | Mejora | Prioridad | Fase.Tarea |
|---|--------|-----------|------------|
| 1 | `.gitignore` blindado | P0 | 0.1 |
| 2 | Migrar a pnpm | P0 | 0.2 |
| 3 | Validación env con Zod (`env.ts`) | P0 | 0.3 |
| 4 | Security headers (`next.config.ts`) | P0 | 0.4 |
| 5 | Rate limiter (`rate-limit.ts`) | P0 | 0.5 |
| 6 | 3 clientes Supabase (server/client/middleware) | P0 | 0.6 |
| 7 | Auth middleware con rutas públicas | P1 | 0.7 |
| 8 | Auth helpers centralizados (`auth.ts`) | P1 | 0.8 |
| 9 | `.env.example` como contrato | P1 | 0.11 |
| 10 | Trigger `updated_at` automático | P1 | 1.1 |
| 11 | RLS en misma migración que CREATE TABLE | P1 | 1.2 |
| 12 | Server Actions patrón 4 pasos | P1 | 2.1+ |
| 13 | Funnel tracking fire-and-forget | P2 | 2.5 |
| 14 | Zod para parsear respuestas AI (nunca `as`) | P2 | 4.3, 5.2 |
| 15 | Rate limiting en endpoints AI | P2 | 4.3, 4.6, 5.2 |
| 16 | Sanitizar filenames en exports | P2 | 7.1 |
| 17 | Conventional Commits atómicos | P2 | Todas |

### Reglas permanentes (Auto-Blindaje)

| Regla | Cómo se aplica |
|-------|---------------|
| Nunca `as MyType` para datos externos | Zod parse en todo boundary (Supabase, AI, FormData) |
| Errores de tipo = bugs | `pnpm exec tsc --noEmit` 0 errores antes de commit |
| Nunca hardcodear credenciales | `process.env` + validación en scripts |
| Migraciones antes de deploy | `apply_migration` → deploy, nunca al revés |
| No columnas GENERATED en INSERT/UPDATE | Documentar con `// GENERATED` |
| Nunca force push a main | Usar `git revert` si necesitas deshacer |

---

## 5. Criterios de Aceptación del MVP

### Funcionales (requerimiento §13)
- [ ] Crear campaña semanal desde research y tema
- [ ] Generar 5 posts L–V con 3 variantes y elegir una
- [ ] Evaluar con rubrica D/G/P/I (score 0–20)
- [ ] Generar JSON Nano Banana Pro por post y versionarlo
- [ ] Adjuntar imagen + QA visual
- [ ] Exportar pack completo (copy + JSON + checklist + links)
- [ ] Registrar métricas y aprendizajes
- [ ] Campaña completa generada en < 30 minutos (con 1 ronda de iteración)
- [ ] Versionado auditable de copy y JSON

### Técnicos (aprendizajes Soiling)
- [ ] `pnpm exec tsc --noEmit` → 0 errores
- [ ] `pnpm run build` → exitoso
- [ ] Env validation activa (app falla sin variables)
- [ ] Security headers en producción
- [ ] RLS habilitado en las 11 tablas
- [ ] Rate limiting en endpoints AI y export
- [ ] No hay secrets en git history

---

## 6. Fuera del MVP

Explícitamente excluido:
- Publicación automática a LinkedIn
- Generación automática de imágenes (Nano Banana Pro sin API)
- Integración directa Perplexity API
- Analytics automático / atribución
- Notificaciones push/email
- Multi-idioma, app móvil nativa
- Invite-only signup, API Keys públicas
- Docker/Dokploy (Vercel suficiente)

---

## 7. Dependencias a Instalar

```bash
pnpm add recharts jszip file-saver @ai-sdk/anthropic react-markdown
pnpm add -D @types/file-saver
```

| Librería | Para qué |
|----------|----------|
| `recharts` | Gráficos de métricas (Fase 8) |
| `jszip` + `file-saver` | Export ZIP client-side (Fase 7) |
| `@ai-sdk/anthropic` | Generación de copy y JSON (Fases 4–5) |
| `react-markdown` | Render de research reports (Fase 2) |

Editor JSON: `@monaco-editor/react` o `react-simple-code-editor` (decidir en Fase 5).

---

## 8. Ejecución

Cada fase sigue el **bucle agéntico** (`.claude/prompts/bucle-agentico-blueprint.md`):

```
Delimitar → Mapear contexto real → Ejecutar → Auto-Blindar errores → Transicionar
```

Se crea un **PRP** (`.claude/PRPs/PRP-XXX-*.md`) para fases complejas (4 y 5 como mínimo).

Commits con **Conventional Commits**: `feat(posts): add D/G/P/I scoring panel`.
