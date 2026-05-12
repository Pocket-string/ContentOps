# PRP-008: Pipeline Agentico de Contenido LinkedIn

> **Estado**: PENDIENTE
> **Fecha**: 2026-03-24
> **Proyecto**: LinkedIn ContentOps (Bitalize)

---

## Objetivo

Transformar ContentOps de una herramienta semi-manual en un pipeline completamente agentico: Research profunda → Topic enriquecido → Campaign → Copy x5 (D→G→P→I) → Visual x5 (sin JSON visible) → Review Dashboard → Publicacion.

## Por Que

| Problema | Solucion |
|----------|----------|
| Research superficial (1 sola llamada Google Search) — topics derivados de baja calidad | Motor multi-query con iteracion profunda, extraccion de "enemigo invisible" + tesis + recurso de conversion |
| Copy generico — no sigue D→G→P→I completo ni "Brick by Brick" (Stakes→Story→Shift) | System prompt enriquecido con hook formula, body structure, share triggers, stage-specific variants |
| Editor visual expone JSON al usuario — requiere conocimiento tecnico | Interfaz simplificada: "Generar Visual" → imagen → feedback texto → regenerar |
| Cada etapa es manual — 4-6 horas semanales entre ChatGPT + Gemini + ContentOps | Pipeline agentico: "Generar Semana" → paquete completo → revision en 15-30 min |

**Valor de negocio**: De 4-6 horas/semana a 15-30 minutos. Eliminar dependencia de ChatGPT Pro externo.

---

## Que

### Criterios de Exito
- [ ] Copy generado pasa RecipeValidator con minimo 10/12 sin intervencion manual
- [ ] El usuario NO ve JSON visual en ningun punto del flujo
- [ ] "Generar Semana" produce 5 posts con copy + visual en menos de 5 minutos
- [ ] Anti-repeticion: hooks no se repiten contra historial de TODAS las campanas
- [ ] Piezas rechazadas se regeneran con feedback textual del usuario
- [ ] Investigacion produce al menos 5 key_findings con fuentes verificables

### Comportamiento Esperado (Happy Path)
1. Usuario hace clic en "Generar Semana" → indica tema/pilar + buyer persona + keyword
2. Pipeline ejecuta: Research → Topic → Campaign → Copy x5 → Visual x5
3. Dashboard de Revision muestra los 5 posts: copy + imagen + scores
4. Aprobar / Rechazar con feedback / Regenerar por pieza
5. Campana pasa a "ready" cuando todo esta aprobado

---

## Contexto

### Documentos Analizados

**1. `docs/Contenido/Analisis flujo.md`** — El workflow ideal de 10 etapas:
- Etapa 1: Investigacion profunda (nivel Perplexity) → "enemigo invisible" + tesis
- Etapa 2: Definicion del tema con 4 preguntas (que no se ve, ejemplo de campo, senal simple, promesa de recurso)
- Etapa 3: Arquitectura semanal mini-funnel (Lun TOFU Problema → Vie BOFU Conversion)
- Etapa 4: Copy en 3 variantes usando metodologia D→G→P→I
- Etapa 5: Concepto visual (infografia 1:1 / carrusel 4:5 / foto humanizada)
- Etapa 6: Prompt JSON como brief ejecutable
- Etapa 7: Generacion de imagen con QA
- Etapa 8: Publicacion con CTA keyword
- Etapa 9: Metricas + aprendizajes → alimentan la semana siguiente

**2. `docs/Contenido/resumen_y_metodologia.md`** — SOP detallado:
- Research debe producir: "enemigo invisible" + evidencia minima + recurso de conversion
- Variantes de copy: Narrativa / Dato shock / Contrarian
- Visual: estetica editorial/periodico, mobile-first, un concepto por pieza
- QA checklist para imagenes (8 criterios)
- Iteracion: max 3-5 cambios por ronda

**3. `docs/Contenido/Guia estrategica de Copywriting.md`** — Metodo "Brick by Brick":
- D→G→P→I (Detener→Ganar→Provocar→Iniciar)
- Formula de hook: Resultado Inesperado + Detalle Especifico
- Cuerpo: Stakes → Story → Shift
- Share triggers: Identity / Emotion / Utility
- Monetizacion ocurre en DMs, no en feed
- Consistencia > Volumen (3x/semana > 6x/semana)

### Referencias (Codigo Existente)

| Archivo | Rol Actual |
|---------|------------|
| `src/app/api/ai/generate-copy/route.ts` | Generacion de copy (ya tiene stage-aware variants) |
| `src/features/prompts/templates/copy-template.ts` | Prompt builder (3 modos: problem/solution/conversion) |
| `src/app/api/research/grounded-research/route.ts` | Research API (1 sola llamada Google Search) |
| `src/features/topics/services/topic-derivation.ts` | Derivacion profunda de topics (ya robusta) |
| `src/app/api/ai/generate-visual-json/route.ts` | Generacion JSON visual (expone JSON al usuario) |
| `src/features/visuals/services/image-prompt-builder.ts` | Convierte JSON → prompt plano para Imagen |
| `src/features/posts/components/PostEditor.tsx` | Editor de copy (intervencion manual) |
| `src/features/visuals/components/VisualEditor.tsx` | Editor visual (muestra JSON textarea) |
| `src/features/campaigns/services/campaign-service.ts` | Campaign CRUD + auto-post creation |
| `src/features/posts/components/RecipeValidator.tsx` | 12-check content validator |

### Arquitectura Propuesta

No se crea una feature folder completamente nueva para todo. Los cambios se distribuyen en features existentes, con una nueva feature `pipeline` para la orquestacion:

```
src/features/pipeline/
├── components/
│   ├── GenerateWeekWizard.tsx     # Wizard multi-step
│   ├── WeekReviewDashboard.tsx    # Review de los 5 posts
│   └── PieceReviewCard.tsx        # Card individual por post
├── services/
│   └── pipeline-orchestrator.ts   # Logica de orquestacion
├── actions/
│   └── pipeline-actions.ts        # Server actions
└── types.ts                       # Tipos del pipeline
```

### Modelo de Datos

No se crean tablas nuevas. Cambios a existentes:

```sql
-- Tracking de progreso del pipeline
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS
  pipeline_status JSONB DEFAULT NULL;
-- { stage: 'research'|'topic'|'copy'|'visual'|'review', progress: 0-100, errors: [] }

-- Feedback de rechazo del usuario
ALTER TABLE posts ADD COLUMN IF NOT EXISTS
  rejection_feedback TEXT DEFAULT NULL;

ALTER TABLE visual_versions ADD COLUMN IF NOT EXISTS
  rejection_feedback TEXT DEFAULT NULL;
```

---

## Blueprint (Assembly Line)

> IMPORTANTE: Solo definir FASES. Las subtareas se generan al entrar a cada fase
> siguiendo el bucle agentico (mapear contexto → generar subtareas → ejecutar)

### Fase 1: Copy Generation Mejorado
**Objetivo**: Incorporar la metodologia completa "Brick by Brick" + D→G→P→I en los system prompts, e implementar anti-repeticion cross-campaign.

**Archivos a modificar**:
- `src/app/api/ai/generate-copy/route.ts` — System prompt enhancement
- `src/features/prompts/templates/copy-template.ts` — Template alignment
- Nuevo: `src/features/posts/services/hook-history-service.ts` — Historical hooks query

**Cambios clave**:

1. **Hook Formula** (actualmente generico): Agregar patron explicito "Resultado Inesperado + Detalle Especifico"
   - NO: "Como mejorar el rendimiento de tu planta"
   - SI: "Redujimos las perdidas un 3.2% sin instalar un solo sensor"

2. **Body Structure** (actualmente solo variant instructions): Agregar arco narrativo Stakes → Story → Shift
   - Stakes: por que importa, costo de ignorarlo
   - Story: caso de campo con tension narrativa
   - Shift: principio universal aplicable

3. **Share Triggers** (actualmente ausente): Instrucciones para Identity / Emotion / Utility
   - Identidad: "que el lector se vea como experto al compartir"
   - Emocion: "conectar a nivel operativo con frustracion real"
   - Utilidad: "que el contenido sea guardable y accionable"

4. **Character limits por stage**: BOFU 1500-2200 chars (directo), TOFU hasta 2500
5. **Single CTA en BOFU**: Un CTA principal, no multiples
6. **Anti-repeticion cross-campaign**: Query ultimos 50 hooks de `post_versions` JOIN `posts` JOIN `campaigns`

**Validacion**:
- [ ] Generar copy 3 veces para mismo tema → hooks sustancialmente diferentes
- [ ] BOFU tiene CTA unico, TOFU tiene pregunta abierta
- [ ] RecipeValidator promedio 10+ de 12
- [ ] `pnpm exec tsc --noEmit` = 0 errores

---

### Fase 2: Simplificacion del Editor Visual
**Objetivo**: Eliminar JSON de la vista del usuario. Flujo: boton "Generar Visual" → imagen resultante → textarea de feedback → "Regenerar".

**Archivos a modificar**:
- `src/features/visuals/components/VisualEditor.tsx` — Refactor UI mayor
- Nuevo: `src/app/api/ai/generate-visual-complete/route.ts` — Endpoint combinado (JSON + imagen en 1 call)
- Nuevo: `src/features/visuals/services/visual-format-selector.ts` — Auto-seleccion de formato

**Cambios clave**:

1. **UI simplificada**: Reemplazar textarea JSON por:
   - Boton "Generar Visual" que ejecuta pipeline completo internamente
   - Barra de progreso (Preparando → Generando → Listo)
   - Preview de imagen generada
   - Textarea de feedback ("Describe que cambiar")
   - Boton "Regenerar con feedback"

2. **Endpoint combinado** (`generate-visual-complete`):
   - Acepta: `post_content, funnel_stage, feedback?`
   - Internamente: genera JSON visual → genera imagen → composita logo → upload → devuelve URL
   - El JSON se guarda en DB pero nunca se muestra al usuario

3. **Auto-seleccion de formato**:
   - TOFU Problem: 1:1 infographic
   - MOFU: 1:1 data chart / diagram
   - BOFU: 1:1 comparison o carousel si contenido tiene 4+ bullets
   - Carousel auto-detectado si el copy tiene listas

**Validacion**:
- [ ] Usuario nunca ve JSON en el flujo visual
- [ ] "Generar Visual" produce imagen visible en un click
- [ ] Feedback → Regenerar funciona con lenguaje natural
- [ ] Formato auto-seleccionado correctamente por stage

---

### Fase 3: Motor de Investigacion Profunda
**Objetivo**: De una llamada Google Search a investigacion multi-query iterativa que produce: "enemigo invisible" + tesis + evidencia minima + recurso de conversion + 5-8 topic candidates con fit scores.

**Archivos a modificar**:
- `src/app/api/research/grounded-research/route.ts` — Multi-query + deepening
- `src/features/research/services/research-prompt-builder.ts` — Use generated search_queries
- `src/features/research/components/ResearchDetail.tsx` — Display new fields
- Schema update en output Zod

**Cambios clave**:

1. **Multi-query parallel research**: Ejecutar 3-5 llamadas Google Search en paralelo (actualmente solo 1), cada una con una query diferente de `search_queries`

2. **Iterative deepening**: Tomar findings → generar preguntas de seguimiento → segunda ronda de busqueda

3. **Output enriquecido**: Agregar campos explicitos:
   ```typescript
   invisible_enemy: z.string(),  // "El PR que miente"
   thesis: z.string(),           // Tesis contrarian principal
   conversion_resource: z.string(), // Que recurso ofrecer en BOFU
   topic_candidates: z.array(z.object({
     title: z.string(),
     angle: z.string(),
     hook_idea: z.string(),
     fit_score: z.number().min(0).max(100),
     ai_recommendation: z.string(),
   })).min(3).max(8),
   ```

4. **Boton "Profundizar"**: Re-research enfocado en un topic angle especifico

**Validacion**:
- [ ] Research produce 5+ key_findings con fuentes verificables
- [ ] `invisible_enemy` y `thesis` son especificos (no genericos)
- [ ] Topic candidates tienen fit scores distintos
- [ ] Re-research produce hallazgos mas profundos

---

### Fase 4: Pipeline "Generar Semana"
**Objetivo**: Orquestacion end-to-end: Research → Topic → Campaign → Copy x5 → Visual x5 → Review Dashboard.

**Archivos nuevos**:
```
src/features/pipeline/
├── components/
│   ├── GenerateWeekWizard.tsx
│   ├── WeekReviewDashboard.tsx
│   └── PieceReviewCard.tsx
├── services/
│   └── pipeline-orchestrator.ts
└── actions/
    └── pipeline-actions.ts
```

**Ruta nueva**: `src/app/(main)/campaigns/[id]/review/page.tsx`

**Cambios clave**:

1. **Wizard**: Seleccionar tema/pilar + buyer persona + keyword → ejecutar pipeline
2. **Orquestador**: Encadena servicios existentes secuencialmente con tracking de progreso en `campaigns.pipeline_status` (JSONB)
3. **Review Dashboard**: Grid de 5 posts con copy preview + thumbnail + scores + Aprobar/Rechazar
4. **Quality Gates automaticos**: RecipeValidator < 8/12 → auto-regenerar con feedback
5. **Anti-repeticion**: No permitir hooks con >30% word overlap dentro de la misma campana

**Migracion**:
```sql
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS pipeline_status JSONB DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS rejection_feedback TEXT DEFAULT NULL;
ALTER TABLE visual_versions ADD COLUMN IF NOT EXISTS rejection_feedback TEXT DEFAULT NULL;
```

**Validacion**:
- [ ] "Generar Semana" produce 5 posts completos en < 5 minutos
- [ ] Review dashboard muestra los 5 posts con scores y thumbnails
- [ ] Rechazar → Feedback → Regenerar funciona por pieza
- [ ] Pipeline status es trackeable y recuperable si falla a mitad
- [ ] `pnpm run build` exitoso

---

## Dependencias entre Fases

```
Fase 1 (Copy) ──────────────┐
                              ├──→ Fase 4 (Pipeline)
Fase 2 (Visual) ─────────────┘         │
                                         │
Fase 3 (Research) ──────────────────────┘
```

Fases 1, 2, 3 son independientes y pueden ejecutarse en paralelo.
Fase 4 depende de las tres anteriores.

---

## Aprendizajes (Self-Annealing / Neural Network)

> Esta seccion CRECE con cada error encontrado durante la implementacion.

*(Vacia — se documenta durante la ejecucion)*

---

## Gotchas

- [ ] `generateObject` SIEMPRE falla con inputs largos en Gemini — usar `generateText` + JSON parse + Zod
- [ ] Zod `.nullable().optional()` para inputs de API donde client envia `null`
- [ ] Google Search grounding tiene rate limits — stagger 500ms entre llamadas paralelas
- [ ] Pipeline timeout: 5 posts x (copy + visual) puede tomar 3-4 min — usar polling de progreso
- [ ] Rate limiter en 10 req/min — pipeline necesita rate limiter separado o bypass server-side
- [ ] Imagen 3 falla silenciosamente a veces — manejar con retry graceful por post
- [ ] `useRef` pattern para `justSavedRef` en todo editor con estado local + server revalidation

## Anti-Patrones

- NO crear tabla nueva "pipeline" — usar `campaigns.pipeline_status` JSONB
- NO reescribir APIs existentes — extender o crear endpoints compuestos que reusen servicios
- NO exponer estructura de prompts al usuario — todo invisible
- NO hacer pipeline sincrono desde client — server actions + polling de progreso
- NO skipear Zod en ninguna respuesta AI
- NO ignorar errores de TypeScript

---

## Archivos Criticos

| Archivo | Fase | Cambio |
|---------|------|--------|
| `src/app/api/ai/generate-copy/route.ts` | 1 | System prompt D→G→P→I + anti-repeticion |
| `src/features/prompts/templates/copy-template.ts` | 1 | Align con Brick by Brick |
| `src/features/posts/services/hook-history-service.ts` | 1 | NUEVO — query historical hooks |
| `src/features/visuals/components/VisualEditor.tsx` | 2 | Refactor — ocultar JSON |
| `src/app/api/ai/generate-visual-complete/route.ts` | 2 | NUEVO — JSON + imagen en 1 call |
| `src/features/visuals/services/visual-format-selector.ts` | 2 | NUEVO — auto-formato |
| `src/app/api/research/grounded-research/route.ts` | 3 | Multi-query + deepening |
| `src/features/research/components/ResearchDetail.tsx` | 3 | Display nuevos campos |
| `src/features/pipeline/` | 4 | NUEVO — orquestacion completa |
| `src/app/(main)/campaigns/[id]/review/page.tsx` | 4 | NUEVO — review dashboard |

---

## Verificacion End-to-End

1. **Fase 1**: Generar copy para mismo tema 3 veces → hooks distintos + RecipeValidator 10+/12
2. **Fase 2**: Click "Generar Visual" → imagen aparece sin ver JSON → feedback → regenerar → imagen mejorada
3. **Fase 3**: Investigar "soiling heterogeneo" → producir 5+ findings con fuentes → enemigo invisible claro
4. **Fase 4**: "Generar Semana" → 5 posts con copy + visual en < 5 min → review → aprobar → campaign ready
5. **Deploy**: `pnpm exec tsc --noEmit` = 0, `pnpm run build` = success, deploy Dokploy

---

*PRP pendiente aprobacion. No se ha modificado codigo.*
