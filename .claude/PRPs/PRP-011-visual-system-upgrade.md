# PRP-011: Visual System Upgrade — Infografias QA-First + Carruseles Storyboard-First

> **Estado**: EN PROGRESO
> **Fecha**: 2026-04-08
> **Proyecto**: LinkedIn ContentOps (Bitalize)

---

## Objetivo

Redisenar la feature Visual de ContentOps para resolver tres brechas criticas:

1. **Eliminar seccion "Historial Nano Banana Pro"** — reemplazar UX manual centrada en runs externos por sistema nativo de versiones visuales
2. **Crear biblioteca de esteticas predefinidas** para carruseles e infografias, basada en estilos probados del proyecto
3. **Reconstruir el flujo de carruseles** con arquitectura Storyboard-First: guion estructurado automatico → slides individuales → render por slide

---

## Por Que

| Problema | Solucion |
|----------|----------|
| La UI conserva "Historial NB Pro", demasiado manual | Eliminado de UI, reemplazado por version history nativa |
| No existen aesthetic presets — se generan dinamicamente | 5 presets hardcodeados basados en estilos probados |
| Carousel + 4:5 genera un prompt unico, no storyboard real | Storyboard automatico: copy + topic → guion → slides → render |
| Cada slide no tiene rol definido | slide_role: cover, context, deep_dive, evidence, method, cta_close |
| El branding en carruseles depende del modelo | Aesthetic preset incluye reglas de marca consistentes |

---

## Que

### Criterios de Exito

- [ ] No existe la seccion "Historial Nano Banana Pro" en la UI
- [ ] Existe selector de aesthetic presets con 5 opciones
- [ ] Cuando el usuario elige Carrusel, el sistema genera un storyboard automatico
- [ ] Cada slide tiene headline, subtitle, body_text y slide_role
- [ ] El aesthetic preset se aplica consistentemente a todos los slides
- [ ] `pnpm exec tsc --noEmit` pasa
- [ ] `pnpm run build` exitoso
- [ ] Playwright: carrusel del jueves generado exitosamente

---

## Fases Implementadas (5 de 10 del PRP original)

### Fase 1: Eliminar "Historial Nano Banana Pro" — COMPLETADA
- Eliminada seccion UI completa (Run ID, iteration reason, QA notes)
- Eliminados estados: nbRunId, nbIterationReason, nbCustomReason, nbQaNotes, isSavingNB
- Eliminado handler handleSaveNanoBanana
- Columnas DB mantenidas por backward compat

### Fase 2: Aesthetic Presets Library
- `src/features/visuals/constants/aesthetic-presets.ts` — 5 presets
- Selector en VisualEditor
- Inyeccion en generate-visual-complete

### Fase 3: Storyboard Builder para Carruseles
- `src/features/visuals/services/storyboard-builder-service.ts`
- Genera guion automatico desde copy + topic + funnel_stage
- 5 slides: cover + 3 desarrollo + cta_close

### Fase 4: Mejorar Carousel Slide Generation
- carousel-prompt-builder con role-aware prompts
- CarouselEditor muestra slide_role
- Aesthetic preset aplicado a todos los slides

### Fase 5: DB Migration 025 — COMPLETADA
- visual_versions: visual_type, aesthetic_preset, generation_mode
- carousel_slides: subtitle, slide_role, status

## Fases Diferidas

| Fase | Razon |
|------|-------|
| QA-First Infographic Engine | VisualCritic + "Corregir con IA" cubren 80% |
| Visual Type Router completo | isCarousel flag ya separa flujos |
| Slide-Level VisualCritic | Requiere refactor grande — diferir |
| Branding Hardcodeado Carruseles extra | Logo compositing ya funciona |
| UI/UX final completo | Iteracion incremental |

---

## Modelo de Datos (Migracion 025)

```sql
ALTER TABLE visual_versions
  ADD COLUMN IF NOT EXISTS visual_type TEXT CHECK (visual_type IN ('infographic','carousel')),
  ADD COLUMN IF NOT EXISTS aesthetic_preset TEXT,
  ADD COLUMN IF NOT EXISTS generation_mode TEXT CHECK (generation_mode IN ('single_image','storyboard_slides'));

ALTER TABLE carousel_slides
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS slide_role TEXT CHECK (slide_role IN ('cover','context','deep_dive','evidence','method','cta_close')),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_qa','approved','rejected'));
```

---

## Aprendizajes

### 2026-04-08: NB Pro era UI manual innecesaria
- **Error**: mantener seccion de tracking de runs externos como centro del flujo visual
- **Fix**: eliminar UI, dejar version history nativa como fuente de verdad
- **Aplicar en**: cualquier feature que dependa de herramientas externas

### 2026-04-08: Carrusel necesita guion, no prompt unico
- **Error**: generar carousel como una imagen unica adaptada a 4:5
- **Fix**: storyboard automatico → slides individuales con roles
- **Aplicar en**: generate-visual-complete, CarouselEditor

---

*PRP en progreso. Fases 1 y 5 completadas.*
