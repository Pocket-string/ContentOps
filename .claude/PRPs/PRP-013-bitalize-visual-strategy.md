# PRP-013: Bitalize Visual Strategy — Proof-Before-Polish para LinkedIn B2B SaaS

> **Estado**: PENDIENTE
> **Fecha**: 2026-05-11
> **Proyecto**: LinkedIn ContentOps (Bitalize)
> **Lente**: Experto marketing B2B SaaS startup early-stage
> **Campaign de validación E2E**: `f00ba3d8-6a4b-4de2-85f5-142b4fe89dc7` (TRACKER, week of May 11)

---

## Objetivo

Evolucionar el sistema visual de PRP-011 para producir visuales **founder-led con tesis "proof before polish"**: 9 archetypes (screenshot_annotated, dashboard_annotated, carousel_mini_report, data_decision_flow, before_after, field_photo_overlay, founder_proof, technical_report, risk_card), auditor anti-genérico 10-point con score /50 visible en UI, biblioteca de plantillas JSON pre-configuradas, selector visual en editor con thumbnails, y validación E2E completa generando los 5 visuales de la campaña May 11-15 con Karpathy loop hasta 100% conformidad marketing expert.

## Por Qué

| Problema | Solución |
|----------|----------|
| Visuales actuales sin tesis editorial: no construyen categoría "pérdida invisible" ni founder-led proof. | 9 archetypes orientados a mostrar pérdida + dónde + cuánto duele + qué decisión habilita. |
| Algoritmo LinkedIn 2026 (360Brew) deprioritiza AI-template content. | Auditor 10-point que bloquea visuales que parezcan stock/template. Obliga a screenshots reales, datos anotados, founder voice visible. |
| Asset Managers ven decenas de gráficos genéricos por día. | "Una idea por visual + dato cuantificado + decisión operativa" como contrato. Bullets/frameworks guardables (saves valen 5x likes en Feed-SR). |
| Sistema no mapea visuales a objetivos de funnel ni a KPIs. | Matriz formato → archetype → funnel → KPI. |
| No hay loop de mejora iterativa por visual (Karpathy adapter solo existe para copy hoy). | Fase E2E con MCP Playwright + auditor + iteración hasta 50/50 score. |

**Valor de negocio (cuantificado, fuentes 2026)**:
- Carruseles 24.42% engagement vs 1.2% video vs 0.8% image
- Founder-led content: 7x más impresiones que company pages
- Documents: 12.92% de todos los saves (2.6x su share)
- Saves = 5x más poderosos que likes en algoritmo Feed-SR

## Qué

### Criterios de Éxito (binarios, medibles)

- [ ] 9 archetypes implementados como enum + selector UI con thumbnails
- [ ] Cada archetype tiene plantilla JSON pre-configurada en `brand_profiles.visual_templates`
- [ ] `buildVisualJsonPrompt()` retorna prompt específico por archetype (test unitario para los 9)
- [ ] `critic-visual` retorna `score` 0-50, `findings[]` con 10 checks binarios, `verdict` (publishable si ≥45, retry_recommended si 35-44, regenerate si <35)
- [ ] VisualEditor UI muestra: selector archetype + auditor score gauge + 10 checks con ✓/✗ + botón "Regenerar con feedback"
- [ ] Migración `02X_prp013_visual_archetypes.sql` aplicada en prod sin breakage
- [ ] **Los 5 visuales de la campaña May 11-15 generados, iterados con Karpathy, y aprobados ≥45/50 cada uno**
- [ ] `pnpm exec tsc --noEmit` = 0 errores en cada fase
- [ ] Build Dokploy exitoso post-deploy
- [ ] Playwright E2E screenshots de los 5 visuales finales persistidos en `.claude/karpathy-runs/prp-013/may-11-15/`

### Comportamiento Esperado (UX flow end-to-end)

**Antes** (estado actual):
1. Usuario abre VisualEditor desde una card de post en el campaign builder.
2. Ve formato (1:1 / 4:5 / 16:9), tipo (single/carousel), aesthetic preset.
3. Click "Generar con AI" → modelo produce imagen sin guidance específica de archetype.
4. Critic panel muestra 8+4 checks pass/fail sin score numérico ni threshold.

**Después** (con PRP-013):
1. Usuario abre VisualEditor. Sobre el selector de tipo ahora hay un **panel de 9 cards de archetype** (ej. "Screenshot Anotado", "Dashboard Anotado", "Carrusel Mini-Informe", "Risk Card") con thumbnail mock + 1-line descripción + badge de funnel target.
2. Al click en una card, se pre-cargan en la textarea de `prompt_json` los campos: `archetype`, `prompt_overall` (template adaptado al post), `layout`, `negative_prompts`, `annotations_max`. Usuario puede editar libre.
3. Click "Generar con AI" → llama `buildVisualJsonPrompt({...post, archetype})` → modelo produce imagen con guidance específica del archetype.
4. La imagen se compone con logo (12% white band) y se guarda como nueva version.
5. Auditor corre automáticamente (o al click "Evaluar"). Panel muestra:
   - **Gauge circular** con score `47/50` y color (verde ≥45, ámbar 35-44, rojo <35)
   - **Lista de 10 checks** binarios con ✓/✗ y razón cuando falla ("Check #7 fail: stock-photo pattern detected — render shows generic solar panels with sunset")
   - **Verdict**: `publishable` / `retry_recommended` / `regenerate`
6. Si verdict ≠ `publishable`, el usuario tiene 3 acciones:
   - **"Regenerar con feedback"**: textarea pre-rellena con findings del auditor; nuevo intento con misma archetype.
   - **"Cambiar archetype"**: vuelve al selector; otra plantilla.
   - **"Editar JSON"**: tweaks manuales al `prompt_json`.
7. Al pasar threshold (≥45/50), botón "Aprobar para publicar" habilitado. Cambia status a `approved`. Card en campaign builder muestra mini-preview con badge "✓ Publishable".

**Cambios UI concretos**:
- `VisualEditor.tsx`: agregar componente `<ArchetypeSelector />` arriba del controles existentes
- `VisualCriticPanel.tsx`: refactor para mostrar gauge + lista 10 checks; oculta tabs viejos D/G/P/I que aplicaban a copy
- `CarouselEditor.tsx`: nuevo prop `archetype="carousel_mini_report"` por default; slides heredan archetype context en su prompt
- Card de post en `CampaignBuilder`: nuevo badge "Archetype: X" + estado auditor

---

## Contexto

### Referencias del codebase (REUSAR — no reinventar)

- [src/features/visuals/services/carousel-prompt-builder.ts:31](src/features/visuals/services/carousel-prompt-builder.ts) — `buildCarouselSlidePrompt()`, `slidesFromCarouselPlan()`, CAROUSEL_CONSISTENCY rules.
- `src/features/visuals/services/visual-json-template.ts` — `buildVisualJsonPrompt()`. Extender con `archetypeSection()`.
- `src/features/visuals/constants/brand-rules.ts` — `BRAND_STYLE`, `CAROUSEL_BRAND_RULES`, `NEGATIVE_PROMPTS`. Agregar `ARCHETYPE_RULES`.
- `src/features/visuals/services/logo-compositor.ts` — 12% white band. **No tocar**.
- `src/features/visuals/services/visual-type-router.ts` — `getVisualFlow()`. Extender con `archetype`.
- `src/app/api/ai/critic-visual/route.ts` — refactor: 10 checks /50.
- Tablas: `visual_versions`, `carousel_slides`, `brand_profiles` (migración extiende, no rompe).

### Documentos referenciales (no duplicar)

- [.claude/PRPs/PRP-011-visual-system-upgrade.md](.claude/PRPs/PRP-011-visual-system-upgrade.md) — base ya implementada.
- [.claude/PRPs/PRP-012-editorial-voice-system.md](.claude/PRPs/PRP-012-editorial-voice-system.md) — capa editorial paralela (copy).
- [docs/Contenido/Formatos y Estilos Más Exitosos de Infografías y C.md](docs/Contenido/Formatos%20y%20Estilos%20Más%20Exitosos%20de%20Infografías%20y%20C.md) — research previo.

### Verificación de claims del reporte (16 claims, 2025-2026)

| # | Claim | Status | Evidencia | Fuente |
|---|---|---|---|---|
| 1 | Carrusel 4:5 + 6-9 slides óptimo | **Confirmado c/refinamiento** | 4:5 portrait óptimo mobile; sweet spot **7 slides (18% mejor)**; rango 5-15 | [Postunreel](https://postunreel.com/blog/linkedin-carousel-engagement-rate-statistics-2026), [Oktopost](https://www.oktopost.com/blog/linkedin-carousel-pdf-best-practices/) |
| 2 | Founder-led amplifica alcance | **Confirmado** | 7x más impresiones que company pages | [Foundera](https://www.foundera.co/blog/founder-led-linkedin-growth) |
| 3 | Screenshots > stock en B2B SaaS | **Confirmado c/matiz** | UI screenshots 20% higher conversion; stock genérico 30-50% peor. Pero screenshots SIN anotación pueden bajar CTR — ejecución matters. | [Marketing Mix](https://www.themarketingmix.agency/post/product-visuals-for-saas-startups-photos-screenshots-or-illustrations), [SaaSHero](https://www.saashero.net/design/best-b2b-saas-linkedin-ads/) |
| 4 | Carruseles > single image | **Confirmado fuerte** | 24.42% vs 0.8% engagement; 3.4x reach | [Postunreel](https://postunreel.com/blog/linkedin-carousel-engagement-rate-statistics-2026) |
| 5 | Dashboards anotados generan saves | **Inferencia razonable** | Documents = 12.92% de saves (2.6x share). Sin estudio "anotado vs limpio" directo. | [Postunreel](https://postunreel.com/blog/linkedin-carousel-engagement-rate-statistics-2026) |
| 6 | Antes/después pattern B2B | **Inferencia razonable** | Social proof + before/after construyen trust en B2B sales | [SaaSHero](https://www.saashero.net/design/best-saas-visuals-b2b-ads/) |
| 7 | Insurtech risk cards adaptables a O&M FV | **Confirmado** | Insurance UX = reducir complejidad + risk scoring + decisión bajo incertidumbre | [Luxoft](https://www.luxoft.com/industries/insurance/ui-ux-design), [Vega IT](https://www.vegait.co.uk/media-center/business-insights/how-we-enabled-data-visualization-in-insurtech) |
| 8 | Digital twin layers en solar FV | **Confirmado fuerte** | Spatiotemporal heatmaps voltage profiles; layered DT architecture | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2211467X25001774), [SmartHelio](https://smarthelio.com/decoding-digital-twin-for-solar-plants/) |
| 9 | AI-generic stock baja autoridad | **Confirmado fuerte** | LinkedIn 360Brew detecta y deprioritiza AI-template content | [Hyperclapper](https://www.hyperclapper.com/blog-posts/linkedin-algorithm-changes-2026-the-complete-guide-to-growing-reach-leads-and-authority-under-the-new-ai-driven-system) |
| 10 | LinkedIn 1500-2200 chars | **Corrección** | Data 2026: **1,300-1,900** chars (no 1500-2200). 47% más engagement. | [ConnectSafely](https://connectsafely.ai/articles/ideal-linkedin-post-length-engagement-guide-2026) |
| 11 | Dwell time + saves primary signal | **Confirmado fuerte** | Saves = 5x más poderoso que like; carruseles 15-20s dwell | [SocialBoost](https://www.socialboostdigital.com/blog/linkedin-dwell-time-factor-2026) |
| 12 | 3-second + una idea por visual | **Confirmado** | "Each slide one key data point"; legible a 25% del tamaño | [Visme](https://visme.co/blog/infographic-layout/) |
| 13 | 60-30-10 design rule | **Confirmado** | Regla universal SaaS digital products; conversion lifts 21-433% | [SixtyThirtyTen](https://www.sixtythirtyten.co/blog/60-30-10-rule-complete-guide) |
| 14 | Acentos rojo/naranja/amarillo para riesgo | **Confirmado fuerte** | Universal data viz; Carbon Design System. Evitar red+green (colorblind). | [Carbon](https://carbondesignsystem.com/patterns/status-indicator-pattern/), [Sigma](https://www.sigmacomputing.com/blog/7-best-practices-for-using-color-in-data-visualizations) |
| 15 | Founder whiteboard/sketches | **Confirmado** | Mini whiteboard sessions = recommended format LinkedIn | [Ordinal](https://www.tryordinal.com/blog/linkedin-content-ideas-for-b2b-saas-founders-100-post-ideas-to-build-pipeline) |
| 16 | Anti-bot: no leading emoji | **No verificado** | Sin cita externa. Heurística interna; mantener como guideline, no como regla algorítmica. | — |

**Resumen**: 12 confirmados, 2 inferencias razonables, 1 corrección, 1 no verificado. Cero a descartar.

### Arquitectura propuesta (extensión Feature-First)

```
src/features/visuals/
├── components/
│   ├── VisualEditor.tsx              # MODIFICAR
│   ├── ArchetypeSelector.tsx         # NUEVO — 9 cards con thumbnail
│   ├── AuditorScorePanel.tsx         # NUEVO — gauge /50 + lista checks
│   ├── VisualCriticPanel.tsx         # MODIFICAR — usar AuditorScorePanel
│   └── CarouselEditor.tsx            # MODIFICAR — heredar archetype context
├── constants/
│   ├── brand-rules.ts                # MODIFICAR — agregar ARCHETYPE_RULES
│   └── archetypes.ts                 # NUEVO — ARCHETYPE_REGISTRY (9 entries)
├── services/
│   ├── visual-json-template.ts       # MODIFICAR — archetypeSection()
│   ├── carousel-prompt-builder.ts    # MODIFICAR — archetype-aware
│   ├── archetype-prompt-builder.ts   # NUEVO — 9 builders + helper
│   └── visual-type-router.ts         # MODIFICAR — getVisualFlow(archetype)
└── types/
    └── archetype.ts                  # NUEVO

src/app/api/ai/
├── critic-visual/route.ts            # MODIFICAR — 10 checks /50
└── audit-visual-anti-generic/route.ts # NUEVO opcional — endpoint dedicado

supabase/migrations/
└── 02X_prp013_visual_archetypes.sql  # NUEVO

docs/Contenido/
├── visual-strategy.md                # NUEVO — guía + matriz formato→KPI
└── visual-archetype-examples.md      # NUEVO — 3 ejemplos por archetype

.claude/karpathy-runs/prp-013/
└── may-11-15/                        # outputs E2E Fase 7
```

### Modelo de Datos

```sql
-- 02X_prp013_visual_archetypes.sql
BEGIN;

-- 1. Agregar archetype (independiente de concept_type — retrocompat)
ALTER TABLE visual_versions
  ADD COLUMN archetype TEXT
    CHECK (archetype IN (
      'screenshot_annotated',
      'dashboard_annotated',
      'carousel_mini_report',
      'data_decision_flow',
      'before_after',
      'field_photo_overlay',
      'founder_proof',
      'technical_report',
      'risk_card'
    ));

-- 2. Auditor score persistido
ALTER TABLE visual_versions ADD COLUMN auditor_score INTEGER
  CHECK (auditor_score BETWEEN 0 AND 50);
ALTER TABLE visual_versions ADD COLUMN auditor_findings JSONB DEFAULT '[]';
ALTER TABLE visual_versions ADD COLUMN auditor_verdict TEXT
  CHECK (auditor_verdict IN ('publishable', 'retry_recommended', 'regenerate'));

-- 3. Biblioteca de plantillas en brand_profiles (JSONB, no nueva tabla)
ALTER TABLE brand_profiles ADD COLUMN visual_templates JSONB DEFAULT '{}';
-- Estructura: { archetype_slug: { prompt_overall, layout, annotations_max, style, negative_prompts, color_accent_role } }

-- 4. RLS: hereda de brand_profiles (workspace_members). NO nueva tabla = NO nueva política.

-- 5. Seed inicial para workspace activo
UPDATE brand_profiles
  SET visual_templates = '{
    "screenshot_annotated": {
      "prompt_overall": "Render high-fidelity sober editorial SaaS dashboard screenshot...",
      "layout": "1:1",
      "annotations_max": 4,
      "style": "editorial_sober",
      "negative_prompts": ["stock photo", "robot AI", "futuristic 3D", "sunset gradient"],
      "color_accent_role": "losses_only"
    }
    // ... 8 más (definidos en Fase 1)
  }'::jsonb
  WHERE is_active = true;

COMMIT;
```

---

## Blueprint (Assembly Line)

> Solo FASES. El bucle-agentico genera subtareas al ejecutar. Cada fase tiene **implementación concreta** + **UX visible** + **validación**.

### Fase 1: Guía visual + 9 pilares + matriz KPI documentados

**Implementación**:
- Crear `docs/Contenido/visual-strategy.md` con:
  - Tesis "proof before polish" (1 párrafo)
  - 9 archetypes: cada uno con nombre, cuándo usar, formato target (1:1/4:5), layout, ejemplo Bitalize concreto, anti-pattern asociado
  - Matriz `archetype → funnel → KPI primaria → KPI secundaria → distribución 45 días`
  - Reglas brand consolidadas (logo, colores acentos, esquinas libres)
- Crear `docs/Contenido/visual-archetype-examples.md` con 3 ejemplos textuales por archetype (qué se vería)

**UX visible**: ninguna aún (documento de referencia que alimenta Fases 2-5).

**Validación**: doc revisado por Jonathan; archetypes cubren 100% del reporte sin agregar no-validados.

### Fase 2: Tipos + registry + plantillas JSON + migración DB

**Implementación**:
- `src/features/visuals/types/archetype.ts`:
  ```ts
  export type ArchetypeSlug =
    | 'screenshot_annotated' | 'dashboard_annotated' | 'carousel_mini_report'
    | 'data_decision_flow' | 'before_after' | 'field_photo_overlay'
    | 'founder_proof' | 'technical_report' | 'risk_card'

  export interface ArchetypeDefinition {
    slug: ArchetypeSlug
    displayName: string
    description: string
    funnelTargets: ('TOFU'|'MOFU'|'BOFU')[]
    defaultFormat: '1:1' | '4:5'
    annotationsMax: number
    promptOverall: string
    negativePrompts: string[]
    thumbnailEmoji: string // mientras no haya thumbnail real
  }
  ```
- `src/features/visuals/constants/archetypes.ts` exporta `ARCHETYPE_REGISTRY: Record<ArchetypeSlug, ArchetypeDefinition>` con las 9 entries completas.
- `supabase/migrations/02X_prp013_visual_archetypes.sql` (definida arriba).
- `mcp__supabase__apply_migration` en dev → tests → prod.
- Seed `brand_profiles.visual_templates` con las 9 plantillas (UPDATE SQL).

**UX visible**: aún ninguna; backend foundation lista.

**Validación**:
- `pnpm exec tsc --noEmit` = 0 errores
- `mcp__supabase__execute_sql`: `SELECT archetype, count(*) FROM visual_versions` no rompe
- `SELECT visual_templates FROM brand_profiles WHERE is_active=true` retorna 9 entries

### Fase 3: Prompt maestro extendido + archetype builders

**Implementación**:
- `src/features/visuals/services/archetype-prompt-builder.ts`: 9 funciones exportadas, una por archetype.
  ```ts
  export function buildScreenshotAnnotatedPrompt(post, brand): VisualPromptJson { ... }
  export function buildDashboardAnnotatedPrompt(post, brand) { ... }
  // ... 7 más
  export function buildArchetypePrompt(archetype: ArchetypeSlug, post, brand): VisualPromptJson { ... }
  ```
- Modificar `src/features/visuals/services/visual-json-template.ts`:
  - `buildVisualJsonPrompt()` ahora acepta `archetype?: ArchetypeSlug`. Si presente → delega a `buildArchetypePrompt()`. Si no → fallback al comportamiento actual (retrocompat).
- Modificar `carousel-prompt-builder.ts`: cuando `archetype === 'carousel_mini_report'`, inyectar:
  - Slide roles en orden: cover → problem → why_matters → breakdown → example → framework → cta_close
  - Default 7 slides (sweet spot por evidencia)

**UX visible**: aún ninguna; pero `POST /api/ai/generate-visual-json` con body `{ archetype: 'screenshot_annotated', ... }` retorna ya prompt distinto del fallback.

**Validación**: Unit tests en `__tests__/archetype-prompt-builder.test.ts` para los 9 builders. Manual: curl al endpoint con cada archetype → inspect prompt_json devuelto.

### Fase 4: Auditor 10-point anti-genérico + endpoint refactor

**Implementación**:
- Refactor `src/app/api/ai/critic-visual/route.ts`:
  - Input: `{ image_url, archetype, post_context }`
  - Modelo: Gemini Vision con system prompt que itera los 10 checks (vea lista bajo "10 Checks Anti-Genérico" más abajo).
  - Output Zod-validated:
    ```ts
    {
      score: 0..50,
      checks: Array<{ id, label, passed: boolean, reason?: string }>, // 10 items
      verdict: 'publishable' | 'retry_recommended' | 'regenerate',
      findings: string[]  // accionables
    }
    ```
- Threshold lógica:
  - `score >= 45` → `publishable`
  - `score in 35..44` → `retry_recommended`
  - `score < 35` → `regenerate`
- Endpoint persiste resultado en `visual_versions.auditor_score`, `auditor_findings`, `auditor_verdict`.

**10 Checks Anti-Genérico** (binarios, +5 cada uno = /50):
1. **3-second clarity** — Idea entendible en 3s (vs requiere leer texto largo)
2. **Real problem** — Muestra problema FV específico (vs abstracto/decorativo)
3. **Technical element** — Tracker / inversor / SCADA / curva PR reconocible
4. **Quantified data** — Al menos 1 número (MW, $, %, kWh, hr)
5. **Single focus** — Una idea principal (vs múltiples competing)
6. **Mobile readable** — Texto legible al 25% del tamaño
7. **Anti-stock** — No stock photo, no robot AI, no render genérico de paneles+sunset
8. **Decision-oriented** — Conecta a decisión operativa (vs decoración)
9. **Brand compliant** — Logo bottom-left, esquina inf-der libre, paleta azul + acentos rojo/naranja solo para riesgo
10. **Anti-AI template** — No parece template generado por AI (anti-360Brew penalty)

**UX visible**: aún ninguna; pero el endpoint ya retorna data nueva.

**Validación**: 15 imágenes diversas (5 con stock photos, 5 founder proof reales del feed Jonathan, 5 dashboards Bitalize prototipos) procesadas. Auditor debe puntuar coherentemente (stock <35, founder ≥45). Manual review.

### Fase 5: UI selector archetype + auditor panel en VisualEditor

**Implementación**:
- `src/features/visuals/components/ArchetypeSelector.tsx`:
  - Grid responsive 3x3 (9 cards). Cada card: emoji thumbnail (📷 screenshot, 📊 dashboard, 🎠 carousel, etc.), display name, descripción 1-line, badge funnel target.
  - State: `selectedArchetype` (controlled).
  - Click → llama `onSelect(archetype)` → padre setea en `prompt_json` y pre-carga plantilla del DB.
- `src/features/visuals/components/AuditorScorePanel.tsx`:
  - **Gauge circular** SVG (0-50) con color verde/ámbar/rojo según verdict.
  - **Lista de 10 checks** con ✓/✗ y razón en hover/expand.
  - **Botón "Regenerar con feedback"**: pre-rellena textarea de iteración con `findings.join('\n- ')`.
  - **Botón "Aprobar para publicar"**: disabled si `verdict !== 'publishable'`.
- Modificar `VisualEditor.tsx`:
  - Render `<ArchetypeSelector>` arriba del controles de formato (siempre visible, cambiar archetype mid-flow OK).
  - Render `<AuditorScorePanel>` debajo de imagen generada (reemplaza VisualCriticPanel cuando hay archetype).
- Modificar `CarouselEditor.tsx`: leer `archetype` del visual_version → pasar a cada slide prompt.

**UX visible**:
```
┌─────────────────────────────────────────────────────────┐
│ Editor Visual — Post Lunes (BOFU feature_kill)          │
├─────────────────────────────────────────────────────────┤
│ Elegir archetype:                                       │
│ ┌────┐ ┌────┐ ┌────┐                                    │
│ │📷  │ │📊  │ │🎠  │  ← cards 3x3 con emoji + nombre   │
│ │Scr │ │Dsh │ │Car │     + descripción 1-line          │
│ │Ann │ │Ann │ │Min │     + badge "TOFU/MOFU/BOFU"      │
│ └────┘ └────┘ └────┘                                    │
│ ...                                                     │
├─────────────────────────────────────────────────────────┤
│ Formato: ◉ 1:1  ○ 4:5     Logo: bottom-left           │
│ prompt_json (textarea editable, pre-cargado)            │
│ [Generar con AI]                                        │
├─────────────────────────────────────────────────────────┤
│ Imagen generada:                                        │
│ ┌──────────────┐    ┌─ Auditor Score ──────────┐       │
│ │              │    │                          │       │
│ │  [imagen]    │    │      ╭──────────╮        │       │
│ │              │    │      │  47/50   │ 🟢     │       │
│ │              │    │      ╰──────────╯        │       │
│ └──────────────┘    │  Verdict: publishable    │       │
│                     │                          │       │
│                     │  ✓ 3-second clarity      │       │
│                     │  ✓ Real problem          │       │
│                     │  ✓ Technical element     │       │
│                     │  ✗ Quantified data       │       │
│                     │    reason: "no $ shown"  │       │
│                     │  ... (10 checks total)   │       │
│                     │                          │       │
│                     │  [Regenerar c/feedback]  │       │
│                     │  [Aprobar para publicar] │       │
│                     └──────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

**Validación**:
- Playwright screenshot del nuevo editor con selector visible
- Click en archetype card → textarea muestra plantilla correspondiente
- Generar imagen → auditor panel renderiza score + 10 checks
- Click "Aprobar" disabled cuando score <45; habilitado cuando ≥45

### Fase 6: Commit + Deploy a producción (Dokploy)

**Implementación**:
- Conventional Commits scoped: `feat(prp-013): visual archetypes + 10-point auditor`
- Push a main → `mcp__dokploy__application-deploy` con applicationId `T5h12sWPliBOeXYVLC75h`
- Poll deploy status (~2-3 min con `cleanCache: true`)
- Verificar prod returns 200 y migración aplicada

**UX visible**: nuevos features live en `contentops.jonadata.cloud`.

**Validación**:
- HTTP 200 en prod
- Login + navegar a `/visuals/N` muestra ArchetypeSelector
- Migración aplicada: `mcp__supabase__execute_sql` confirma columnas nuevas

### Fase 7: E2E Karpathy loop — generar 5 visuales para campaña May 11-15

**Mapping post → archetype (basado en estructura editorial + funnel)**:

| Día | Post (variant aprobada) | Funnel | Estructura | Archetype recomendado | Justificación |
|---|---|---|---|---|---|
| Lun 12 | "Matamos métrica del dashboard" (contrarian v4) | BOFU | feature_kill | **screenshot_annotated** | Mostrar dashboard v1 (con métrica killed) vs v2 (vista outliers). Founder proof. |
| Mar 13 | "TRACKER respondía al ping" (story v8) | MOFU | aprendizaje_cliente | **dashboard_annotated** | Curva potencia con "pliegue" anotado + flecha + dato (5-10% drift). |
| Mie 14 | "Backtracking ondulado" (contrarian v8) | TOFU | nicho_olvidado | **risk_card** | Risk card insurtech-style: causa (backtracking), impacto ($200-400k), confianza, acción. |
| Jue 15 | "Encoder vs irradiancia" (contrarian v8) | MOFU | demo_pequena | **carousel_mini_report** | 7 slides: hook → problema → cruce datos → ejemplo → framework → checklist → CTA. |
| Vie 16 | "Polvo del desierto" (story v13) | TOFU | opinion_contraria_ia | **field_photo_overlay** | Foto real de planta + overlay "SCADA dice 99%, realidad 66-88%". Founder-led. |

**Karpathy loop por visual** (max 2 ciclos, max 5 fixes/ciclo per CLAUDE.md):
1. **Generate** — MCP Playwright: navegar a `/visuals/N`, seleccionar archetype, pre-cargar plantilla, click "Generar con AI"
2. **Eval** — Auditor automático corre + lente B2B SaaS marketing expert lee findings
3. **Decision tree**:
   - `score >= 45` AND marketing lens OK → **commit** (save approved)
   - `score 35-44` → **mutate** (click "Regenerar con feedback", inyectar findings + observaciones marketing)
   - `score <35` → **discard archetype** (cambiar de archetype o ajustar plantilla raíz en `archetypes.ts`)
4. **Persist** — logs en `.claude/karpathy-runs/prp-013/may-11-15/<day>/<iter>/` con imagen, score, findings, decisión

**Lente B2B SaaS marketing expert** (criterios adicionales no cubiertos por auditor):
- ¿El visual genera ganas de guardar? (saveability check)
- ¿Un Asset Manager lo reenviaría al CFO o al directorio?
- ¿Construye categoría "pérdida invisible" o se queda en "info genérica"?
- ¿La estética dice "ingeniería clara + founder-led" o "startup futurista genérica"?
- ¿Funciona standalone sin el copy del post?

**Implementación**:
- Script orquestador en Node o Playwright spec en `e2e/prp013-visual-karpathy.spec.ts`:
  ```ts
  const POSTS_MAY_11 = [
    { day:1, postId:'85ee8cc0-...', archetype:'screenshot_annotated' },
    { day:2, postId:'1e5284a1-...', archetype:'dashboard_annotated' },
    { day:3, postId:'442e1c83-...', archetype:'risk_card' },
    { day:4, postId:'1fd7fc9f-...', archetype:'carousel_mini_report' },
    { day:5, postId:'79b0188b-...', archetype:'field_photo_overlay' },
  ]
  for (const { day, postId, archetype } of POSTS_MAY_11) {
    let iter = 0
    while (iter < 2) {
      await page.goto(`https://contentops.jonadata.cloud/campaigns/.../visuals/${day}`)
      // click ArchetypeSelector
      // click Generar con AI
      // wait for auditor score
      const { score, verdict, findings } = await readAuditorPanel(page)
      persistIteration(day, iter, { score, findings })
      if (verdict === 'publishable') break
      // mutate
      await fillFeedback(page, findings.concat(marketingExpertObservations(...)))
      await clickRegenerar(page)
      iter++
    }
  }
  ```
- Alternativamente flow manual operado por Claude: cada step en MCP Playwright + manual eval marketing.

**UX visible**: los 5 visuales finales aparecen en cada card de post en el campaign builder. Status `approved`, badge "✓ Publishable" + score.

**Validación**:
- Los 5 visuales tienen `auditor_score >= 45` en DB
- Marketing expert (Claude) confirma cada uno con justificación escrita
- Screenshots de cada visual final en `.claude/karpathy-runs/prp-013/may-11-15/`
- Logs Karpathy completos persistidos
- Reporte E2E: `iter-final.md` con scores antes/después, mutaciones aplicadas, lessons

### Fase 8: Validación final + Aprendizajes documentados

**Implementación**:
- Smoke test rutas críticas: `/campaigns/.../visuals/[1-5]` cargan, auditor responde, save persiste
- `pnpm run build` exitoso en local
- Documentar aprendizajes en sección "🧠 Aprendizajes" del PRP
- Marcar PRP-013 como **COMPLETADO**

**Validación final**:
- [ ] `pnpm exec tsc --noEmit` pasa
- [ ] `pnpm run build` exitoso
- [ ] Migración aplicada en prod
- [ ] Playwright screenshot del flow completo
- [ ] 5 visuales May 11-15 generados, iterados, aprobados ≥45/50
- [ ] Marketing lens approval por escrito para cada uno
- [ ] PRP marcado COMPLETADO con timestamp

---

## 🧠 Aprendizajes (Self-Annealing)

> Esta sección crecerá durante implementación. Inicializada con learnings ya conocidos.

### [2026-04-08]: Logo compositing duplicado en carruseles (PRP-011)
- **Error**: AI dibujaba logo + sharp compositor también → logos duplicados.
- **Fix**: prompt instruye "leave bottom 12% white band"; AI no dibuja logo.
- **Aplicar en**: TODOS los archetypes nuevos. Logo SIEMPRE vía compositor.

### [2026-05-11]: AI fabrica específicos cuando se pide concreto (PRP-012)
- **Error**: pedir "escena con planta + MW + fecha" produce ficción.
- **Fix**: usar anclas genéricas ("una planta del norte chileno"). Nunca inventar nombres propios, fechas, MW exacto en mockups.
- **Aplicar en**: `field_photo_overlay`, `founder_proof`, cualquier visual con "experiencia vivida". Los mockups NO deben contener datos específicos no verificables.

### [2026-05-11]: Server Action stale post-deploy (PRP-012)
- **Error**: Cada deploy invalida IDs Server Actions; sesiones Playwright abiertas pierden capacidad de guardar.
- **Fix**: Hard reload browser tras deploy. O surgical SQL para writes deterministas.
- **Aplicar en**: testing E2E de Fase 7 — ejecutar TODO después del deploy de Fase 6, con browser fresco.

### [2026-05-11]: LinkedIn longitud óptima ajustada
- **Error**: Memoria PRP-012 dice 1500-2200 chars; data 2026 dice 1300-1900.
- **Fix**: Actualizar `RecipeValidator` check de "longitud óptima" a 1300-1900 (PRP-012 follow-up, no aquí).
- **Aplicar en**: captions de posts visuales también deben respetar 1300-1900.

---

## Gotchas

- [ ] **Logo compositor 12% white band** — todos los archetypes reservan franja inferior. NO dibujar logo vía AI.
- [ ] **Esquina inferior derecha SIEMPRE libre** — negative prompt automático.
- [ ] **Aspect ratio único por carrusel** — validar en `carousel-prompt-builder.ts`.
- [ ] **Red-green color combo prohibido** — accessibility (colorblind). Agregar shape/text indicators.
- [ ] **`concept_type` retrocompat** — agregar `archetype` paralela. No eliminar `concept_type`.
- [ ] **AI puede fabricar datos en mockups** — para screenshots/dashboards, usar datos plausibles pero genéricos. NO inventar clientes ni MW exacto.
- [ ] **Auditor binario, no gradiente** — 10 checks pass/fail = suma simple /50. Threshold 45 = ≥9 de 10 pasan.
- [ ] **Caption ≠ texto del visual** — visual standalone-legible. Caption complementa.
- [ ] **Server Actions stale post-deploy** — hard reload browser entre Fase 6 y Fase 7.
- [ ] **Karpathy hard stop**: max 2 ciclos × 5 fixes/ciclo. Si tras iter 2 no llegamos a 45/50, escalar a Jonathan, no insistir.

## Anti-Patrones

- ❌ Stock photos paneles solares, robots IA, manos teclados, gradientes futuristas
- ❌ Dashboards sin contexto (un screenshot sin anotaciones no responde una pregunta)
- ❌ >4 anotaciones (pierde foco)
- ❌ >4 bullets en carrusel final (saveability se diluye — regla PRP-012)
- ❌ Fabricar nombres clientes / fechas específicas / MW exacto en mockups
- ❌ Renders 3D futuristas, avatares, metaverso (adoptar lógica de capas/heatmap, NO la estética)
- ❌ Mixing aspect ratios en mismo carrusel
- ❌ Texto pequeño no legible al 25%
- ❌ Red + green sin alternativa (accessibility fail)
- ❌ Reescribir PRP-011 (ya construido; PRP-013 extiende)
- ❌ Saltarse Fase 6 deploy antes de Fase 7 E2E (Karpathy DEBE correr contra prod por feedback memory)

---

## Recomendaciones estratégicas (síntesis Fase C del plan)

### Mantener (confirmados)
1. Tesis "proof before polish" — confirmada por 360Brew deprioritizing AI-template.
2. Founder-led visual proof — 7x más impresiones.
3. 9 archetypes — todos con base en evidencia.
4. Brand rules actuales (logo bottom-left, esquina inf-der libre, ratios 1:1 + 4:5).
5. Auditor anti-genérico 10-point — alinea con preferencia algoritmo 2026.
6. 60-30-10 color rule.
7. Una idea por visual + legible al 25% mobile.

### Corregir / matizar
1. **Copy length sweet spot** ajustado a 1300-1900 (no 1500-2200). PRP-012 follow-up.
2. **Slides carrusel** ajustado a 5-15 con sweet spot 7 (no 6-9).
3. **Screenshots no siempre ganan** — necesitan anotación + pregunta. Auditor penaliza screenshots desnudos.
4. **Anti-bot emoji rule** mantener como guideline interno, sin afirmar fuente externa.

### Priorizar (mayor ROI early-stage)
1. screenshot_annotated — 20% higher conversion
2. carousel_mini_report 7 slides — 24.42% engagement
3. founder_proof whiteboard/sketches — top recommended
4. dashboard_annotated — máximo dwell time
5. risk_card insurtech — diferenciador único en O&M FV

### Descartar
1. KPIs exactas por archetype como métricas firmes (hipótesis, no compromisos)
2. Distribución 25/25/20/15/15% rígida (heurística inicial)
3. Renders 3D / digital twin futuristas (adoptar lógica, no estética)

### Riesgos a evitar
1. AI-generated stock visuals (360Brew penalty)
2. Hook visual genérico (60-70% drop al "See more")
3. Fabricar datos/nombres/fechas en mockups (PRP-012 learning)
4. >15 slides carrusel (completion rate cae)
5. Mixing aspect ratios (preview rompe)
6. Red-green sin alternativa accessibility

---

## Archivos a crear/modificar (lista ejecutable)

### CREAR
- `src/features/visuals/constants/archetypes.ts`
- `src/features/visuals/types/archetype.ts`
- `src/features/visuals/services/archetype-prompt-builder.ts`
- `src/features/visuals/components/ArchetypeSelector.tsx`
- `src/features/visuals/components/AuditorScorePanel.tsx`
- `src/features/visuals/services/__tests__/archetype-prompt-builder.test.ts`
- `supabase/migrations/02X_prp013_visual_archetypes.sql`
- `docs/Contenido/visual-strategy.md`
- `docs/Contenido/visual-archetype-examples.md`
- `e2e/prp013-visual-karpathy.spec.ts` (opcional automation)
- `.claude/karpathy-runs/prp-013/may-11-15/` (logs E2E)

### MODIFICAR
- `src/features/visuals/services/visual-json-template.ts` (extender `buildVisualJsonPrompt` con archetype)
- `src/features/visuals/services/carousel-prompt-builder.ts` (archetype-aware roles)
- `src/features/visuals/services/visual-type-router.ts` (`getVisualFlow(archetype)`)
- `src/features/visuals/constants/brand-rules.ts` (`ARCHETYPE_RULES`)
- `src/features/visuals/components/VisualEditor.tsx` (integrar ArchetypeSelector + AuditorScorePanel)
- `src/features/visuals/components/VisualCriticPanel.tsx` (usar AuditorScorePanel)
- `src/features/visuals/components/CarouselEditor.tsx` (heredar archetype context)
- `src/app/api/ai/critic-visual/route.ts` (10 checks /50)

### NO TOCAR
- `src/features/visuals/services/logo-compositor.ts` (estable)
- `.claude/PRPs/PRP-011-visual-system-upgrade.md` (concluido)
- Endpoints copy (PRP-012 paralelo)

---

## Próximo paso recomendado

Si aprobás este PRP:

1. **Ejecutar Blueprint con skill `/bucle-agentico`** empezando por Fase 1 (docs).
2. **Cada fase**: mapear contexto real → generar subtareas → ejecutar → auto-blindaje si error → transicionar.
3. **Fase 7 E2E Karpathy** = donde se ejecuta el plan de testing real con los 5 posts May 11-15. Yo (Claude) actúo como B2B SaaS marketing expert, MCP Playwright contra prod, iterar hasta 100% conformidad.
4. **Fase 6 deploy es obligatoria ANTES de Fase 7** — Karpathy debe correr contra prod por memoria `feedback_karpathy_in_production.md`.
5. **Si Fase 7 algún visual no llega a 45/50 tras 2 iter** → escalar a Jonathan con propuesta de fix (ajustar plantilla raíz o cambiar archetype).

**Out of scope este PRP**:
- LinkedIn analytics ingest (KPIs son hipótesis; medir post-publicación con tracking manual primero)
- Actualización copy length sweet spot 1300-1900 (PRP-012 follow-up)
- Sistema scheduling editorial (los 45 días del reporte son guideline)
- Video generation (cubierto parcialmente por sistema actual)

---

*PRP pendiente aprobación. No se ha modificado código. Verificación de claims completa con 16 fuentes externas 2025-2026. Plan E2E definido contra campaña real de la semana en curso.*
