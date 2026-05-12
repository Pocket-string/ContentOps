# PRP-013 Karpathy iter 1 — Final report

**Fecha**: 2026-05-11
**Sesión**: extensa, varios giros de plan tras inspección visual real

## Resultados — campaña May 11-15

| Día | Archetype | Iter 0 | Iter 1 final | Brand | Editor en prod |
|---|---|---|---|---|---|
| 1 Lun | screenshot_annotated | 40/50 retry | **45/50 publishable** | Pill | ✓ Aprobado |
| 2 Mar | dashboard_annotated | 25/50 regen | **45/50 publishable** | Pill | ✓ Aprobado |
| 3 Mié | risk_card | 45/50 publishable (banda OLD) | **50/50 publishable** ⭐ | Pill | ✓ Aprobado |
| 4 Jue | carousel_mini_report | — DEFERRED | DEFERRED iter 2 | — | — |
| 5 Vie | field_photo_overlay | 50/50 publishable (banda OLD) | **50/50 publishable** ⭐ | Pill | ✓ Aprobado |

**4/5 publishable, marca consistente (pill bottom-right), todos visibles en editor.**

## Arc de la sesión (lo que pasó realmente)

### Fase A — primer intento de iter 1 (Patches #1, #2, #3, #6, #7)

Aplicamos el backlog del iter-final.md:
- #1: fetch logo Bitalize en compose-annotated
- #2: glass-pill bottom-right reemplaza banda blanca 12% (cambio de diseño con Jonathan)
- #3: white-out top-left para cubrir logo lucvia (re-skin → Bitalize)
- #6: persistir `archetype` al crear visual_version
- #7: action devuelve `visualVersionId` real (no `pending-revalidation`)

Score subió 40→45 / 25→45. **Pero fue prematuro declarar publishable**:
inspección visual reveló dos artefactos:

1. **Anotaciones SVG renderizando como tofu** (▯▯▯) — librsvg en Docker no tiene fuente Latin
2. **Parche blanco top-left** demasiado agresivo (Patch #3) — se ve como un agujero en el diseño dark

### Fase B — fix honesto (skip_annotations + recapture cropeado)

- Patch agregado: `skip_annotations: true` en compose-annotated → bypass Vision AI + bypass white-out
- Recapturamos lucvia.com cropeado (sin header — `header.sticky { display: none }` via Playwright evaluate)
- Subimos bases via PUT /api/ai/capture-screenshot (browser_file_upload)
- Recompusimos: dashboard limpio + pill bottom-right + sin tofu + sin parche

**Score post-fix**: Día 1 45/50, Día 2 45/50 (mobile_readable sigue fallando por densidad de tabla, conocido).

### Fase C — Patch #10 (auto-persist) + clean-orphan-slides

Gap arquitectural detectado durante Fase B: `compose-annotated` y `audit-visual` no
persistían al DB cuando se llamaban directo. Esto forzaba SQL UPDATE manual (prohibido por
Jonathan). Patch #10 cerró el gap: ambos endpoints aceptan `visual_version_id` y persisten
`image_url`, `annotations_json`, `auditor_score`, `auditor_verdict`, `auditor_findings`,
`auditor_checks`. Verdict publishable promueve `status` a `approved` automáticamente.

Segundo bloqueador: editor mostraba carrusel huérfano (5 slides "El Ángulo que te Roba
Energía") en lugar de la imagen composed de Día 1. Causa: `visual_versions.slide_count=5`
+ `carousel_slides` con 5 rows de iteración anterior. `isCarousel` en VisualEditor (línea
267) se activa con `slide_count >= 2`.

Fix: endpoint `POST /api/visuals/clean-orphan-slides` que borra carousel_slides + resetea
`slide_count` y `concept_type` a NULL. Llamado para Día 1 (5 deleted) y Día 2 (0 deleted).

### Fase D — regenerar Días 3 y 5 con pill para brand consistency

Días 3 y 5 (iter 0) usaban banda blanca + logo bottom-left. Tras la migración a pill,
visualmente inconsistentes con Días 1-2. Jonathan pidió regenerar.

Path: limpiar `prompt_overall` de las menciones de banda blanca + signature, agregar
directiva "DO NOT draw any logo... keep bottom-right quiet", llamar
`/api/ai/generate-image` con el prompt cleaned + logo_url. El endpoint usa el
`compositeLogoOnImage` actualizado (pill, no banda).

- **Día 3 v2**: 50/50 publishable ⭐ — risk_card limpio, pill correcta
- **Día 5 v2**: tuvo texto alucinado al fondo ("tenpien trackers desalineados róbare-axis") → re-roll con prompt blindado "STRICT TEXT POLICY: exactly 3 texts and nothing else"
- **Día 5 v3-strict**: 50/50 publishable ⭐ — sin texto extra

### Fase E — fix copy Día 1 (específicos fabricados)

Jonathan detectó que el copy del Lunes tenía datos inventados que violaban
`feedback_no_fabricated_specifics.md`:

| Antes | Después |
|---|---|
| "Lo descubrimos en **Atacama**" | "Lo vimos en una **planta del norte chileno**" |
| "**500** trackers sanos con **12** cojeando **30%**" | "**cientos** de trackers sanos con **un puñado** cojeando **cerca del 30%**" |
| "**USD 200-400k/año en 100 MW**" | "**varios cientos de miles de USD al año en una planta mediana**" |
| "El cursor temblaba en su pantalla mientras buscaba culpables." | _(eliminado)_ |
| "Estamos validando con **3 plantas piloto en LATAM**" | "Estamos validando con **plantas piloto en operación**" |

Path: `POST /api/ai/iterate` con feedback explícito (el endpoint ya tiene la regla
"NUNCA FABRICAR ESPECIFICOS" en su system prompt desde commit bda544a). AI hizo el rewrite
limpio. Resultado guardado vía la UI del post editor (`/campaigns/.../posts/1` → setear
textarea + click "Guardar Version") → `post_versions` v7 `is_current=true`.

## Commits push'eados durante esta sesión

```
e077c32 feat(prp-013): glass-pill brand overlay + lucvia re-skin (iter 1)
60e4ff8 fix(prp-013): persist archetype on create + return new ID for auto-select
ef98d0d fix(prp-013): align auditor brand_compliant with glass-pill spec
4e52211 fix(prp-013): add skip_annotations flag to compose-annotated
fd53662 feat(prp-013): auto-persist compose + audit results when visual_version_id provided
053bb8e feat(visuals): clean-orphan-slides endpoint
6996c0d fix(visuals): clean-orphan-slides also resets slide_count + concept_type
```

7 commits + 8 deploys (Dokploy `cleanCache: true`, ~2-3 min cada uno).

## Patches que cambiaron la arquitectura

1. **Banda blanca → glass-pill** (logo-compositor.ts + screenshot-overlay-composer.ts):
   `buildBrandPillComposites()` reusable, semi-transparente con drop-shadow, bottom-right
2. **AI prompts** (image-prompt-builder.ts + archetype-prompt-builder.ts):
   "DO NOT draw any logo... keep bottom-right ~22% × 10% quiet"
3. **Auditor `brand_compliant`**: spec actualizado al pill (no más expectativa de banda)
4. **Auto-persist** (compose-annotated + audit-visual): cierran el gap "API call → editor
   no muestra" sin requerir SQL externo
5. **clean-orphan-slides**: endpoint honesto para resetear `slide_count` + `concept_type`
   + `carousel_slides` cuando se cambia de archetype carrusel a non-carrusel
6. **skip_annotations flag**: workaround para tofu rendering hasta que se instalen fuentes
   en Docker (Patch #9 backlog)

## Lección personal documentada

Antes declaré "publishable 45/50" basándome solo en el score del auditor sin inspección
visual mía ni audit del copy contra reglas anti-fabricación. Tuve que rectificar dos
veces. La regla actualizada para próximas sesiones:

> **"Publishable" requiere TRES validaciones simultáneas:**
> 1. Auditor visual /50 ≥ 45
> 2. Inspección visual mía (no solo el score)
> 3. Audit del copy contra reglas activas (`feedback_no_fabricated_specifics.md`, etc.)

## Backlog iter 2 (no urgente para esta campaña)

1. **Patch #9 (CRÍTICO si quieres anotaciones)**: instalar fuentes (`fonts-inter` o
   `fonts-dejavu`) en Dockerfile → librsvg renderiza glyphs → recuperar valor del
   archetype anotación
2. **Día 4 carousel_mini_report**: 7 slides con archetype-aware CarouselEditor
3. **Mobile readability**: capturar 3-5 filas en vez de tabla completa para
   `screenshot_annotated` con tablas densas (Día 1 + 2 caveat conocido)
4. **Auditor de copy** integrado al flow Karpathy (ya existe `audit-naturalidad` 0-50;
   agregar check explícito anti-fabricación)
5. **Eliminar `feedback_karpathy_in_production.md` carryover**: validado, Karpathy en prod
   vía MCP Playwright funciona end-to-end (esta sesión es prueba)

## Persistencia esta sesión

- `iter1/lun-screenshot-annotated/v2/composed.png` + `base-clean.png`
- `iter1/mar-dashboard-annotated/v2/composed.png` + `base-clean.png`
- `iter1/mie-risk-card/v2-pill.png` (regenerado con pill)
- `iter1/vie-field-photo/v3-strict.png` (re-rolled sin texto alucinado)
- `iter1/editor-day1-final.png` + `editor-day2-final.png` (screenshots del editor en prod)
- `inspection/` — PNGs y snapshots intermedios usados durante la sesión
