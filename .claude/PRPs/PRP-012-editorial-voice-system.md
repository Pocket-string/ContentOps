# PRP-012: Sistema Editorial Founder-Led + Capa Humanizadora + Auditor Anti-IA

> **Estado**: PENDIENTE DE APROBACIÓN — refinamientos research aplicados 2026-05-11
> **Fecha**: 2026-05-09 (refinado 2026-05-11 con deep research)
> **Proyecto**: LinkedIn ContentOps (Bitalize)
> **Reporte fuente**: [docs/Contenido/reporte_estrategia_copywriting_linkedin_bitalize.md](docs/Contenido/reporte_estrategia_copywriting_linkedin_bitalize.md)
> **Plan de ejecución**: [.claude/PRPs/PRP-012-execution-plan.md](.claude/PRPs/PRP-012-execution-plan.md)
> **Research backing**: [.claude/memory/reference_linkedin_b2b_research_2026.md](.claude/memory/reference_linkedin_b2b_research_2026.md)

---

## Objetivo

Implementar la capa editorial superior + sistema de humanización + auditor anti-IA que el reporte estratégico exige, para que las publicaciones generadas dejen de sonar a "consultora genérica de IA" y suenen a "fundador técnico que entiende O&M FV". Resultado esperado: 6 pilares editoriales + 4 audiencias ICP + 5 estructuras founder-led asignadas semanalmente + endpoint Humanizer + endpoint Auditor Naturalidad (0-50), todo desplegado en `contentops.jonadata.cloud` y validado con loop de Karpathy en producción.

## Por Qué

| Problema | Solución | Evidencia 2025-2026 |
|----------|----------|---------------------|
| Posts generados suenan corporativos/genéricos (templados, "olor a IA") | Banned phrases como filtro de CALIDAD (~20 patrones) + tabla de sustitución concreta | Contenido AI-genérico: **30-55% menos reach** ([AI Monks 2025](https://medium.com/aimonks/why-not-to-use-ai-for-your-linkedin-content-huge-impact-on-reach-and-engagement-d443e8f17fba)). El algoritmo penaliza patrones templados, no léxico — usar como heurística de calidad |
| Cada semana los 5 posts tienen el mismo formato (3 variantes del mismo angle) → poca diversidad de feed | 5 estructuras founder-led (taxonomía propietaria Bitalize) auto-distribuidas: 5 estructuras distintas/semana, prohibido repetir 2 días seguidos | Founder-led B2B SaaS: **5-7x reach vs corporate brand**, empleados 5-10x vs brand ([a88lab 2025](https://www.a88lab.com/blog/founder-led-content-b2b-saas)) |
| Sin priorización por audiencia: todos los posts hablan a "todos", nadie se siente identificado, dwell time bajo | 4 ICPs explícitos (Asset Manager / Head of O&M / Analista performance / CEO-CFO) con dolor + hooks + CTAs específicos | **Dwell time ≥61s → 15.6% engagement vs 1.2% baseline** ([Meet-Lea 2025](https://meet-lea.com/en/blog/linkedin-algorithm-explained)). Relevancia para audiencia específica es el driver #1 de dwell |
| Sin coherencia editorial: campañas sin pilar = posts dispersos sin tesis | 6 pilares editoriales seleccionables a nivel campaña | Posts coherentes refuerzan member embedding del autor en Feed-SR ([arXiv 2602.12354](https://arxiv.org/abs/2602.12354)) |
| Drafts AI se publican tal cual; sin layer de humanización ni detector de "olor a IA" | Capa 1 Humanizer (rewrite founder voice) + Capa 2 Auditor Naturalidad 0-50 con 10 criterios, ambos manuales | Saves + comentarios sustantivos > likes en el ranker. Naturalidad correlaciona con ambos |
| No hay mecanismo de mejora continua de los prompts | Karpathy loop sobre los 3 prompts críticos en producción, con evals binarias de marketing B2B SaaS | Compound improvement: 0.5%/iter × 50 iter = transformación ([Karpathy autoresearch](.claude/skills/autoresearch/SKILL.md)) |

**Valor de negocio**: aumentar engagement real (comentarios, saves, shares) en publicaciones generadas, replicar la performance del perfil personal de Jonathan (~2,558 impresiones promedio, 18 reacciones, 3.5 comentarios) en los posts producidos por la app, y construir autoridad de nicho en "pérdidas invisibles FV" — el wedge comercial de Bitalize. Métricas objetivo post-implementación: reducir contenido AI-detectable (penalty 30-55%) + subir dwell time (driver del Feed-SR transformer) + replicar señales founder-led (5-7x reach baseline brand).

## Qué

### Criterios de Éxito

- [ ] 6 pilares + 4 audiencias + 5 estructuras editoriales persistidas en Supabase con seed data
- [ ] Campaign Builder permite seleccionar pilar + audiencia al crear campaña
- [ ] Distribuidor automático asigna 5 estructuras distintas a los 5 posts de una semana (5 estructuras × 5 días = todas distintas, prohibido repetir 2 días seguidos)
- [ ] Endpoint `POST /api/ai/humanize-copy` funcional (rate-limited 10/min) que devuelve versión humanizada + cambios + riesgos
- [ ] Endpoint `POST /api/ai/audit-naturalidad` funcional que devuelve score 0-50 + 10 criterios + frases problemáticas
- [ ] CriticPanel muestra tab "Naturalidad" en paralelo al Critic D/G/P/I/R existente (NO bloquea publicación, solo advierte)
- [ ] RecipeValidator detecta las 20 frases banned con sugerencias de sustitución
- [ ] Sistema desplegado en `contentops.jonadata.cloud` con migraciones aplicadas
- [ ] Loop de Karpathy ejecutado sobre los 3 prompts (generate-with-structure, humanize, audit) hasta llegar a ≥85% checks pass
- [ ] Sanity check humano: Jonathan valida 5 outputs aleatorios → ≥4/5 "suena a mí"
- [ ] `pnpm exec tsc --noEmit` = 0 errores; `pnpm run build` exitoso

### Comportamiento Esperado

**Flujo principal (Happy Path)**:

1. Jonathan crea una campaña en `/campaigns/new`. Selecciona keyword, topic, **pilar editorial = "Pérdidas Invisibles FV"** y **audiencia = "Asset Manager"**.
2. Pipeline orchestrator deriva 5 posts (Lun-Vie). El **structure-distributor** asigna automáticamente: Lun = `nicho_olvidado` (alcance), Mar = `aprendizaje_cliente`, Mié = `opinion_contraria_ia`, Jue = `demo_pequena`, Vie = `feature_kill` (proof) — 5 estructuras distintas, ninguna repetida 2 días seguidos. Override manual disponible por post.
3. Al generar copy de un post, el system prompt inyecta: framework Solar Story (existente) + structure_blueprint (nuevo) + audience_angle (nuevo) + pillar_context (nuevo). Salida: 3 variantes (Revelación/Terreno/Framework) del MISMO archetype.
4. En el PostEditor, Jonathan ve el badge "Estructura: Nicho olvidado" + 3 variantes. Cada variante tiene 4 acciones: Iterar | **Humanizar** (nuevo) | Aplicar score | Elegir.
5. Click "Humanizar" → llamada a `/api/ai/humanize-copy` → diff lado a lado + lista de cambios + riesgos detectados.
6. Click "Auditar" en CriticPanel → muestra 2 tabs: "Critic D/G/P/I/R" (existente) y **"Naturalidad 0-50" (nuevo)** con barra visual + 10 criterios + frases problemáticas highlighted.
7. RecipeValidator detecta automáticamente frases banned ("transformación digital" → sugiere "ordenar pérdidas por $/día").
8. Jonathan elige variante, publica.

---

## Contexto

### Referencias

- [docs/Contenido/reporte_estrategia_copywriting_linkedin_bitalize.md](docs/Contenido/reporte_estrategia_copywriting_linkedin_bitalize.md) — Reporte estratégico fuente (secciones 5, 6, 7, 16, 17, 18 son las directamente codificadas)
- [docs/Contenido/Análisis de Estilo_ Publicaciones de Jonathan Nava.md](docs/Contenido/Análisis%20de%20Estilo_%20Publicaciones%20de%20Jonathan%20Nava.md) — Tesis "Ingeniero Poeta" + métricas reales del perfil
- [.claude/PRPs/PRP-009-formulas-ganadoras-karpathy-loop.md](.claude/PRPs/PRP-009-formulas-ganadoras-karpathy-loop.md) — Receta interna (Framework Solar Story 9 pasos, complementaria, NO se duplica aquí)
- [src/app/api/ai/generate-copy/route.ts](src/app/api/ai/generate-copy/route.ts) — Sistema actual de copy (líneas 309-454 contienen el system prompt a extender)
- [src/app/api/ai/critic-copy/route.ts](src/app/api/ai/critic-copy/route.ts) — Critic D/G/P/I/R actual (NO se modifica; el auditor naturalidad va en endpoint separado)
- [src/features/posts/components/CriticPanel.tsx](src/features/posts/components/CriticPanel.tsx) — UI a extender con tab Naturalidad
- [src/features/posts/components/RecipeValidator.tsx](src/features/posts/components/RecipeValidator.tsx) — 19 checks actuales a extender con banned phrases ampliadas

### Arquitectura Propuesta (Feature-First)

```
src/features/editorial/                       # NUEVA feature
├── components/
│   ├── PillarSelector.tsx                    # Select de 6 pilares en CampaignBuilder
│   ├── AudienceSelector.tsx                  # Select de 4 audiencias en CampaignBuilder
│   ├── StructureBadge.tsx                    # Badge de estructura en PostEditor
│   ├── HumanizerPanel.tsx                    # Diff antes/después + cambios + riesgos
│   └── NaturalidadTab.tsx                    # Tab nueva en CriticPanel
├── services/
│   ├── pillars-service.ts                    # CRUD pilares
│   ├── audiences-service.ts                  # CRUD audiencias
│   ├── structures-service.ts                 # CRUD estructuras + lookup por slug
│   └── structure-distributor.ts              # distributeStructures(weekly_brief, posts[])
├── prompts/
│   ├── structure-blueprints/
│   │   ├── aprendizaje-cliente.ts
│   │   ├── nicho-olvidado.ts
│   │   ├── demo-pequena.ts
│   │   ├── feature-kill.ts
│   │   ├── opinion-contraria-ia.ts
│   │   └── default.ts
│   ├── audience-angles/
│   │   ├── asset-manager.ts
│   │   ├── head-om.ts
│   │   ├── analista-performance.ts
│   │   └── ceo-cfo.ts
│   └── pillar-contexts/                      # Contextos cortos por pilar
│       └── *.ts
├── lib/
│   ├── banned-phrases.ts                     # Lista 20 frases + tabla sustituciones
│   └── naturalidad-rubric.ts                 # 10 criterios + thresholds
└── types/
    ├── pillar.ts
    ├── audience.ts
    ├── structure.ts
    ├── humanization.ts
    └── naturalidad.ts

src/app/api/ai/
├── humanize-copy/route.ts                    # NUEVO endpoint (Capa 1)
└── audit-naturalidad/route.ts                # NUEVO endpoint (Capa 2)
```

### Modelo de Datos

```sql
-- Migración 017: Pilares + Audiencias

CREATE TABLE editorial_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  target_dolor TEXT NOT NULL,
  hook_examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_for_prompt TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audience_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  dolor_principal TEXT NOT NULL,
  formato_preferido TEXT NOT NULL,
  hook_template TEXT NOT NULL,
  cta_template TEXT NOT NULL,
  angle_for_prompt TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns
  ADD COLUMN editorial_pillar_id UUID REFERENCES editorial_pillars(id),
  ADD COLUMN target_audience_id UUID REFERENCES audience_profiles(id);

-- RLS en MISMA migración (regla del proyecto)
ALTER TABLE editorial_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read pillars" ON editorial_pillars
  FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "authenticated read audiences" ON audience_profiles
  FOR SELECT TO authenticated USING (is_active = TRUE);

-- Seeds: 6 pilares + 4 audiencias (insertados en migración)

-- Migración 018: Estructuras editoriales

CREATE TABLE editorial_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_blueprint TEXT NOT NULL,
  ideal_funnel_stage TEXT,                    -- TOFU/MOFU/BOFU o NULL si flexible
  weekday_default INT,                        -- 1=Mon..5=Fri o NULL (preferencia, no constraint)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Nota: NO incluir mix_weight. Research 2025-2026 no soporta el mix fijo 30/25/20/15/10.
-- Regla del distribuidor: 5 estructuras distintas/semana, no repetir 2 días seguidos.

ALTER TABLE posts
  ADD COLUMN editorial_structure_slug TEXT NOT NULL DEFAULT 'default'
    REFERENCES editorial_structures(slug);

-- Backfill posts existentes
UPDATE posts SET editorial_structure_slug = 'default' WHERE editorial_structure_slug IS NULL;

ALTER TABLE editorial_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated read structures" ON editorial_structures
  FOR SELECT TO authenticated USING (is_active = TRUE);

-- Seeds: 5 estructuras + 1 default (weekday_default es preferencia, no constraint)
INSERT INTO editorial_structures (slug, name, weekday_default) VALUES
  ('nicho_olvidado',       'Nicho Olvidado',           1),     -- Lun preferido
  ('aprendizaje_cliente',  'Aprendizaje de Cliente',   2),     -- Mar preferido
  ('opinion_contraria_ia', 'La IA no es magia',        3),     -- Mié preferido
  ('demo_pequena',         'Demo pequeña',             4),     -- Jue preferido
  ('feature_kill',         'Hoy matamos una feature',  5),     -- Vie preferido
  ('default',              'Default (sin archetype)',  NULL);
```

---

## Blueprint (Assembly Line)

> Solo FASES. Subtareas se generan en cada fase via `/bucle-agentico`.

### Fase 1 — Pilares Editoriales + Audiencias ICP
**Objetivo**: Persistir 6 pilares + 4 audiencias, vincular a campañas, exponer en CampaignBuilder.
**Validación**: Crear campaña con pilar "Pérdidas Invisibles FV" + audiencia "Asset Manager" → datos persisten + visibles al editar + RLS funcionando.

### Fase 2 — Post-Archetypes (5 Estructuras founder-led) + Cadencia Semanal
**Objetivo**: Auto-distribuir 5 estructuras distintas a los 5 posts semanales. Inyectar structure_blueprint + audience_angle + pillar_context al system prompt de generate-copy.
**Validación**: Crear campaña 5 días → 5 estructuras distintas asignadas + cada generate-copy refleja blueprint en output (verificar 1 post por estructura).

### Fase 3 — Capa 1: Humanizer
**Objetivo**: Endpoint `POST /api/ai/humanize-copy` + botón "Humanizar" en PostEditor + panel diff.
**Validación**: Generar post → humanizar → ≥3 cambios reales (no cosméticos) + tono más conversacional + lista de riesgos visible.

### Fase 4 — Capa 2: Auditor "Naturalidad" 0-50 + Banned Phrases Expandidas
**Objetivo**: Endpoint `POST /api/ai/audit-naturalidad` + tab Naturalidad en CriticPanel + 20 banned phrases en RecipeValidator + tabla sustituciones.

**Cambios específicos en RecipeValidator** (basados en research 2025-2026):
- **DROP check actual #2** ("Hook anti-bot por emoji inicial"): refutado por research — leading-emoji penalty no está medido por nadie, solo es heurística estilística sin data
- **AGREGAR check #20** "Scene/Data/Decision": validar que el post contiene AL MENOS una de:
  - Escena concreta (patrón: verbo de acción + sustantivo físico + detalle sensorial)
  - Número específico con unidad (`\d+\s*(%|MW|kWh|US$|días|tickets|alarmas|strings)`)
  - Decisión explícita (patrones: "decidimos", "elegimos", "descartamos", "matamos", "cambiamos a", "dejamos de")
- **AMPLIAR banned phrases** de 6 a ~20 (sección 18.1 del reporte): "transformación digital", "revolucionar", "aprovechar el poder", "desbloquear potencial", "en conclusión", "es importante destacar", "cabe mencionar", "sin duda alguna", "soluciones integrales", "innovadoras", "potenciar", "impulsar la transformación", "el futuro de", "game changer", "aprovechar la IA", "optimizar procesos", "transformar radicalmente", "el dinámico mundo actual", "ecosistema digital", "sinergia"
- **TABLA DE SUSTITUCIÓN** inline (sección 18.3 del reporte): cada banned phrase detectada muestra su reemplazo recomendado
- **MANTENER**: check de longitud 1500-2200 chars (research-confirmado)

**Validación**: Auditar 3 variantes → cada una recibe score 0-50 + frases banned highlighted + sugerencias de sustitución concretas mostradas + check #20 detecta scene/data/decision en post real, falla en post genérico.

### Fase 5 — Build local + Deploy a Producción
**Objetivo**: Sistema corriendo en `contentops.jonadata.cloud` (Dokploy `T5h12sWPliBOeXYVLC75h`) con migraciones aplicadas.
**Validación**:
- [ ] `pnpm exec tsc --noEmit` = 0 errores
- [ ] `pnpm run build` exitoso
- [ ] Migraciones 017 + 018 aplicadas via MCP `apply_migration`
- [ ] Commits atómicos por fase con Conventional Commits
- [ ] Deploy con `cleanCache: true` (~2 min full rebuild)
- [ ] `https://contentops.jonadata.cloud` responde 200
- [ ] Smoke check UI: login + crear campaña + ver pilar/audiencia/estructura/Humanizar/Auditar

### Fase 6 — Karpathy Loop sobre 3 prompts (E2E en PRODUCCIÓN con MCP Playwright)
**Objetivo**: Iterar prompts hasta ≥85% checks pass desde lente experto B2B SaaS marketing.

**Setup**:
- Persistencia: `.claude/karpathy-runs/prp-012/<prompt>/v<N>/` con `prompt.txt`, `outputs.json`, `evals.json`, `decision.md`
- Versionado en código: `src/features/editorial/prompts/versions/<prompt>-v<N>.ts`
- Hard limits: max 5 iteraciones por prompt; max 5 outputs por iteración (aprendizaje MEMORY.md "max 2 ciclos Karpathy/sesión")

**Evals binarias (lente B2B SaaS marketing)**:

`generate-copy` con structure_blueprint (10 checks PASS/FAIL):
1. Abre con tensión concreta (NO "En el mundo de...", "Hoy quiero...")
2. Contiene escena, dato O decisión real (≥1)
3. Producto aparece como CONSECUENCIA del problema (no protagonista)
4. Traduce técnico a impacto operativo o económico
5. CTA = pregunta específica de experiencia (no genérica)
6. Refleja la estructura asignada (ej: "Hoy matamos feature" tiene decisión + razón + aprendizaje)
7. Refleja el pilar editorial (ej: "Pérdidas Invisibles FV" menciona $/día, PR, MWh perdidos)
8. Refleja la audiencia (ej: Asset Manager → caja/decisión, no SCADA tags)
9. Evita las 20 frases banned
10. Suena fundador-técnico, NO consultora genérica de IA

`humanize-copy` (5 checks):
1. Cambios reales (no cosméticos)
2. Score Naturalidad post-humanize > pre-humanize
3. Mantiene exactitud técnica
4. Mantiene una sola idea central
5. NO introduce promesas de ROI

`audit-naturalidad` (3 checks):
1. Detecta frases genéricas inyectadas (test con post deliberadamente AI-genérico)
2. NO falsea positivos en post humano de Jonathan (test con post real de engagement alto)
3. Score correlaciona con criterio humano (Jonathan revisa 10 outputs, marca pass/fail, comparar)

**Loop**:
```
Para cada prompt en [generate-copy, humanize-copy, audit-naturalidad]:
  v = 1
  REPEAT (max 5):
    1. RUN: vía MCP Playwright en PROD, generar 5 outputs con prompt vN
       - mcp__playwright__browser_navigate → login → campaña → generar copy
       - Capturar output JSON + screenshot
    2. EVAL: aplicar checks binarios
    3. SCORE: % checks pass
    4. DECISION:
       - Si score ≥ 85% Y mejor que vN-1 → KEEP, break
       - Si score < 85% O peor que vN-1 → DISCARD, mutar:
         · Fallaron criterios anti-genérico → reforzar instrucciones anti-IA
         · Fallaron audiencia/pilar → inyectar más contexto
         · Fallaron estructura → expandir blueprint específico
         · Fallaron voz fundador → agregar más few-shot examples de Jonathan
    5. v += 1
  Persistir winner en src/features/editorial/prompts/versions/<prompt>-v<winner>.ts
  Actualizar import en route handler
  Documentar deltas v1 → vN en sección "Aprendizajes" de este PRP
```

**Validación final**:
- [ ] 3 prompts versionados con winner identificado
- [ ] ≥85% checks pass en eval final de cada prompt
- [ ] Jonathan valida cualitativamente 5 outputs aleatorios → ≥4/5 "suena a mí" (blind review)
- [ ] Screenshots E2E del loop completo en `e2e/screenshots/prp-012-karpathy/`
- [ ] Aprendizajes v1 → vN documentados en este PRP

### Fase 7 — Validación Final
**Objetivo**: Sistema funcionando E2E + tests pasando + memoria actualizada.
**Validación**:
- [ ] `pnpm exec tsc --noEmit` = 0 errores
- [ ] `pnpm run build` exitoso
- [ ] Producción responde 200, smoke E2E completo OK
- [ ] Memoria actualizada en `.claude/memory/` (decisiones de Karpathy + qué tipo de mutaciones funcionaron)

---

## 🧠 Aprendizajes (Self-Annealing)

> Crece con cada error/iteración. Documentar deltas de Karpathy aquí.

_(vacío al inicio)_

---

## Gotchas

- [ ] **`generateText` > `generateObject`** para humanizer y auditor (MEMORY.md: `generateObject` falla con prompts >5000 chars en Gemini). Usar `generateText` + JSON system prompt + `JSON.parse()` + `Zod.parse()`.
- [ ] **RLS en MISMA migración** que crea las tablas (regla CLAUDE.md). No separar migraciones de tablas y políticas.
- [ ] **`UNIQUE CONSTRAINT, no INDEX`** si hay swap/reorder de structures en futuro (ver aprendizaje CLAUDE.md).
- [ ] **`useRef` post-`revalidatePath`**: el HumanizerPanel debe mantener estado del editor con `justSavedRef` (igual que el editor actual, MEMORY.md pattern).
- [ ] **`.nullable().optional()` en Zod** para schemas de API que reciben null del cliente.
- [ ] **No `as Type`**: parsear todo external data con Zod (especialmente outputs del humanizer/auditor).
- [ ] **PostgREST trunca a 1000**: paginar si listamos pillars/audiences/structures crece (improbable, pero documentar).
- [ ] **Backward compat**: posts existentes deben funcionar con `editorial_structure_slug = 'default'`. Migración 018 incluye UPDATE explícito.
- [ ] **Distribuidor con pilar muy específico**: si pilar restringe estructuras compatibles, fallback a 'default' antes que crashear.
- [ ] **Structure blueprint LARGO**: si el blueprint individual es >2000 chars, dividir en `core_rules` + `examples` para no inflar el system prompt total.
- [ ] **Loop Karpathy en producción**: cada iteración requiere deploy si cambian archivos `.ts`. Mitigación: prompts en archivos separados versionados; cambiar import + redeploy ~2 min.
- [ ] **Blind review en Karpathy**: Jonathan no debe saber qué versión generó qué output (sesgo confirmation). Tags de versión solo en filesystem, no en UI.
- [ ] **Costo en producción**: 3 prompts × 5 iter × 5 outputs = ~75 generaciones. Estimar ~$5-15 USD con Gemini 2.5 Flash. Aprobar antes de iniciar.
- [ ] **Cron secret + rate limiting**: ambos endpoints nuevos deben usar `createRateLimiter()` (10 req/min) y require auth.
- [ ] **Sales ratio 80/20 (1:4), NO 1:8-10**: el reporte fuente sugiere 1:8-10 pero research 2025-2026 confirma estándar 80/20 ([FSE Digital 2025](https://www.fsedigital.com/blog/social-media-strategy-for-2025-why-the-80-20-rule-still-wins/)). El structure-distributor permite hasta 1 post commercial (BOFU) cada 5 posts (1:4 efectivo).
- [ ] **LinkedIn algoritmo es Feed-SR (transformer)**: las heurísticas anti-IA importan a nivel **patrón templado**, no a nivel léxico exacto. Banned phrases son indicador de calidad, no claim de penalty algorítmico directo ([arXiv 2602.12354](https://arxiv.org/abs/2602.12354)).
- [ ] **Longitud 1500-2200 chars confirmada** por múltiples sources 2025-2026. RecipeValidator debe penalizar fuera de ese rango (warning).
- [ ] **Link penalty ~6x en perfiles personales**: si CTAs incluyen URLs, sugerir mover link al primer comentario (out of scope para PRP-012, pero documentar para futuras iteraciones).

---

## Anti-Patrones

- NO modificar el endpoint `critic-copy` existente (D/G/P/I/R sigue intacto). El auditor naturalidad va en endpoint SEPARADO.
- NO reemplazar las 3 variantes Revelación/Terreno/Framework. Las 5 estructuras son un eje ORTOGONAL.
- NO bloquear la publicación con el auditor naturalidad. Solo advertir (decisión confirmada con Jonathan).
- NO invocar Humanizer ni Auditor automáticamente en cada generación (costo de tokens + UX). Ambos manuales.
- NO crear más de 5 iteraciones Karpathy por prompt (regla MEMORY.md: max 5 fixes por ciclo).
- NO documentar deltas de prompts en código fuente (ruido en diffs). Documentar en `.claude/karpathy-runs/` y en sección Aprendizajes de este PRP.
- NO duplicar la receta interna del Framework Solar Story de PRP-009. Aquí solo se inyecta `structure_blueprint` por encima.
- NO commitear `.claude/karpathy-runs/<runs en progreso>/` con prompts de versiones descartadas si ocupan mucho. Solo el winner.
- NO usar `as Type` en outputs del humanizer/auditor. Parsear con Zod siempre.
- NO crear nuevos patrones de Server Action. Reutilizar el 4-step (auth → Zod → execute → side effects).
- NO hardcodear el Dokploy app ID ni Supabase keys. Leer de env validado con Zod.
- NO probar el loop de Karpathy en local. La eval es contra PRODUCCIÓN (Jonathan lo pidió explícitamente).
- NO presentar las 5 estructuras founder-led como industria-standard. Son **taxonomía propietaria de Bitalize**. Research 2025-2026 muestra otras taxonomías (ej StartupGTM: Framework 42% / Relatability 17% / Community 17% / Credibility 8% / Contrarian 8% / Educational 8%). Las nuestras son una hipótesis editorial, no un estándar validado.
- NO codificar el mix 30/25/20/15/10 en el structure-distributor. Research no lo soporta. Regla simple: 5 estructuras distintas/semana, no repetir 2 días seguidos.
- NO asumir que cualquier output de IA es penalizado. El penalty (30-55%) aplica a contenido **genérico/templado**, no a contenido de IA con scene/data/decision real. Diseñar prompts para evitar lo templado, no para evitar la IA.
- NO mantener el check anti-bot por emoji inicial en RecipeValidator. Refutado por research — eliminar en Fase 4.

---

*PRP-012 pendiente aprobación. No se ha modificado código aún. Una vez aprobado, ejecutar via `/bucle-agentico`.*
