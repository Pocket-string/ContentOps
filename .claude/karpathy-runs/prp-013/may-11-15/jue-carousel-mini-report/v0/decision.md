# Día 4 (Jueves 15-may) — carousel_mini_report v0 (DEFERRED)

**Post copy**: contrarian v8 "Encoder vs irradiancia"
**Archetype**: `carousel_mini_report` (MOFU `demo_pequena`)
**Plan**: 7 slides — 5 AI conceptuales + 2 con captures reales de lucvia cross-plot

## Estado: DEFERRED a Karpathy iter 1 (próxima sesión)

El carrusel `carousel_mini_report` requiere:
1. Generación de 7 slides AI con roles fijos (cover/problem/why/breakdown/example/framework/cta_close)
2. Para slides 4 (breakdown) y 5 (example): captura real de lucvia cross-plot vista + overlay annotations
3. Consistency check across 7 slides (mismo aspect ratio, paleta, tipografía)
4. CarouselEditor.tsx debe heredar archetype context (modificación UI pendiente)

**Razón del deferral**: complejidad operacional (~7 generaciones individuales + 2 captures + compose por cada slide) excede budget de sesión. Pipeline overlay-only validado conceptualmente en Días 1 y 5; replicar para carrusel es trabajo de Karpathy iter 1.

**Plan iter 1**:
- Modificar `CarouselEditor.tsx` para que slides individuales acepten `base_image_url` cuando archetype=carousel_mini_report
- Llamar compose-annotated por slide cuando aplica
- Auditor evalúa cada slide individualmente + deck consistency
