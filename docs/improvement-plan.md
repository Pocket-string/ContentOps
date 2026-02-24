# Plan de Mejoras — LinkedIn ContentOps

> **Fecha**: 2026-02-24
> **Origen**: Auditoria de logica App ContentOps vs proceso manual Bitalize
> **Proposito**: Plan accionable con todas las mejoras recomendadas, priorizadas por impacto y organizadas en fases implementables.

---

## Indice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Fase 1: Research Estructurado](#fase-1-research-estructurado-sprint-1)
3. [Fase 2: Topics Enriquecidos](#fase-2-topics-enriquecidos-sprint-1)
4. [Fase 3: Campaign Weekly Brief](#fase-3-campaign-weekly-brief-sprint-2)
5. [Fase 4: Copy Estructurado + Validador de Receta](#fase-4-copy-estructurado--validador-de-receta-sprint-2)
6. [Fase 5: CopyCritic Agent](#fase-5-copycritic-agent-sprint-3)
7. [Fase 6: Conceptos Visuales (3 opciones)](#fase-6-conceptos-visuales-3-opciones-sprint-3)
8. [Fase 7: VisualCritic Agent](#fase-7-visualcritic-agent-sprint-4)
9. [Fase 8: Brand Profiles Versionados](#fase-8-brand-profiles-versionados-sprint-4)
10. [Fase 9: Iteraciones Nano Banana Pro](#fase-9-iteraciones-nano-banana-pro-sprint-5)
11. [Fase 10: Export Pack Ampliado](#fase-10-export-pack-ampliado-sprint-5)
12. [Fase 11: Conversion Mejorada](#fase-11-conversion-mejorada-sprint-5)
13. [Fase 12: Pattern Library + Retrieval](#fase-12-pattern-library--retrieval-sprint-6)
14. [Fase 13: Motor de Mejora Continua](#fase-13-motor-de-mejora-continua-sprint-6)
15. [Resumen de Cambios en Base de Datos](#resumen-de-cambios-en-base-de-datos)
16. [Resumen de Nuevos Endpoints AI](#resumen-de-nuevos-endpoints-ai)
17. [Dependencias entre Fases](#dependencias-entre-fases)

---

## 1. Resumen Ejecutivo

### Estado Actual
La app cubre el pipeline completo Research → Topics → Campaigns → Posts → Visuals → Conversion → Export → Metrics con 24 rutas, 11 tablas, 4 endpoints AI, y 8 capas de seguridad.

### Brechas Identificadas
La auditoria identifica 12 areas de mejora agrupadas en 3 horizontes:

| Horizonte | Fases | Enfoque |
|-----------|-------|---------|
| **MVP+** (Sprints 1-3) | Fases 1-7 | Estructura de datos + Critic Agents |
| **v2** (Sprints 4-5) | Fases 8-11 | Brand profiles + Export + Nano Banana |
| **v3** (Sprint 6) | Fases 12-13 | Pattern Library + Mejora continua |

### Principios de Implementacion
- **Feature-first**: Cada mejora se implementa dentro de su feature (`src/features/`)
- **Backward compatible**: No romper flows existentes; nuevos campos son opcionales
- **Migraciones incrementales**: Una migracion SQL por fase que modifica BD
- **Zero `any`**: Todo nuevo campo validado con Zod
- **Server Actions 4-step**: Auth → Zod → Execute → Side effects

---

## Fase 1: Research Estructurado (Sprint 1)

### Brecha
El research actual captura solo `title`, `source`, `raw_text` y `tags_json`. Falta estructura para research profundo: recencia, senales de traccion, persona, keywords del momento, conclusiones accionables.

### Estado Actual de la Tabla `research_reports`
```
id, workspace_id, title, source, raw_text, tags_json, created_by, created_at, updated_at
```

### Cambios Requeridos

#### 1.1 Migracion SQL — Nuevos campos en `research_reports`
```sql
ALTER TABLE research_reports
  ADD COLUMN recency_date date,
  ADD COLUMN market_region text,
  ADD COLUMN buyer_persona text,
  ADD COLUMN trend_score smallint CHECK (trend_score >= 0 AND trend_score <= 10),
  ADD COLUMN fit_score smallint CHECK (fit_score >= 0 AND fit_score <= 10),
  ADD COLUMN evidence_links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN key_takeaways jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN recommended_angles jsonb DEFAULT '[]'::jsonb;
```

#### 1.2 Tipo actualizado en `content-ops.ts`
```typescript
// Nuevos campos en researchSchema
recency_date: z.string().nullable(),        // "2026-02-20"
market_region: z.string().nullable(),       // "LATAM", "Europa", "Global"
buyer_persona: z.string().nullable(),       // "Director de O&M", "Ingeniero planta"
trend_score: z.number().min(0).max(10).nullable(),
fit_score: z.number().min(0).max(10).nullable(),
evidence_links: z.array(z.string()).default([]),
key_takeaways: z.array(z.string()).default([]),
recommended_angles: z.array(z.string()).default([]),
```

#### 1.3 UI — ResearchForm ampliado
Agregar seccion colapsable "Research Profundo" debajo de raw_text:
- **Fecha de recencia** (date picker)
- **Region de mercado** (select: LATAM / Europa / MENA / Asia / Global)
- **Buyer Persona** (text input con sugerencias: "Director O&M", "Ingeniero planta", "CEO empresa solar")
- **Trend Score** (0-10 slider, igual que fit_score en Topics)
- **Fit Score** (0-10 slider)
- **Evidence Links** (lista dinamica de URLs)
- **Key Takeaways** (lista dinamica, 3-10 bullets)
- **Recommended Angles** (lista dinamica, angulos sugeridos para contenido)

#### 1.4 Research Synthesis (nuevo paso)
Agregar boton "Generar Sintesis" en detalle de research que:
1. Toma `raw_text` + `key_takeaways`
2. Llama a un nuevo endpoint `/api/ai/synthesize-research`
3. Retorna 5-10 bullets convertibles a Topics
4. Muestra en un panel colapsable "Sintesis AI"
5. Cada bullet tiene boton "Crear Topic" que navega a `/topics/new` pre-llenado

#### 1.5 Archivos a Modificar
| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/002_research_structured.sql` | Nuevo: ALTER TABLE |
| `src/shared/types/content-ops.ts` | Actualizar researchSchema + tipos |
| `src/features/research/services/research-service.ts` | Aceptar nuevos campos |
| `src/features/research/actions/research-actions.ts` | Parsear nuevos campos de FormData |
| `src/features/research/components/ResearchForm.tsx` | Seccion colapsable nueva |
| `src/features/research/components/ResearchDetail.tsx` | Mostrar nuevos campos |
| `src/app/api/ai/synthesize-research/route.ts` | Nuevo: endpoint AI |

---

## Fase 2: Topics Enriquecidos (Sprint 1)

### Brecha
Falta el concepto de "enemigo silencioso" (nombre corto + patron) y su "prueba minima".

### Estado Actual de la Tabla `topics`
```
id, workspace_id, title, hypothesis, evidence, anti_myth, signals_json,
fit_score, priority, status, created_by, created_at, updated_at
```

### Cambios Requeridos

#### 2.1 Migracion SQL — Nuevos campos en `topics`
```sql
ALTER TABLE topics
  ADD COLUMN silent_enemy_name text,
  ADD COLUMN minimal_proof text,
  ADD COLUMN failure_modes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN expected_business_impact text,
  ADD COLUMN recommended_week_structure jsonb;
```

#### 2.2 Tipo actualizado en `content-ops.ts`
```typescript
// Nuevos campos en topicSchema
silent_enemy_name: z.string().nullable(),     // "El polvo invisible"
minimal_proof: z.string().nullable(),          // "Mide la irradiancia vs produccion un dia nublado"
failure_modes: z.array(z.string()).default([]), // ["No medir", "Medir sin corregir temperatura"]
expected_business_impact: z.string().nullable(), // "3-8% perdida anual por soiling no detectado"
recommended_week_structure: z.record(z.unknown()).nullable(), // Plan semanal sugerido
```

#### 2.3 UI — TopicForm ampliado
Agregar seccion "Enemigo Silencioso" con:
- **Nombre del enemigo** (text, placeholder: "El polvo invisible")
- **Prueba minima** (textarea, placeholder: "Como evidenciar este problema con una accion simple")
- **Failure Modes** (lista dinamica)
- **Impacto de negocio esperado** (textarea)
- **Estructura semanal recomendada** (JSON editor opcional, para usuarios avanzados)

#### 2.4 Archivos a Modificar
| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/002_topics_enriched.sql` | Nuevo: ALTER TABLE |
| `src/shared/types/content-ops.ts` | Actualizar topicSchema |
| `src/features/topics/services/topic-service.ts` | Aceptar nuevos campos |
| `src/features/topics/actions/topic-actions.ts` | Parsear nuevos campos |
| `src/features/topics/components/TopicForm.tsx` | Seccion "Enemigo Silencioso" |
| `src/features/topics/components/TopicList.tsx` | Mostrar silent_enemy_name en cards |

---

## Fase 3: Campaign Weekly Brief (Sprint 2)

### Brecha
Falta un "brief semanal" completo que sirva de contexto para toda la generacion de contenido.

### Estado Actual
`campaigns` tiene `keyword`, `resource_json`, `audience_json` pero no un brief estructurado.

### Cambios Requeridos

#### 3.1 Migracion SQL
```sql
ALTER TABLE campaigns
  ADD COLUMN weekly_brief jsonb,
  ADD COLUMN publishing_plan jsonb;
```

#### 3.2 Estructura del Weekly Brief
```typescript
interface WeeklyBrief {
  tema: string                    // Titulo del tema central
  enemigo_silencioso: string      // Del Topic asociado
  evidencia_clave: string         // Dato/hecho principal
  senales_mercado: string[]       // Preguntas, tendencias
  anti_mito: string               // Mito a derribar
  buyer_persona: string           // Audiencia target
  keyword: string                 // CTA keyword
  recurso: string                 // Nombre del recurso
  restriccion_links: boolean      // No links externos (default true)
  tone_rules: string              // Reglas de tono especificas
}

interface PublishingPlan {
  [day: number]: {                // 1-5
    suggested_time: string        // "08:30" (hora sugerida)
    notes: string                 // Notas de publicacion
  }
}
```

#### 3.3 UI — Brief Tab en CampaignBuilder
Agregar tab "Brief" en el header del CampaignBuilder:
- Formulario con todos los campos del brief
- Auto-llenado desde Topic asociado (si existe):
  - `tema` ← topic.title
  - `enemigo_silencioso` ← topic.silent_enemy_name
  - `evidencia_clave` ← topic.evidence
  - `senales_mercado` ← topic.signals_json
  - `anti_mito` ← topic.anti_myth
- Publishing plan: 5 filas (L-V) con time picker + notas

#### 3.4 Impacto en Generacion AI
El weekly_brief se inyecta como contexto en:
- `/api/ai/generate-copy` — seccion "Brief de la semana" en el prompt
- `/api/ai/generate-visual-json` — contexto de marca y tema
- Futuros Critic Agents — evaluan coherencia vs brief

#### 3.5 Archivos a Modificar
| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/003_campaign_brief.sql` | ALTER TABLE campaigns |
| `src/shared/types/content-ops.ts` | WeeklyBrief + PublishingPlan types |
| `src/features/campaigns/services/campaign-service.ts` | Guardar/leer brief |
| `src/features/campaigns/actions/campaign-actions.ts` | Action para update brief |
| `src/features/campaigns/components/CampaignBuilder.tsx` | Tab "Brief" |
| `src/features/campaigns/components/WeeklyBriefForm.tsx` | Nuevo: formulario de brief |
| `src/app/api/ai/generate-copy/route.ts` | Inyectar brief como contexto |
| `src/app/api/ai/generate-visual-json/route.ts` | Inyectar brief como contexto |

---

## Fase 4: Copy Estructurado + Validador de Receta (Sprint 2)

### Brecha
El copy se guarda como texto plano. Falta estructura semantica (hook/context/signals/cta) y un validador explicito de la receta D/G/P/I.

### Estado Actual
`post_versions.content` es `text` — un solo campo de texto libre.

### Cambios Requeridos

#### 4.1 Migracion SQL
```sql
ALTER TABLE post_versions
  ADD COLUMN structured_content jsonb;
```

#### 4.2 Estructura del Copy
```typescript
interface StructuredContent {
  hook: string           // Primera linea que detiene el scroll
  context: string        // Contexto/evidencia (1-2 parrafos)
  signals: string        // Senales de mercado, datos
  provocation: string    // Provocacion emocional/intelectual
  cta: string            // Call-to-action
  hashtags: string[]     // 3-5 hashtags
}
```

#### 4.3 Validador de Receta D/G/P/I
Nuevo componente `RecipeValidator` que analiza el contenido en tiempo real:

| Check | Regla | UI |
|-------|-------|----|
| Hook presente | Primera linea < 120 chars, contiene pregunta o dato | ✓/✗ |
| Sin links externos | No contiene http/https | ✓/✗ |
| Keyword presente | Keyword de campana aparece en texto | ✓/✗ |
| Parrafos cortos | Ningun parrafo > 3 lineas | ✓/✗ |
| CTA presente | Ultima seccion invita a accion | ✓/✗ |
| Longitud optima | 1500-2800 chars (sweet spot LinkedIn) | ✓/✗ |
| Hashtags | 3-5 hashtags al final | ✓/✗ |
| Densidad legibilidad movil | Parrafos < 280 chars (ancho movil) | ✓/✗ |

#### 4.4 Generacion AI Estructurada
Actualizar `/api/ai/generate-copy` para devolver `structured_content` ademas de `content`:
```typescript
// Output schema actualizado
const generatedCopySchema = z.object({
  variants: z.array(z.object({
    variant: z.enum(['contrarian', 'story', 'data_driven']),
    content: z.string().min(1),        // Texto completo (backward compatible)
    hook: z.string().min(1),
    cta: z.string().min(1),
    structured_content: z.object({     // NUEVO
      hook: z.string(),
      context: z.string(),
      signals: z.string(),
      provocation: z.string(),
      cta: z.string(),
      hashtags: z.array(z.string()),
    }),
  })).length(3),
})
```

#### 4.5 Archivos a Modificar
| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/003_post_structured.sql` | ALTER TABLE post_versions |
| `src/shared/types/content-ops.ts` | StructuredContent type |
| `src/features/posts/components/PostEditor.tsx` | RecipeValidator + vista estructurada |
| `src/features/posts/components/RecipeValidator.tsx` | Nuevo: validador en tiempo real |
| `src/features/posts/services/post-service.ts` | Guardar structured_content |
| `src/app/api/ai/generate-copy/route.ts` | Schema actualizado + structured output |

---

## Fase 5: CopyCritic Agent (Sprint 3)

### Brecha
El scoring D/G/P/I es solo humano. Falta un agente critico automatizado que detecte problemas antes de la revision humana.

### Diseno

#### 5.1 Nuevo Endpoint AI
**`POST /api/ai/critic-copy`**

Input:
```typescript
{
  content: string,
  variant: PostVariant,
  funnel_stage: FunnelStage,
  weekly_brief?: WeeklyBrief,
  keyword?: string,
}
```

Output:
```typescript
{
  score: {
    detener: number,   // 0-5
    ganar: number,
    provocar: number,
    iniciar: number,
    total: number,
  },
  findings: Array<{
    category: 'generico' | 'sin_evidencia' | 'jerga' | 'cta_debil' | 'hook_debil' | 'longitud' | 'formato',
    severity: 'blocker' | 'warning' | 'suggestion',
    description: string,
    location: string,     // "hook", "parrafo 3", "cta"
  }>,
  suggestions: string[],  // Max 3 cambios sugeridos
  verdict: 'pass' | 'needs_work' | 'rewrite',
}
```

#### 5.2 System Prompt del Critic
```
Eres un critico experto de copy LinkedIn para O&M fotovoltaico.
Evaluas usando la rubrica D/G/P/I (0-5 cada dimension).
Detectas: contenido generico, falta de evidencia, jerga innecesaria, CTA debil.
Propones MAXIMO 3 cambios por iteracion (enfocados, no overwhelm).
Si el brief semanal esta disponible, verificas coherencia.
```

#### 5.3 UI — Panel Critic en PostEditor
Agregar boton "Evaluar con AI" en el sidebar derecho:
- Muestra score AI vs score humano (side by side)
- Lista de findings con severity badges
- 3 sugerencias accionables
- Verdict badge: Pass (verde) / Needs Work (amarillo) / Rewrite (rojo)

#### 5.4 Human Approval Gate
Agregar estado intermedio en post status:
```
draft → review → needs_human_review → approved → published
```
El CopyCritic puede sugerir `needs_human_review` cuando detecta blockers.

#### 5.5 Migracion SQL
```sql
-- Nuevo estado en post status check
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'review', 'needs_human_review', 'approved', 'published'));

-- Tabla para guardar reviews del critic
CREATE TABLE critic_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_version_id uuid NOT NULL REFERENCES post_versions(id) ON DELETE CASCADE,
  critic_type text NOT NULL CHECK (critic_type IN ('copy', 'visual')),
  score_json jsonb,
  findings jsonb DEFAULT '[]'::jsonb,
  suggestions jsonb DEFAULT '[]'::jsonb,
  verdict text CHECK (verdict IN ('pass', 'needs_work', 'rewrite')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE critic_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY critic_reviews_workspace_isolation ON critic_reviews
  FOR ALL USING (
    post_version_id IN (
      SELECT pv.id FROM post_versions pv
      JOIN posts p ON pv.post_id = p.id
      JOIN campaigns c ON p.campaign_id = c.id
      WHERE public.is_workspace_member(c.workspace_id)
    )
  );
CREATE INDEX idx_critic_reviews_version ON critic_reviews(post_version_id);
```

#### 5.6 Archivos a Crear/Modificar
| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/004_critic_reviews.sql` | Nuevo: tabla critic_reviews + post status update |
| `src/shared/types/content-ops.ts` | CriticReview type + POST_STATUSES update |
| `src/app/api/ai/critic-copy/route.ts` | Nuevo: endpoint CopyCritic |
| `src/features/posts/components/PostEditor.tsx` | Panel Critic + approval gate |
| `src/features/posts/components/CriticPanel.tsx` | Nuevo: visualizacion de findings |
| `src/features/posts/services/critic-service.ts` | Nuevo: CRUD critic_reviews |

---

## Fase 6: Conceptos Visuales (3 opciones) (Sprint 3)

### Brecha
La app salta directamente a generar el JSON visual sin un paso previo de seleccion de concepto. En el proceso manual se eligen 3 opciones: infografia 1:1, carrusel 4:5, foto humanizada.

### Diseno

#### 6.1 Nuevo Modelo: Visual Concepts
```typescript
interface VisualConcept {
  id: string
  post_id: string
  concept_type: 'infographic_1x1' | 'carousel_4x5' | 'humanized_photo' | 'data_chart' | 'custom'
  rationale: string          // Por que este concepto
  layout: string             // Descripcion del layout
  text_budget: string        // Cuanto texto cabe
  data_evidence: string      // Que datos visualizar
  risk_notes: string         // Riesgos (texto ilegible, etc.)
  selected: boolean          // El humano selecciono este
  created_at: string
}
```

#### 6.2 Migracion SQL
```sql
CREATE TABLE visual_concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  concept_type text NOT NULL CHECK (concept_type IN (
    'infographic_1x1', 'carousel_4x5', 'humanized_photo', 'data_chart', 'custom'
  )),
  rationale text NOT NULL,
  layout text,
  text_budget text,
  data_evidence text,
  risk_notes text,
  selected boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE visual_concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY visual_concepts_workspace_isolation ON visual_concepts
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN campaigns c ON p.campaign_id = c.id
      WHERE public.is_workspace_member(c.workspace_id)
    )
  );
CREATE INDEX idx_visual_concepts_post ON visual_concepts(post_id);

-- Agregar concept_type a visual_versions para vincular
ALTER TABLE visual_versions
  ADD COLUMN concept_type text;
```

#### 6.3 Nuevo Endpoint AI
**`POST /api/ai/generate-visual-concepts`**

Input:
```typescript
{
  post_content: string,
  funnel_stage: FunnelStage,
  topic?: string,
  keyword?: string,
  weekly_brief?: WeeklyBrief,
}
```

Output:
```typescript
{
  concepts: Array<{
    concept_type: ConceptType,
    rationale: string,
    layout: string,
    text_budget: string,
    data_evidence: string,
    risk_notes: string,
  }>   // Siempre 3 opciones
}
```

#### 6.4 Flujo Actualizado del Visual Editor
```
1. Desde CampaignBuilder, click "Visual"
2. Nuevo paso: "Seleccion de Concepto"
   - Generar 3 conceptos con AI
   - Cards comparativas (infografia / carrusel / foto)
   - Cada card muestra: rationale, layout, riesgos
   - Humano selecciona uno
3. Paso existente: Generacion de JSON (ahora con concept_type)
   - El JSON se genera pre-contextualizado con el concepto elegido
4. Resto del flujo igual (QA, upload, etc.)
```

#### 6.5 Archivos a Crear/Modificar
| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/004_visual_concepts.sql` | Nuevo: tabla + ALTER visual_versions |
| `src/shared/types/content-ops.ts` | VisualConcept type + ConceptType enum |
| `src/app/api/ai/generate-visual-concepts/route.ts` | Nuevo: endpoint |
| `src/features/visuals/services/visual-concept-service.ts` | Nuevo: CRUD concepts |
| `src/features/visuals/components/ConceptSelector.tsx` | Nuevo: selector de 3 opciones |
| `src/features/visuals/components/VisualEditor.tsx` | Integrar ConceptSelector como paso 1 |

---

## Fase 7: VisualCritic Agent (Sprint 4)

### Brecha
El QA visual es manual (9 checkboxes). Falta un agente que evalue legibilidad movil, coherencia con copy, consistencia editorial.

### Diseno

#### 7.1 Nuevo Endpoint AI
**`POST /api/ai/critic-visual`**

Input:
```typescript
{
  prompt_json: VisualPromptJson,
  post_content: string,
  concept_type?: ConceptType,
  format: VisualFormat,
}
```

Output:
```typescript
{
  findings: Array<{
    category: 'legibilidad' | 'coherencia_copy' | 'consistencia_editorial' | 'brand' | 'texto_render',
    severity: 'blocker' | 'warning' | 'suggestion',
    description: string,
  }>,
  suggestions: string[],     // Max 3
  mobile_readability: 'pass' | 'warning' | 'fail',
  brand_consistency: 'pass' | 'warning' | 'fail',
  verdict: 'pass' | 'needs_work' | 'rewrite',
}
```

#### 7.2 Reutilizar tabla `critic_reviews`
El `critic_type = 'visual'` usa la misma tabla creada en Fase 5, pero referenciando `visual_versions` en lugar de `post_versions`. Alternativa: agregar `visual_version_id` nullable a `critic_reviews`.

#### 7.3 Archivos a Crear/Modificar
| Archivo | Cambio |
|---------|--------|
| `src/app/api/ai/critic-visual/route.ts` | Nuevo: endpoint |
| `src/features/visuals/components/VisualEditor.tsx` | Boton "Evaluar con AI" |
| `src/features/visuals/components/VisualCriticPanel.tsx` | Nuevo: findings + verdict |

---

## Fase 8: Brand Profiles Versionados (Sprint 4)

### Brecha
Las reglas de marca estan hardcodeadas en `brand-rules.ts`. La marca evoluciona y deberia ser configurable por workspace.

### Diseno

#### 8.1 Migracion SQL
```sql
CREATE TABLE brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default',
  version smallint NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  colors jsonb NOT NULL,        -- {primary, secondary, accent, background, text}
  typography jsonb NOT NULL,    -- {heading, body, style}
  logo_rules jsonb NOT NULL,    -- {placement, size, includeAlways}
  imagery jsonb NOT NULL,       -- {style, subjects[], mood}
  tone text NOT NULL,
  negative_prompts jsonb DEFAULT '[]'::jsonb,
  qa_checklist jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY brand_profiles_workspace ON brand_profiles
  FOR ALL USING (public.is_workspace_member(workspace_id));
CREATE INDEX idx_brand_profiles_workspace ON brand_profiles(workspace_id);
CREATE TRIGGER trg_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### 8.2 Impacto en Generacion AI
- Endpoints AI leen brand_profile activo del workspace en lugar de constantes hardcodeadas
- Fallback a `BRAND_STYLE` de `brand-rules.ts` si no hay profile

#### 8.3 UI — Pagina de Brand Settings
Nueva ruta: `/settings/brand`
- Editor de colores (color pickers)
- Editor de tipografia
- Editor de reglas de logo
- Editor de negative prompts
- Preview visual del brand profile
- Historial de versiones

#### 8.4 Archivos a Crear/Modificar
| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/005_brand_profiles.sql` | Nuevo: tabla |
| `src/features/brand/services/brand-service.ts` | Nuevo: CRUD + getActiveProfile |
| `src/features/brand/components/BrandEditor.tsx` | Nuevo: editor completo |
| `src/app/(main)/settings/brand/page.tsx` | Nuevo: pagina |
| `src/features/visuals/constants/brand-rules.ts` | Convertir a fallback |
| `src/app/api/ai/generate-visual-json/route.ts` | Leer brand profile |
| `src/app/api/ai/generate-copy/route.ts` | Inyectar tone del brand |

---

## Fase 9: Iteraciones Nano Banana Pro (Sprint 5)

### Brecha
La app no registra el proceso de iteracion en Nano Banana Pro (que prompt genero que imagen, que se corrigio).

### Cambios Requeridos

#### 9.1 Migracion SQL
```sql
ALTER TABLE visual_versions
  ADD COLUMN nanobanana_run_id text,
  ADD COLUMN output_asset_id uuid REFERENCES assets(id),
  ADD COLUMN qa_notes text,
  ADD COLUMN iteration_reason text;
```

#### 9.2 UI — Panel de Iteracion Nano Banana
En VisualEditor, seccion "Historial Nano Banana":
- Input `nanobanana_run_id` (manual, el disenador pega el ID del run)
- Boton "Subir Resultado" (sube imagen a assets + vincula)
- Campo `iteration_reason` ("Texto ilegible en esquina", "Logo muy grande")
- Campo `qa_notes` (notas del QA)
- Timeline de iteraciones: prompt v1 → imagen v1 → QA fail → prompt v2 → imagen v2 → QA pass

#### 9.3 QA Triage (fallos comunes)
Agregar presets de `iteration_reason`:
- "Texto ilegible"
- "Caos visual / composicion saturada"
- "Logo incorrecto o ausente"
- "Colores fuera de marca"
- "Formato incorrecto"
- "Otro" (campo libre)

---

## Fase 10: Export Pack Ampliado (Sprint 5)

### Brecha
El pack actual incluye copy.md, visual_prompts/, checklist.md, links.md. Falta weekly_brief.md, publishing_plan.md, y templates copy/paste.

### Cambios Requeridos

#### 10.1 Nuevos archivos en el ZIP
```
campaign-pack-2026-02-24.zip
├── weekly_brief.md              # NUEVO: resumen tema + pruebas + anti-mitos
├── publishing_plan.md           # NUEVO: horarios sugeridos por dia
├── copy.md                      # Existente (posts + scores)
├── dm_templates.md              # NUEVO: version renderizada Y version copy/paste
├── visual_prompts/              # Existente
├── checklist_publicacion.md     # Existente
└── links.md                     # Existente
```

#### 10.2 Generacion de weekly_brief.md
```markdown
# Brief Semanal — Semana 24/02/2026

## Tema Central
SCADA Data Quality en O&M Fotovoltaico

## Enemigo Silencioso
El polvo invisible — lecturas SCADA contaminadas

## Evidencia Clave
El 73% de plantas no calibran sensores trimestralmente

## Anti-Mito
"Los datos del inversor son suficientes para monitorear"

## Buyer Persona
Director de O&M en plantas >5MW

## Keyword CTA
#SCADA
```

#### 10.3 Generacion de dm_templates.md
Dos secciones por template:
1. **Version con variables** (para documentacion)
2. **Version copy/paste** (renderizada, lista para usar)

#### 10.4 Archivos a Modificar
| Archivo | Cambio |
|---------|--------|
| `src/features/export/services/export-service.ts` | Agregar generators para brief + plan + dm |
| `src/features/export/components/ExportPanel.tsx` | Nuevas cards de preview |

---

## Fase 11: Conversion Mejorada (Sprint 5)

### Brecha
Falta modo "copy/paste sin variables" para operacion rapida y template de comentario fijado.

### Cambios Requeridos

#### 11.1 UI — Toggle "Modo Rapido"
En ConversionPanel, agregar toggle:
- **Modo Variables**: muestra `{{keyword}}`, `{{nombre}}`, etc. (actual)
- **Modo Copy/Paste**: renderiza con valores reales, listo para pegar

#### 11.2 Pinned Comment Template
Agregar campo `pinned_comment_template` en ConversionConfig:
```typescript
interface ConversionConfig {
  resource?: ResourceData
  templates?: TemplateData[]
  pinned_comment?: string      // NUEVO: "Comenta #SCADA para recibir la guia"
}
```

#### 11.3 Archivos a Modificar
| Archivo | Cambio |
|---------|--------|
| `src/features/conversion/services/conversion-service.ts` | Nuevo campo pinned_comment |
| `src/features/conversion/components/ConversionPanel.tsx` | Toggle modo + pinned comment |

---

## Fase 12: Pattern Library + Retrieval (Sprint 6)

### Brecha
Los aprendizajes se documentan pero no se reutilizan. Falta un vinculo entre metricas/learnings y la generacion futura.

### Diseno

#### 12.1 Migracion SQL
```sql
CREATE TABLE pattern_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pattern_type text NOT NULL CHECK (pattern_type IN (
    'hook', 'cta', 'visual_format', 'topic_angle', 'content_structure'
  )),
  content text NOT NULL,           -- El patron en si
  context jsonb DEFAULT '{}'::jsonb, -- {funnel_stage, variant, topic, persona}
  performance jsonb DEFAULT '{}'::jsonb, -- {impressions, comments, engagement_rate, dgpi_score}
  source_post_version_id uuid REFERENCES post_versions(id),
  source_campaign_id uuid REFERENCES campaigns(id),
  tags jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pattern_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY pattern_library_workspace ON pattern_library
  FOR ALL USING (public.is_workspace_member(workspace_id));
CREATE INDEX idx_pattern_library_workspace ON pattern_library(workspace_id);
CREATE INDEX idx_pattern_library_type ON pattern_library(workspace_id, pattern_type);
```

#### 12.2 Flujo de Indexacion
Despues de guardar metricas (Fase 8 actual), opcion "Guardar como patron":
1. Usuario selecciona que parte del post es el patron (hook, CTA, estructura)
2. Se guarda con contexto (funnel, variante, tema) y performance
3. Se tagea automaticamente

#### 12.3 Retrieval en Generacion AI
Antes de llamar a `/api/ai/generate-copy`:
1. Query top 5 patrones similares (mismo funnel_stage + patron_type = 'hook')
2. Query top 5 learnings recientes del workspace
3. Inyectar en el prompt como contexto:
```
Patrones exitosos previos:
- Hook "Tu SCADA no miente" → 18/20 D/G/P/I, 2.3% engagement
- CTA "Comenta #SCADA" → 45 leads en una semana

Aprendizajes recientes:
- Hooks con preguntas generan 2x mas comentarios
- Posts MOFU con infografia tienen 30% mas saves
```

#### 12.4 Archivos a Crear/Modificar
| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/006_pattern_library.sql` | Nuevo: tabla |
| `src/features/patterns/services/pattern-service.ts` | Nuevo: CRUD + search |
| `src/features/patterns/components/PatternLibrary.tsx` | Nuevo: vista de patrones |
| `src/features/analytics/components/MetricsPanel.tsx` | Boton "Guardar como patron" |
| `src/app/api/ai/generate-copy/route.ts` | Retrieval pre-generacion |
| `src/app/(main)/patterns/page.tsx` | Nuevo: pagina de library |

---

## Fase 13: Motor de Mejora Continua (Sprint 6)

### Brecha
Falta cerrar el loop: aprender de iteraciones y resultados, y reutilizar automaticamente.

### Diseno

#### 13.1 Tracking de Deltas de Iteracion
Registrar en cada iteracion AI:
```typescript
interface IterationDelta {
  post_version_from: string   // UUID version original
  post_version_to: string     // UUID version iterada
  changes_made: string[]      // Del AI iterate response
  score_before: ScoreJson | null
  score_after: ScoreJson | null
  score_delta: number         // total_after - total_before
}
```

Esto permite responder: "Que tipo de cambios mejoran mas el score?"

#### 13.2 Dashboard de Mejora Continua
Nueva seccion en `/dashboard` o nueva ruta `/insights`:
- **Top hooks** por engagement (de pattern_library)
- **Top CTAs** por leads
- **Formatos visuales** que mejor rinden
- **Mejoras mas efectivas** (deltas de iteracion positivos)
- **Trends**: engagement rate por semana (linea de tiempo)

#### 13.3 Loop Automatizado
```
1. Generacion v1 (copy + conceptos visuales)
2. Critic Agents (copy/visual) → recomendaciones automaticas
3. Humano elige → v2 (con approval gate)
4. Publicacion
5. Metricas capturadas post-publicacion
6. Indexacion automatica de patrones exitosos (score > 16 o engagement > 2%)
7. Retrieval en proxima generacion → mejor contexto → mejor v1
```

#### 13.4 Archivos a Crear
| Archivo | Cambio |
|---------|--------|
| `src/features/insights/services/insights-service.ts` | Nuevo: queries agregadas |
| `src/features/insights/components/InsightsDashboard.tsx` | Nuevo: visualizacion |
| `src/app/(main)/insights/page.tsx` | Nuevo: pagina |

---

## Resumen de Cambios en Base de Datos

### Tablas Nuevas (4)
| Tabla | Fase | Proposito |
|-------|------|-----------|
| `critic_reviews` | 5 | Reviews de CopyCritic y VisualCritic |
| `visual_concepts` | 6 | 3 opciones de concepto visual por post |
| `brand_profiles` | 8 | Reglas de marca versionadas por workspace |
| `pattern_library` | 12 | Patrones exitosos indexados |

### Columnas Nuevas en Tablas Existentes
| Tabla | Columnas | Fase |
|-------|----------|------|
| `research_reports` | recency_date, market_region, buyer_persona, trend_score, fit_score, evidence_links, key_takeaways, recommended_angles | 1 |
| `topics` | silent_enemy_name, minimal_proof, failure_modes, expected_business_impact, recommended_week_structure | 2 |
| `campaigns` | weekly_brief, publishing_plan | 3 |
| `post_versions` | structured_content | 4 |
| `posts` | status CHECK actualizado (+needs_human_review) | 5 |
| `visual_versions` | concept_type, nanobanana_run_id, output_asset_id, qa_notes, iteration_reason | 6, 9 |

---

## Resumen de Nuevos Endpoints AI

| Endpoint | Fase | Proposito |
|----------|------|-----------|
| `POST /api/ai/synthesize-research` | 1 | Sintetizar research en bullets accionables |
| `POST /api/ai/critic-copy` | 5 | CopyCritic: evalua D/G/P/I + findings |
| `POST /api/ai/generate-visual-concepts` | 6 | Genera 3 conceptos visuales |
| `POST /api/ai/critic-visual` | 7 | VisualCritic: legibilidad + coherencia |

---

## Dependencias entre Fases

```
Fase 1 (Research) ──────> Fase 2 (Topics) ──> Fase 3 (Brief) ──> Fase 4 (Copy)
                                                    │                   │
                                                    v                   v
                                              Fase 6 (Concepts) ──> Fase 5 (CopyCritic)
                                                    │                   │
                                                    v                   v
                                              Fase 7 (VisualCritic)  Fase 8 (Brand)
                                                    │
                                                    v
                                    Fase 9 (Nano Banana) + Fase 10 (Export) + Fase 11 (Conversion)
                                                    │
                                                    v
                                         Fase 12 (Patterns) ──> Fase 13 (Mejora Continua)
```

**Fases independientes** (pueden ejecutarse en paralelo):
- Fase 1 + Fase 2 (ambas son enriquecimiento de datos)
- Fase 5 + Fase 6 (CopyCritic + Visual Concepts)
- Fase 9 + Fase 10 + Fase 11 (Nano Banana + Export + Conversion)

**Fases con dependencias duras**:
- Fase 3 depende de Fase 2 (brief usa campos de topics)
- Fase 4 depende de Fase 3 (copy usa brief como contexto)
- Fase 7 depende de Fase 6 (critic evalua conceptos)
- Fase 12 depende de Fase 5 (patterns guardan scores del critic)
- Fase 13 depende de Fase 12 (mejora continua usa pattern library)

---

*Plan generado a partir de la auditoria de logica App ContentOps vs proceso manual Bitalize.*
