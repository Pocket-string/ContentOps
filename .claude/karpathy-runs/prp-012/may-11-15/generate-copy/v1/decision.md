# Karpathy iter v1 — decisión

**Fecha**: 2026-05-11
**Prompt**: generate-copy con structure_blueprint
**Input**: Lunes 11/may, estructura `opinion_contraria_ia`, pilar Pérdidas Invisibles FV, audiencia Asset Manager
**Topic**: Tracker availability real 66-88%

## Evaluación binaria (10 checks B2B SaaS marketing)

| # | Criterio | contrarian | story | data_driven |
|---|---|---|---|---|
| 1 | Hook concreto (NO genérico) | ✅ | ✅ | ✅ |
| 2 | Scene/data/decision (≥1) | ✅ (escena+dato) | ✅ (escena fuerte) | ✅ (dato fuerte) |
| 3 | Producto = consecuencia | ✅ | ✅ | ✅ |
| 4 | Traducción técnico→negocio | ✅ ($200-400k/año) | ⚠️ falta $ explícito | ✅ ($400k, P&L, LCOE) |
| 5 | CTA específico experiencia | ✅ | ✅ | ✅ |
| 6 | Estructura reflejada (op_contraria) | ✅ creencia→tesis→evidencia→matiz | ❌ no es opinion contraria, es escena terreno | ✅ |
| 7 | Pilar reflejado (Pérdidas Invisibles FV) | ✅ | ✅ | ✅ |
| 8 | Audiencia AM ($/día, P&L) | ✅ | ⚠️ tono más Head O&M | ✅ |
| 9 | Sin banned phrases | ✅ | ✅ | ✅ |
| 10 | Voz fundador-técnico | ✅ | ✅ | ✅ |

**Score**: contrarian 10/10, story 7/10, data_driven 10/10. **Promedio 9/10 = 90%** ≥ threshold 85% ✅.

## Violación detectada por usuario (NO en los 10 criterios)

**Issue**: Uso de comillas simples (') como citación.
- contrarian: 2x ('activos')
- story: 6x ('gemelos', 'operativos', 'disponibilidad', 'optimización')
- data_driven: 0x ✓

**Regla violada**: en español formal SOLO se usan comillas dobles ("texto"). Las comillas simples se reservan para apóstrofos en palabras/nombres extranjeros (d'Arc, O'Brien).

## DECISIÓN: DISCARD v1 → mutate to v2

**Mutación aplicada**:
1. `generate-copy`: agregué sección `## COMILLAS (CRITICO — REGLA DE ESPAÑOL)` con regla + ejemplo correcto vs incorrecto. Corregido el ejemplo de formato (cambié `'verdes'` → `"verdes"`)
2. `humanize-copy`: misma regla + instrucción explícita de reemplazar comillas simples si vienen del borrador
3. `RecipeValidator`: nuevo check #22 `comillas-dobles` (severity=error), regex que detecta `'word'` rodeado de no-letras, ignora apóstrofos legítimos

**Commit**: `5eaa469` — "fix(prp-012): forbid single quotes as citation marks (Spanish rule)"
**Deploy**: triggered, pendiente confirmación prod ready
