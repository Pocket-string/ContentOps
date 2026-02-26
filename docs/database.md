# Base de Datos -- LinkedIn ContentOps

> 11 migraciones | PostgreSQL via Supabase | RLS en todas las tablas

---

## Tabla de Contenidos

1. [Resumen de Tablas](#1-resumen-de-tablas)
2. [Historial de Migraciones](#2-historial-de-migraciones)
3. [Diagrama de Relaciones (ASCII)](#3-diagrama-de-relaciones-ascii)
4. [Patron RLS](#4-patron-rls)
5. [Funciones SQL](#5-funciones-sql)
6. [Storage (Supabase Storage)](#6-storage-supabase-storage)

---

## 1. Resumen de Tablas

### 1.1 workspaces

Tabla raiz de aislamiento multi-tenant. Toda entidad del sistema pertenece a un workspace.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `name` | text | NOT NULL | Nombre del workspace |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |
| `updated_at` | timestamptz | NOT NULL, default `now()` | Auto-actualizado via trigger |

**RLS**: Solo miembros del workspace pueden acceder.
**Trigger**: `trg_workspaces_updated_at` -> `update_updated_at()`

---

### 1.2 workspace_members

Tabla junction que asocia usuarios (`auth.users`) a workspaces con roles.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `workspace_id` | uuid | PK (compuesto), FK -> `workspaces(id)` ON DELETE CASCADE | Workspace |
| `user_id` | uuid | PK (compuesto), FK -> `auth.users(id)` ON DELETE CASCADE | Usuario |
| `role` | text | NOT NULL, default `'collaborator'`, CHECK `('admin','editor','collaborator')` | Rol del miembro |
| `joined_at` | timestamptz | NOT NULL, default `now()` | Fecha de union |

**Indices**: `idx_workspace_members_user(user_id)`
**RLS**: Dos politicas -- `members_own` (el usuario ve sus propias membresías) y `members_admin_manage` (admins gestionan miembros).

---

### 1.3 research_reports

Investigaciones importadas (Perplexity, articulos, etc.) con campos estructurados para analisis AI.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `workspace_id` | uuid | NOT NULL, FK -> `workspaces(id)` ON DELETE CASCADE | Workspace propietario |
| `title` | text | NOT NULL | Titulo de la investigacion |
| `source` | text | nullable | Fuente (URL, nombre de publicacion) |
| `raw_text` | text | NOT NULL | Texto completo de la investigacion |
| `tags_json` | jsonb | NOT NULL, default `'[]'` | Tags categorizando la investigacion |
| `created_by` | uuid | NOT NULL, FK -> `auth.users(id)` | Usuario que la creo |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |
| `updated_at` | timestamptz | NOT NULL, default `now()` | Auto-actualizado via trigger |
| `recency_date` | date | nullable | *[002]* Fecha de relevancia del dato |
| `market_region` | text | nullable | *[002]* Region de mercado (ej. LATAM, EU) |
| `buyer_persona` | text | nullable | *[002]* Perfil del comprador objetivo |
| `trend_score` | smallint | CHECK `0-10` | *[002]* Puntuacion de tendencia |
| `fit_score` | smallint | CHECK `0-10` | *[002]* Ajuste al perfil de contenido |
| `evidence_links` | jsonb | default `'[]'` | *[002]* Links de evidencia |
| `key_takeaways` | jsonb | default `'[]'` | *[002]* Conclusiones clave |
| `recommended_angles` | jsonb | default `'[]'` | *[002]* Angulos de contenido sugeridos |
| `ai_synthesis` | jsonb | nullable | *[002]* Resumen generado por AI |

**Indices**: `idx_research_workspace(workspace_id)`, `idx_research_tags(tags_json)` GIN
**Trigger**: `trg_research_updated_at` -> `update_updated_at()`

---

### 1.4 topics

Backlog de temas para campanas, con hipotesis, evidencia y el concepto "enemigo silencioso".

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `workspace_id` | uuid | NOT NULL, FK -> `workspaces(id)` ON DELETE CASCADE | Workspace propietario |
| `title` | text | NOT NULL | Titulo del tema |
| `hypothesis` | text | nullable | Hipotesis principal |
| `evidence` | text | nullable | Evidencia que soporta la hipotesis |
| `anti_myth` | text | nullable | Mito que se desmonta |
| `signals_json` | jsonb | NOT NULL, default `'[]'` | Senales del mercado |
| `fit_score` | smallint | CHECK `0-10` | Ajuste al perfil |
| `priority` | text | NOT NULL, default `'medium'`, CHECK `('low','medium','high')` | Prioridad |
| `status` | text | NOT NULL, default `'backlog'`, CHECK `('backlog','selected','used','archived')` | Estado en pipeline |
| `created_by` | uuid | NOT NULL, FK -> `auth.users(id)` | Creador |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |
| `updated_at` | timestamptz | NOT NULL, default `now()` | Auto-actualizado via trigger |
| `silent_enemy_name` | text | nullable | *[002]* Nombre del "enemigo silencioso" |
| `minimal_proof` | text | nullable | *[002]* Prueba minima viable |
| `failure_modes` | jsonb | default `'[]'` | *[002]* Modos de falla posibles |
| `expected_business_impact` | text | nullable | *[002]* Impacto de negocio esperado |
| `recommended_week_structure` | jsonb | nullable | *[002]* Estructura semanal sugerida |

**Indices**: `idx_topics_workspace(workspace_id)`, `idx_topics_status(workspace_id, status)`
**Trigger**: `trg_topics_updated_at` -> `update_updated_at()`

---

### 1.5 campaigns

Campanas semanales (L-V) con un tema, keyword, brief y plan de publicacion.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `workspace_id` | uuid | NOT NULL, FK -> `workspaces(id)` ON DELETE CASCADE | Workspace propietario |
| `topic_id` | uuid | FK -> `topics(id)` ON DELETE SET NULL | Tema asociado |
| `week_start` | date | NOT NULL | Lunes de la semana de publicacion |
| `keyword` | text | nullable | Keyword SEO principal |
| `resource_json` | jsonb | NOT NULL, default `'{}'` | Recursos de la campana |
| `audience_json` | jsonb | NOT NULL, default `'{}'` | Audiencia objetivo |
| `status` | text | NOT NULL, default `'draft'`, CHECK `('draft','in_progress','ready','published','archived')` | Estado de la campana |
| `created_by` | uuid | NOT NULL, FK -> `auth.users(id)` | Creador |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |
| `updated_at` | timestamptz | NOT NULL, default `now()` | Auto-actualizado via trigger |
| `weekly_brief` | jsonb | nullable | *[003]* Brief semanal generado por AI |
| `publishing_plan` | jsonb | nullable | *[003]* Plan de publicacion L-V |

**Indices**: `idx_campaigns_workspace(workspace_id)`, `idx_campaigns_week(workspace_id, week_start)`, `idx_campaigns_topic(topic_id)`
**Trigger**: `trg_campaigns_updated_at` -> `update_updated_at()`

---

### 1.6 posts

Posts individuales dentro de una campana, uno por dia (L-V), con etapa de funnel.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `campaign_id` | uuid | NOT NULL, FK -> `campaigns(id)` ON DELETE CASCADE | Campana padre |
| `day_of_week` | smallint | NOT NULL, CHECK `1-5` | Dia (1=Lunes, 5=Viernes) |
| `funnel_stage` | text | NOT NULL, CHECK `('tofu_problem','mofu_problem','tofu_solution','mofu_solution','bofu_conversion')` | Etapa del funnel |
| `objective` | text | nullable | Objetivo del post |
| `status` | text | NOT NULL, default `'draft'`, CHECK `('draft','review','needs_human_review','approved','published')` | Estado *[004: agrego needs_human_review]* |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |
| `updated_at` | timestamptz | NOT NULL, default `now()` | Auto-actualizado via trigger |

**Indices**: `idx_posts_campaign(campaign_id)`, `idx_posts_campaign_day(campaign_id, day_of_week)` UNIQUE
**Trigger**: `trg_posts_updated_at` -> `update_updated_at()`
**Nota**: El indice unico `idx_posts_campaign_day` es DEFERRABLE para permitir swap atomico via `swap_post_days()`.

---

### 1.7 post_versions

Variantes de copy para cada post (contrarian, story, data_driven). Multiples versiones con una marcada como `is_current`.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `post_id` | uuid | NOT NULL, FK -> `posts(id)` ON DELETE CASCADE | Post padre |
| `version` | smallint | NOT NULL, default `1` | Numero de version |
| `variant` | text | NOT NULL, default `'contrarian'`, CHECK `('contrarian','story','data_driven')` | Tipo de variante |
| `content` | text | NOT NULL, default `''` | Texto del copy |
| `score_json` | jsonb | nullable | Puntuaciones D/G/P/I |
| `notes` | text | nullable | Notas del editor |
| `is_current` | boolean | NOT NULL, default `false` | Version activa para publicacion |
| `created_by` | uuid | NOT NULL, FK -> `auth.users(id)` | Creador |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |
| `structured_content` | jsonb | nullable | *[003]* Contenido estructurado (hook, body, CTA) |

**Indices**: `idx_post_versions_post(post_id)`, `idx_post_versions_current(post_id) WHERE is_current = true` (partial)

---

### 1.8 visual_versions

Versiones visuales con prompts JSON para herramientas de diseno (Nano Banana Pro). Soporta imagenes individuales y carouseles.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `post_id` | uuid | NOT NULL, FK -> `posts(id)` ON DELETE CASCADE | Post padre |
| `version` | smallint | NOT NULL, default `1` | Numero de version |
| `format` | text | NOT NULL, default `'1:1'` | Formato (1:1, 4:5, etc.) |
| `prompt_json` | jsonb | NOT NULL, default `'{}'` | Prompt JSON para la herramienta de diseno |
| `qa_json` | jsonb | nullable | Resultado del QA visual |
| `image_url` | text | nullable | URL de la imagen generada |
| `status` | text | NOT NULL, default `'draft'`, CHECK `('draft','pending_qa','approved','rejected')` | Estado de aprobacion |
| `created_by` | uuid | NOT NULL, FK -> `auth.users(id)` | Creador |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |
| `concept_type` | text | nullable | *[004]* Tipo de concepto visual |
| `nanobanana_run_id` | text | nullable | *[006]* ID del run en Nano Banana Pro |
| `output_asset_id` | uuid | FK -> `assets(id)` | *[006]* Asset generado |
| `qa_notes` | text | nullable | *[006]* Notas del QA visual |
| `iteration_reason` | text | nullable | *[006]* Razon de la iteracion |
| `slide_count` | smallint | nullable | *[011]* NULL=imagen unica, 2-10=carousel |

**Indices**: `idx_visual_versions_post(post_id)`

---

### 1.9 carousel_slides

Slides individuales de un carousel, cada uno con su propio prompt, imagen y texto.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `visual_version_id` | uuid | NOT NULL, FK -> `visual_versions(id)` ON DELETE CASCADE | Version visual padre |
| `slide_index` | smallint | NOT NULL, CHECK `0-9` | Posicion del slide (0-based) |
| `prompt_json` | jsonb | NOT NULL, default `'{}'` | Prompt JSON del slide individual |
| `image_url` | text | nullable | URL de la imagen generada |
| `headline` | text | nullable | Titulo del slide |
| `body_text` | text | nullable | Texto del cuerpo |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |

**Constraint unico**: `(visual_version_id, slide_index)` -- no puede haber dos slides con el mismo indice.
**Indices**: `idx_carousel_slides_version(visual_version_id)`, `idx_carousel_slides_order(visual_version_id, slide_index)`

---

### 1.10 critic_reviews

Evaluaciones del CopyCritic y VisualCritic sobre versiones de copy o versiones visuales.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `post_version_id` | uuid | nullable, FK -> `post_versions(id)` ON DELETE CASCADE | Version de copy evaluada *[010: hecho nullable]* |
| `visual_version_id` | uuid | nullable, FK -> `visual_versions(id)` ON DELETE CASCADE | *[010]* Version visual evaluada |
| `critic_type` | text | NOT NULL, CHECK `('copy','visual')` | Tipo de critica |
| `score_json` | jsonb | nullable | Puntuaciones detalladas |
| `findings` | jsonb | default `'[]'` | Hallazgos de la revision |
| `suggestions` | jsonb | default `'[]'` | Sugerencias de mejora |
| `verdict` | text | CHECK `('pass','needs_work','rewrite')` | Veredicto final |
| `created_at` | timestamptz | default `now()` | Fecha de creacion |

**Constraint**: `critic_reviews_one_fk_check` -- exactamente una FK debe estar presente (`post_version_id` XOR `visual_version_id`).
**Indices**: `idx_critic_reviews_version(post_version_id)`, `idx_critic_reviews_visual_version(visual_version_id)`

---

### 1.11 visual_concepts

Conceptos visuales propuestos para un post antes de generar la version final.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `post_id` | uuid | NOT NULL, FK -> `posts(id)` ON DELETE CASCADE | Post padre |
| `concept_type` | text | NOT NULL, CHECK `('infographic_1x1','carousel_4x5','humanized_photo','data_chart','custom')` | Tipo de formato visual |
| `rationale` | text | NOT NULL | Justificacion del concepto |
| `layout` | text | nullable | Descripcion del layout propuesto |
| `text_budget` | text | nullable | Presupuesto de texto en la imagen |
| `data_evidence` | text | nullable | Datos que respaldan la propuesta |
| `risk_notes` | text | nullable | Riesgos identificados |
| `selected` | boolean | default `false` | Si fue seleccionado para produccion |
| `created_by` | uuid | FK -> `auth.users(id)` | Creador |
| `created_at` | timestamptz | default `now()` | Fecha de creacion |

**Indices**: `idx_visual_concepts_post(post_id)`

---

### 1.12 assets

Archivos subidos (imagenes, documentos) asociados a un workspace.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `workspace_id` | uuid | NOT NULL, FK -> `workspaces(id)` ON DELETE CASCADE | Workspace propietario |
| `type` | text | NOT NULL, default `'image'`, CHECK `('image','document','other')` | Tipo de asset |
| `url` | text | NOT NULL | URL publica del archivo |
| `metadata_json` | jsonb | NOT NULL, default `'{}'` | Metadata adicional (dimensiones, MIME, etc.) |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |

**Indices**: `idx_assets_workspace(workspace_id)`

---

### 1.13 metrics

Metricas de rendimiento por post (impressions, comments, etc.).

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `post_id` | uuid | NOT NULL, FK -> `posts(id)` ON DELETE CASCADE | Post medido |
| `impressions` | integer | NOT NULL, default `0` | Impresiones |
| `comments` | integer | NOT NULL, default `0` | Comentarios |
| `saves` | integer | NOT NULL, default `0` | Guardados |
| `shares` | integer | NOT NULL, default `0` | Compartidos |
| `leads` | integer | NOT NULL, default `0` | Leads generados |
| `notes` | text | nullable | Notas sobre las metricas |
| `captured_at` | timestamptz | NOT NULL, default `now()` | Fecha de captura |

**Indices**: `idx_metrics_post(post_id)` UNIQUE -- una sola fila de metricas por post.

---

### 1.14 learnings

Insights semanales extraidos de cada campana para mejora continua.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `campaign_id` | uuid | NOT NULL, FK -> `campaigns(id)` ON DELETE CASCADE | Campana analizada |
| `summary` | text | NOT NULL | Resumen del aprendizaje |
| `bullets_json` | jsonb | NOT NULL, default `'[]'` | Lista de puntos clave |
| `created_by` | uuid | NOT NULL, FK -> `auth.users(id)` | Creador |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |

**Indices**: `idx_learnings_campaign(campaign_id)`

---

### 1.15 brand_profiles

Perfiles de marca versionados con colores, tipografia, reglas de logo, estilo de imagen y tono.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `workspace_id` | uuid | NOT NULL, FK -> `workspaces(id)` ON DELETE CASCADE | Workspace propietario |
| `name` | text | NOT NULL, default `'Default'` | Nombre del perfil |
| `version` | smallint | NOT NULL, default `1` | Version del perfil |
| `is_active` | boolean | default `true` | Si es la version activa |
| `colors` | jsonb | NOT NULL, default con paleta Bitalize | Paleta de colores (primary, secondary, accent, background, text) |
| `typography` | jsonb | NOT NULL, default Inter | Tipografia (heading, body, style) |
| `logo_rules` | jsonb | NOT NULL, default esquina inferior derecha | Reglas de colocacion del logo |
| `imagery` | jsonb | NOT NULL, default editorial fotovoltaico | Estilo de imagenes (style, subjects, mood) |
| `tone` | text | NOT NULL, default `'profesional, tecnico pero accesible, confiable'` | Tono de voz |
| `negative_prompts` | jsonb | default lista de exclusiones | Prompts negativos para AI |
| `qa_checklist` | jsonb | default `'[]'` | Checklist de QA visual |
| `created_at` | timestamptz | default `now()` | Fecha de creacion |
| `updated_at` | timestamptz | default `now()` | Auto-actualizado via trigger |

**Indices**: `idx_brand_profiles_workspace(workspace_id)`
**Trigger**: `trg_brand_profiles_updated_at` -> `update_updated_at()`

---

### 1.16 pattern_library

Biblioteca de patrones reutilizables (hooks, CTAs, formatos visuales, angulos de tema, estructuras de contenido) con metricas de rendimiento para retrieval por AI.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `workspace_id` | uuid | NOT NULL, FK -> `workspaces(id)` ON DELETE CASCADE | Workspace propietario |
| `pattern_type` | text | NOT NULL, CHECK `('hook','cta','visual_format','topic_angle','content_structure')` | Tipo de patron |
| `content` | text | NOT NULL | Contenido del patron |
| `context` | jsonb | default `'{}'` | Contexto de uso |
| `performance` | jsonb | default `'{}'` | Metricas de rendimiento |
| `source_post_version_id` | uuid | FK -> `post_versions(id)` | Post version de origen |
| `source_campaign_id` | uuid | FK -> `campaigns(id)` | Campana de origen |
| `tags` | jsonb | default `'[]'` | Tags de clasificacion |
| `created_by` | uuid | FK -> `auth.users(id)` | Creador |
| `created_at` | timestamptz | default `now()` | Fecha de creacion |

**Indices**: `idx_pattern_library_workspace(workspace_id)`, `idx_pattern_library_type(workspace_id, pattern_type)`

---

### 1.17 orchestrator_sessions

Sesiones de chat del Orchestrator AI. Persisten conversaciones multi-turno.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `workspace_id` | uuid | NOT NULL, FK -> `workspaces(id)` ON DELETE CASCADE | Workspace |
| `user_id` | uuid | NOT NULL, FK -> `auth.users(id)` ON DELETE CASCADE | Usuario |
| `title` | text | nullable | Titulo de la sesion |
| `messages_json` | jsonb | NOT NULL, default `'[]'` | Historial de mensajes |
| `page_context` | jsonb | nullable | Contexto de pagina (modulo, IDs extraidos) |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |
| `updated_at` | timestamptz | NOT NULL, default `now()` | Auto-actualizado via trigger |

**Indices**: `idx_orchestrator_sessions_workspace(workspace_id)`, `idx_orchestrator_sessions_user(user_id)`
**Trigger**: `update_orchestrator_sessions_updated_at` -> `update_updated_at()`

---

### 1.18 orchestrator_actions

Log de acciones ejecutadas por el Orchestrator (que hizo, con que input/output, y si funciono).

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `session_id` | uuid | FK -> `orchestrator_sessions(id)` ON DELETE SET NULL | Sesion asociada |
| `workspace_id` | uuid | NOT NULL, FK -> `workspaces(id)` ON DELETE CASCADE | Workspace |
| `agent_type` | text | NOT NULL | Tipo de agente que ejecuto |
| `action_name` | text | NOT NULL | Nombre de la accion |
| `input_data` | jsonb | NOT NULL, default `'{}'` | Datos de entrada |
| `output_data` | jsonb | nullable | Datos de salida |
| `status` | text | NOT NULL, default `'pending'`, CHECK `('pending','success','failed')` | Estado de ejecucion |
| `error_message` | text | nullable | Mensaje de error si fallo |
| `executed_by` | uuid | NOT NULL, FK -> `auth.users(id)` | Usuario que ejecuto |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |

**Indices**: `idx_orchestrator_actions_session(session_id)`, `idx_orchestrator_actions_workspace(workspace_id)`

---

### 1.19 orchestrator_learnings

Feedback y outcomes para mejora continua del Orchestrator.

| Columna | Tipo | Constraint | Descripcion |
|---------|------|------------|-------------|
| `id` | uuid | PK, `gen_random_uuid()` | Identificador unico |
| `workspace_id` | uuid | NOT NULL, FK -> `workspaces(id)` ON DELETE CASCADE | Workspace |
| `action_id` | uuid | FK -> `orchestrator_actions(id)` ON DELETE SET NULL | Accion evaluada |
| `agent_type` | text | NOT NULL | Tipo de agente |
| `feedback_type` | text | NOT NULL, CHECK `('positive','negative','refinement')` | Tipo de feedback |
| `feedback_text` | text | nullable | Texto del feedback |
| `context_json` | jsonb | NOT NULL, default `'{}'` | Contexto del feedback |
| `created_by` | uuid | NOT NULL, FK -> `auth.users(id)` | Quien dio feedback |
| `created_at` | timestamptz | NOT NULL, default `now()` | Fecha de creacion |

**Indices**: `idx_orchestrator_learnings_workspace(workspace_id)`, `idx_orchestrator_learnings_agent(agent_type)`

---

## 2. Historial de Migraciones

| # | Archivo | Que creo/modifico | Por que |
|---|---------|-------------------|---------|
| 001 | `001_content_ops.sql` | Creo 11 tablas base: `workspaces`, `workspace_members`, `research_reports`, `topics`, `campaigns`, `posts`, `post_versions`, `visual_versions`, `assets`, `metrics`, `learnings`. Creo funcion `update_updated_at()`. Habilito RLS + triggers + indices en todas. | Setup inicial del schema completo para el pipeline de contenido: research -> topics -> campaigns -> posts -> versions -> metrics. |
| 002 | `002_research_topics_enriched.sql` | Agrego 8 columnas a `research_reports` (recency_date, market_region, buyer_persona, trend_score, fit_score, evidence_links, key_takeaways, recommended_angles, ai_synthesis). Agrego 5 columnas a `topics` (silent_enemy_name, minimal_proof, failure_modes, expected_business_impact, recommended_week_structure). | Enriquecer investigaciones con campos estructurados para deep research y agregar concepto de "enemigo silencioso" a topics. |
| 003 | `003_campaign_brief_structured_content.sql` | Agrego `weekly_brief` y `publishing_plan` a `campaigns`. Agrego `structured_content` a `post_versions`. | Soportar brief semanal generado por AI y contenido estructurado (hook, body, CTA) en variantes de copy. |
| 004 | `004_critic_reviews_visual_concepts.sql` | Creo tabla `critic_reviews`. Creo tabla `visual_concepts`. Agrego `concept_type` a `visual_versions`. Amplio CHECK de `posts.status` para incluir `'needs_human_review'`. | Implementar CopyCritic/VisualCritic agent y sistema de conceptos visuales pre-produccion. |
| 005 | `005_brand_profiles.sql` | Creo tabla `brand_profiles` con defaults para paleta Bitalize/fotovoltaico. | Perfiles de marca versionados para guiar generacion visual y mantener consistencia de marca. |
| 006 | `006_nanobanana_iterations.sql` | Agrego 4 columnas a `visual_versions`: `nanobanana_run_id`, `output_asset_id` (FK -> assets), `qa_notes`, `iteration_reason`. | Tracking de iteraciones con la herramienta de diseno Nano Banana Pro (run IDs, assets producidos, notas QA). |
| 007 | `007_pattern_library.sql` | Creo tabla `pattern_library`. | Biblioteca de patrones reutilizables (hooks, CTAs, formatos) con metricas de rendimiento para retrieval AI. |
| 008 | `008_visual_assets_storage.sql` | Creo bucket `visual-assets` en Supabase Storage con politicas de acceso. | Almacenamiento de imagenes generadas por AI (PNG, JPEG, WebP, max 10 MB). Public read, authenticated write/delete. |
| 009 | `009_orchestrator_memory.sql` | Creo 3 tablas: `orchestrator_sessions`, `orchestrator_actions`, `orchestrator_learnings`. RLS + indices + trigger updated_at. | Sistema de memoria persistente para el Orchestrator AI (chat sessions, action log, feedback/learning). |
| 010 | `010_critic_reviews_visual_fk.sql` | Agrego `visual_version_id` FK a `critic_reviews`. Hizo `post_version_id` nullable. Agrego constraint XOR. Actualizo RLS para dual-path. | Fix: critic_reviews solo tenia FK a post_versions, pero visual critics necesitaban referenciar visual_versions. Solucion: columna dedicada + constraint exactamente-una-FK. |
| 011 | `011_carousel_slides.sql` | Creo tabla `carousel_slides`. Agrego `slide_count` a `visual_versions`. | Soporte de carouseles multi-slide (2-10 slides), cada slide con prompt, imagen, headline y body independientes. |

---

## 3. Diagrama de Relaciones (ASCII)

```
                            auth.users
                                |
                                | (user_id FK)
                                v
  +-------------+     +--------------------+
  | workspaces  |<--->| workspace_members  |
  +-------------+     +--------------------+
        |                    |
        | (workspace_id FK en todas las tablas hijas)
        |
        +----------------------------------------------------------+
        |              |              |              |              |
        v              v              v              v              v
  +-----------+  +-----------+  +----------+  +---------+  +------------------+
  | research_ |  |  topics   |  |  assets  |  | brand_  |  | pattern_library  |
  | reports   |  |           |  |          |  |profiles |  |                  |
  +-----------+  +-----------+  +----------+  +---------+  +------------------+
                      |              ^
                      | (topic_id)   | (output_asset_id)
                      v              |
                +-----------+        |
                | campaigns |        |
                +-----------+        |
                   |     |           |
                   |     +-----------|-------> +------------+
                   |                 |         | learnings  |
                   v                 |         +------------+
              +----------+           |
              |  posts   |           |
              +----------+           |
              |    |    |            |
              |    |    +----------->+
              |    |
              v    v                v
  +---------------+   +------------------+   +------------------+
  | post_versions |   | visual_versions  |   | visual_concepts  |
  +---------------+   +------------------+   +------------------+
        |                   |        |
        |                   |        +---------> +------------------+
        |                   |                    | carousel_slides  |
        |                   |                    +------------------+
        v                   v
  +------------------------------+
  |       critic_reviews         |
  | (post_version_id XOR         |
  |  visual_version_id)          |
  +------------------------------+

  +----------+
  | metrics  | <--- posts (1:1 via post_id UNIQUE)
  +----------+


  === Orchestrator (independiente del pipeline de contenido) ===

  workspaces -+-> orchestrator_sessions --> orchestrator_actions
              |                                     |
              |                                     v
              +-------------------> orchestrator_learnings
```

### Detalle de cadena de FKs

```
workspaces
  +-- workspace_members (workspace_id, user_id)
  +-- research_reports (workspace_id)
  +-- topics (workspace_id)
  |     +-- campaigns (topic_id -> topics.id, SET NULL on delete)
  |           +-- learnings (campaign_id)
  |           +-- posts (campaign_id)
  |                 +-- post_versions (post_id)
  |                 |     +-- critic_reviews (post_version_id, nullable)
  |                 +-- visual_versions (post_id)
  |                 |     +-- critic_reviews (visual_version_id, nullable)
  |                 |     +-- carousel_slides (visual_version_id)
  |                 +-- visual_concepts (post_id)
  |                 +-- metrics (post_id, 1:1)
  +-- assets (workspace_id)
  |     ^-- visual_versions.output_asset_id
  +-- brand_profiles (workspace_id)
  +-- pattern_library (workspace_id)
  |     +-- source_post_version_id -> post_versions.id
  |     +-- source_campaign_id -> campaigns.id
  +-- orchestrator_sessions (workspace_id, user_id)
  |     +-- orchestrator_actions (session_id, SET NULL on delete)
  |           +-- orchestrator_learnings (action_id, SET NULL on delete)
  +-- orchestrator_learnings (workspace_id)
  +-- orchestrator_actions (workspace_id)
```

---

## 4. Patron RLS

### 4.1 Principio: Workspace Isolation

Toda tabla tiene RLS habilitado (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) en la **misma migracion** donde se crea la tabla. El patron fundamental es:

```sql
CREATE POLICY "tabla_workspace_isolation" ON public.tabla
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

Esto asegura que un usuario solo ve datos de workspaces donde es miembro. La funcion `auth.uid()` de Supabase retorna el `user_id` del JWT del usuario autenticado.

### 4.2 Tablas directas vs. indirectas

**Tablas con `workspace_id` directo** (patron simple):
- `workspaces`, `research_reports`, `topics`, `campaigns`, `assets`, `brand_profiles`, `pattern_library`
- `orchestrator_sessions`, `orchestrator_actions`, `orchestrator_learnings`

**Tablas sin `workspace_id`** (patron con JOIN chain):
- `posts` -> via `campaigns.workspace_id`
- `post_versions` -> via `posts.campaign_id -> campaigns.workspace_id`
- `visual_versions` -> via `posts.campaign_id -> campaigns.workspace_id`
- `visual_concepts` -> via `posts.campaign_id -> campaigns.workspace_id`
- `carousel_slides` -> via `visual_versions.post_id -> posts.campaign_id -> campaigns.workspace_id`
- `critic_reviews` -> dual path: via `post_versions` O via `visual_versions` (ambos llegan a `campaigns.workspace_id`)
- `metrics` -> via `posts.campaign_id -> campaigns.workspace_id`
- `learnings` -> via `campaigns.workspace_id`

### 4.3 Politicas especiales

**workspace_members** tiene dos politicas:

1. `members_own` -- `FOR ALL USING (user_id = auth.uid())`: el usuario ve sus propias membresías.
2. `members_admin_manage` -- `FOR ALL USING (workspace_id IN (SELECT ... WHERE role = 'admin'))`: los admins gestionan todos los miembros de su workspace.

**critic_reviews** tiene politica dual-path (desde migracion 010):

```sql
-- Path 1: via post_version_id -> post_versions -> posts -> campaigns -> workspace_members
-- Path 2: via visual_version_id -> visual_versions -> posts -> campaigns -> workspace_members
-- Conectados con OR
```

### 4.4 SECURITY DEFINER

La funcion `swap_post_days()` (ver seccion 5.2) usa `SECURITY DEFINER` para bypasear RLS durante el swap atomico de dias, ya que necesita hacer dos UPDATEs en la misma transaccion que temporalmente violan la constraint unica.

---

## 5. Funciones SQL

### 5.1 update_updated_at()

Funcion trigger reutilizable que actualiza `updated_at` automaticamente antes de cada UPDATE.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Tablas con este trigger**:
- `workspaces` (trg_workspaces_updated_at)
- `research_reports` (trg_research_updated_at)
- `topics` (trg_topics_updated_at)
- `campaigns` (trg_campaigns_updated_at)
- `posts` (trg_posts_updated_at)
- `brand_profiles` (trg_brand_profiles_updated_at)
- `orchestrator_sessions` (update_orchestrator_sessions_updated_at)

**Nota**: `post_versions`, `visual_versions`, `assets`, `metrics`, `learnings`, `critic_reviews`, `carousel_slides`, `pattern_library`, `orchestrator_actions` y `orchestrator_learnings` no tienen columna `updated_at` y por lo tanto no usan este trigger.

### 5.2 swap_post_days(post_a_id, post_b_id)

Funcion RPC que intercambia el `day_of_week` de dos posts dentro de la misma campana de forma atomica. Fue aplicada directamente en el SQL Editor de Supabase (no existe en los archivos de migracion).

**Comportamiento**:
1. Lee el `day_of_week` de ambos posts.
2. Ejecuta `SET CONSTRAINTS uq_posts_campaign_day DEFERRED` para deshabilitar temporalmente la constraint unica compuesta `(campaign_id, day_of_week)`.
3. Actualiza ambos posts con el dia del otro.
4. Al finalizar la transaccion, la constraint se re-evalua y se valida.

**Llamada desde codigo** (`post-service.ts`):
```typescript
const { error } = await supabase.rpc('swap_post_days', {
  post_a_id: currentPost.id,
  post_b_id: targetPost.id,
})
```

**Prerequisito**: El indice unico `idx_posts_campaign_day` debe ser `DEFERRABLE INITIALLY IMMEDIATE` para que `SET CONSTRAINTS ... DEFERRED` funcione dentro de la transaccion.

---

## 6. Storage (Supabase Storage)

### 6.1 Bucket: visual-assets

Creado en la migracion `008_visual_assets_storage.sql`.

| Propiedad | Valor |
|-----------|-------|
| **ID / Nombre** | `visual-assets` |
| **Publico** | Si (`public: true`) |
| **Tamano maximo** | 10 MB (10,485,760 bytes) |
| **MIME types permitidos** | `image/png`, `image/jpeg`, `image/webp` |

### 6.2 Politicas de acceso

| Politica | Operacion | Quien | Condicion |
|----------|-----------|-------|-----------|
| `visual_assets_select` | SELECT (lectura) | Todos (publico) | `bucket_id = 'visual-assets'` |
| `visual_assets_insert` | INSERT (subida) | `authenticated` | `bucket_id = 'visual-assets'` |
| `visual_assets_update` | UPDATE | `authenticated` | `bucket_id = 'visual-assets'` |
| `visual_assets_delete` | DELETE | `authenticated` | `bucket_id = 'visual-assets'` |

**Nota**: Las imagenes son de lectura publica (para uso en tags `<img src="...">` sin autenticacion), pero solo usuarios autenticados pueden subir, actualizar o eliminar archivos.

### 6.3 Relacion con tabla assets

Los archivos subidos a este bucket se registran en la tabla `assets` con la URL publica de Supabase Storage. La columna `visual_versions.output_asset_id` referencia `assets.id` para vincular versiones visuales con sus archivos generados.

---

## Apendice: Resumen rapido de tablas

| # | Tabla | Columnas | RLS | Trigger updated_at | Creada en |
|---|-------|----------|-----|--------------------|-----------|
| 1 | `workspaces` | 4 | Si | Si | 001 |
| 2 | `workspace_members` | 4 | Si | No | 001 |
| 3 | `research_reports` | 17 | Si | Si | 001 + 002 |
| 4 | `topics` | 17 | Si | Si | 001 + 002 |
| 5 | `campaigns` | 14 | Si | Si | 001 + 003 |
| 6 | `posts` | 8 | Si | Si | 001 + 004 |
| 7 | `post_versions` | 11 | Si | No | 001 + 003 |
| 8 | `visual_versions` | 15 | Si | No | 001 + 004 + 006 + 011 |
| 9 | `carousel_slides` | 7 | Si | No | 011 |
| 10 | `critic_reviews` | 9 | Si | No | 004 + 010 |
| 11 | `visual_concepts` | 10 | Si | No | 004 |
| 12 | `assets` | 5 | Si | No | 001 |
| 13 | `metrics` | 9 | Si | No | 001 |
| 14 | `learnings` | 5 | Si | No | 001 |
| 15 | `brand_profiles` | 13 | Si | Si | 005 |
| 16 | `pattern_library` | 10 | Si | No | 007 |
| 17 | `orchestrator_sessions` | 7 | Si | Si | 009 |
| 18 | `orchestrator_actions` | 10 | Si | No | 009 |
| 19 | `orchestrator_learnings` | 8 | Si | No | 009 |

**Total**: 19 tablas + 1 bucket de storage. Todas con RLS habilitado.
