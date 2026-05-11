# Guía Visual Bitalize — Proof-Before-Polish para LinkedIn B2B SaaS

> Companion doc a [PRP-013](../../.claude/PRPs/PRP-013-bitalize-visual-strategy.md). Define qué hace que un visual "valga la pena publicar" desde la lente de marketing B2B SaaS startup early-stage.

**Versión**: 1.0 (PRP-013, fase 1)
**Fecha**: 2026-05-11

---

## 1. Tesis central

> En O&M fotovoltaico, un buen visual no es el que muestra más información. Es el que ayuda a decidir qué pérdida atacar primero.

Cada visual de Bitalize debe responder al menos una de estas 5 preguntas operativas:

1. ¿Qué pérdida invisible existe?
2. ¿Dónde está ocurriendo?
3. ¿Cuánto duele en MWh, $/día, PR o riesgo operativo?
4. ¿Qué debería mirar primero el equipo de O&M o Asset Management?
5. ¿Qué decisión habilita este dato?

Si un visual no responde ninguna, probablemente es decoración — y LinkedIn 360Brew lo deprioritizará como AI-template content.

**Principio anti-genérico**: Bitalize NO compite contra contenido visual de empresas grandes con renders impecables. Compite construyendo **autoridad por prueba real**:
- Screenshots de productos reales (lucvia, mantenimiento.jonadata.cloud)
- Dashboards anotados con datos demo verificables
- Fotos de campo (no stock)
- Pizarras / decisiones de producto founder-led

> "Proof before polish" — cada visual debe pasar el test: *¿alguien hizo esto realmente, o un AI lo inventó?*

---

## 2. Reglas brand consolidadas

| Atributo | Regla |
|---|---|
| **Formato post estático** | 1:1 (1080×1080 px) |
| **Formato carrusel** | 4:5 (1080×1350 px), 5-15 slides, **sweet spot 7** (18% mejor performance LinkedIn 2026) |
| **Logo** | SIEMPRE esquina inferior izquierda, sobre franja blanca 12% del alto |
| **Esquina inferior derecha** | SIEMPRE libre (LinkedIn UI ahí pone CTAs, no chocar) |
| **Paleta dominante (60%)** | Azul marino oscuro (#1E3A5F) o blanco editorial |
| **Paleta secundaria (30%)** | Azules medios/claros, gris cálido |
| **Acentos (10%)** | Amarillo, naranja, **rojo SOLO para pérdidas/riesgos críticos**. Verde solo para "recuperado/corregido". |
| **Tipografía** | Sans-serif limpia (Inter Bold). Títulos grandes legibles al 25% del tamaño en mobile. Max 2 tamaños por visual. |
| **Densidad de texto** | Una idea principal por visual. 2-4 anotaciones máximo. |
| **Anti-patrones absolutos** | NO stock photos paneles+sunset, NO robots IA, NO renders 3D futuristas, NO red+green sin alternativa accessibility, NO mezclar aspect ratios en un carrusel. |

**Anti-fabricación** ([memoria](../../.claude/memory/feedback_no_fabricated_specifics.md)): NO inventar nombres de clientes, fechas específicas, MW exacto, ni diálogos atribuidos a personas reales. Usar anclas genéricas verificables ("una planta del norte chileno", "un Asset Manager con el que conversé").

---

## 3. Los 9 Archetypes

### 3.1 `screenshot_annotated` 📷

**Qué es**: Captura real de producto Bitalize (lucvia, mantenimiento.jonadata.cloud) con 2-4 anotaciones agregadas vía sharp overlay. AI **NO regenera el UI** — solo sugiere dónde anotar.

**Cuándo usar**: BOFU `feature_kill`, MOFU `aprendizaje_cliente` cuando hay vista concreta para mostrar. Cualquier post donde el producto ES la prueba.

**Formato**: 1:1.

**Layout**:
- Screenshot centrado, espacio para anotaciones a los lados
- Max 4 anotaciones (callout boxes con flecha)
- 1 anotación de "número clave" destacado en rojo/naranja
- Logo Bitalize bottom-left

**Ejemplo Bitalize** (Lun 12 may, feature_kill "Matamos métrica"):
- Captura: `lucvia.com/demo/perdidas-priorizadas`
- Anotación 1: "❌ Métrica vieja: Fleet Availability 99%" (tachada)
- Anotación 2: "✓ Vista nueva: top pérdidas por $/día"
- Anotación 3 (rojo): "$200-400k/año en 100 MW"

**Anti-pattern**: Screenshots sin anotación (no responde pregunta). Mockups AI pixel-perfect (parecen reales pero son fabricados — Jonathan veta).

**KPI primaria**: DMs (proof real → consulta). **Secundaria**: Saves.

---

### 3.2 `dashboard_annotated` 📊

**Qué es**: Igual que `screenshot_annotated` pero con foco en UNA vista de dashboard que destaque UN insight clave (pliegue en curva, outlier, gap).

**Cuándo usar**: MOFU `aprendizaje_cliente` cuando el copy menciona un patrón observable en una vista (ej. "el AM notó un pliegue raro en la curva"). Cualquier post donde el insight está en los datos, no en producto en general.

**Formato**: 1:1 o 4:5.

**Layout**:
- Zoom a sección del dashboard (no full screen, recortado al insight)
- 1 gráfico protagonista
- Max 3 anotaciones explicativas
- Color de acento solo en el outlier/pérdida

**Ejemplo Bitalize** (Mar 13 may, aprendizaje_cliente "TRACKER respondía al ping"):
- Captura: `lucvia.com/demo/curva-potencia`
- Anotación 1 (flecha): "← Aquí: pliegue a las 3:30 PM, sin alarma"
- Anotación 2: "Drift 5-10% del ángulo óptimo"
- Anotación 3 (rojo): "SCADA dice OK. El P&L dice otra cosa."

**Anti-pattern**: Dashboards demasiado limpios sin contexto. Dashboards "todo verde" sin destacar lo importante.

**KPI primaria**: Saves (insight guardable). **Secundaria**: Comentarios técnicos.

---

### 3.3 `carousel_mini_report` 🎠

**Qué es**: Carrusel PDF estilo mini-informe técnico, 7 slides con roles narrativos fijos. Puede mezclar slides AI-generadas (conceptuales) con captures reales (en slides de método/ejemplo).

**Cuándo usar**: MOFU `demo_pequena` cuando hay un método/framework para enseñar. TOFU cuando el tema requiere desglose paso a paso.

**Formato**: 4:5, 7 slides (sweet spot validado LinkedIn 2026).

**Roles fijos**:
1. **Cover** — hook visual: 1 titular fuerte + 1 dato impactante
2. **Problem** — el problema en una frase + visual conceptual
3. **Why_matters** — por qué importa: traducción técnico → $
4. **Breakdown** — desglose técnico (puede usar capture real lucvia)
5. **Example** — ejemplo concreto / gráfico (capture real cross-plot)
6. **Framework** — framework/método propio en 3-5 pasos
7. **Cta_close** — checklist guardable + CTA conversacional

**Ejemplo Bitalize** (Jue 15 may, demo_pequena "Encoder vs irradiancia"):
- Slide 1 (AI): "Tu SCADA dice ✓. Tu P&L dice ✗. ¿Por qué?"
- Slide 2 (AI): Problema — drift silencioso de TRACKERS
- Slide 3 (AI): $200-400k/año perdidos en 100 MW
- **Slide 4 (real lucvia cross-plot)**: ejemplo del cruce encoder vs irradiancia
- **Slide 5 (real lucvia)**: framework "vista de desviación"
- Slide 6 (AI): checklist "5 preguntas que tu dashboard debe responder"
- Slide 7 (AI): CTA conversacional

**Anti-pattern**: >15 slides (completion rate cae). Mezclar aspect ratios. Slides con >280 chars de texto.

**KPI primaria**: Saves (documents = 12.92% de saves LinkedIn). **Secundaria**: Reach (3.4x vs single image).

---

### 3.4 `data_decision_flow` 🔁

**Qué es**: Diagrama de flujo dato → decisión. Muestra cómo Bitalize transforma señales en acciones.

**Cuándo usar**: TOFU/MOFU para explicar metodología sin vender producto. Posts conceptuales sobre cómo se hacen las cosas.

**Formato**: 1:1.

**Layout**:
- Flujo horizontal o circular de 4-6 bloques max
- Cada bloque: 1 verbo + micro-icono
- Flechas marcadas con la transformación
- Ejemplos típicos: `SCADA bruto → validación → evento → pérdida estimada → prioridad → acción O&M`

**Ejemplo Bitalize**:
- Bloque 1: "Datos crudos SCADA"
- Bloque 2: "Validación + agrupación"
- Bloque 3: "Pérdida estimada $/día"
- Bloque 4: "Prioridad por impacto"
- Bloque 5: "Acción focalizada"

**Anti-pattern**: Diagramas de consultoría con cajas vacías. Más de 6 bloques.

**KPI primaria**: Saves. **Secundaria**: Reach.

---

### 3.5 `before_after` ↔️

**Qué es**: Comparativa lado a lado entre dos estados — operación con/sin Bitalize, dashboard v1/v2, alarmas vs prioridades.

**Cuándo usar**: MOFU cuando hay transformación clara que mostrar. Después de un caso aplicado.

**Formato**: 1:1, split vertical 50/50.

**Layout**:
- Izquierda: estado anterior (gris, caótico, denso)
- Derecha: estado nuevo (claro, priorizado, accionable)
- Header común: "Antes / Después" o "Sin / Con [proceso]"
- 2-3 elementos comparados máximo

**Ejemplo Bitalize**:
- Antes: "300 alarmas sin criterio económico"
- Después: "5 prioridades ordenadas por $/día"

**Anti-pattern**: Comparativas falsas (no exagerar el "antes"). Más de 3 elementos por lado.

**KPI primaria**: DMs. **Secundaria**: Comentarios.

---

### 3.6 `field_photo_overlay` 📷

**Qué es**: Foto real de campo (planta solar, tracker, sala de control) con overlay textual breve.

**Cuándo usar**: TOFU `opinion_contraria_ia` cuando el post tiene anclaje en realidad de campo. Posts founder-led con experiencia de visita.

**Formato**: 1:1.

**Layout**:
- Foto ocupa 70-80% del frame
- Overlay textual: 1 frase corta + 1 stat opcional
- Logo + franja blanca en parte inferior 12%
- Ningún elemento de stock photo (sin modelo posando, sin gente de oficina, sin paneles+sunset)

**Ejemplo Bitalize** (Vie 16 may, opinion_contraria_ia "Polvo del desierto"):
- Foto: vista aérea o de campo de planta FV
- Overlay: "SCADA 99% ✓ vs Realidad 66-88%"
- Subtítulo pequeño: "Estudio EPJ Photovoltaics 2026, 2 GW"

**Anti-pattern**: Stock photos con personas posando. Renders 3D de paneles con sunset. Texto largo encima de la foto (overlay debe ser respiro, no párrafo).

**KPI primaria**: Comentarios cualitativos (foto invita a compartir). **Secundaria**: Profile visits.

---

### 3.7 `founder_proof` ✍️

**Qué es**: Pizarra, sketch, captura de Miro, esquema en cuaderno, o screenshot de decisión de producto descartada — donde se ve el proceso de pensamiento de Jonathan.

**Cuándo usar**: TOFU/MOFU para construir autoridad founder-led. Posts donde el ángulo es "esto fue lo que decidí y por qué".

**Formato**: 1:1.

**Layout**:
- Foto/captura real del artefacto
- Overlay mínimo (título + 1 frase)
- Logo bottom-left
- Aceptable que se vea "imperfecto" — eso ES el founder proof

**Ejemplo Bitalize**:
- Foto de pizarra Miro con "v1 [tachada] → v2 simplificada"
- Overlay: "Por qué eliminamos esta vista del dashboard"

**Anti-pattern**: Pizarras "limpias y posadas" (no auténticas). Renders bonitos de wireframes (parecen mockups, no decisiones reales).

**KPI primaria**: Followers nuevos (proof in public atrae seguidores). **Secundaria**: Comentarios.

---

### 3.8 `technical_report` 📋

**Qué es**: Mini-reporte tipo "engineering note" — un solo gráfico claro + nota técnica + fuente.

**Cuándo usar**: MOFU para análisis profundos, hallazgos cuantitativos, benchmarking.

**Formato**: 4:5.

**Layout**:
- Fondo claro/blanco
- Título tipo informe técnico arriba
- Gráfico simple central (1 gráfico, NO dashboard completo)
- Nota técnica breve abajo
- Fuente / supuesto explícito en pie

**Ejemplo Bitalize**:
- Título: "Impacto de backlog no priorizado en planta FV de 30 MW"
- Gráfico: barras de pérdida por categoría
- Nota: "Estimación sintética basada en SOP O&M LATAM"

**Anti-pattern**: Reportes con 5+ gráficos en un visual. Sin fuente o supuesto. Tono académico denso.

**KPI primaria**: Saves (analistas guardan). **Secundaria**: DMs de analistas.

---

### 3.9 `risk_card` 🛡️

**Qué es**: Ficha de decisión estilo insurtech adaptada a O&M FV. Ataja cada pérdida como una decisión financiera.

**Cuándo usar**: TOFU `nicho_olvidado` cuando el post identifica un mecanismo de pérdida específico. Cualquier post donde hay que "fichar" un riesgo como categoría.

**Formato**: 1:1.

**Layout** (tipo carta):
- Encabezado: nombre del riesgo
- 5 campos visibles:
  - Causa probable
  - Impacto estimado ($/año/MW)
  - Confianza del diagnóstico (alta/media/baja)
  - Acción sugerida
  - Prioridad (icono semáforo: rojo/naranja/amarillo)
- Logo bottom-left

**Ejemplo Bitalize** (Mié 14 may, nicho_olvidado "Backtracking ondulado"):
- Encabezado: "Drift de backtracking en terreno ondulado"
- Causa: "Algoritmo asume terreno plano"
- Impacto: "USD 200-400k/año en planta 100 MW"
- Confianza: Media-Alta (validado en 2 GW por EPJ Photovoltaics 2026)
- Acción: "Auditar cross-plot encoder vs irradiancia por bloque"
- Prioridad: 🟠 Alta (silencioso, recurrente)

**Anti-pattern**: Risk cards con datos fabricados. Más de 5 campos. Look genérico de tarjeta SaaS.

**KPI primaria**: Saves (fichas guardables). **Secundaria**: DMs de AMs ("¿podrían armarme una para mi planta?").

---

## 4. Matriz formato → archetype → funnel → KPI → distribución

| Archetype | Formato | Funnel target | KPI primaria | KPI secundaria | % distribución 45 días (heurística) |
|---|---|---|---|---|---|
| `screenshot_annotated` | 1:1 | MOFU / BOFU | DMs | Saves | 12% |
| `dashboard_annotated` | 1:1 / 4:5 | MOFU | Saves | Comentarios técnicos | 13% |
| `carousel_mini_report` | 4:5 (7 slides) | TOFU / MOFU | Saves | Reach | 20% |
| `data_decision_flow` | 1:1 | TOFU / MOFU | Saves | Reach | 8% |
| `before_after` | 1:1 | MOFU | DMs | Comentarios | 7% |
| `field_photo_overlay` | 1:1 | TOFU | Comentarios cualitativos | Profile visits | 10% |
| `founder_proof` | 1:1 | TOFU / MOFU | Followers nuevos | Comentarios | 15% |
| `technical_report` | 4:5 | MOFU | Saves | DMs analistas | 5% |
| `risk_card` | 1:1 | MOFU | Saves | DMs AMs | 10% |

Total = 100%. La distribución es **heurística inicial**, no contrato — ajustar tras 2-4 semanas de medir performance real.

**Cadencia recomendada**: 3-5 posts/semana (validado para B2B SaaS LinkedIn 2026). Para 45 días = ~20 posts visuales totales.

---

## 5. Mapping a estructuras editoriales (PRP-012)

Cada estructura editorial tiene un archetype "natural" recomendado:

| Estructura editorial | Archetype recomendado | Por qué |
|---|---|---|
| `feature_kill` | `screenshot_annotated` | Si matamos una feature, mostramos v1 vs v2 visualmente |
| `aprendizaje_cliente` | `dashboard_annotated` | El cliente ve un dato → necesitamos mostrar ese dato anotado |
| `nicho_olvidado` | `risk_card` | El nicho merece una ficha de decisión financiera |
| `demo_pequena` | `carousel_mini_report` | La demo del método requiere pasos visibles |
| `opinion_contraria_ia` | `field_photo_overlay` | La opinión contraria se ancla en realidad de campo |

Archetypes adicionales (oportunistas, sin mapping fijo a estructura): `before_after`, `founder_proof`, `technical_report`, `data_decision_flow`.

---

## 6. Auditor visual 10-point anti-genérico

Cada visual debe pasar al menos **9 de 10** checks (score ≥45/50) para ser publicable. Threshold:
- `score ≥ 45` → **publishable** (verde)
- `35 ≤ score < 45` → **retry_recommended** (ámbar)
- `score < 35` → **regenerate** (rojo)

**Los 10 checks (binarios, +5 cada uno)**:

1. **3-second clarity** — ¿Se entiende la idea en 3 segundos?
2. **Real FV problem** — ¿Muestra un problema FV específico (no abstracto/decorativo)?
3. **Technical element** — ¿Tiene tracker, inversor, SCADA, curva PR, panel reconocible?
4. **Quantified data** — ¿Incluye al menos 1 número concreto (MW, $, %, kWh, hr)?
5. **Single focus** — ¿Una idea principal (no múltiples compitiendo)?
6. **Mobile readable** — ¿Texto legible al 25% del tamaño en móvil?
7. **Anti-stock** — ¿NO es stock photo, robot IA, render genérico paneles+sunset?
8. **Decision-oriented** — ¿Conecta a una decisión operativa (no es decorativo)?
9. **Brand compliant** — ¿Logo bottom-left, esquina inf-der libre, paleta correcta, acentos rojo/naranja solo en riesgo?
10. **Anti-AI template** — ¿NO parece template generado por AI (anti-360Brew penalty)?

---

## 7. Anti-patrones (lista cerrada)

- ❌ Stock photos (paneles+sunset, manos+teclados, robots IA, modelos posando)
- ❌ Renders 3D futuristas, avatares, metaverso genérico
- ❌ Dashboards limpios sin contexto (no responden pregunta)
- ❌ >4 anotaciones en un visual (pierde foco)
- ❌ >4 bullets en carrusel CTA slide (saveability se diluye — regla PRP-012)
- ❌ Fabricar nombres clientes, fechas específicas, MW exacto en mockups
- ❌ Mezclar aspect ratios en un carrusel
- ❌ Texto pequeño no legible al 25% (mobile-fail)
- ❌ Red + green sin alternativa (accessibility fail)
- ❌ Anuncios "directos" tipo "compra ahora", "agenda demo" — el visual construye autoridad, no vende explícitamente
- ❌ Logos competidores visibles
- ❌ Datos sensibles de clientes reales (siempre usar datos demo)

---

## 8. Pipeline de producción

**Para archetypes con base real** (`screenshot_annotated`, `dashboard_annotated`, partes de `carousel_mini_report`):

```
1. Editor Visual UI:
   - Selecciona archetype
   - ScreenshotCaptureControl: elige URL (lucvia.com/demo/X o mantenimiento.jonadata.cloud/demo)
   - Click "Capturar via Playwright"
2. Backend:
   - POST /api/ai/capture-screenshot { url, viewport, post_id }
   - Playwright headless captura → Supabase Storage bucket visual-base-images
   - Retorna base_image_url
3. Editor: click "Componer anotaciones"
4. Backend:
   - POST /api/ai/compose-annotated
   - Vision AI analiza base_image + post context → sugiere annotations JSON
   - sharp compone overlay (no regenera UI)
   - Agrega 12% white band + logo Bitalize
   - Save final imagen
5. Auditor 10-point automático
6. Si verdict='publishable' → status='approved'; sino iterar
```

**Para archetypes AI-only** (`risk_card`, `field_photo_overlay`, `founder_proof`, `before_after`, `data_decision_flow`, `technical_report`, y porciones de `carousel_mini_report`):

```
1. Editor Visual UI:
   - Selecciona archetype
   - Plantilla JSON pre-cargada desde brand_profiles.visual_templates
2. Click "Generar con AI"
3. Backend:
   - buildArchetypePrompt(archetype, post, brand) → prompt específico
   - Gemini genera imagen
   - logo-compositor agrega franja blanca + logo
4. Auditor 10-point automático
5. Iterar si verdict != publishable
```

---

## 9. Referencias y verificación de claims

Doc basado en investigación 2025-2026 con 16 fuentes verificadas. Resumen:
- **8 claims confirmados fuerte**: founder-led 7x reach, carruseles 24.4% engagement, saves 5x likes, 360Brew anti-AI template, etc.
- **4 confirmados**: insurtech UX, digital twin layers, 60-30-10 rule, founder whiteboard format.
- **1 refinamiento**: carrusel sweet spot 7 slides (no 6-9).
- **1 matiz**: screenshots ganan SOLO si revelan slice que responde pregunta concreta.
- **2 inferencias razonables**: dashboards anotados + antes/después como patrones B2B.
- **1 corrección externa**: copy length sweet spot 1300-1900 chars (no 1500-2200) — aplica a captions de visuales también; PRP-012 follow-up.

Detalle completo en sección "Verificación de claims" del [PRP-013](../../.claude/PRPs/PRP-013-bitalize-visual-strategy.md).

---

*Esta guía evoluciona con cada campaña. Cambios documentados en commits con scope `docs(visual)`. La fuente de verdad operativa es esta guía; el código (`archetypes.ts`, `archetype-prompt-builder.ts`) implementa lo que esta guía define.*
