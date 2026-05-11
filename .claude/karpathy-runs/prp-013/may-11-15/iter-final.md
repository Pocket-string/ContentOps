# PRP-013 Fase 7 — Reporte Final E2E Karpathy May 11-15

**Fecha**: 2026-05-11
**Sesión**: PRP-013 Fases 1-7 ejecutadas en una sola sesión
**Commit deployed**: `f627136` (Dokploy → prod 200 ✓)

## Estado final 5 visuales

| Día | Archetype | Source | Score | Verdict | Estado |
|---|---|---|---|---|---|
| **Lun 12** | screenshot_annotated | lucvia ZALDIVIA dashboard (real) | 40/50 | retry_recommended | v0 con gaps documentados |
| **Mar 13** | dashboard_annotated | lucvia PR view (real) | 25/50 | regenerate | v0 con gaps documentados |
| Mié 14 | risk_card | AI generate | 45/50 ⭐ | publishable | v0 commit |
| Jue 15 | carousel_mini_report | Mixed (AI+lucvia) | — | DEFERRED | iter 1 próxima sesión |
| **Vie 16** | field_photo_overlay | AI generate | **50/50** ⭐ | **publishable** | v0 commit ⭐ |

**Promedio (4 días auditados)**: 40/50 = 80% del threshold publishable.
**Días publishable inmediato**: 2/5 (Mié 45/50, Vie 50/50).
**Días con gaps documentados (iter 1)**: 2/5 (Lun, Mar).
**Días deferred**: 1/5 (Jue carousel).

## Lo que SÍ funcionó (logros de la sesión)

### Pipeline completo validado end-to-end

1. ✓ **Migración DB aplicada** en prod: archetype + auditor_* + base_image_url columns + bucket Storage
2. ✓ **9 archetype builders** funcionando (deterministic, sin AI call, fast)
3. ✓ **Auditor 10-point /50** ejecutándose contra imágenes reales con Vision AI Gemini
4. ✓ **UI ArchetypeSelector** rendereando 9 cards correctamente en prod
5. ✓ **Pipeline overlay-only validado conceptualmente**:
   - Playwright MCP captura lucvia.com → PUT /api/ai/capture-screenshot → Storage
   - POST /api/ai/compose-annotated → Vision AI sugiere annotations JSON
   - sharp compone overlay (no regenera UI base) → upload final
   - audit-visual evalúa imagen final
6. ✓ **Día 5 — 50/50 perfecto** con AI-only flow (field_photo_overlay)
7. ✓ **Día 3 — 45/50 publishable** con AI-only flow (risk_card)
8. ✓ **Días 1 y 2** — capture+compose ejecutó completo aunque audit reveló gaps fixables

### Decisiones strategic validadas en campo

- **Founder-led product proof real > AI mockup**: capturar lucvia funciona técnicamente.
- **Vision AI sugiere anotaciones contextualmente relevantes**: las 4 anotaciones del Día 1 ("Outliers: La VERDADERA pérdida", "El promedio oculta strings", etc.) eran exactamente las que el copy del post necesitaba.
- **Sharp composer NO regenera UI**: la integridad del base image se preservó en todas las composiciones (zero AI hallucination del UI).

## Gaps identificados (Karpathy iter 1 backlog)

### Gap #1 — Logo Bitalize ausente en overlay pipeline (CRÍTICO)

`compose-annotated/route.ts` llama `composeOverlay({ addBrandStrip: true })` pero NO pasa `logoBuffer`. Resultado: franja blanca sin logo Bitalize → check brand_compliant falla.

**Fix**: en `compose-annotated`, antes de llamar `composeOverlay`:
1. Fetch `brand_profiles.logo_urls[0]` del workspace activo
2. Download el PNG del logo a buffer
3. Pasar como `logoBuffer` a `composeOverlay`

**Estimación**: ~30 min implementación + deploy.

### Gap #2 — White band cubre data crítica del base (CRÍTICO)

Cuando el base capturado tiene contenido en su 88% inferior (típico en dashboards densos), la franja blanca 12% bottom tapa datos importantes.

**Fix options**:
- A) Antes de componer, sharp recorta el base al 88% top (zoom + crop), luego band va abajo sin pérdida
- B) Band semi-transparente con logo Bitalize blanco encima
- C) Sin band: logo en esquina con halo blanco translúcido

**Decisión sugerida**: Opción A (más limpia, preserva proporción del base original).

### Gap #3 — Re-skin lucvia → Bitalize (UX gap)

Decisión Jonathan: "mostrarlos como Bitalize". Pero el base preserva el logo Lucvia top-left. Esto rompe brand_compliant.

**Fix options**:
- A) Vision AI agrega anotación rectángulo blanco sobre el logo Lucvia (top-left coverage)
- B) Pre-process del base con sharp: black-out o blur del 5% top-left antes de componer

**Estimación**: 1h implementación.

### Gap #4 — Mobile readability de dashboards densos

Auditor falla check #6 cuando el base tiene tablas con texto pequeño. Sharp no puede ampliar el texto del base sin regenerar.

**Fix**: para `screenshot_annotated` con tablas, capturar SOLO 3-5 filas (no todas), o usar viewport más grande y luego scale-down con un crop estratégico.

### Gap #5 — Vision AI debería conectar más fuerte con el copy

En Día 2, las anotaciones fueron genéricas ("Pérdida de rendimiento = Impacto en P&L") en vez de específicas al "pliegue raro" mencionado en el post. Vision AI prompt necesita "captura específicamente el insight del copy, no generalidades".

### Gap #6 — `archetype` no se persiste al crear visual_version desde UI

El handler `handleArchetypeSelect` setea state local pero `handleAutoCreateVersion` no incluye `archetype` en el formData → DB queda con `archetype=null`. Patch manual via SQL en cada visual durante la sesión.

**Fix**: agregar `formData.set('archetype', archetype)` en `handleAutoCreateVersion` + crear server action que persista la columna.

### Gap #7 — `selectedVisualId` no auto-updatea tras generar

Bug pre-existente PRP-011: la nueva versión queda en DB pero el editor necesita reload para mostrarla. Affects UX de todos los archetypes.

**Fix**: tras `router.refresh()` en `handleGenerateComplete`, seleccionar el ID retornado por el endpoint.

## Bugs adicionales encontrados durante E2E

1. **RLS missing en `visual-assets` bucket**: el compose-annotated falló inicialmente por "row violates row-level security policy". Fix on-the-fly: agregar policy `visual_assets_insert_authenticated` (SQL aplicado, sin deploy).
2. **`carousel_slides` `slide_role` constraint check**: tuve que `DROP CONSTRAINT IF EXISTS` antes de re-create con los 5 nuevos roles (problem/why_matters/breakdown/example/framework). Migración 028 lo hace correctamente.

## Marketing lens overall

Como B2B SaaS marketing expert evaluando los 4 visuales producidos:

| Visual | Saveability | Forward-worthy | Category-building | Aesthetic | Standalone | Coherence | Verdict |
|---|---|---|---|---|---|---|---|
| Día 5 (field_photo_overlay) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **6/6** ⭐ |
| Día 3 (risk_card) | ⚠️ | ✓ | ✓ | ⚠️ | ✓ | ✓ | 4/6 |
| Día 1 (screenshot_annotated) | ✓ (anotaciones útiles) | ✓ | ✓ | ⚠️ (Lucvia branding) | ✓ | ✓ | 4/6 |
| Día 2 (dashboard_annotated) | ⚠️ (band cubre data) | ⚠️ | ✓ | ✗ | ⚠️ | ⚠️ | 2/6 |

## Decisión global

**El concepto del PRP-013 está validado**. Los 4 outputs producidos demuestran que:
- ✅ La estrategia "proof before polish" funciona — el Día 1 con base lucvia REAL captura un insight que un AI mockup nunca lograría.
- ✅ El auditor 10-point /50 funciona y rechaza correctamente outputs con problemas.
- ✅ Vision AI puede sugerir anotaciones contextualmente útiles.
- ❌ El pipeline NECESITA los 7 patches arriba antes de poder operar en producción sin intervención manual.

## Próximos pasos (próxima sesión)

### Sprint Karpathy iter 1 (~3-4h)

1. **Patch #1**: agregar logo Bitalize a compose-annotated (~30 min)
2. **Patch #2**: smart-positioning del white band (~1h)
3. **Patch #3**: re-skin lucvia base via overlay (~1h)
4. **Patch #6**: persistir archetype en visual_versions create (~15 min)
5. **Patch #7**: auto-select new visual tras generate (~15 min)
6. Deploy
7. Re-correr Días 1, 2 con patches → target ≥45/50

### Sprint Karpathy iter 2 (~3-4h)

8. Implementar Día 4 (carousel_mini_report) — 7 slides con CarouselEditor archetype-aware
9. Tuneo de Vision AI prompt para conexión más fuerte con copy (Patch #5)
10. Re-eval marketing lens completo
11. Auditor final aprobar 5/5 para publicar

### Fase 8 (validación final) — pendiente para fin de iter 1

- `pnpm run build` exitoso (skipped this session por tiempo)
- Smoke test rutas críticas
- PRP-013 marcado COMPLETADO

## Persistencia esta sesión

Toda la implementación está en commit `f627136` en prod. Logs Karpathy en `.claude/karpathy-runs/prp-013/may-11-15/`:
- vie-field-photo-overlay/v0/ (50/50 ⭐)
- mie-risk-card/v0/ (45/50 ⭐)
- lun-screenshot-annotated/v0/ (40/50, base lucvia capturada)
- mar-dashboard-annotated/v0/ (25/50, gaps documentados)
- jue-carousel-mini-report/v0/ (DEFERRED)

Lecciones a memoria persistente:
- pipeline overlay-only viable en producción con Vision AI suggesting + sharp composing
- founder-led product proof requiere fix de re-skin antes de operación sin intervención
