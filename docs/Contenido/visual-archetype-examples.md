# Ejemplos Aplicados — 9 Archetypes Visuales Bitalize

> Companion a [visual-strategy.md](visual-strategy.md). Un ejemplo concreto por archetype, mapeado al copy real de la campaña May 11-15 cuando aplica.

---

## 1. `screenshot_annotated` — Lunes 12-may (BOFU `feature_kill`)

**Copy del post**: "Matamos una métrica de nuestro dashboard. La que más miraban los Asset Managers... La media te tranquiliza. La mediana te engaña. La distribución te delata."

**Visual**:
- **Base**: captura via Playwright de `lucvia.com/demo/perdidas-priorizadas`
- **Overlay**:
  - Anotación 1 (tachada, gris): `Fleet Availability 99.2% — métrica vieja`
  - Anotación 2 (highlight verde, flecha): `→ Vista nueva: top pérdidas por $/día`
  - Anotación 3 (rojo, callout grande): `$200-400k/año en 100 MW`
  - Pequeña nota en pie: `Estudio EPJ Photovoltaics 2026, 2 GW`
- **Brand**: logo Bitalize bottom-left, franja blanca 12%, esquina inf-der libre.

**Por qué funciona**: muestra LITERAL la decisión de producto que el copy describe. No es mockup — es el dashboard real.

---

## 2. `dashboard_annotated` — Martes 13-may (MOFU `aprendizaje_cliente`)

**Copy del post**: "El TRACKER respondía al ping, siempre. No había alarmas. Pero una tarde, el Asset Manager... notó un 'pliegue' raro en su curva de potencia."

**Visual**:
- **Base**: captura via Playwright de `lucvia.com/demo/curva-potencia`
- **Overlay**:
  - Anotación 1 (flecha curva apuntando al pliegue): `← Aquí: caída sin alarma`
  - Anotación 2 (callout): `Drift 5-10% del ángulo óptimo`
  - Anotación 3 (rojo, headline): `SCADA dice OK. El P&L dice otra cosa.`
- **Brand**: logo bottom-left.

**Por qué funciona**: el lector VE el pliegue del que habla el texto. Saveability máxima: AM screenshot-ea para "buscar pliegues en su propia planta".

---

## 3. `carousel_mini_report` — Jueves 15-may (MOFU `demo_pequena`)

**Copy del post**: "Tu SCADA te dice que el TRACKER está activo. Pero no te cuenta si está apuntando un par de grados fuera de su ángulo óptimo..."

**Carrusel de 7 slides (4:5)**:

| # | Role | Tipo | Contenido |
|---|---|---|---|
| 1 | Cover | AI | "Tu SCADA dice ✓. Tu P&L dice ✗" + "Cruza encoder con irradiancia. Te muestro cómo." |
| 2 | Problem | AI conceptual | Drift silencioso de TRACKER — diagrama: SCADA reporta OK, ángulo real desviado |
| 3 | Why_matters | AI | "$200-400k/año en 100 MW. Sin alarma. Sin dashboard que lo grite." |
| 4 | Breakdown | **Real lucvia capture** | `lucvia.com/demo/cross-plot` con anotación "Encoder vs Irradiancia — outliers en rojo" |
| 5 | Example | **Real lucvia capture** | Misma vista pero con caso concreto: "TRACKER #X — debería 30°, mide 28°" |
| 6 | Framework | AI | Framework "Vista de Desviación" 3 pasos: superponer → identificar patrón → priorizar |
| 7 | Cta_close | AI | "▪ El SCADA mide conectividad, no precisión / ▪ Cada 1% drift = 0.5% energía / ▪ Recuperable en semanas, sin sensores nuevos" + CTA conversacional |

**Por qué funciona**: 5 slides conceptuales + 2 con product proof real. Construye categoría + muestra que existe el método.

---

## 4. `data_decision_flow` — uso oportunista

**Ejemplo Bitalize**: post conceptual sobre "qué hacemos con un dato SCADA antes de que sea decisión".

**Visual**:
- Flujo horizontal con 6 bloques + flechas:
  1. `SCADA bruto` (icono: stream de datos)
  2. `Validación + agrupación` (icono: filtro)
  3. `Evento candidato` (icono: alarma)
  4. `Pérdida estimada $/día` (icono: $)
  5. `Prioridad por impacto` (icono: ranking)
  6. `Acción O&M focalizada` (icono: pin en mapa)
- Flecha entre bloque 4 y 5 marcada en rojo: "← donde el 80% de equipos pierde dinero"
- Logo bottom-left, esquina inf-der libre.

**Por qué funciona**: educa metodología sin vender producto. Reutilizable como referencia recurrente en posts de TOFU.

---

## 5. `before_after` — uso oportunista

**Ejemplo Bitalize**: post sobre cómo cambia un comité de performance al usar pérdidas priorizadas.

**Visual** (split vertical 50/50):
- **Izquierda — "Antes"** (gris, denso):
  - Header: "Comité performance — Sin priorización"
  - Lista: "300 alarmas SCADA / 17 reportes diferentes / debate 90 min sin decisión"
- **Derecha — "Después"** (claro, accionable):
  - Header: "Con vista priorizada"
  - Lista: "5 pérdidas top / $/día por cada una / decisión en 20 min"

**Por qué funciona**: vende alivio sin nombrar el producto. AM lo reenvía al equipo.

---

## 6. `field_photo_overlay` — Viernes 16-may (TOFU `opinion_contraria_ia`)

**Copy del post**: "El polvo se pegaba al cuello bajo un sol implacable. El SCADA reportaba un 99% de disponibilidad, impoluto. Pero los TRACKERS, sabía, mentían."

**Visual**:
- **Base**: foto real de campo (planta FV, vista aérea o caminando entre filas). Si Jonathan no tiene → foto solar genérica SIN marca + overlay fuerte que la convierta en proof.
- **Overlay**:
  - Texto central grande: `SCADA dice 99% ✓`
  - Texto contraste rojo: `Realidad: 66-88%`
  - Subtítulo: `2 GW analizados — EPJ Photovoltaics 2026`
- **Brand**: logo bottom-left, franja blanca 12%.

**Por qué funciona**: ancla el copy en realidad de campo. Anti-bot de 360Brew (no es template AI).

---

## 7. `founder_proof` — uso oportunista

**Ejemplo Bitalize**: post sobre por qué eliminaron una feature del MVP.

**Visual**:
- Foto/captura de pizarra Miro o boceto en cuaderno con `v1 [tachada] → v2 simplificada`
- Overlay mínimo: "Por qué quitamos el dashboard 'todo verde'"
- Subtítulo pequeño: "Decisión de producto · 2024"
- Logo bottom-left, intencionalmente "imperfecto" en el styling — eso ES el proof.

**Por qué funciona**: construye autoridad founder-led. "Yo decido esto, yo aprendo de mis errores". Atrae seguidores que valoran transparencia.

---

## 8. `technical_report` — uso oportunista

**Ejemplo Bitalize**: análisis benchmark de backlog priorizado.

**Visual** (4:5, fondo claro tipo paper):
- Título arriba: "Impacto de backlog no priorizado en planta FV 30 MW"
- Gráfico central: barras de pérdida estimada por categoría (curtailment, soiling, trackers, strings)
- Nota técnica: "Estimación sintética basada en SOP O&M LATAM. Pérdidas anualizadas."
- Fuente al pie: "Bitalize Engineering Note 01 — 2026"
- Logo bottom-left.

**Por qué funciona**: el analista de performance lo screenshot-ea para mostrar a su Head of O&M. Saveability técnica.

---

## 9. `risk_card` — Miércoles 14-may (TOFU `nicho_olvidado`)

**Copy del post**: "Tu PR puede estar sano, pero tus TRACKERS desalineados roban hasta US$400.000 anuales. En silencio, invisibles al SCADA."

**Visual** (1:1, formato tarjeta):

```
┌─────────────────────────────────────────────┐
│  ⚠️  RIESGO IDENTIFICADO                    │
├─────────────────────────────────────────────┤
│                                              │
│  Drift de backtracking en terreno ondulado  │
│                                              │
│  ─────────────────────────────────          │
│                                              │
│  CAUSA PROBABLE                              │
│  Algoritmo asume terreno plano               │
│                                              │
│  IMPACTO ESTIMADO                            │
│  USD 200-400k/año (planta 100 MW)            │
│                                              │
│  CONFIANZA DEL DIAGNÓSTICO                   │
│  ████████░░ Media-Alta                       │
│  Fuente: EPJ Photovoltaics 2026 (2 GW)       │
│                                              │
│  ACCIÓN SUGERIDA                             │
│  Auditar cross-plot encoder vs irradiancia  │
│  por bloque                                  │
│                                              │
│  PRIORIDAD                                   │
│  🟠 Alta — silencioso, recurrente            │
│                                              │
├─────────────────────────────────────────────┤
│  bitalize                                    │
└─────────────────────────────────────────────┘
```

**Por qué funciona**: insurtech-pattern aplicado a O&M. AM lo guarda como ficha de decisión para su próximo comité.

---

## Resumen mapeo campaña May 11-15

| Día | Estructura | Archetype | Source | Slide-level decisions (si aplica) |
|---|---|---|---|---|
| Lun 12 | feature_kill | `screenshot_annotated` | lucvia/perdidas-priorizadas | — |
| Mar 13 | aprendizaje_cliente | `dashboard_annotated` | lucvia/curva-potencia | — |
| Mié 14 | nicho_olvidado | `risk_card` | AI mockup | — |
| Jue 15 | demo_pequena | `carousel_mini_report` | Mixed | Slides 4-5 real lucvia/cross-plot; resto AI |
| Vie 16 | opinion_contraria_ia | `field_photo_overlay` | Foto + AI overlay | — |

**3 de 5 visuales con base real lucvia** = founder-led product proof máximo.

---

*Estos ejemplos son template de inspiración. Cada visual real debe pasar el auditor 10-point antes de aprobarse.*
