# PRP-013: Plan de Ejecución

> **Companion** al [PRP-013](.claude/PRPs/PRP-013-bitalize-visual-strategy.md).
> Contiene: (1) validación final de claims, (2) **decisión de founder-led screenshots reales (lucvia + mantenimiento)**, (3) mapa exacto de cambios UI/UX con números de línea, (4) plan de testeo Karpathy con la campaña real May 11-15, (5) cronograma + cheat sheet.

**Fecha**: 2026-05-11
**Estado**: Listo para ejecutar tras aprobar PRP-013
**Campaña target E2E**: `f00ba3d8-6a4b-4de2-85f5-142b4fe89dc7` (TRACKER, week of May 11)

---

## 0. Decisión estratégica clave: screenshots reales vía Playwright

**Confirmado por Jonathan (2026-05-11)**:
- `lucvia.com` tiene: **curva de potencia, cross-plot de datos, lista priorizada de pérdidas**. Datos demo (no clientes reales).
- `mantenimiento.jonadata.cloud` también tiene demos públicas.
- Branding final: **mostrar como Bitalize** (paleta consistente, logo bottom-left, tipografía Bitalize).
- Captura libre vía Playwright de los demos.

**Impacto**: el archetype `screenshot_annotated` y `dashboard_annotated` cambian de "AI mockup desde cero" a **founder-led product proof real**:
- AI NO regenera el UI (eso destruye el "proof" y dispara 360Brew penalty)
- Pipeline: **Playwright capture → Vision AI sugiere anotaciones → sharp compone overlay → logo strip**
- Memoria guardada: [feedback_real_product_screenshots.md](.claude/memory/feedback_real_product_screenshots.md) — preferencia permanente

Esta decisión convierte el sistema en **"capture + annotate"** para 3 de los 5 días, no solo "AI generate".

---

## 1. Validación de Claims (Resumen)

16 claims verificados con WebSearch (fuentes 2025-2026). Detalle completo en sección "Verificación de claims" del PRP-013. Resumen:

| Categoría | # | Acción para implementación |
|---|---|---|
| Confirmado fuerte | 8 | KEEP exacto en prompts/checks |
| Confirmado | 4 | KEEP |
| Confirmado c/refinamiento | 1 (carrusel slides) | Sweet spot 7 (no 6-9); rango 5-15 |
| Confirmado c/matiz | 1 (screenshots) | Auditor penaliza screenshots sin anotación. **Reforzado por decisión §0: ahora los screenshots SON reales, no mock**. |
| Inferencia razonable | 2 | KEEP como heurística |
| Corrección | 1 (longitud copy 1500-2200 → 1300-1900) | Out of scope (PRP-012 follow-up) |
| No verificado | 1 (no leading emoji) | KEEP guideline interno |

**Refinamientos al PRP-013 antes de implementar**:
1. **Agregar Fase 5b** (overlay composer pipeline) — ver §3.4
2. **Modificar tabla post→archetype** del PRP-013 con sources reales — ver §3.5
3. **Agregar columna DB** `base_image_url` a `visual_versions` — ver §2.7
4. **Brand re-skin** en demos lucvia/mantenimiento — ver §3.4

Estos refinamientos van en el código durante la implementación, no requieren PR previo al PRP.

---

## 2. Mapa Exacto de Cambios UI/UX

### 2.1 ArchetypeSelector (NUEVO componente)

Ubicación: `src/features/visuals/components/ArchetypeSelector.tsx`.

```
┌──────────────────────────────────────────────────────────────────┐
│  Elegí archetype visual (PRP-013)                                 │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │  📷 ⭐      │  │  📊 ⭐      │  │  🎠         │               │
│  │  Screenshot │  │  Dashboard  │  │  Carrusel   │               │
│  │  Anotado    │  │  Anotado    │  │  Mini-Info  │               │
│  │ (real)      │  │ (real)      │  │             │               │
│  │  📎 lucvia  │  │  📎 lucvia  │  │  AI mockup  │               │
│  │  [BOFU]     │  │  [MOFU]     │  │  [MOFU]     │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │  🔁 Dato→   │  │  ↔️ Antes/  │  │  📷 Foto+   │               │
│  │  Decisión   │  │  Después    │  │  Overlay    │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │  ✍️ Founder │  │  📋 Tech    │  │  🛡️ Risk    │               │
│  │  Proof      │  │  Report     │  │  Card       │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
└──────────────────────────────────────────────────────────────────┘
```

Cards `screenshot_annotated` y `dashboard_annotated` muestran badge `📎 lucvia` indicando que el flow es **capture + annotate**, no AI generate.

`recommendedFor` heurística:
- `feature_kill`+BOFU → `screenshot_annotated`
- `aprendizaje_cliente`+MOFU → `dashboard_annotated`
- `nicho_olvidado`+TOFU → `risk_card`
- `demo_pequena`+MOFU → `carousel_mini_report`
- `opinion_contraria_ia`+TOFU → `field_photo_overlay`

### 2.2 AuditorScorePanel (NUEVO componente)

(igual al diseño anterior — sin cambios)

```
╭───────────╮  47/50  🟢   Verdict: publishable
│   gauge   │
╰───────────╯
✓ #1-10 (lista checks binarios con razón en hover)
[🔄 Regenerar con feedback]  [✅ Aprobar para publicar]
```

### 2.3 ScreenshotCaptureControl (NUEVO — específico para archetypes con base image)

Visible solo cuando `archetype` ∈ {`screenshot_annotated`, `dashboard_annotated`}:

```
┌─ Captura de producto (lucvia / mantenimiento) ───┐
│  URL destino:                                     │
│  [https://lucvia.com/demo/perdidas       ▼]      │
│  Sugeridas:                                       │
│    • lucvia.com/demo/curva-potencia               │
│    • lucvia.com/demo/cross-plot                   │
│    • lucvia.com/demo/perdidas-priorizadas         │
│    • mantenimiento.jonadata.cloud/demo            │
│                                                   │
│  Viewport: ◉ 1080×1080 (1:1)  ○ 1080×1350 (4:5)  │
│                                                   │
│  [📸 Capturar via Playwright]                     │
│                                                   │
│  Preview:                                         │
│  ┌───────────────────────┐                       │
│  │                       │                       │
│  │   [screenshot capturado]                      │
│  │                       │                       │
│  └───────────────────────┘                       │
│  [📤 Subir manualmente]   [✏️ Editar anotaciones]│
└───────────────────────────────────────────────────┘
```

Flow:
1. Usuario elige URL destino (de lista sugerida o custom)
2. Click "Capturar via Playwright" → server-side Playwright headless captura el screenshot → upload a Supabase Storage bucket `visual-base-images` → setea `visual_versions.base_image_url`
3. Preview se renderiza
4. Botón "Generar con AI" ahora invoca pipeline overlay-only (ver §2.7)

### 2.4 VisualEditor.tsx (MODIFICAR)

Ubicación: `src/features/visuals/components/VisualEditor.tsx`.

**Cambios**:
1. Render `<ArchetypeSelector>` arriba del editor (siempre visible)
2. Si `archetype ∈ {screenshot_annotated, dashboard_annotated}` → render `<ScreenshotCaptureControl>` entre selector y prompt_json textarea
3. Si `archetype ∈ {screenshot_annotated, dashboard_annotated}` → botón "Generar con AI" cambia a "**Componer anotaciones**" (semantic: AI no genera la imagen, compone overlay)
4. Render `<AuditorScorePanel>` debajo de imagen final (reemplaza VisualCriticPanel cuando hay archetype)

```tsx
<ArchetypeSelector ... />

{archetype === 'screenshot_annotated' || archetype === 'dashboard_annotated' ? (
  <>
    <ScreenshotCaptureControl
      sources={['lucvia.com', 'mantenimiento.jonadata.cloud']}
      onCapture={(url) => setBaseImageUrl(url)}
    />
    <button onClick={handleCompose}>Componer anotaciones</button>
  </>
) : (
  <>
    <PromptJsonEditor ... />
    <button onClick={handleGenerate}>Generar con AI</button>
  </>
)}

{imageUrl && <img src={imageUrl} />}

{archetype && auditorResult ? (
  <AuditorScorePanel ... />
) : (
  <VisualCriticPanel ... />
)}
```

### 2.5 CarouselEditor.tsx (MODIFICAR)

Cuando `archetype === 'carousel_mini_report'`, default 7 slides con roles `cover → problem → why_matters → breakdown → example → framework → cta_close`.

Slides individuales pueden tener su propio "base_image" si el slide muestra un screenshot real. UI: cada slide tiene un mini-toggle "📎 usar screenshot real" → muestra `ScreenshotCaptureControl` inline.

### 2.6 DayColumn (CampaignBuilder) — badge

```
┌─ Lunes 12 may ──────────────────┐
│  Funnel: BOFU                    │
│  Estructura: Feature kill        │
│  Visual: 📷📎 Screenshot Anotado │ ← 📎 indica base real
│  Auditor: 47/50 ✓ Publishable    │
│  ...                             │
└──────────────────────────────────┘
```

### 2.7 Backend changes

| Archivo | Cambio |
|---|---|
| `visual-json-template.ts` | extender `buildVisualJsonPrompt({ archetype, base_image_url? })` |
| `carousel-prompt-builder.ts` | archetype-aware + base_image_url por slide |
| `visual-type-router.ts` | `getVisualFlow(archetype, hasBaseImage)` |
| `brand-rules.ts` | `ARCHETYPE_RULES` (9 entries) |
| `archetype-prompt-builder.ts` | NUEVO — 9 funciones + helper |
| `archetype-prompt-builder.test.ts` | NUEVO — 9 tests |
| `critic-visual/route.ts` | refactor 10 checks /50 |
| **NUEVO**: `capture-screenshot/route.ts` | Playwright headless capture → Supabase Storage upload → return `base_image_url` |
| **NUEVO**: `compose-annotated/route.ts` | input: base_image_url + post context + archetype → Vision AI sugiere anotaciones → sharp compone overlay → save final image |
| **NUEVO**: `lib/screenshot-overlay-composer.ts` | helper sharp: load base, draw annotations (arrows + text + numbered markers), add 12% white band + Bitalize logo + paleta tints |
| `02X_prp013_visual_archetypes.sql` | NUEVO migración + columna `base_image_url TEXT` en `visual_versions` + bucket `visual-base-images` en Storage |

### 2.8 Modelo de datos (refinado)

```sql
-- 02X_prp013_visual_archetypes.sql
BEGIN;

ALTER TABLE visual_versions
  ADD COLUMN archetype TEXT
    CHECK (archetype IN (
      'screenshot_annotated', 'dashboard_annotated', 'carousel_mini_report',
      'data_decision_flow', 'before_after', 'field_photo_overlay',
      'founder_proof', 'technical_report', 'risk_card'
    ));

ALTER TABLE visual_versions ADD COLUMN auditor_score INTEGER
  CHECK (auditor_score BETWEEN 0 AND 50);
ALTER TABLE visual_versions ADD COLUMN auditor_findings JSONB DEFAULT '[]';
ALTER TABLE visual_versions ADD COLUMN auditor_verdict TEXT
  CHECK (auditor_verdict IN ('publishable', 'retry_recommended', 'regenerate'));

-- NUEVO: base_image_url para flow overlay-only
ALTER TABLE visual_versions ADD COLUMN base_image_url TEXT;
ALTER TABLE visual_versions ADD COLUMN base_image_source TEXT
  CHECK (base_image_source IN ('playwright_capture', 'manual_upload', 'ai_generated'));

-- carousel_slides también puede tener base_image_url (slide-level)
ALTER TABLE carousel_slides ADD COLUMN base_image_url TEXT;

-- Biblioteca de plantillas (JSONB en brand_profiles)
ALTER TABLE brand_profiles ADD COLUMN visual_templates JSONB DEFAULT '{}';

-- Supabase Storage bucket para screenshots base
-- (manual desde dashboard o vía SQL si supabase-cli)
-- bucket: visual-base-images
-- policy: workspace_members read/write own workspace files

COMMIT;
```

Storage bucket via Supabase MCP o dashboard: `visual-base-images` con RLS workspace-scoped.

### 2.9 Pipeline overlay-only (mecánica)

**Para `screenshot_annotated` y `dashboard_annotated`**:

```
1. UI: usuario click "Capturar via Playwright" con URL destino
   ↓
2. POST /api/ai/capture-screenshot { url, viewport, post_id }
   - Spawn Playwright headless chromium
   - page.goto(url), wait for selector específico (ej. ".dashboard-loaded")
   - page.screenshot({ clip: { x:0, y:0, width:1080, height:1080 } })
   - Upload to Supabase Storage bucket visual-base-images
   - INSERT visual_versions (base_image_url=..., base_image_source='playwright_capture')
   - Return { base_image_url, visual_version_id }
   ↓
3. UI: render preview de base image
   ↓
4. UI: usuario click "Componer anotaciones"
   ↓
5. POST /api/ai/compose-annotated { visual_version_id, archetype, post_context }
   - Vision AI (Gemini Vision) recibe:
     * base_image_url
     * post copy completo
     * archetype rules (cuántas anotaciones, qué tipo, color rule)
   - Vision AI retorna JSON:
     {
       focal_point: { x: 540, y: 320 },
       annotations: [
         { x: 200, y: 150, text: "Fleet Availability\n99.2% promedio", arrow: "down-right", color: "neutral", style: "callout" },
         { x: 700, y: 400, text: "12 trackers cojeando\n= USD 200-400k/año", arrow: "left", color: "loss", style: "highlight" },
         { x: 540, y: 700, text: "La media miente", arrow: "none", color: "accent", style: "headline" }
       ],
       brand_strip: { position: "bottom", height_pct: 12, logo: "bitalize" }
     }
   - sharp loads base image
   - sharp draws annotations (rectangles, arrows, text) per JSON
   - sharp adds 12% white band + Bitalize logo
   - sharp adds subtle brand tint si lucvia branding visible (re-skin sutil)
   - Save final composited image to visual_versions.image_url
   ↓
6. Auditor evalúa la imagen final (mismo flow que para AI mockups)
```

**Para los otros archetypes** (carousel_mini_report, risk_card, field_photo_overlay, founder_proof, before_after, data_decision_flow, technical_report): mantienen el flow AI-generate desde cero (con plantillas mejoradas anti-genérico).

---

## 3. Plan de Testeo Post-Deploy con Karpathy Loop

### 3.1 Objetivo

Generar los 5 visuales de la campaña May 11-15 (copy ya aprobado en PRP-012 iter 2), iterando con Karpathy contra producción hasta auditor ≥45/50 + marketing expert lens 6/6 por visual.

### 3.2 Pre-requisitos (gate)

- [ ] PRP-013 + este execution plan aprobados
- [ ] Fases 1-6 del PRP-013 completas y deployadas en `contentops.jonadata.cloud`
- [ ] Migración 02X aplicada (incluyendo columnas `base_image_url`, `base_image_source`)
- [ ] Supabase Storage bucket `visual-base-images` creado con RLS
- [ ] Seed `brand_profiles.visual_templates` con 9 entries
- [ ] Smoke check: `/api/ai/capture-screenshot` retorna 200 con URL pública demo
- [ ] Smoke check: `/api/ai/compose-annotated` retorna imagen compuesta
- [ ] Hard reload browser post-deploy (Server Action stale — learning PRP-012)
- [ ] Carpeta `.claude/karpathy-runs/prp-013/may-11-15/` creada

### 3.3 Mapping post → archetype + source (REFINADO con decisión §0)

| Día | Fecha | Post ID | Copy approved | Archetype | Source visual | URL/strategy |
|-----|-------|---------|---------------|-----------|---------------|--------------|
| Lun | 12-may | `85ee8cc0-068f-4a89-8761-5db1ccbbc863` | contrarian v4 ("Matamos métrica") | **screenshot_annotated** | **lucvia.com/demo (lista priorizada de pérdidas)** | Capture → anotaciones: "❌ métrica vieja (Fleet Availability 99%)" tachada + "✓ vista nueva (top pérdidas por $/día)" highlight + "$200-400k/año" en rojo. |
| Mar | 13-may | `1e5284a1-8b66-4bda-8e4e-7c6ca44a76b2` | story v8 ("TRACKER respondía al ping") | **dashboard_annotated** | **lucvia.com/demo (curva de potencia)** | Capture → anotaciones: flecha a "pliegue" en la curva + label "drift 5-10% del ángulo" + "SCADA 99% OK ← mentía". |
| Mié | 14-may | `442e1c83-6a87-4fec-b14a-bf6590459e99` | contrarian v8 ("Backtracking ondulado") | **risk_card** | **AI mockup** (ficha conceptual insurtech-style) | No screenshot real — risk card es categorización abstracta. AI genera ficha: Causa / Impacto $/año / Confianza / Acción. |
| Jue | 15-may | `1fd7fc9f-a2bc-4177-87b4-f0709297e90b` | contrarian v8 ("Encoder vs irradiancia") | **carousel_mini_report** | **Mixed**: 5 slides AI + **2 slides reales de lucvia cross-plot** | Slides 4 (ejemplo) y 5 (framework) usan capture de `lucvia.com/demo (cross-plot)` con anotaciones. Slides 1-3, 6-7 son AI conceptuales. |
| Vie | 16-may | `79b0188b-2435-44d8-97a9-2dcc0bcdcab3` | story v13 ("Polvo del desierto") | **field_photo_overlay** | **Foto de campo** (stock anonimizado o foto Jonathan tiene) | No screenshot — necesita foto real planta solar. AI overlay agrega "SCADA 99% vs realidad 66-88%" sobre la foto. Si Jonathan no tiene foto propia → usar foto solar genérica sin marca + overlay fuerte. |

**Resumen sources**:
- **3 días con screenshots reales lucvia** (Lun, Mar, parcial Jue) → founder-led proof máximo
- **1 día AI mockup conceptual** (Mié risk card) → ficha categórica
- **1 día foto + overlay** (Vie) → realidad de campo

### 3.4 Criterios de evaluación

**A. Auditor 10-point binario, /50** (igual que antes — automático):
1. 3-second clarity / 2. Real FV problem / 3. Technical element / 4. Quantified data / 5. Single focus / 6. Mobile readable / 7. Anti-stock / 8. Decision-oriented / 9. Brand compliant / 10. Anti-AI template

Score `≥45` = `publishable`; `35-44` = `retry_recommended`; `<35` = `regenerate`.

**Para visuales con `base_image_url`** (Lun, Mar, partes Jue): los checks 7 (anti-stock) y 10 (anti-AI template) tienen ventaja natural — el base IS real product. Lo que se evalúa además: ¿las anotaciones aportan claridad sin saturar?

**B. Marketing expert lens (Claude actuando B2B SaaS startup early-stage)** — cualitativo:
1. **Saveability**: ¿lo screenshot-earía un AM?
2. **Forward-worthy**: ¿lo reenviaría al CFO/directorio?
3. **Category-building**: ¿construye "pérdida invisible FV"?
4. **Aesthetic verdict**: ¿"ingeniería clara + founder-led" o "startup futurista genérica"?
5. **Standalone test**: ¿funciona sin el copy del post?
6. **Coherence with copy**: ¿refuerza el copy o lo contradice?

PASS = 6/6. <6/6 → mutate.

**C. Cross-check Bitalize brand** (binario):
- [ ] Logo bottom-left presente y visible
- [ ] Esquina inferior derecha libre
- [ ] Color rojo/naranja SOLO usado para pérdidas/riesgos (no decorativo)
- [ ] Ratio 1:1 o 4:5 (no mixing en carruseles)
- [ ] No mock data fabricado (no MW exacto inventado, no nombres clientes, no fechas específicas)
- [ ] **Para base image lucvia**: re-skin Bitalize aplicado (paleta + logo + tipografía consistente)

Cualquier fail → regenerar.

### 3.5 Loop de Karpathy (mecánica exacta)

**Hard stops** (CLAUDE.md): max 2 ciclos por visual; max 10 generaciones AI total.

```
PER VISUAL (5 total):

ITER 0 (baseline):
  Para visuales con base image (Lun, Mar, partes Jue):
    1. Playwright nav → /campaigns/.../visuals/<day>
    2. Click ArchetypeSelector (screenshot_annotated / dashboard_annotated)
    3. ScreenshotCaptureControl: elegir URL (ej. lucvia.com/demo/curva-potencia), click "Capturar"
       → Backend Playwright headless captura → Storage → base_image_url
    4. Click "Componer anotaciones"
       → Vision AI sugiere anotaciones → sharp compone overlay
    5. Esperar auditor automático
    6. Capturar:
       - imagen base + imagen final → .claude/karpathy-runs/prp-013/may-11-15/<day>/v0/
       - eval.json (auditor)
       - marketing-eval.md (Claude marketing lens)
       - decision.md

  Para visuales AI-only (Mié, Vie):
    1-3. Selector + plantilla
    4. Click "Generar con AI"
    5-6. Auditor + capturas

  DECISION:
    - auditor ≥45 AND marketing 6/6 AND brand pass → COMMIT
    - auditor 35-44 OR marketing 4-5/6 → MUTATE → iter 1
    - auditor <35 OR brand fail OR marketing <4/6 → MUTATE AGRESIVO → iter 1

ITER 1:
  Mutaciones según tipo:

  Para overlay (Lun, Mar): mutar el Vision AI prompt (qué anotar, dónde, con qué énfasis)
    - "Demasiadas anotaciones" → max 3 vs 4
    - "Anotaciones cubren el dato clave" → coordinate adjustment
    - "Color rojo en lugar equivocado" → reglas de color
    - "Falta highlight del foco" → agregar focal_point ring
    - Si base image no encaja (ej. lucvia no tiene exactamente la vista que esperaba el copy) → cambiar URL fuente

  Para AI-only (Mié, Vie): mutar prompt_json (re-edit textarea + regenerar)

  Captura v1/{image.png, eval.json, marketing-eval.md, mutation.md}

  DECISION final:
    - publishable → COMMIT
    - no → ESCALAR a Jonathan (hard stop)

PERSISTENCIA:
.claude/karpathy-runs/prp-013/may-11-15/
├── lun-screenshot-annotated/
│   ├── base-capture/lucvia-perdidas.png  # imagen capturada via Playwright
│   ├── v0/
│   │   ├── annotations.json     # JSON suggested by Vision AI
│   │   ├── image-final.png      # composited result
│   │   ├── eval.json            # auditor
│   │   ├── marketing-eval.md
│   │   └── decision.md
│   └── v1/ (si aplica)
├── mar-dashboard-annotated/
├── mie-risk-card/
├── jue-carousel-mini-report/
│   ├── base-capture/lucvia-crossplot.png  # solo para slides 4-5
│   └── v0/, v1/ (con 7 slides cada uno)
└── vie-field-photo-overlay/
```

### 3.6 Cronograma del test (1 sesión, ~4-5h)

| Hora | Bloque | Detalle |
|------|--------|---------|
| T+0 | Setup | Verificar deploy prod, login, smoke checks (capture-screenshot endpoint OK), hard reload |
| T+15m | Día 1 (Lun screenshot-anotado real lucvia) | Capture base + compose + iter. ~30 min |
| T+45m | Día 2 (Mar dashboard-anotado real lucvia curva) | Capture + compose + iter. ~30 min |
| T+75m | Día 3 (Mié risk_card AI) | Iter 0 + iter 1. ~25 min |
| T+100m | Día 4 (Jue carousel 7 slides, 2 con base real lucvia cross-plot) | Más complejo: capture slides 4-5 + AI generate slides 1-3, 6-7 + compose. ~60-75 min |
| T+175m | Día 5 (Vie field_photo_overlay) | AI overlay sobre foto base. ~25 min |
| T+200m | Final review marketing | Claude marketing lens escribe verdict global + recomendación |
| T+230m | Persist + reporte | iter-final.md, screenshots, commit |

**Hard limits**:
- Max 2 iter por visual (CLAUDE.md)
- Max 10 generaciones AI totales (auditor + compose count)
- Budget: ~$8-12 USD tokens (Vision AI + sharp composer es lightweight)
- Si tras iter 1 algún visual falla → escalar

### 3.7 Resultados esperados (criterios de aceptación)

- [ ] 5/5 visuales con auditor `auditor_score ≥ 45`
- [ ] 5/5 con marketing expert 6/6
- [ ] 5/5 con cross-check brand pass
- [ ] 5/5 con `status='approved'` en DB
- [ ] **3/5 visuales tienen `base_image_source='playwright_capture'`** (Lun, Mar, partes Jue)
- [ ] Logo Bitalize visible en cada uno
- [ ] Cero stock photos / robots IA
- [ ] Carrusel jueves: 7 slides consistentes en aspect ratio (4:5), paleta, tipografía — incluso mezclando AI + base reales
- [ ] Logs persistidos en `.claude/karpathy-runs/prp-013/may-11-15/`

### 3.8 Anti-patrones del test

- ❌ Correr en localhost (siempre prod)
- ❌ Saltar hard reload tras deploy
- ❌ Más de 2 iter sin escalar
- ❌ Combinar 2+ mutaciones en una iteración
- ❌ **Que Vision AI regenere el UI de lucvia** (debe ser overlay-only — sharp compone sobre base)
- ❌ Aprobar con auditor 44 "porque está cerca"
- ❌ Publicar en LinkedIn como parte del test (drafts only)
- ❌ Olvidar re-skin Bitalize en screenshots lucvia (logo, paleta)
- ❌ Capturar screenshots con datos sensibles visibles (verificar antes de cada capture que viewport solo muestra datos demo)

### 3.9 Plan B (si el loop no converge)

Si tras iter 1 algún visual no llega a publishable:

1. **Triage tipo overlay** (Lun/Mar):
   - ¿El base image no muestra lo que esperaba el copy? → cambiar URL fuente (intentar otra demo de lucvia o mantenimiento)
   - ¿Anotaciones saturan? → reducir a 2-3 max
   - ¿Vision AI ubica mal? → editar `annotations.json` manualmente, recomponer
2. **Triage tipo AI** (Mié/Vie):
   - ¿Archetype mal elegido? → probar alternativo
   - ¿Prompt template fundamentalmente roto? → modificar `archetypes.ts` raíz (afecta futuros — escalar)
3. **Escalar a Jonathan**: side-by-side iter 0 vs iter 1 + propuesta fix
4. **Reducir scope**: mantener iter 0 como "draft pendiente revisión Jonathan"
5. **Documentar** en CLAUDE.md / memory

---

## 4. Reporte Post-Ejecución (a llenar tras correr el test)

### 4.1 Resumen ejecutivo
_Llenar tras Fase 7._

### 4.2 Scores por visual (iter 0 → iter final)
_Tabla auditor + marketing lens deltas._

### 4.3 Visuales finales May 11-15
_5 imágenes finales + permalinks visual_version_id._

### 4.4 Mutaciones efectivas
_Qué tipos de feedback movieron score; patrones por archetype._

### 4.5 Aprendizajes para memoria
_Nuevas entradas en `.claude/memory/`: qué archetypes funcionaron mejor con base real vs AI._

### 4.6 Métricas tras publicación (semana del 18-may)
_7 días post-publicado: impressions / reactions / comments / saves / DMs vs baseline histórico._

---

## Apéndice A — Refinamientos al PRP-013

Refinamientos a aplicar durante implementación (en el código, no en el doc PRP):

1. **Agregar Fase 5b al Blueprint**: "Pipeline overlay-only (capture + compose)" entre Fase 4 (auditor) y Fase 5 (UI). Incluye nuevos endpoints `capture-screenshot` y `compose-annotated`, librería `screenshot-overlay-composer.ts`.
2. **Modificar archetype builder de `screenshot_annotated` y `dashboard_annotated`**: en vez de `prompt_overall` para generar desde cero, retornan `annotation_template` (qué anotar, color rules, max anotaciones) que el Vision AI usa al sugerir overlay.
3. **Migración DB extendida**: columnas `base_image_url`, `base_image_source` en `visual_versions` + bucket Storage.
4. **`ScreenshotCaptureControl` agregado al diseño UI**: nuevo componente para archetypes con base image.
5. **Tabla de mapping post→archetype en Fase 7** actualizada con sources reales (lucvia URLs).

---

## Apéndice B — Comandos exactos del test (cheat sheet)

```bash
# Setup
mkdir -p .claude/karpathy-runs/prp-013/may-11-15/{lun-screenshot-annotated,mar-dashboard-annotated,mie-risk-card,jue-carousel-mini-report,vie-field-photo-overlay}

# Pre-flight
curl -sf https://contentops.jonadata.cloud
# (vía MCP) mcp__supabase__execute_sql --query "SELECT base_image_url FROM visual_versions LIMIT 0"
# (vía MCP) mcp__supabase__execute_sql --query "SELECT count(*) FROM storage.buckets WHERE name='visual-base-images'"

# Loop overlay (Lun, Mar):
# 1. Navigate
# (vía MCP) mcp__playwright__browser_navigate → /campaigns/.../visuals/<day>
# 2. Click ArchetypeSelector
# (vía MCP) mcp__playwright__browser_click target="card screenshot_annotated"
# 3. Capture screenshot
# (vía MCP) mcp__playwright__browser_type target="url-input" text="https://lucvia.com/demo/curva-potencia"
# (vía MCP) mcp__playwright__browser_click target="Capturar via Playwright"
# 4. Wait + compose
# (vía MCP) mcp__playwright__browser_wait_for text="Preview"
# (vía MCP) mcp__playwright__browser_click target="Componer anotaciones"
# 5. Wait auditor + capture
# (vía MCP) mcp__playwright__browser_wait_for text="Auditor Score"
# (vía MCP) mcp__playwright__browser_take_screenshot filename=".claude/karpathy-runs/prp-013/may-11-15/<day>/v<N>/image.png"
# 6. Read score + persist eval/marketing-eval/decision

# Loop AI-only (Mié, Vie):
# Similar pero sin step 3-4 (no capture); step "Generar con AI" directo.

# Final
# (vía MCP) mcp__supabase__execute_sql --query "UPDATE visual_versions SET status='approved' WHERE id IN (...) AND auditor_score >= 45"
git add .claude/karpathy-runs/prp-013/
git commit -m "chore(prp-013): persist Karpathy E2E logs + visual approval (5 visuals, 3 with lucvia base)"
```

---

## Apéndice C — Mapping archetype ↔ estructura editorial (referencia)

| Estructura (PRP-012) | Archetype visual | Source default | Por qué |
|---|---|---|---|
| `feature_kill` | `screenshot_annotated` | **lucvia capture** | "Mataron una feature" → comparativa v1/v2 real |
| `aprendizaje_cliente` | `dashboard_annotated` | **lucvia capture** | El cliente vio un dato → anotamos el dato real |
| `nicho_olvidado` | `risk_card` | AI mockup | Ficha categórica conceptual |
| `demo_pequena` | `carousel_mini_report` | **Mixed lucvia + AI** | Demo del método: parte con captures reales |
| `opinion_contraria_ia` | `field_photo_overlay` | Foto + AI overlay | Realidad de campo |

Archetypes adicionales (oportunistas, futuros posts):
- `before_after` — estados comparativos
- `founder_proof` — pizarra/sketch propio
- `technical_report` — análisis profundos
- `data_decision_flow` — metodológicos

---

*Plan de ejecución pendiente aprobación. Ningún cambio de código aplicado. Companion al PRP-013-bitalize-visual-strategy.md. Decisión clave: 3/5 visuales con base real de lucvia.com (founder-led product proof).*
