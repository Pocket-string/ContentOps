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
    |       → Ejecutar skill PLAYWRIGHT-CLI (testing automatizado)
    |
    ├── "Necesito algo de la base de datos" / "tabla" / "query" / "metricas"
    |       → Ejecutar skill SUPABASE (estructura + datos + metricas)
    |
    ├── "Quiero hacer deploy / publicar"
    |       → Deploy directo con Vercel CLI o git push
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

## Skills: 15 Herramientas Especializadas

| # | Skill | Cuando usarlo |
|---|-------|---------------|
| 1 | `new-app` | Empezar proyecto desde cero. Entrevista de negocio → BUSINESS_LOGIC.md |
| 2 | `add-login` | Auth completa: Email/Password + Google OAuth + profiles + RLS |
| 3 | `add-payments` | Pagos con Polar (MoR): checkout, webhooks, suscripciones, acceso |
| 4 | `add-emails` | Emails transaccionales: Resend + React Email + batch + unsubscribe |
| 5 | `add-mobile` | PWA instalable + notificaciones push (iOS compatible, 14 commits de gotchas) |
| 6 | `website-3d` | Landing cinematica Apple-style: scroll-driven video + copy AIDA/PAS |
| 4 | `prp` | Plan de feature compleja antes de implementar. Siempre antes de bucle-agentico |
| 5 | `bucle-agentico` | Features complejas: multiples fases coordinadas (DB + API + UI) |
| 6 | `ai` | Capacidades de IA: chat, RAG, vision, tools, web search |
| 7 | `supabase` | Todo BD: crear tablas, RLS, migraciones, queries, metricas, CRUD |
| 8 | `playwright-cli` | Testing automatizado con browser real |
| 9 | `primer` | Cargar contexto completo del proyecto al inicio de sesion |
| 10 | `update-sf` | Actualizar SaaS Factory a la ultima version |
| 11 | `eject-sf` | Remover SaaS Factory del proyecto. DESTRUCTIVO. Confirmar siempre |
| 12 | `memory-manager` | Memoria persistente POR PROYECTO en `.claude/memory/` (git-versioned) |
| 13 | `image-generation` | Generar y editar imagenes con OpenRouter + Gemini |
| 14 | `autoresearch` | Auto-optimizar skills con loop autonomo (patron Karpathy) |
| 15 | `skill-creator` | Crear nuevos skills para extender la fabrica |

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
├── skills/                    # 15 skills especializados
│   ├── new-app/              # Entrevista de negocio
│   ├── add-login/            # Auth completo
│   ├── website-3d/           # Landing pages cinematicas
│   ├── prp/                  # Generar PRPs
│   ├── bucle-agentico/       # Bucle Agentico BLUEPRINT
│   ├── ai/                   # AI Templates hub
│   ├── supabase/             # BD completa: estructura + datos + metricas
│   ├── playwright-cli/       # Testing automatizado
│   ├── primer/               # Context initialization
│   ├── update-sf/            # Actualizar SF
│   ├── eject-sf/             # Remover SF
│   ├── memory-manager/       # Memoria persistente por proyecto
│   ├── image-generation/     # Generacion de imagenes (OpenRouter + Gemini)
│   ├── autoresearch/         # Auto-optimizacion de skills
│   └── skill-creator/        # Crear nuevos skills
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

### 2025-01-09: Usar pnpm run dev, no next dev
- **Error**: Puerto hardcodeado causa conflictos
- **Fix**: Siempre usar `pnpm run dev` (auto-detecta puerto)
- **Aplicar en**: Todos los proyectos

---

## 🔒 Seguridad (8 capas — aprendizaje Soiling Calculator)

### Capa 1: Validación de Entorno
- Validar TODAS las env vars con Zod en `src/lib/env.ts` al arrancar la app (no al usar)
- Mantener `.env.example` actualizado como contrato del equipo

### Capa 2: Security Headers
- `next.config.ts` incluye: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy
- `poweredByHeader: false`

### Capa 3: Validación de Inputs
- Validar TODAS las entradas de usuario con Zod
- Nunca usar `as MyType` para castear datos externos — parsear con Zod
- Validar en Server Actions Y en API Routes

### Capa 4: RLS (Row Level Security)
- SIEMPRE habilitar RLS en tablas Supabase
- RLS en la MISMA migración que crea la tabla (nunca separado)
- Patrón: `workspace_members` filtra todo por workspace_id

### Capa 5: Rate Limiting
- `src/lib/rate-limit.ts` — `createRateLimiter()` compartido
- Aplicar en: endpoints AI, export, y cualquier endpoint público

### Capa 6: Auth Middleware
- `src/middleware.ts` — rutas públicas configurables
- Auth helpers centralizados: `requireAuth()`, `getProfile()`, `requireAdmin()`

### Capa 7: Secrets
- NUNCA exponer secrets en código
- NUNCA hardcodear credenciales en scripts (usar `process.env`)
- `.gitignore` blindado: `.env*`, `.mcp.json`, `settings.local.json`

### Capa 8: Sanitización
- Sanitizar filenames en Content-Disposition (exports/descargas)
- `name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')`
- HTTPS en producción

---

## ❌ No Hacer (Critical)

### Código
- ❌ Usar `any` en TypeScript (usar `unknown`)
- ❌ Usar `as MyType` para datos externos (usar Zod parse)
- ❌ Ignorar errores de typecheck ("funciona en dev" no es excusa)
- ❌ Commits gigantes — una idea = un commit (Conventional Commits)
- ❌ Omitir manejo de errores
- ❌ Hardcodear configuraciones o credenciales
- ❌ Usar `npm` (usar `pnpm`)

### Seguridad
- ❌ Exponer secrets (verificar `.gitignore` ANTES del primer commit)
- ❌ Loggear información sensible
- ❌ Saltarse validación de entrada
- ❌ Crear tablas sin RLS en la misma migración
- ❌ Incluir columnas GENERATED ALWAYS en INSERT/UPDATE
- ❌ Deploy sin aplicar migraciones primero

### Arquitectura
- ❌ Crear dependencias circulares
- ❌ Mezclar responsabilidades
- ❌ Estado global innecesario
- ❌ Force push a main/master

---

## 🔥 Aprendizajes Adicionales (Auto-Blindaje — ContentOps)

> 27 aprendizajes activos del proyecto.

### ⚙️ Configuración y Entorno

### 2025-02-21: Usar pnpm en lugar de npm
- **Error**: npm es vulnerable a supply chain attacks (typosquatting, dependency confusion, phantom dependencies)
- **Fix**: Siempre usar `pnpm install` / `pnpm add`. pnpm usa symlinks y un store global que previene instalaciones fantasma
- **Aplicar en**: Todos los proyectos nuevos

### 2025-02-21: Nunca commitear archivos .env
- **Error**: Secrets expuestos en historial de Git son irrecuperables
- **Fix**: Verificar que `.env`, `.env.local`, `.mcp.json` y `settings.local.json` están en `.gitignore` ANTES del primer commit
- **Aplicar en**: Setup inicial de todo proyecto

### 2025-02-21: Usar .env.example como contrato del equipo
- **Error**: Nuevos devs no saben qué variables configurar
- **Fix**: Mantener `.env.example` actualizado con todas las keys (sin valores reales)
- **Aplicar en**: Cada vez que se añade una nueva variable de entorno

### 2025-02-21: Validar variables de entorno al arrancar, no al usar
- **Error**: App arranca bien pero falla horas después cuando toca variable no configurada
- **Fix**: Validar todas las env vars con Zod en `src/lib/env.ts` que se importa en el inicio
- **Aplicar en**: Todo proyecto antes del primer deploy

### 2025-02-21: Nunca hardcodear credenciales en scripts auxiliares
- **Error**: Tokens quedaron hardcodeados en scripts de migración
- **Fix**: Siempre usar `process.env.VARIABLE` + validación con `process.exit(1)` si falta
- **Aplicar en**: Todo script en `/scripts`, seeds, migraciones manuales

### 🗃️ Base de Datos (Supabase)

### 2025-02-21: Habilitar RLS desde el día 0, no después
- **Error**: Habilitar RLS en tabla con datos existentes puede romper queries en producción
- **Fix**: Crear tabla + policies de RLS en la misma migración inicial
- **Aplicar en**: Cualquier `apply_migration` que cree una tabla nueva

### 2025-02-21: No incluir columnas GENERATED ALWAYS en INSERT/UPDATE
- **Error**: Supabase rechaza INSERT/UPDATE si incluyes columnas generadas
- **Fix**: Excluir columnas generadas del payload. Documentar en tipos con `// GENERATED`
- **Aplicar en**: Toda tabla con columnas calculadas

### 2025-02-21: Siempre correr migraciones antes de desplegar
- **Error**: Deploy sin migración aplicada → runtime crash en producción
- **Fix**: El orden es: `apply_migration` → deploy. Nunca al revés
- **Aplicar en**: Todo flujo de CI/CD

### 2025-02-21: Trigger updated_at automático
- **Fix**: Crear función `update_updated_at()` una vez y reusar trigger en cada tabla mutable
- **Aplicar en**: Toda tabla con columna `updated_at`

### 🧩 TypeScript y Código

### 2025-02-21: Nunca usar `as` para castear tipos desconocidos
- **Error**: `data as MyType` oculta errores reales que explotan en runtime
- **Fix**: Usar Zod para validar y parsear datos externos (API, DB, formularios, respuestas AI)
- **Aplicar en**: Cualquier dato que venga de fuera del sistema

### 2025-02-21: Los errores de tipo no son warnings, son bugs
- **Error**: Ignorar errores de typecheck porque "funciona en dev"
- **Fix**: `pnpm exec tsc --noEmit` debe pasar en 0 errores antes de cualquier commit
- **Aplicar en**: Todos los proyectos

### 2025-02-21: Patrón Server Action estandarizado (4 pasos)
- **Fix**: Toda Server Action sigue: 1) Auth → 2) Validar (Zod) → 3) Ejecutar (Supabase) → 4) Side effects (track, revalidate)
- **Aplicar en**: Toda action de CRUD en este proyecto

### 🔄 Git y Versionado

### 2025-02-21: Nunca hacer force push a main/master
- **Error**: Reescribir historial de rama compartida rompe el trabajo de otros
- **Fix**: Si necesitas revertir, usar `git revert`. Force push solo en ramas personales
- **Aplicar en**: Todo proyecto

### 2025-02-21: Commits atómicos — una idea, un commit
- **Error**: Commits gigantes imposibilitan `git bisect` o revertir cambios puntuales
- **Fix**: Usar Conventional Commits con scope: `feat(posts): add D/G/P/I scoring`
- **Aplicar en**: Todos los proyectos

### 🚀 Deploy y Producción

### 2025-02-21: Security headers desde el día 1
- **Error**: App desplegada sin CSP, X-Frame-Options, ni X-Content-Type-Options
- **Fix**: Incluir security headers en `next.config.ts` desde el setup inicial
- **Aplicar en**: Todo proyecto nuevo

### 2025-02-21: Rate limiting en endpoints públicos y AI
- **Error**: Endpoints sin rate limit permiten DoS
- **Fix**: Usar `createRateLimiter()` compartido en todo endpoint público y AI
- **Aplicar en**: Endpoints AI (generación copy/JSON), export, formularios públicos

### 2025-02-21: Sanitizar filenames en Content-Disposition
- **Error**: Nombres con caracteres especiales pueden inyectar headers HTTP
- **Fix**: `name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')`
- **Aplicar en**: Todo endpoint que genere archivos descargables (Export Pack)

### 🗃️ Base de Datos (Supabase) — ContentOps

### 2026-02-25: UNIQUE INDEX vs UNIQUE CONSTRAINT para operaciones swap
- **Error**: `swap_post_days` fallaba con "duplicate key violates unique constraint" incluso con CASE WHEN en un solo UPDATE
- **Causa raíz**: Un `UNIQUE INDEX` NO es deferrable — PostgreSQL verifica per-row, no al final de la transacción
- **Fix**: Convertir INDEX a CONSTRAINT con `DEFERRABLE INITIALLY IMMEDIATE` + usar `SET CONSTRAINTS ... DEFERRED`
- **Aplicar en**: Cualquier tabla que necesite swap/reordenar filas con restricción única

### 2026-02-25: SECURITY DEFINER para funciones que cruzan RLS
- **Error**: `critic_reviews` insert fallaba con "new row violates RLS policy"
- **Fix**: Funciones que necesitan operar sin filtro RLS deben ser `SECURITY DEFINER` o usar `supabaseServiceRole`
- **Aplicar en**: Toda función SQL o server action que cruza boundaries de RLS

### 🤖 AI y Modelos — ContentOps

### 2026-02-25: generateObject SIEMPRE falla con inputs largos en Gemini 2.5 Flash
- **Error**: `generateObject` de Vercel AI SDK falla silenciosamente o retorna JSON malformado cuando el prompt supera ~5000 caracteres
- **Fix**: Usar `generateText` con system prompt que pida JSON + `JSON.parse()` manual + Zod validate. Nunca `generateObject` para prompts largos con Gemini
- **Aplicar en**: Todo endpoint AI que reciba copy completo, weekly_brief, o context largo

### 2026-02-25: Zod `.nullable().optional()` para inputs de API
- **Error**: Client envía `null` para campos opcionales, pero Zod `.optional()` solo acepta `undefined`
- **Fix**: Usar `.nullable().optional()` en schemas de input de API
- **Aplicar en**: Todo schema Zod en API routes que recibe datos de formularios/fetch del client

### ⚛️ React / Next.js — ContentOps

### 2026-02-25: useRef flag para evitar useEffect después de revalidatePath
- **Error**: Después de guardar un post, `revalidatePath` causa re-render → useEffect sobreescribe estado del editor
- **Fix**: `justSavedRef.current = true` al guardar, skip en useEffect si true
- **Aplicar en**: Todo editor con estado local + server revalidation

### 🚀 Deploy y Producción — ContentOps

### 2026-02-26: Docker build cache se acumula con deploys frecuentes
- **Error**: 30 deploys acumularon 42.9GB de build cache en el VPS
- **Fix**: Cron job diario con `docker builder prune`, Docker daemon con log rotation (`max-size: 10m`, `max-file: 3`)
- **Aplicar en**: Todo proyecto con Docker + Dokploy en VPS

### 2026-02-26: Configurar SSH con alias + key dedicada desde el día 0
- **Error**: Pérdida de acceso SSH al VPS al cambiar de máquina
- **Fix**: Crear `~/.ssh/id_ed25519_<proyecto>` + `~/.ssh/config` con alias + sudoers passwordless
- **Aplicar en**: Todo VPS nuevo

### 🎨 Tailwind CSS — ContentOps

### 2026-03-04: Color scales en Tailwind DEBEN tener DEFAULT
- **Error**: `bg-primary` era invisible porque `primary` se definió como scale (50-950) sin valor `DEFAULT`
- **Fix**: Agregar `DEFAULT: '#0A66C2'` al color primary en `tailwind.config.ts`. Toda color scale custom DEBE incluir `DEFAULT`
- **Aplicar en**: Todo proyecto con Tailwind que defina color scales custom

---

*V4: Todo es un Skill. Agent-First. El usuario habla, tu construyes. (27 aprendizajes activos)*
