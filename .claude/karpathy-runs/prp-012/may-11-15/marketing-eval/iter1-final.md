# Marketing Eval Iter 1 (Final) — B2B SaaS Marketing Lens

**Fecha**: 2026-05-11
**Campaign**: f00ba3d8-6a4b-4de2-85f5-142b4fe89dc7 — TRACKER — Pérdidas Invisibles FV — Asset Manager
**Evaluador**: Lente experto B2B SaaS startup early-stage
**Cycle**: Iter 1 (1 of max 2 per CLAUDE.md budget)

## Mutaciones aplicadas (5 fixes, hard cap)

1. **Prompt mutation** (commit `2d79ddd`): generate-copy + humanize-copy forbid double-quoting ALL-CAPS tokens (TRACKER, SCADA, PR, EBITDA). Quotes reservados solo para citas literales, ironía, o tokens en minúscula.
2. **Day 5 story**: re-humanize → v13 (2110c)
3. **Day 2 story**: re-humanize → v7 (1847c)
4. **Day 4 contrarian**: re-humanize → v7 (2369c)
5. **Day 3 contrarian**: `/api/ai/iterate` con feedback estructurado (escena founder-led + reforzar nicho_olvidado + remover comillas + atar $ al P&L) → v7 (2015c)

## Scorecard final

| Día | Estructura | Funnel | Variante elegida | Versión | Len | Score iter0 | Score iter1 | Δ |
|---|---|---|---|---|---|---|---|---|
| 1 lun | feature_kill | bofu_conversion | contrarian | v4 | 1319 | 13/13 ⭐ | 13/13 ⭐ | — |
| 2 mar | aprendizaje_cliente | mofu_problem | story | v7 | 1847 | 11/13 | 13/13 ⭐ | +2 |
| 3 mie | nicho_olvidado | tofu_solution | contrarian | v7 | 2015 | 10/13 | 12/13 ⚠️ | +2 |
| 4 jue | demo_pequena | mofu_solution | contrarian | v7 | 2369 | 12/13 | 13/13 ⭐ | +1 |
| 5 vie | opinion_contraria_ia | tofu_problem | story | v13 | 2110 | 12/13 | 13/13 ⭐ | +1 |

**Promedio**: 11.6/13 → **12.8/13 = 98%** (+5pp)

## Gap pendiente (1 item — requiere acción humana)

**Día 3 contrarian v7**: la iteración produjo una escena específica que mejora dramáticamente el founder-proof, pero la AI fabricó detalles que requieren verificación humana:

- "Octubre de 2023, 50 MW en Atacama"
- Operador con casco empolvado diciéndome literalmente: "Jonathan, ¿ves cómo ese grupo de TRACKERS se gira de más al atardecer?"

**Acción requerida (Jonathan)**:
- Si la escena es real (o ajustable a un evento real) → publicar tal cual o ajustar fecha/MW → 13/13
- Si es fabricada → editar manualmente con escena verificable o usar lenguaje más genérico ("una planta del norte chileno, hace un par de años")

**Por qué importa**: como B2B SaaS marketing expert, la autenticidad founder-led es el moat. Publicar diálogos fabricados de personas reales destruye la credibilidad del autor. La AI no sabe esto — Jonathan sí.

## Hallazgos del proceso

### Lo que funcionó
- **Mutación de prompt seguida de re-humanize**: eliminó el patrón de over-quoting `"TRACKER"` en 1 ciclo. Sin esto, regenerar producía el mismo defecto.
- **Feedback estructurado en Iterar con AI**: 5 puntos numerados con ejemplos concretos produjeron un output 12/13 desde 10/13 en una sola pasada.
- **Server Action stale post-deploy**: hard reload del browser resolvió el error.

### Lo que NO funcionó
- **Humanize pierde bullets**: la capa Humanizer convierte bullets en narrativa flowing. Para MOFU/demo_pequena puede ser un trade-off no deseado. Considerar agregar regla "preservar bullets si existen y tienen pattern accionable" al humanize-copy.
- **AI fabrica detalles cuando se piden específicos**: pedir "fecha + planta + MW + sensorial" produjo detalles plausibles pero no verificables. Necesita guardrail o aclaración: "si no tienes referencia real, usa placeholders genéricos".

### Anti-patrón identificado y resuelto
- "TRACKER" entre comillas dobles repetido 6-15 veces por post → señal AI fingerprint en 4 de 5 días. Fix permanente en prompts (commit `2d79ddd`).

## Recomendación de publicación

| Día | Variante | Estado | Acción Jonathan antes de publicar |
|---|---|---|---|
| Lun 12-May | contrarian v4 | ✅ Publicar | Ninguna (13/13) |
| Mar 13-May | story v7 | ✅ Publicar | Ninguna (13/13) |
| Mie 14-May | contrarian v7 | ⚠️ Revisar | Verificar escena Atacama Oct 2023 → publicar o editar |
| Jue 15-May | contrarian v7 | ✅ Publicar | Ninguna (13/13) |
| Vie 16-May | story v13 | ✅ Publicar | Ninguna (13/13) ⭐ best post de la semana |

## Budget Karpathy

- Ciclos usados: 1 de 2 (50%)
- Fixes en ciclo 1: 5 de 5 (100%)
- Ciclo 2: NO ejecutado — gaps restantes requieren verificación humana, no más prompt engineering.
