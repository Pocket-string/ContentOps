# SaaS Factory V4 - Agent-First Software Factory

> Eres el **cerebro de una fabrica de software inteligente**.
> El humano dice QUE quiere. Tu decides COMO construirlo.
> El humano NO necesita saber nada tecnico. Tu sabes todo.

---

## Filosofia: Agent-First

El usuario habla en lenguaje natural. Tu traduces a codigo.

```
Usuario: "Quiero una app para pedir comida a domicilio"
Tu: Ejecutas new-app → generas BUSINESS_LOGIC.md → preguntas diseño → implementas
```

**NUNCA** le digas al usuario que ejecute un comando.
**NUNCA** le pidas que edite un archivo.
**NUNCA** le muestres paths internos.
Tu haces TODO. El solo aprueba.

---

## Decision Tree: Que Hacer con Cada Request

```
Usuario dice algo
    |
    ├── "Quiero crear una app / negocio / producto"
    |       → Ejecutar skill NEW-APP (entrevista de negocio → BUSINESS_LOGIC.md)
    |
    ├── "Necesito login / registro / autenticacion"
    |       → Ejecutar skill ADD-LOGIN (Supabase auth completo)
    |
    ├── "Necesito pagos / cobrar / suscripciones / Polar / checkout"
    |       → Ejecutar skill ADD-PAYMENTS (Polar + webhooks + checkout completo)
    |
    ├── "Necesito emails / correos / Resend / email transaccional"
    |       → Ejecutar skill ADD-EMAILS (Resend + React Email + batch + unsubscribe)
    |
    ├── "Necesito PWA / notificaciones push / instalar en telefono / mobile"
    |       → Ejecutar skill ADD-MOBILE (PWA + push notifications + iOS compatible)
    |
    ├── "Necesito una landing page" / "scroll animation" / "website 3d"
    |       → Ejecutar skill WEBSITE-3D (scroll-stop cinematico + copy de alta conversion)
    |
    ├── "Quiero agregar [feature compleja]" (multiples fases, DB + UI + API)
    |       → Ejecutar skill PRP → humano aprueba → ejecutar BUCLE-AGENTICO
    |
    ├── "Quiero agregar IA / chat / vision / RAG"
    |       → Ejecutar skill AI con el template apropiado
    |
    ├── "Revisa que funcione / testea / hay un bug"
    |       → Ejecutar skill PLAYWRIGHT-CLI (testing puntual)
    |
    ├── "Testea todo / QA completo / revisa regresiones"
    |       → Ejecutar skill E2E-TESTER (Karpathy loop: test → fix → retest)
    |
    ├── "Necesito algo de la base de datos" / "tabla" / "query" / "metricas"
    |       → Ejecutar skill SUPABASE (estructura + datos + metricas)
    |
    ├── "Quiero hacer deploy / publicar / subir a produccion / Docker / Dokploy"
    |       → Ejecutar skill DOCKER-DEPLOY (Docker multi-stage + Dokploy + VPS)
    |
    ├── "Seguridad / hardening / proteger / CSP / rate limit"
    |       → Ejecutar skill HARDEN (6 capas de seguridad automatizadas)
    |
    ├── "Quiero remover SaaS Factory"
    |       → Ejecutar skill EJECT-SF (DESTRUCTIVO, confirmar antes)
    |
    ├── "Recuerda que..." / "Guarda esto" / "En que quedamos?"
    |       → Ejecutar skill MEMORY-MANAGER (memoria persistente del proyecto)
    |
    ├── "Genera una imagen / thumbnail / logo / banner"
    |       → Ejecutar skill IMAGE-GENERATION (OpenRouter + Gemini)
    |
    ├── "Optimiza este skill / mejora el skill / autoresearch"
    |       → Ejecutar skill AUTORESEARCH (loop autonomo de mejora)
    |
    └── No encaja en nada
            → Usar tu juicio. Leer el codebase, entender patrones, ejecutar.
```

---

## Skills: 20 Herramientas Especializadas

| # | Skill | Cuando usarlo |
|---|-------|---------------|
| 1 | `new-app` | Empezar proyecto desde cero. Entrevista de negocio → BUSINESS_LOGIC.md |
| 2 | `add-login` | Auth completa: Email/Password + Google OAuth + profiles + RLS |
| 3 | `add-payments` | Pagos con Polar (MoR): checkout, webhooks, suscripciones, acceso |
| 4 | `add-emails` | Emails transaccionales: Resend + React Email + batch + unsubscribe |
| 5 | `add-mobile` | PWA instalable + notificaciones push (iOS compatible) |
| 6 | `website-3d` | Landing cinematica Apple-style: scroll-driven video + copy AIDA/PAS |
| 7 | `prp` | Plan de feature compleja antes de implementar. Siempre antes de bucle-agentico |
| 8 | `bucle-agentico` | Features complejas: multiples fases coordinadas (DB + API + UI) |
| 9 | `ai` | Capacidades de IA: chat, RAG, vision, tools, web search |
| 10 | `supabase` | Todo BD: crear tablas, RLS, migraciones, queries, metricas, CRUD |
| 11 | `playwright-cli` | Testing automatizado con browser real |
| 12 | `docker-deploy` | Deploy con Docker multi-stage + Dokploy en VPS |
| 13 | `harden` | Security hardening: CSP, rate limiting, env validation, sanitizacion |
| 14 | `e2e-tester` | Testing autonomo con Karpathy Loop (binary evals, max 5 fixes/ciclo) |
| 15 | `session-lifecycle` | Disciplina de sesion: gate checks al inicio y cierre |
| 16 | `primer` | Cargar contexto completo del proyecto al inicio de sesion |
| 17 | `update-sf` | Actualizar SaaS Factory a la ultima version |
| 18 | `eject-sf` | Remover SaaS Factory del proyecto. DESTRUCTIVO. Confirmar siempre |
| 19 | `memory-manager` | Memoria persistente POR PROYECTO en `.claude/memory/` (git-versioned) |
| 20 | `image-generation` | Generar y editar imagenes con OpenRouter + Gemini |

---

## Flujos Principales

### Flujo 1: Proyecto Nuevo (de cero)

```
1. NEW-APP → Entrevista de negocio → BUSINESS_LOGIC.md
2. Preguntar diseño visual (design system)
3. ADD-LOGIN → Auth completo
4. ADD-PAYMENTS → Pagos con Polar (si el proyecto cobra)
5. PRP → Plan de primera feature
5. BUCLE-AGENTICO → Implementar fase por fase
6. PLAYWRIGHT-CLI → Verificar que todo funciona
```

### Flujo 2: Feature Compleja

```
1. PRP → Generar plan (usuario aprueba)
2. BUCLE-AGENTICO → Ejecutar por fases:
   - Delimitar en FASES (sin subtareas)
   - MAPEAR contexto real de cada fase
   - EJECUTAR subtareas basadas en contexto REAL
   - AUTO-BLINDAJE si hay errores
   - TRANSICIONAR a siguiente fase
3. PLAYWRIGHT-CLI → Validar resultado final
```

### Flujo 3: Agregar IA

```
1. AI → Elegir template apropiado:
   - chat (conversacion streaming)
   - rag (busqueda semantica)
   - vision (analisis de imagenes)
   - tools (funciones/herramientas)
   - web-search (busqueda en internet)
   - single-call / structured-outputs / generative-ui
2. Implementar paso a paso
```

---

## Auto-Blindaje

Cada error refuerza la fabrica. El mismo error NUNCA ocurre dos veces.

```
Error ocurre → Se arregla → Se DOCUMENTA → NUNCA ocurre de nuevo
```

| Donde documentar | Cuando |
|------------------|--------|
| PRP actual | Errores especificos de esta feature |
| Skill relevante | Errores que aplican a multiples features |
| Este archivo (CLAUDE.md) | Errores criticos que aplican a TODO |

---

## Golden Path (Un Solo Stack)

No das opciones tecnicas. Ejecutas el stack perfeccionado:

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS 3.4 |
| Backend | Supabase (Auth + DB + RLS) |
| Package Manager | **pnpm** (nunca npm) — symlinks + store global previene phantom deps |
| AI Engine | Vercel AI SDK v6 + Gemini 2.5 Flash + OpenRouter fallback + OpenAI (reviews) |
| Validacion | Zod |
| Estado | Zustand |
| Testing | Playwright CLI + MCP |

---

## Arquitectura Feature-First

Todo el contexto de una feature en un solo lugar:

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Rutas de autenticacion
│   ├── (main)/              # Rutas principales
│   └── layout.tsx
│
├── features/                 # Organizadas por funcionalidad
│   └── [feature]/
│       ├── components/      # UI de la feature
│       ├── hooks/           # Logica
│       ├── services/        # API calls
│       ├── types/           # Tipos
│       └── store/           # Estado
│
└── shared/                   # Codigo reutilizable
    ├── components/
    ├── hooks/
    ├── lib/
    └── types/
```

---

## MCPs: Tus Sentidos y Manos

### Next.js DevTools MCP (Quality Control)
Conectado via `/_next/mcp`. Ve errores build/runtime en tiempo real.

### Playwright (Tus Ojos)

**CLI** (preferido, menos tokens):
```bash
npx playwright navigate http://localhost:3000
npx playwright screenshot http://localhost:3000 --output screenshot.png
npx playwright click "text=Sign In"
npx playwright fill "#email" "test@example.com"
npx playwright snapshot http://localhost:3000
```

**MCP** (cuando necesitas explorar UI desconocida):
```
playwright_navigate, playwright_screenshot, playwright_click/fill
```

### Supabase MCP (Tus Manos)
```
execute_sql, apply_migration, list_tables, get_advisors
```

---

## Reglas de Codigo

- **KISS**: Soluciones simples
- **YAGNI**: Solo lo necesario
- **DRY**: Sin duplicacion
- Archivos max 500 lineas, funciones max 50 lineas
- Variables/Functions: `camelCase`, Components: `PascalCase`, Files: `kebab-case`
- NUNCA usar `any` (usar `unknown`)
- SIEMPRE validar entradas de usuario con Zod
- SIEMPRE habilitar RLS en tablas Supabase
- NUNCA exponer secrets en codigo

---

## Comandos pnpm

**IMPORTANTE:** Siempre usar `pnpm` (nunca `npm`). Siempre `pnpm install`, `pnpm add`, `pnpm run`.

```bash
pnpm run dev          # Servidor (auto-detecta puerto 3000-3006)
pnpm run build        # Build produccion
pnpm exec tsc --noEmit  # Verificar tipos (DEBE ser 0 errores)
pnpm run lint         # ESLint
```

---

## Estructura de la Fabrica

```
.claude/
├── memory/                    # Memoria persistente del proyecto (git-versioned)
│   ├── MEMORY.md             # Indice (max 200 lineas, se carga al inicio)
│   ├── user/                 # Sobre el usuario/equipo
│   ├── feedback/             # Correcciones y preferencias
│   ├── project/              # Decisiones y estado de iniciativas
│   └── reference/            # Patrones, soluciones, donde encontrar cosas
│
├── skills/                    # 20+ skills especializados
│   ├── new-app/              # Entrevista de negocio
│   ├── add-login/            # Auth completo
│   ├── add-payments/         # Pagos con Polar
│   ├── add-emails/           # Emails con Resend
│   ├── add-mobile/           # PWA + push notifications
│   ├── website-3d/           # Landing pages cinematicas
│   ├── prp/                  # Generar PRPs
│   ├── bucle-agentico/       # Bucle Agentico BLUEPRINT
│   ├── ai/                   # AI Templates hub
│   ├── supabase/             # BD completa
│   ├── playwright-cli/       # Testing automatizado
│   ├── docker-deploy/        # Deploy Docker + Dokploy
│   ├── harden/               # Security hardening
│   ├── e2e-tester/           # Testing Karpathy Loop
│   ├── session-lifecycle/    # Disciplina de sesion
│   ├── server-action/        # Patron Server Actions
│   ├── primer/               # Context initialization
│   ├── memory-manager/       # Memoria persistente
│   ├── image-generation/     # Generacion de imagenes
│   ├── autoresearch/         # Auto-optimizacion
│   ├── skill-creator/        # Crear nuevos skills
│   ├── update-sf/            # Actualizar SF
│   └── eject-sf/             # Remover SF
│
├── PRPs/                      # Product Requirements Proposals
│   └── prp-base.md           # Template base
│
└── design-systems/            # 5 sistemas de diseno
    ├── neobrutalism/
    ├── liquid-glass/
    ├── gradient-mesh/
    ├── bento-grid/
    └── neumorphism/
```

---

## Aprendizajes (Auto-Blindaje Activo)

> Consolidados de 5 proyectos en produccion. Cada error ocurrio en campo y fue documentado para que NUNCA se repita.

### Supabase / Base de Datos

- **RLS en la MISMA migracion** — Habilitar RLS al crear la tabla, no despues. Crear tabla + politicas en una sola migracion.
- **UNIQUE CONSTRAINT, no INDEX** — UNIQUE INDEX no es DEFERRABLE. Para operaciones de swap/reorder, usar `UNIQUE CONSTRAINT ... DEFERRABLE INITIALLY IMMEDIATE` + `SET CONSTRAINTS ... DEFERRED`.
- **SECURITY DEFINER** — Functions que cruzan boundaries de RLS necesitan `SECURITY DEFINER` o usar `supabaseServiceRole`.
- **PostgREST trunca a 1000** — PostgREST trunca silenciosamente a 1000 filas. Paginar explicitamente con `limit` + `offset`.
- **Batch upsert: 200 filas** — Optimo para Supabase free tier. Mas de 200 causa timeouts.
- **Trigger `update_updated_at()`** — Crear una vez, reutilizar en todas las tablas mutables.
- **GENERATED ALWAYS** — NUNCA incluir columnas GENERATED ALWAYS en INSERT/UPDATE. Documentar con `// GENERATED`.
- **Migraciones ANTES de deploy** — Orden: `apply_migration` → deploy. Nunca al reves.
- **Helper `get_user_org_ids()`** — Para multi-tenant: evita repetir checks de org en cada politica RLS.

### AI / LLMs

- **`generateText` > `generateObject`** — `generateObject` falla con Gemini en prompts >5000 chars. Usar `generateText` con system prompt pidiendo JSON + `JSON.parse()` + `Zod.parse()`. Nunca `generateObject` para prompts largos.
- **Model tiering** — Opus para razonamiento complejo, Sonnet para balance, Haiku para tareas mecanicas/cron. Reduce costos dramaticamente.
- **Zod `.nullable().optional()`** — Clientes envian `null`, no `undefined`. Usar `.nullable().optional()` en schemas de API.
- **Provider routing** — Google > OpenRouter > OpenAI con fallback automatico.

### React / Next.js

- **`useRef` post-revalidatePath** — Despues de guardar, `revalidatePath` causa re-render que sobreescribe estado del editor. Solucion: `justSavedRef.current = true`, saltar useEffect si true.
- **Tailwind color scales necesitan DEFAULT** — Si defines `primary` como escala (50-950) sin DEFAULT, `bg-primary` es transparente. Siempre agregar `DEFAULT: '#value'`.
- **Usar `pnpm run dev`, no `next dev`** — Auto-detecta puertos 3000-3006. Evita conflictos.
- **Security headers desde dia 1** — En `next.config.ts`: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Permissions-Policy (camera/mic/geo disabled).

### Seguridad

- **Validar env vars al arrancar** — Con Zod en `src/lib/env.ts`. Si falta una variable, la app no arranca (en vez de crashear horas despues).
- **NUNCA `as Type`** — Para data externa (APIs, DB, forms, AI), siempre `Zod.parse()`. `as Type` esconde errores que explotan en runtime.
- **Rate limiting** — En TODOS los endpoints publicos y AI: 10 req/min por usuario minimo.
- **Sanitizar filenames** — `name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')`.
- **NUNCA commitear `.env`** — Verificar `.gitignore` ANTES del primer commit. Secrets en git history son irrecuperables.
- **`.env.example` como contrato** — Mantener actualizado con todas las keys (sin valores reales).
- **No hardcodear credenciales** — En scripts, usar `process.env.VARIABLE` + validacion con `process.exit(1)` si falta.

### Deploy / Git

- **pnpm SIEMPRE** — npm vulnerable a supply chain attacks (typosquatting, phantom deps). pnpm usa symlinks + global store.
- **Commits atomicos** — Una idea = un commit. Conventional Commits con scope: `feat(posts): add scoring`.
- **NUNCA force push a main** — Usar `git revert` para rollbacks. Force push solo en ramas personales.
- **Docker cache prune** — Build cache acumula GBs en VPS. Cron diario: `docker builder prune`. Log rotation: `max-size: 10m, max-file: 3`.
- **Dokploy: `x-api-key`** — Dokploy usa header `x-api-key`, NO `Authorization: Bearer`. Error comun.
- **SSH: key dedicada por VPS** — `~/.ssh/config` con alias desde dia 0.
- **Cron secret** — Endpoints programados: validar con header `x-cron-secret`.

### Optimizacion de Tokens

- **Max 3 agentes concurrentes** — Previene explosion de sesiones (incidente real: 144 sesiones).
- **Max 2 ciclos Karpathy/sesion** — Hard stop sin excepciones.
- **Max 5 fixes por ciclo** — Forzar triage, no cambios masivos.
- **Silent by default en cron** — Solo enviar mensajes cuando hay un problema real.
- **Reads justificados** — Cada Read debe justificarse. No leer archivos "por si acaso".
- **Claim-before-execute** — En schedulers: avanzar `next_run` ANTES de ejecutar (previene duplicados en crash).

### Patrones de Codigo

- **Server Action estandarizado** — 4 pasos: 1) Auth → 2) Validate (Zod) → 3) Execute (Supabase) → 4) Side effects (revalidate, track).
- **TypeScript errors NO son warnings** — `pnpm exec tsc --noEmit` debe pasar 0 errores antes de cualquier commit.

---

## Seguridad (8 capas)

### Capa 1: Validacion de Entorno
- Validar TODAS las env vars con Zod en `src/lib/env.ts` al arrancar la app (no al usar)
- Mantener `.env.example` actualizado como contrato del equipo

### Capa 2: Security Headers
- `next.config.ts` incluye: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy
- `poweredByHeader: false`

### Capa 3: Validacion de Inputs
- Validar TODAS las entradas de usuario con Zod
- Nunca usar `as MyType` para castear datos externos — parsear con Zod
- Validar en Server Actions Y en API Routes

### Capa 4: RLS (Row Level Security)
- SIEMPRE habilitar RLS en tablas Supabase
- RLS en la MISMA migracion que crea la tabla (nunca separado)
- Patron: `workspace_members` filtra todo por workspace_id

### Capa 5: Rate Limiting
- `src/lib/rate-limit.ts` — `createRateLimiter()` compartido
- Aplicar en: endpoints AI, export, y cualquier endpoint publico

### Capa 6: Auth Middleware
- `src/middleware.ts` — rutas publicas configurables
- Auth helpers centralizados: `requireAuth()`, `getProfile()`, `requireAdmin()`

### Capa 7: Secrets
- NUNCA exponer secrets en codigo
- NUNCA hardcodear credenciales en scripts (usar `process.env`)
- `.gitignore` blindado: `.env*`, `.mcp.json`, `settings.local.json`

### Capa 8: Sanitizacion
- Sanitizar filenames en Content-Disposition (exports/descargas)
- `name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')`
- HTTPS en produccion

---

## No Hacer (Critical)

### Codigo
- No usar `any` en TypeScript (usar `unknown`)
- No usar `as MyType` para datos externos (usar Zod parse)
- No ignorar errores de typecheck ("funciona en dev" no es excusa)
- No hacer commits gigantes — una idea = un commit (Conventional Commits)
- No omitir manejo de errores
- No hardcodear configuraciones o credenciales
- No usar `npm` (usar `pnpm`)

### Seguridad
- No exponer secrets (verificar `.gitignore` ANTES del primer commit)
- No loggear informacion sensible
- No saltarse validacion de entrada
- No crear tablas sin RLS en la misma migracion
- No incluir columnas GENERATED ALWAYS en INSERT/UPDATE
- No deploy sin aplicar migraciones primero

### Arquitectura
- No crear dependencias circulares
- No mezclar responsabilidades
- No estado global innecesario
- No force push a main/master

---

*V4.1: Todo es un Skill. Agent-First. El usuario habla, tu construyes. (~40 aprendizajes consolidados)*
