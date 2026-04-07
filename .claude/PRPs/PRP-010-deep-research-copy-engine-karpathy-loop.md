# PRP-010: Deep Research Intelligence + Copy Engine + Karpathy Improvement Loop

> **Estado**: PENDIENTE  
> **Fecha**: 2026-04-07  
> **Proyecto**: LinkedIn ContentOps (Bitalize)

---

## Objetivo

Elevar ContentOps en dos capacidades criticas:

1. **Investigacion profunda** — mejorar captacion, profundidad, trazabilidad y utilidad de la informacion fuente para sostener campanas semanales de 5 dias con densidad narrativa, tecnica y comercial. Incluye una **segunda investigacion focalizada** sobre el topic elegido antes de crear la campana.
2. **Copy Engine mejorado** — hacer la generacion **validator-aware** (consciente del RecipeValidator y critic desde el origen), inyectar golden templates como few-shot examples, y agregar herramientas de formato unicode para LinkedIn.
3. **Mejora continua** basada en el **loop de Karpathy** — prompt versioning, mutacion controlada, evaluacion binaria, keep/discard/rollback.

> **Nota**: El sistema de copy ya implementa D/G/P/I + Framework Solar Story + Ingeniero Poeta (PRP-009 Fase 3). Este PRP **extiende** esa base, no la reescribe.

> **Playwright MCP** queda estrictamente como herramienta de testing y QA tecnico. No participa en generacion creativa.

---

## Por Que

| Problema | Solucion |
|----------|----------|
| El research actual no captura suficiente profundidad para sostener 5 dias de campana | Motor de research con scoring de fuentes, deteccion de vacios, y readiness score |
| Un buen topic no basta sin profundizacion posterior | Segunda investigacion profunda especifica sobre el topic elegido |
| El copy no nace suficientemente alineado con el rubric | Generacion validator-aware: el prompt conoce los 19 checks del RecipeValidator |
| No hay few-shot examples de posts ganadores en la generacion | Golden templates extraidos de posts top se inyectan como ejemplos |
| No existe formato unicode para destacar ideas en LinkedIn | Toolbar de Unicode Styling (negrita, cursiva, monospace) |
| No hay cadena robusta de mejora continua con el stack actual | Karpathy loop sobre prompt_versions, analytics, critics, patterns |
| La copy-template.ts de fallback aun menciona hashtags | Limpiar template legacy y alinear con regla "sin hashtags" |

**Valor de negocio**: campanas semanales mas solidas, mejor calidad de copy desde la primera version, y una app que mejora por evidencia acumulada.

---

## Que

### Criterios de Exito

- [ ] Cada research genera: 5-10 hallazgos verificables, 1 enemigo invisible, 1 tesis contrarian, 3-5 angulos narrativos, 3-5 recursos sugeridos, 5-8 topic candidates con score
- [ ] Existe `research_depth_score` y `campaign_readiness_score` calculados y visibles
- [ ] El topic elegido dispara una segunda investigacion profunda con evidencia especifica, micro-problemas, cifras y angulos por dia
- [ ] El Copy Engine genera variantes validator-aware que puntuan alto en primera iteracion
- [ ] Golden templates de posts ganadores se inyectan como few-shot examples
- [ ] Existe toolbar de formato unicode funcional en el editor de posts
- [ ] El Karpathy loop permite versionar prompts, mutar, evaluar y keep/discard/rollback
- [ ] Ninguna variante de copy contiene hashtags
- [ ] `pnpm exec tsc --noEmit` pasa en 0 errores
- [ ] `pnpm run build` exitoso

### Comportamiento Esperado

#### Happy Path - Research
1. Usuario ejecuta "Investigacion profunda"
2. El sistema construye multi-queries, busca, profundiza vacios
3. Output: invisible_enemy, thesis, evidence, narrative_angles, conversion_resources, topic_candidates
4. Se calcula research_depth_score y campaign_readiness_score
5. Usuario elige topic candidate
6. Sistema ejecuta **segunda investigacion focalizada** sobre ese topic
7. Produce topic_deepening_json con subproblemas, cifras, angulos diarios, fuentes
8. Solo entonces el topic pasa a Campaign Builder

#### Happy Path - Copy
1. Generate-copy consulta RecipeValidator checks programaticamente
2. Consulta golden templates y top patterns
3. Genera 3 variantes con conocimiento explicito de que sera evaluado
4. Critic y validator puntuan — score inicial alto
5. Usuario puede aplicar formato unicode sobre la version final

#### Happy Path - Karpathy Loop
1. Prompt activo genera posts, se acumulan metricas reales
2. Se computan binary evals (impresiones, comments, saves, engagement, recipe pass, critic score)
3. Se formula hipotesis de mejora
4. Se crea nueva version del prompt con UNA mutacion
5. Se evalua contra baseline
6. Keep si mejora, discard si no, rollback si degrada

---

## Contexto

### Lo que YA existe y funciona (no tocar)

| Componente | Archivo | Estado |
|-----------|---------|--------|
| Research multi-query + iterative deepening | `src/app/api/research/grounded-research/route.ts` (320 LOC) | Funcional — genera invisible_enemy, thesis, topic_candidates |
| Topic derivation con content_angles + solution_framework | `src/features/topics/services/topic-derivation.ts` (264 LOC) | Funcional |
| Copy generation con Ingeniero Poeta 9-step + D/G/P/I | `src/app/api/ai/generate-copy/route.ts` (~350 LOC) | Funcional — PRP-009 Fase 3 |
| Critic con D/G/P/I/R scoring | `src/app/api/ai/critic-copy/route.ts` | Funcional |
| RecipeValidator con 19 checks | `src/features/posts/components/RecipeValidator.tsx` (381 LOC) | Funcional |
| Pipeline orchestrator Research-to-Visual | `src/features/pipeline/services/pipeline-orchestrator.ts` (628 LOC) | Funcional |
| Pattern library CRUD + getTopPatterns | `src/features/patterns/services/pattern-service.ts` | Funcional |
| Analytics service + insights | `src/features/analytics/` + `src/features/insights/` | Funcional |
| AI Router con BYOK + fallback | `src/shared/lib/ai-router.ts` | Funcional |
| Anti-repeticion cross-campaign hooks | `src/features/posts/services/hook-history-service.ts` | Funcional |

### Lo que FALTA (scope de este PRP)

| Necesidad | Existe? |
|-----------|---------|
| Columnas de enrichment en research_reports (source_quality, narrative_angles, depth_score, readiness_score) | NO |
| Topic deepening service (segunda investigacion post-derivation) | NO |
| Prompt versioning (tabla + service) | NO |
| Performance analyzer (weighted engagement, labels) | NO |
| Pattern auto-extraction de posts ganadores | NO |
| Golden templates table + injection en generate-copy | NO |
| Validator-awareness en generate-copy (checks programaticos) | NO |
| Unicode formatting toolbar | NO |
| Karpathy loop (mutacion + eval + keep/discard) | NO |
| Limpiar copy-template.ts (aun dice "3-5 hashtags al final") | PENDIENTE |

### Relacion con PRPs anteriores

- **PRP-008** (Pipeline Agentico): Completamente implementado. PRP-010 extiende el pipeline con topic deepening y prompts versionados.
- **PRP-009** (Formulas Ganadoras + Karpathy):
  - Fase 1 (Performance Analytics): **NO implementada** → absorbida en PRP-010 Fase 4
  - Fase 2 (Pattern Extraction): **NO implementada** → absorbida en PRP-010 Fase 4
  - Fase 3 (Prompt Engineering): **YA implementada** → generate-copy ya tiene Framework Solar Story completo
  - Fase 4 (Karpathy Loop): **NO implementada** → absorbida en PRP-010 Fase 5
  - Fase 5 (Enhanced Pipeline): **NO implementada** → absorbida en PRP-010 Fases 2-3

### Arquitectura Propuesta (Feature-First)

```text
src/features/
  research/
    services/
      topic-deepener.ts              # NUEVO — segunda investigacion focalizada
  posts/
    components/
      UnicodeToolbar.tsx              # NUEVO — toolbar de formato unicode
  analytics/
    services/
      performance-analyzer.ts        # NUEVO — weighted engagement, labels, winning posts
  patterns/
    services/
      pattern-extractor.ts           # NUEVO — auto-extraccion de patrones de posts ganadores
  prompts/
    services/
      prompt-version-service.ts      # NUEVO — CRUD de versiones de prompts
      prompt-optimizer.ts            # NUEVO — Karpathy loop core

src/shared/
  lib/
    unicode-format.ts                # NUEVO — utilidades de formato unicode

src/app/api/ai/
  extract-patterns/route.ts          # NUEVO — endpoint para extraccion manual
  mutate-prompt/route.ts             # NUEVO — endpoint para mutacion controlada
```

### Modelo de Datos (Migracion 024)

```sql
-- 1. Research enrichment columns
ALTER TABLE research_reports
  ADD COLUMN IF NOT EXISTS source_quality_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS narrative_angles_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS conversion_resources_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS topic_deepening_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS research_depth_score SMALLINT CHECK (research_depth_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS campaign_readiness_score SMALLINT CHECK (campaign_readiness_score BETWEEN 0 AND 100);

-- 2. Metrics enrichment
ALTER TABLE metrics
  ADD COLUMN IF NOT EXISTS weighted_engagement_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS performance_label TEXT CHECK (performance_label IN ('top_performer','average','underperformer'));

-- 3. Pattern library enrichment
ALTER TABLE pattern_library
  ADD COLUMN IF NOT EXISTS recipe_step TEXT,
  ADD COLUMN IF NOT EXISTS effectiveness_score NUMERIC,
  ADD COLUMN IF NOT EXISTS extracted_by TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_post_content TEXT;

-- 4. Prompt versioning
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('copy_system','research_system','topic_deepening_system','critic_system')),
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  performance_score NUMERIC,
  posts_generated INTEGER DEFAULT 0,
  parent_version_id UUID REFERENCES prompt_versions(id),
  hypothesis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON prompt_versions
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- 5. Prompt optimization log
CREATE TABLE IF NOT EXISTS prompt_optimization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  iteration INTEGER NOT NULL,
  hypothesis TEXT,
  change_description TEXT,
  eval_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC,
  previous_score NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('baseline','keep','discard','rollback')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE prompt_optimization_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON prompt_optimization_log
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- 6. Post-to-prompt junction
CREATE TABLE IF NOT EXISTS post_prompt_version (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, prompt_version_id)
);
ALTER TABLE post_prompt_version ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON post_prompt_version
  FOR ALL USING (post_id IN (SELECT p.id FROM posts p JOIN campaigns c ON p.campaign_id = c.id JOIN workspace_members wm ON c.workspace_id = wm.workspace_id WHERE wm.user_id = auth.uid()));

-- 7. Golden templates
CREATE TABLE IF NOT EXISTS golden_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('alcance','nutricion','conversion')),
  template_content TEXT NOT NULL,
  metrics_snapshot JSONB DEFAULT '{}'::jsonb,
  recipe_analysis JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE golden_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_isolation" ON golden_templates
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- 8. Updated_at triggers for new tables
CREATE TRIGGER set_prompt_versions_updated_at BEFORE UPDATE ON prompt_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Blueprint (Assembly Line)

> IMPORTANTE: Solo FASES. Las subtareas se generan al entrar a cada fase con el bucle agentico.

### Fase 1: Database Foundation
**Objetivo**: Crear todas las tablas y columnas nuevas en una sola migracion (024).
**Validacion**:
- [ ] `supabase apply_migration` exitoso
- [ ] Tipos TypeScript actualizados en `content-ops.ts`
- [ ] `pnpm exec tsc --noEmit` pasa

### Fase 2: Deep Research Engine + Topic Deepening
**Objetivo**: Mejorar calidad de research con source scoring, narrative angles, depth/readiness scores, y crear el servicio de topic deepening (segunda investigacion post-derivation).

**Cambios clave**:
- Enriquecer `grounded-research/route.ts` con pasos adicionales: source quality assessment, narrative angle extraction, depth_score y readiness_score
- Crear `src/features/research/services/topic-deepener.ts` — segunda busqueda focalizada en el topic elegido
- Integrar topic deepening en pipeline orchestrator (entre topic derivation y campaign creation)
- Actualizar `DeepResearchPanel.tsx` para mostrar scores y indicadores de readiness

**Validacion**:
- [ ] Research produce source_quality_json, narrative_angles_json, depth_score, readiness_score
- [ ] Topic deepening genera evidencia especifica, subproblemas y angulos diarios
- [ ] Pipeline orchestrator ejecuta topic deepening automaticamente
- [ ] UI muestra indicadores de calidad de research

### Fase 3: Copy Engine Validator-Aware + Golden Templates
**Objetivo**: Hacer que generate-copy conozca los checks del RecipeValidator y use golden templates como few-shot examples.

**Cambios clave**:
- Extraer checks del RecipeValidator como reglas inyectables en el prompt (programatico, no hardcoded)
- En generate-copy, consultar `golden_templates` por content_type mapeado a funnel_stage e inyectar 1-2 como ejemplos
- Post-processing safety net: strip hashtags `content.replace(/#\w+/g, '')`
- Limpiar `copy-template.ts` — eliminar todas las menciones de "3-5 hashtags al final"

**Validacion**:
- [ ] El prompt de generacion incluye resumen de checks del validator
- [ ] Golden templates se inyectan cuando existen
- [ ] No aparecen hashtags en output
- [ ] copy-template.ts limpio de referencias a hashtags

### Fase 4: Performance Analytics + Pattern Extraction
**Objetivo**: Cerrar el feedback loop — computar engagement ponderado, etiquetar posts, extraer patrones de ganadores, generar golden templates.

**Cambios clave**:
- Crear `performance-analyzer.ts`: weighted engagement = `(comments*3 + saves*2 + shares*2 + reactions) / impressions * 100`, etiquetado por percentiles
- Crear `pattern-extractor.ts`: descompone posts ganadores en pasos de la receta, guarda en pattern_library con recipe_step
- Crear `extract-patterns/route.ts`: endpoint para extraccion manual
- Auto-trigger: al guardar metricas de un post top_performer, extraer patrones automaticamente
- Generar golden templates de los top 3 posts por content_type

**Validacion**:
- [ ] Metricas calculan weighted_engagement_rate y performance_label
- [ ] Posts top_performer generan patrones automaticamente
- [ ] Golden templates se crean desde posts ganadores
- [ ] Insights dashboard muestra datos de performance

### Fase 5: Karpathy Improvement Loop
**Objetivo**: Prompt versioning + mutacion controlada + evaluacion binaria + keep/discard/rollback.

**Cambios clave**:
- Crear `prompt-version-service.ts`: CRUD de versiones, activacion, fallback a hardcoded default
- Crear `prompt-optimizer.ts`: core del loop — analizar performance, formular hipotesis, mutar, evaluar, decidir
- Crear `mutate-prompt/route.ts`: endpoint que genera una mutacion controlada (1 cambio por iteracion)
- Modificar generate-copy para usar prompt versionado (si existe) y registrar junction post-prompt
- Binary evals: impressions > median, >= 1 substantive comment, >= 1 save, engagement > median, recipe pass, critic >= 20/25
- UI en settings para ver versiones, scores, historial de optimizacion

**Validacion**:
- [ ] Prompt v1 se crea desde el prompt hardcoded actual como baseline
- [ ] Posts se asocian a su prompt_version via junction table
- [ ] Ciclo de optimizacion manual funciona (mutar → evaluar → keep/discard)
- [ ] Rollback restaura version anterior
- [ ] Trazabilidad completa por iteracion

### Fase 6: Unicode Copy Styling Toolbar
**Objetivo**: Toolbar de formato unicode en el editor de posts para destacar texto en LinkedIn.

**Cambios clave**:
- Crear `unicode-format.ts`: mapeos A-Z/a-z/0-9 a Unicode Mathematical Bold/Italic/Monospace + strikethrough
- Crear `UnicodeToolbar.tsx`: botones Bold/Italic/Monospace/Strikethrough/Clear sobre textarea
- Integrar en PostEditor — toolbar aparece sobre el textarea de edicion
- Preview antes de aplicar
- Reglas editoriales: no sobrecargar, solo frases clave, legibilidad movil

**Validacion**:
- [ ] Seleccionar texto + click Bold aplica unicode bold
- [ ] Clear formatting revierte a ASCII
- [ ] Texto formateado es legible en preview movil
- [ ] Formato no rompe el copy ni inserta caracteres no deseados

### Fase 7: Validacion Final
**Objetivo**: Sistema funcionando end-to-end.
**Validacion**:
- [ ] `pnpm exec tsc --noEmit` pasa
- [ ] `pnpm run build` exitoso
- [ ] Research produce insumos suficientes para campanas de 5 dias
- [ ] Topic deepening se ejecuta tras seleccion de topic
- [ ] Copy Engine genera piezas validator-aware con golden templates
- [ ] Unicode Styling funciona en el editor
- [ ] Karpathy loop funciona con baseline, keep, discard, rollback
- [ ] Criterios de exito del PRP se cumplen
- [ ] Playwright smoke tests pasan en flujos criticos

---

## Principios del Karpathy Loop

```text
1. Generar copy con prompt baseline activo
2. Capturar senales: metricas reales + critic + validator + decisiones humanas
3. Detectar patron o problema repetido
4. Formular hipotesis concreta
5. Crear nueva prompt_version con UNA mutacion
6. Evaluar contra baseline con binary evals
7. Keep / discard / rollback
8. Persistir aprendizaje
9. Repetir
```

- Una mutacion por iteracion
- Baseline estable siempre disponible
- No promover cambios sin evidencia
- Combinar senal editorial + senal real + senal tecnica
- Minimo ~10 posts con metricas por version para evaluar

---

## Aprendizajes (Self-Annealing)

### 2026-04-07: La debilidad esta aguas arriba
- **Error**: intentar mejorar campanas actuando solo sobre topics o copy
- **Fix**: mover el foco a profundidad y readiness del research
- **Aplicar en**: research engine, topic derivation, campaign builder

### 2026-04-07: Un buen topic no basta sin profundizacion
- **Error**: asumir que el topic candidate inicial tiene material suficiente para 5 posts
- **Fix**: segunda investigacion profunda especifica sobre el topic seleccionado
- **Aplicar en**: topic selection flow, campaign context building

### 2026-04-07: Testing no es creatividad
- **Error**: mezclar Playwright MCP dentro del proceso creativo
- **Fix**: separar completamente generacion creativa de QA tecnico
- **Aplicar en**: qa services, product boundaries

### 2026-04-07: El copy debe nacer cerca del objetivo
- **Error**: depender de iteracion posterior para alcanzar calidad
- **Fix**: hacer el motor validator-aware + inyectar golden templates
- **Aplicar en**: generate-copy, first-pass optimization

### 2026-04-07: copy-template.ts menciona hashtags
- **Error**: el template de fallback aun dice "3-5 hashtags al final" en variantes Problem y Solution
- **Fix**: limpiar todas las referencias a hashtags en copy-template.ts
- **Aplicar en**: Fase 3

---

## Gotchas

- [ ] No intentar resolver debilidad de research tocando solo topics
- [ ] No meter Playwright MCP dentro del proceso creativo
- [ ] No mutar multiples prompts criticos a la vez (1 mutacion por iteracion)
- [ ] No promover cambios sin smoke suite verde
- [ ] No perder backward compatibility del schema
- [ ] No permitir hashtags en copy (ni en template de fallback)
- [ ] No sobrecargar el texto con unicode styling
- [ ] No optimizar por likes; priorizar conversacion, guardados y senal cualificada
- [ ] generateText siempre para Gemini con inputs largos (nunca generateObject)
- [ ] Karpathy loop cold start: necesita ~10 posts con metricas para evaluar — proveer seed baseline
- [ ] Unicode chars renderizan distinto en cada browser/app — testear en LinkedIn mobile

## Anti-Patrones

- NO producir investigaciones amplias pero vacias
- NO pasar directo de topic candidate a campaign sin profundizacion
- NO generar copy correcto pero sin identidad propia
- NO abusar de negritas/cursivas hasta volver el texto artificial
- NO usar Karpathy loop sin logs ni baseline
- NO confiar solo en critics AI
- NO repetir hooks y tesis mecanicamente entre campanas

---

*PRP pendiente aprobacion. No se ha modificado codigo.*
