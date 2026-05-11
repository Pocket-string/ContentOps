# Marketing Eval Iter 0 (Baseline) — B2B SaaS Marketing Lens

**Fecha**: 2026-05-11
**Campaign**: f00ba3d8-6a4b-4de2-85f5-142b4fe89dc7 — TRACKER — Pérdidas Invisibles FV — Asset Manager
**Evaluador**: Lente experto B2B SaaS startup early-stage

## Rúbrica binaria (13 checks, threshold ≥11/13 para "100% conforme")

1. **HOOK** detiene scroll en 2s — específico, número o tensión, NO genérico
2. **POV** no obvio — opinión, no descripción del problema
3. **SPECIFICITY** ≥3 detalles concretos (planta, MW, $, fecha, modelo, fuente)
4. **FOUNDER PROOF** — escena vivida por el autor, no consultor genérico
5. **AUDIENCE FIT** — el Asset Manager lo reenviaría al CFO/directorio
6. **BUSINESS TRANSLATION** — pérdida/ganancia en $/día o $/MW/año
7. **STRUCTURE FIT** — refleja archetype (feature_kill, aprendizaje_cliente, etc.)
8. **FUNNEL FIT** — BOFU pide acción, MOFU muestra gap, TOFU planta opinión
9. **CTA** conversacional, sin lead-magnet
10. **CLEAN** — 0 banned phrases, 0 hashtags, comillas dobles correctas, NO sobre-uso de tokens entre comillas
11. **LENGTH** 1500-2200 chars (BOFU puede ser menor si denso)
12. **SAVEABILITY** — framework/regla/check que alguien guardaría
13. **ANTI-AI** — variación de longitud, frases incompletas OK, NO 3 bullets paralelos siempre

## Resultados Iter 0

| Día | Funnel | Estructura | Variante | Score | Veredicto |
|---|---|---|---|---|---|
| 1 lun | bofu_conversion | feature_kill | **contrarian** ⭐ | **13/13** | PASS — congelar |
| 1 lun | — | — | data_driven | 11/13 | OK |
| 1 lun | — | — | story | 12/13 | OK |
| 2 mar | mofu_problem | aprendizaje_cliente | **story** ⭐ | 11/13 | NEEDS ITER — comillas |
| 2 mar | — | — | contrarian | 10/13 | NEEDS ITER |
| 2 mar | — | — | data_driven | 11/13 | OK |
| 3 mie | tofu_solution | nicho_olvidado | **contrarian** ⭐ | 10/13 | NEEDS ITER — escena+estructura+comillas |
| 3 mie | — | — | data_driven | 9/13 | FAIL |
| 3 mie | — | — | story | 10/13 | NEEDS ITER (mejor metáfora) |
| 4 jue | mofu_solution | demo_pequena | **contrarian** ⭐ | 12/13 | NEEDS ITER — comillas + add proof concreto |
| 4 jue | — | — | data_driven | 9/13 | FAIL — markdown bold en LinkedIn |
| 4 jue | — | — | story | 12/13 | OK (hook débil) |
| 5 vie | tofu_problem | opinion_contraria_ia | **story** ⭐ | 12/13 | NEEDS ITER — comillas |
| 5 vie | — | — | contrarian | 10/13 | NEEDS ITER |
| 5 vie | — | — | data_driven | 12/13 | OK |

## Hallazgo crítico (común a 4 de 5 días)

**Anti-patrón AI**: Sobre-uso de "TRACKER" entre comillas dobles como token recurrente, 6-15 veces por post.

Ejemplo del día 2 story:
> El "TRACKER" respondía al ping... 99% de disponibilidad para los "TRACKERS"... un "TRACKER" muerto, sino uno "vivo"...

**Causa raíz**: La regla del prompt (`fe525a7`) dice tokens/keywords en dobles O ALL CAPS — el AI está aplicando ambos simultáneamente. La keyword "TRACKER" viene de `campaigns.keyword` y se inyecta al system prompt como término focal, lo que amplifica su uso.

**Fix necesario**: clarificar regla → si el token YA está en ALL CAPS, NO se le ponen comillas. Reservar comillas para énfasis/cita/términos extranjeros sin caps.

## Plan iter 1 (max 5 fixes, hard stop)

1. **PROMPT MUTATION**: añadir regla "ALL CAPS sin comillas" a `generate-copy` y `humanize-copy`
2. **Day 3 contrarian**: regenerar — la escena "café frío" es cliché, no founder-led
3. **Day 4 contrarian**: agregar resultado concreto al final (eg. "PR recuperado X%") + remover comillas
4. **Day 2 story**: re-humanizar para limpiar comillas
5. **Day 5 story**: re-humanizar para limpiar comillas (es la mejor de la semana en hook, no tocar más)

Día 1 contrarian: CONGELADO (13/13). No tocar.
