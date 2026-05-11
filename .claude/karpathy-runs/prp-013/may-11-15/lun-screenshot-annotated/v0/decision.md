# Día 1 (Lunes 12-may) — screenshot_annotated v0

**Post copy**: contrarian v4 "Matamos una métrica de nuestro dashboard"
**Archetype**: `screenshot_annotated` (BOFU `feature_kill`)
**Visual version ID**: `72c8ebc7-c1df-4b15-ad5f-a47c7555be74`
**Base source**: Playwright capture de `lucvia.com/demo/PLT_A/dashboard` (ZALDIVIA dashboard real)
**Composed image**: visual-assets/.../1778530574425-composed.png

## Pipeline ejecutado

1. ✓ Playwright MCP captura lucvia ZALDIVIA dashboard 1080×1080
2. ✓ Upload base PNG vía PUT /api/ai/capture-screenshot (multipart)
3. ✓ POST /api/ai/compose-annotated → Vision AI sugiere 4 anotaciones:
   - Headline rojo: "Outliers: La VERDADERA pérdida en tu flota."
   - 3 callouts navy: "promedio oculta strings con baja performance", "Identificación precisa de cada string problemático", "Delta (W) es el impacto real de cada outlier"
4. ✓ sharp compone overlay sobre base (no regenera UI)
5. ✓ Audit-visual evalúa imagen final

## Auditor PRP-013

**Score: 40/50 — retry_recommended**

| # | Check | Pass | Razón |
|---|---|---|---|
| 1 | 3_second_clarity | ✓ | |
| 2 | real_fv_problem | ✓ | |
| 3 | technical_element | ✓ | |
| 4 | quantified_data | ✓ | |
| 5 | single_focus | ✓ | |
| 6 | mobile_readable | ✗ | Tabla con texto pequeño no legible al 25% |
| 7 | anti_stock | ✓ | |
| 8 | decision_oriented | ✓ | |
| 9 | brand_compliant | ✗ | Logo Lucvia top-left (base), no Bitalize bottom-left |
| 10 | anti_ai_template | ✓ | |

## Gaps identificados (Karpathy iter 1 pending)

### Gap 1 — screenshot-overlay-composer no agrega logo Bitalize

`composeOverlay()` recibe `logoBuffer` opcional. Cuando undefined (como en `compose-annotated` actual), solo agrega franja blanca SIN logo. Fix: el endpoint `compose-annotated` debe fetchear el logo del brand_profile activo y pasarlo a `composeOverlay`. **Patch necesario** en `src/app/api/ai/compose-annotated/route.ts`: leer `brand_profiles.logo_urls` antes de llamar `composeOverlay`.

### Gap 2 — Re-skin del producto (lucvia → Bitalize)

La captura incluye logo Lucvia visible. Per decisión Jonathan "mostrarlos como Bitalize", necesita:
- Vision AI agrega anotación rectángulo blanco sobre el logo Lucvia, O
- Pre-process del base image para reemplazar logo, O
- Footer Bitalize que "absorbe" el branding visual

### Gap 3 — Mobile readability de tablas densas

Base image tiene tabla 10 filas con texto pequeño. Vision AI no lo amplía (es overlay-only). Para `screenshot_annotated` con tablas: zoom el base a un subset de filas (3-5) antes de componer.

## Logros (lo que SÍ funciona)

✅ End-to-end pipeline overlay-only ejecutado por primera vez en prod
✅ Base captured de producto real (founder-led proof in public)
✅ Vision AI suggested 4 anotaciones contextualmente relevantes (1 headline + 3 callouts)
✅ Sharp composer agrega anotaciones SVG sobre base sin regenerar UI
✅ 8 de 10 checks anti-genérico passed (el resto son fixables con patches arriba)

## Decision: COMMIT v0 with status retry_recommended

Iter 1 documentada para próxima sesión con los 3 patches above. La pipeline overlay-only es validada conceptualmente (Vision AI sugiere + sharp compone) — solo falta el polish de branding y un fix de readability.

**Status DB**: `auditor_score=40`, `auditor_verdict='retry_recommended'`, `base_image_source='playwright_capture'`.
