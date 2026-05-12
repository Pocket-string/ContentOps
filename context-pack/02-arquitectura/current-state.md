# Estado Actual -- LinkedIn ContentOps
> Snapshot: 2026-02-26 | Build: af6775c | Dominio: contentops.jonadata.cloud

---

## 1. Tech Stack

| Capa | Tecnologia |
|------|-----------|
| Framework | Next.js 16 + React 19 + TypeScript 5.7 |
| Estilos | Tailwind CSS 3.4 + shadcn/ui (new-york) |
| Backend | Supabase (Auth + PostgreSQL + Storage + RLS) |
| AI Primario | Gemini 2.5 Flash via Vercel AI SDK v6 (`ai@^6.0.97`, `@ai-sdk/google@^3.0.30`) |
| AI Reviewer | OpenAI GPT-4o-mini (`@ai-sdk/openai@^3.0.31`) |
| AI Fallback | OpenRouter (cuando Gemini falla) |
| Validacion | Zod 3.24 |
| Estado | Zustand 5.0.9 |
| Charts | Recharts 3.7 |
| Export | JSZip 3.10.1 (client-side ZIP) |
| XLSX Import | xlsx 0.18.5 |
| Package Manager | pnpm 9.15.4 (corepack) |
| Deploy | Docker 4-stage -> Dokploy -> VPS (72.60.143.251) |
| Testing | Playwright (config presente, tests pendientes) |

---

## 2. Feature Map (16 features en src/features/)

| Feature | Ruta Principal | Estado | Componentes Clave |
|---------|---------------|--------|-------------------|
| auth | `/login`, `/signup` | Completo | LoginForm, SignupForm, ForgotPasswordForm, UpdatePasswordForm |
| research | `/research`, `/research/new`, `/research/[id]` | Completo | ResearchList, ResearchForm, ResearchDetail, DeepResearchPanel, TagInput |
| topics | `/topics`, `/topics/new`, `/topics/[id]` | Completo | TopicList, TopicForm |
| campaigns | `/campaigns`, `/campaigns/new`, `/campaigns/[id]` | Completo | CampaignList, CampaignForm, CampaignBuilder, WeeklyBriefForm |
| posts | `/campaigns/[id]/posts/[day]` | Completo | PostEditor, CriticPanel, RecipeValidator |
| visuals | `/campaigns/[id]/visuals/[day]` | Completo | VisualEditor, ConceptSelector, CarouselEditor, ImageGenerator, VisualCriticPanel, VisualValidator |
| conversion | `/campaigns/[id]/conversion` | Completo | ConversionPanel |
| export | `/campaigns/[id]/export` | Completo | ExportPanel |
| analytics | `/campaigns/[id]/metrics` | Completo | MetricsPanel, MetricsMiniChart, WeekComparisonBar |
| brand | `/settings/brand` | Completo | BrandEditor |
| patterns | `/patterns` | Completo | PatternLibrary |
| insights | `/insights` | Completo | InsightsDashboard, WeeklyTrendsChart |
| orchestrator | (ChatWidget flotante en todas las paginas auth) | Completo | ChatWidget (Zustand store) |
| prompts | (no tiene ruta propia) | Completo | Templates: copy-template, research-template, visual-json-template |
| import | (no tiene ruta propia) | Completo | Parsers: copy-parser, visual-parser |
| qa | (no tiene ruta propia) | Completo | QAScoreCard |

---

## 3. Mapa de Rutas

### Rutas de App (autenticadas)

```
/dashboard                          -- Panel principal con metricas
/research                           -- Lista de investigaciones
/research/new                       -- Nueva investigacion (Grounded Research)
/research/[id]                      -- Detalle de investigacion
/research/[id]/edit                 -- Editar investigacion
/topics                             -- Lista de topics
/topics/new                         -- Nuevo topic
/topics/[id]                        -- Detalle de topic
/campaigns                          -- Lista de campanas
/campaigns/new                      -- Nueva campana
/campaigns/[id]                     -- Builder de campana (grid Lun-Vie)
/campaigns/[id]/posts/[day]         -- Editor de copy (3 variantes)
/campaigns/[id]/visuals/[day]       -- Editor visual (concepto + imagen)
/campaigns/[id]/conversion          -- Keyword CTA, recursos, templates DM
/campaigns/[id]/export              -- Export Pack ZIP
/campaigns/[id]/metrics             -- Metricas + learnings
/insights                           -- Dashboard de mejora continua
/patterns                           -- Biblioteca de patrones
/settings/brand                     -- Editor de perfil de marca
```

### Rutas Auth

```
/login                              -- Login (email/password)
/signup                             -- Registro
/check-email                        -- Confirmar email
/forgot-password                    -- Recuperar password
/update-password                    -- Actualizar password
```

### API Routes

| Endpoint | Metodo | Proposito | Rate Limit |
|----------|--------|-----------|-----------|
| `/api/ai/generate-copy` | POST | Genera 3 variantes de copy via Gemini | 10/min |
| `/api/ai/iterate` | POST | Itera copy con feedback | 10/min |
| `/api/ai/critic-copy` | POST | CopyCritic: D/G/P/I scoring + hallazgos | 10/min |
| `/api/ai/generate-visual-json` | POST | JSON de prompt visual para Nano Banana | 10/min |
| `/api/ai/iterate-visual` | POST | Itera prompt visual con feedback | 10/min |
| `/api/ai/generate-visual-concepts` | POST | 3 opciones de concepto visual | 10/min |
| `/api/ai/critic-visual` | POST | VisualCritic: legibilidad + coherencia marca | 10/min |
| `/api/ai/generate-image` | POST | Generacion de imagen via Gemini | 5/min |
| `/api/ai/generate-carousel` | POST | Generacion de slides de carousel | 10/min |
| `/api/ai/synthesize-research` | POST | Sintesis AI de investigacion | 10/min |
| `/api/research/grounded-research` | POST | Investigacion con Google Search Grounding | 3/min |
| `/api/chat` | POST | Orchestrator chat (streaming + tools) | 30/min |
| `/api/chat/session` | GET/POST | Cargar/crear sesion de chat | -- |
| `/api/chat/session/save` | POST | Persistir mensajes de sesion | -- |
| `/api/chat/feedback` | POST | Thumbs up/down en mensajes | -- |
| `/api/analytics/import-xlsx` | POST | Importar analytics LinkedIn desde XLSX | -- |

---

## 4. Base de Datos (Resumen)

15+ tablas tras 11 migraciones. Ver [database.md](database.md) para detalle completo.

**Tablas principales**: workspaces, workspace_members, research_reports, topics, campaigns, posts, post_versions, visual_versions, visual_concepts, critic_reviews, brand_profiles, pattern_library, carousel_slides, assets, metrics, learnings, orchestrator_sessions, orchestrator_actions, orchestrator_learnings

**Patron de seguridad**: RLS en todas las tablas. Aislamiento por workspace via `workspace_members`.

---

## 5. Cambios Recientes (ultimos 30 commits)

### Operaciones
- `af6775c` ops: Docker disk cleanup scripts, log rotation, optimized .dockerignore

### Bug Fixes
- `bf3319e` fix(posts): day swap deferrable constraint + recipe validator save stability
- `091d4bf` fix: keyword null error, recipe validator stability, atomic day swap
- `94436b5` fix(campaigns): day swap constraint, keyword edit, recipe validator score stability
- `de004cd` fix(visuals): resolve RLS violation for visual critic reviews
- `d92c0d6` fix(visuals): human-readable download filenames
- `92390f3` fix(research): unify AI synthesis formats, fix null validation
- `965a02a` fix(research): use text-based JSON instead of generateObject
- `916324b` fix(research): robust fallback for schema validation failures
- `36156ba` fix(research): auto-save AI results, pre-fill topics, relax schema
- `ffac990` fix(research): two-pass approach for grounded research
- `d49480b` fix(ai): upgrade from deprecated gemini-2.0-flash to gemini-2.5-flash

### Performance
- `09c1eeb` perf: optimize fonts, parallel fetches, carousel batching, ISR, dynamic imports

### Features
- `4c3d882` feat(campaigns): post frequency selection, published toggle, XLSX published-only
- `9416ceb` feat(ux): recipe validator, day selector, LinkedIn XLSX import
- `ca4e783` feat(ux): dashboard score fix, campaign enrichment, variant comparison, visual context
- `7ce9223` feat(visuals): implement LinkedIn carousel support
- `bcc7838` feat(visuals): add download button for generated images
- `3dbf65a` refactor(posts): remove manual D/G/P/I rubric from PostEditor
- `f5a09a3` feat(orchestrator): enrich system prompt with domain knowledge
- `0a9882f` feat(orchestrator): add runGroundedResearch tool
- `984d5da` feat(orchestrator): Phase 3-6 -- sessions, action logging, learning loop
- `792592b` feat(orchestrator): Phase 2 -- tool calling, feedback UI, learning service
- `e4cb0bd` feat(orchestrator): add AI chat widget with streaming
- `bd723ec` feat(ai): fix copy generation, upgrade CriticPanel, rename variants
- `2ed649d` feat(flow): preserve research context through entire content pipeline
- `905bf81` feat(audit): breadcrumbs, better placeholders, topic link in header
- `2dab751` feat(audit): add topic detail page + research edit page
- `374fd88` feat(analytics): Sprint E -- recharts visualizations + week-over-week comparison
- `2307a8d` feat(prompts+import): Sprint D -- prompt templates + import bridge

---

## 6. Seguridad (8 capas implementadas)

| Capa | Implementacion | Archivo |
|------|---------------|---------|
| 1. Env Validation | Zod schema, falla al arrancar si faltan vars | `src/lib/env.ts` |
| 2. Security Headers | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy | `next.config.ts` |
| 3. Input Validation | Zod en cada Server Action y API route | Cada action/route |
| 4. RLS | Habilitado en misma migracion que crea tabla. Patron workspace_members | `supabase/migrations/` |
| 5. Rate Limiting | 5 limiters: AI (10/min), image (5/min), export (5/min), research (3/min), chat (30/min) | `src/lib/rate-limit.ts` |
| 6. Auth Middleware | Rutas publicas configurables, session refresh | `src/middleware.ts` |
| 7. Secrets | .env* en .gitignore, nunca en codigo | `.gitignore` |
| 8. Sanitizacion | Filenames en Content-Disposition para exports/descargas | Export service |

---

## 7. Gaps Conocidos

| Area | Estado | Prioridad |
|------|--------|-----------|
| E2E Tests (Playwright) | Config presente pero tests legacy (LexAgenda). No hay tests ContentOps | Alta |
| CI/CD | Sin GitHub Actions ni pipeline automatizado | Media |
| Seed Data | Solo legacy LexAgenda. No hay seed para ContentOps | Baja |
| PWA / Offline | No implementado | Baja |
| i18n | Solo espanol | Baja |
| Webhook Dokploy | Deploy manual (no auto-deploy on push) | Media |

---

*Para mas detalle, ver los docs especializados en [INDEX.md](INDEX.md)*
