# Requerimiento — App “LinkedIn ContentOps” (Bitalize)

## 0) Resumen ejecutivo
Construir una aplicación interna que transforme una **investigación semanal (Perplexity)** + un **tema (enemigo silencioso)** en un paquete completo listo para publicar en LinkedIn:

- **Plan semanal L–M–X–J–V** (TOFU/MOFU/BOFU).
- **Copy** para cada post usando la receta **Detener → Ganar → Provocar → Iniciar**.
- **Concepto visual** + **prompt JSON** listo para **Nano Banana Pro** (estilo editorial/brief técnico, formato 1:1 por defecto).
- **Iteración y QA** (v1 → feedback acotado 3–5 cambios → v2/v3).
- **Operación de conversión** (keyword + DM/form, evitando link externo en el cuerpo del post).
- **Export “Campaign Pack”** (copy + JSON + checklist + links) + tracking de métricas y aprendizajes.

---

## 1) Objetivos del producto
### 1.1 Objetivo principal
Reducir el tiempo y aumentar la consistencia para crear y operar una semana completa de contenido, manteniendo:
- rigor técnico,
- estilo editorial Bitalize,
- y conversión sin afectar alcance.

### 1.2 Objetivos medibles (MVP)
- Generar una campaña L–V completa en **< 30 minutos** (incluyendo 1 ronda de iteración).
- Mantener **versionado auditable** de copy/JSON y decisiones.
- Exportar un “pack” listo para ejecutar (copiar/pegar + JSON + checklist).

### 1.3 No objetivos (fuera de MVP)
- Publicación automática en LinkedIn.
- Generación automática de imágenes (si Nano Banana Pro no expone API, queda manual guiado).
- Integración directa Perplexity API (primero ingest manual del reporte).
- Analytics avanzado o atribución automática.

---

## 2) Usuarios, roles y permisos
### Roles
- **Admin (Founder):** crea campañas, aprueba, publica, define reglas.
- **Editor/Marketer:** ajusta copy, genera/itera visual JSON, QA, export.
- **Colaborador:** propone temas, carga research, sugiere variaciones, comenta.

### Permisos (alto nivel)
- Admin: CRUD completo + settings.
- Editor: CRUD sobre campañas/posts/versiones + export + métricas.
- Colaborador: crear borradores, comentar, proponer temas; no aprueba.

---

## 3) Flujo end-to-end (de research a publicación)
1) **Ingesta Research**: pegar/subir reporte de Perplexity.
2) **Topic Backlog**: extraer y taggear tendencias; seleccionar “enemigo silencioso”.
3) **Campaign Builder**: crear campaña semanal (tema, buyer persona, hipótesis, evidencias, anti-mito, keyword CTA, recurso).
4) **Plan L–V**: generar/editar secuencia TOFU/MOFU/BOFU.
5) **Posts**: para cada día:
   - generar **3 variantes** (contrarian / historia / data-driven),
   - evaluar con **rubrica D→G→P→I**,
   - editar y aprobar.
6) **Visuals**: por cada post aprobado:
   - derivar **idea visual única**,
   - elegir formato (1:1 por defecto; carrusel 4:5 si aplica),
   - generar **prompt JSON Nano Banana Pro**,
   - iterar con feedback acotado.
7) **QA final**: checklist copy + checklist visual.
8) **Export Pack**: paquete final para publicar.
9) **Tracking**: registrar métricas por post + aprendizajes semanales.

---

## 4) Scope MVP (funcionalidades)
### 4.1 Autenticación y workspace
- Supabase Auth.
- Workspaces con miembros y roles.

### 4.2 Research (Perplexity)
- Crear “Research Report” pegando texto o subiendo archivo.
- Tagging: tema, dolor, buyer persona, geografía, urgencia.
- Conversión de research → backlog de temas (manual asistido).

### 4.3 Topic Backlog
- CRUD de temas (enemigo silencioso).
- Campos: hipótesis, evidencias, señales, anti-mito, prioridad, fit core Bitalize.

### 4.4 Campaign Builder (semana)
- Crear campaña (semana + tema + keyword CTA + recurso).
- Definir: buyer persona, objetivo (TOFU/MOFU/BOFU), reglas de publicación.
- Generación automática de plan L–V (editable).

### 4.5 Post Editor (copy)
- Para cada día: generar **3 variantes**.
- Rubrica de score D/G/P/I.
- Editor con reglas: evitar link externo en cuerpo; CTA keyword; legibilidad móvil.
- Estados: Draft → Review → Approved → Published.
- Versionado de copy con historial.

### 4.6 Visual Generator (JSON → Nano Banana Pro)
- Derivar “visual brief” desde el copy final.
- Generar **prompt JSON** con:
  - formato (1:1 default),
  - layout y jerarquía,
  - estilo editorial/brief,
  - reglas de marca (logo fiel, ubicación, aire),
  - negative prompts.
- Versionado del JSON.
- Adjuntar imagen final (subida manual) + QA visual.

### 4.7 Conversión (keyword + recurso)
- Registrar recurso (Drive/Form URL, correo template, notas).
- Plantillas DM/comentario **copiar/pegar** sin placeholders.

### 4.8 Export “Campaign Pack”
- Exportar campaña completa como:
  - `copy.md` (posts L–V con estado Approved),
  - carpeta `/visual_prompts/` con JSON por post,
  - `checklist_publicacion.md`,
  - `links.md` (recursos, forms, etc.).

### 4.9 Métricas + aprendizajes
- Registro manual por post: impresiones, comentarios, guardados, shares, leads.
- “Weekly learnings” (3–5 bullets): hook, visual, CTA, fricción, oportunidades.

---

## 5) Reglas del sistema (core del método)
### 5.1 Metodología de copy
Cada post se construye y evalúa con:
- **Detener:** hook contrarian, entendible en 3–5s.
- **Ganar:** contexto + señales verificables + impacto negocio.
- **Provocar:** fricción positiva (pregunta de criterio, anti-mito).
- **Iniciar:** CTA concreto (keyword/guardar/DM/form), sin fricción.

### 5.2 Arquitectura semanal
- **Lunes:** Problema TOFU (instalar dolor + evidencia simple).
- **Martes:** Problema MOFU (señales/diagnóstico).
- **Miércoles:** Solución TOFU (enfoque sin vender).
- **Jueves:** Solución MOFU (mini-método + falsos positivos).
- **Viernes:** BOFU (recurso + keyword + entrega).

### 5.3 Visuales
- Estética: **editorial/brief técnico**.
- Formato default: **1:1** (cuadrado), salvo carrusel 4:5.
- Logo: fiel al original, consistente (normalmente bottom-left).
- Texto: mínimo indispensable y legible en móvil.

### 5.4 Conversión
- Evitar link externo en el cuerpo del post.
- Preferir keyword + DM / comentario fijado / formulario.

---

## 6) Requisitos funcionales en historias de usuario (con criterios de aceptación)
### 6.1 Research
**US-R1:** Como editor, quiero crear un Research Report pegando texto/subiendo archivo para guardar fuentes y tendencias.
- **AC:** puedo crear/editar; queda versionado; tiene tags.

**US-R2:** Como admin, quiero convertir un research en temas del backlog.
- **AC:** puedo crear temas desde el research (manual asistido) y asociar referencias.

### 6.2 Campaign
**US-C1:** Como admin, quiero crear una campaña semanal desde un tema.
- **AC:** campaña incluye semana, keyword, recurso, buyer persona y plan L–V editable.

### 6.3 Posts
**US-P1:** Como editor, quiero generar 3 variantes por día y compararlas.
- **AC:** se generan 3 variantes y quedan guardadas como versiones.

**US-P2:** Como admin, quiero calificar cada variante con rubrica D/G/P/I.
- **AC:** cada versión tiene score + notas; puedo elegir “Set as Current”.

**US-P3:** Como editor, quiero pasar el post por estados (Draft/Review/Approved/Published).
- **AC:** solo roles permitidos pueden aprobar/publicar.

### 6.4 Visuals
**US-V1:** Como editor, quiero generar un prompt JSON para Nano Banana Pro desde el copy aprobado.
- **AC:** el JSON incluye brand rules + negative prompts y se asocia al post.

**US-V2:** Como editor, quiero iterar el JSON con feedback acotado.
- **AC:** se crea nueva versión; el sistema mantiene historial y “diff” semántico (cambio resumido).

**US-V3:** Como editor, quiero subir la imagen generada y pasar QA.
- **AC:** checklist visual + estado “Approved”.

### 6.5 Export
**US-E1:** Como editor, quiero exportar la campaña completa.
- **AC:** se genera pack con copy + JSON + checklist + links.

### 6.6 Métricas
**US-M1:** Como admin, quiero registrar métricas por post.
- **AC:** formulario simple; resumen semanal automático.

---

## 7) Requisitos no funcionales
- **Auditabilidad:** versionado + autor + timestamp.
- **Performance:** UI rápida; generar campaña sin latencias excesivas.
- **Seguridad:** Supabase RLS por workspace.
- **Portabilidad:** export pack descargable.
- **Calidad:** lint + typecheck + tests mínimos.

---

## 8) Stack y arquitectura (alineado al README)
### 8.1 Tech stack
- **Next.js 16 App Router + TypeScript**
- **Supabase** (Postgres + Auth)
- **Tailwind CSS + shadcn/ui**
- **Zustand** (estado donde aporte)
- **Zod** (validaciones)
- **Jest + React Testing Library**
- Integración con **Claude Code** (PRPs, agentes, reglas)

### 8.2 Arquitectura Feature-First (estructura objetivo)
```
src/
  app/
    (auth)/
    (main)/
  features/
    auth/
    research/
    topics/
    campaigns/
    posts/
    visuals/
    conversion/
    analytics/
    settings/
  shared/
    components/
    lib/
    utils/
    types/
```

### 8.3 Páginas/Routes (MVP)
- `/login` `/signup`
- `/dashboard` (overview campañas)
- `/research` (reports)
- `/topics` (backlog)
- `/campaigns` (lista)
- `/campaigns/[id]` (builder L–V)
- `/campaigns/[id]/posts/[day]` (editor + versiones + score)
- `/campaigns/[id]/visuals` (JSON + QA)
- `/campaigns/[id]/export` (pack)
- `/campaigns/[id]/metrics` (tracking)

---

## 9) Modelo de datos (Supabase) — MVP
Tablas sugeridas:
- `workspaces` (id, name, created_at)
- `workspace_members` (workspace_id, user_id, role)
- `research_reports` (workspace_id, title, source, raw_text, tags_json, created_by, created_at)
- `topics` (workspace_id, title, hypothesis, evidence, anti_myth, signals_json, fit_score, status, created_at)
- `campaigns` (workspace_id, week_start, topic_id, keyword, resource_json, audience_json, status)
- `posts` (campaign_id, day_of_week, funnel_stage, objective, status)
- `post_versions` (post_id, version, content, score_json, notes, created_by, created_at)
- `visual_versions` (post_id, version, format, prompt_json, qa_json, image_asset_id, status)
- `assets` (workspace_id, type, url, metadata_json)
- `metrics` (post_id, impressions, comments, saves, shares, leads, notes, captured_at)
- `learnings` (campaign_id, summary, bullets_json, created_at)

**RLS:** todo por workspace; miembros ven solo su workspace.

---

## 10) Rubricas y checklists (operación)
### 10.1 Rubrica D/G/P/I (score)
- **Detener (0–5):** hook claro, contrarian, entendible en móvil.
- **Ganar (0–5):** evidencia + señales + impacto negocio.
- **Provocar (0–5):** pregunta/anti-mito que activa conversación.
- **Iniciar (0–5):** CTA concreto, sin fricción, sin link externo.

### 10.2 Checklist QA Copy
- Legible en móvil (párrafos 1–2 líneas).
- Sin relleno ni buzzwords.
- Señales verificables.
- CTA keyword claro (copiar/pegar).

### 10.3 Checklist QA Visual
- Formato correcto (1:1 default).
- Estilo editorial consistente.
- Texto mínimo y legible.
- Logo fiel y bien integrado.

---

## 11) Integración de IA (orquestación por etapas)

### 11.1 Vibe Planning (documentación, sin código)
**Prompt — Arquitectura (Deep Research):**

> Actúa como Senior Architect + Senior PM para una app interna llamada “LinkedIn ContentOps” de Bitalize.
>
> Contexto: La app automatiza la creación semanal de contenidos para LinkedIn en el nicho O&M fotovoltaico con datos/SCADA/BI/IA. El proceso operativo es:
> - Temas semanales basados en investigación profunda (Perplexity) y filtrados por fit con core Bitalize.
> - Plan semanal L–M–X–J–V (TOFU/MOFU/BOFU).
> - Copy siguiendo Detener → Ganar → Provocar → Iniciar, con 3 variantes por post y ciclo de iteración.
> - Visuales generados como prompts JSON para Nano Banana Pro (estilo editorial/periódico, formato 1:1 por defecto, logo fiel).
> - Operación de conversión con keyword + entrega por DM/form (evitar link externo en el cuerpo del post).
> - Tracking de métricas y aprendizajes semanales.
>
> Stack obligado:
> Next.js 16 (App Router) + TypeScript + Supabase (DB/Auth) + Tailwind + shadcn/ui + Zustand + Zod + Jest.
> Arquitectura: Feature-First.
>
> Entregables:
> 1) Arquitectura en palabras (componentes, módulos, flujos, boundaries).
> 2) Propuesta de modelo de datos (tablas, relaciones, RLS).
> 3) Flujos críticos (Research→Campaign→Posts→Visual JSON→Export→Metrics).
> 4) Estrategia MVP vs v2 (evitar sobreingeniería).
> No escribas código.

**Prompt — Features (Filters) (Deep Research):**

> Actúa como Product Manager. Define las funcionalidades usando historias de usuario + criterios de aceptación.
> Incluye: Workspaces/roles, Research Perplexity, Topic backlog, Campaign L–V, Copy D/G/P/I (3 variantes + score + editor), Visual JSON Nano Banana Pro (brand rules + negative prompts + versionado + QA), CTA keyword + recurso, Export Pack, métricas y aprendizajes.
> No escribas código. Prioriza MVP y lista explícitamente lo que NO entra.

**Prompt — Plan de acción (tareas ejecutables):**

> Eres Senior PM. Con base en /docs/architecture.md y /docs/features.md, genera un plan paso a paso en tareas pequeñas con objetivo, pasos, DoD, archivos involucrados (feature-first) y pruebas mínimas. No escribas código: solo tareas concretas para ejecutar en Claude Code.

**Acción usuario (refinamiento):** guardar outputs como:
- `/docs/architecture.md`
- `/docs/features.md`
- `/docs/action-plan.md`

### 11.2 Vibe Design (referencias UI)
**Prompt — Google Stitch:**

> Diseña una web app interna llamada “LinkedIn ContentOps” para Bitalize.
> Estilo: técnico/editorial (brief de operación), minimalista, alto contraste, no look marketing/ecommerce.
> UI: sidebar + workspace, tablas con estados, editor con versiones, panel de score D/G/P/I, generador de JSON con validaciones, checklist QA.
> Pantallas: Login, Dashboard, Research, Topics, Campaign Builder, Post Editor, Visual Generator, Export, Metrics.

**Acción usuario:** guardar capturas en `/design/` (solo referencia; no copiar HTML/CSS).

### 11.3 Vibe Coding (ejecución iterativa)
**Rules para Claude Code (system prompt del repo):**
- Fuente de verdad: `/docs/*.md`.
- Feature-first estricto (todo dentro de `src/features/<feature>`).
- No implementar v2 en MVP.
- UI con shadcn/ui + Tailwind.
- Validaciones con Zod.
- Tests mínimos donde aporte.

---

## 12) Plan de entrega (fases)
### Fase 0 — Setup (1–2 días)
- Repo base con template.
- Supabase project + env + migraciones iniciales.
- Estructura feature-first.

### Fase 1 — MVP Core (1–2 semanas)
- Workspaces/roles.
- Research + Topics.
- Campaign Builder (L–V).
- Post Editor + versiones + rubrica.

### Fase 2 — Visuals + Export (1 semana)
- Visual JSON generator + versionado + QA.
- Export pack.

### Fase 3 — Metrics + Learnings (3–5 días)
- Métricas manuales + resumen semanal.

---

## 13) Criterios de aceptación del MVP
- Crear campaña semanal desde research y tema.
- Generar 5 posts L–V con 3 variantes y elegir una.
- Generar JSON Nano Banana Pro por post y versionarlo.
- Adjuntar imagen + QA visual.
- Exportar pack completo.
- Registrar métricas y aprendizajes.

---

## 14) Riesgos y mitigaciones
- **Texto ilegible en imágenes**: preferir mínimo texto y jerarquía, QA manual.
- **No API Nano Banana Pro**: mantener como paso manual guiado.
- **Sobreingeniería**: mantener lista “NO MVP” y bloquear features.
- **Consistencia de marca**: checklist + reglas y validaciones en JSON.

---

## 15) Entregables del repositorio
- `/docs/architecture.md`
- `/docs/features.md`
- `/docs/action-plan.md`
- `/design/` (capturas referencia)
- App funcional con módulos MVP.

