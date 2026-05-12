# Resumen del chat y aprendizajes

Este proyecto se centró en **crear contenido educativo y de conversión para LinkedIn** sobre **pérdidas “invisibles” en plantas fotovoltaicas** (sin alarmas SCADA), específicamente:

- **Soiling heterogéneo** (micro-zonas: camino de tierra, muro rompe-viento, zona de aves, humedad post-lluvia).
- **Backtracking y sombreado entre trackers** (pérdidas AM/PM, topografía real vs modelo ideal, GCR efectivo, ajustes slope-aware).
- **Señales en datos SCADA** para detectar problemas: dispersión de strings, MPPTs desbalanceados, valles AM/PM bajo cielo despejado, diferencias por zona plana vs pendiente, patrones repetidos en trackers “gemelos”.

El trabajo evolucionó desde **infografías 1:1** a **carruseles 4:5**, y también a **piezas de conversión** con CTA tipo “Comenta ‘BACKTRACKING’ / ‘TOOLKIT’” para entregar recursos (plantilla/guía/checklist).

---

# Principales aprendizajes (técnicos + marketing)

## 1) Aprendizajes técnicos (PV / SCADA)

- Una **curva ideal** de potencia para **trackers** no es “campana puntiaguda” típica de fixed-tilt: debe verse como **“campana achatada”** (rampa AM, **meseta** en horas de mayor irradiancia, rampa PM).
- Para comparar **zona plana vs zona inclinada** cuando hay backtracking desalineado, la señal esperada es:
  - **Curva de zona plana por encima de la curva de zona pendiente durante todo el día** (misma forma general, nivel inferior en pendiente).
  - Evitar gráficas donde las curvas se crucen si el mensaje es “pendiente rinde menos”.
- El backtracking “por defecto” suele asumir **terreno ideal** (planitud, pitch/GCR homogéneos). En terreno real:
  - Puede quedar **sub-rotado** (sombra residual entre filas) o **sobre-rotado** (pierde irradiancia útil por girar de más).
  - Las pérdidas se concentran en **amanecer/atardecer** y se **diluyen** en promedios diarios.

## 2) Aprendizajes de marketing (LinkedIn)

- El contenido funciona mejor cuando está **alineado 1:1 entre copy y visual**: si el copy habla de “micro-topografía” y “AM/PM”, la infografía debe mostrar exactamente eso.
- Evitar repetición de hooks (“tu planta está en verde…”) rotando ángulos:
  - “Lo que el promedio no puede ver”, “la huella en el borde del día”, “señales sin alarma”, “el manual vs el terreno real”, etc.
- Para conversión, el mejor patrón fue:
  - **Promesa concreta** (auditar backtracking con SCADA)
  - **Señales específicas** (5 señales)
  - **Recurso inmediato** (checklist/guía/plantilla)
  - **CTA simple** (palabra clave en comentarios)

---

# Metodología de trabajo que usamos (copy + diseño + prompt JSON)

Este proyecto siguió un ciclo iterativo “**Copy → Concepto visual → Prompt JSON → Generación → Crítica → Iteración**”.

## 1) Definición del objetivo por etapa del funnel

- **Alcance (TOFU):** instalar el fenómeno (“pérdidas silenciosas”, “patrones AM/PM”, “manual vs realidad”).
- **Nutrición (MOFU):** enseñar el “cómo se detecta” con señales concretas en datos SCADA.
- **Conversión (BOFU):** ofrecer recurso accionable (guía/plantilla/checklist), con CTA directo.

## 2) Diseño de copy por variantes

Para cada post, se generaron y compararon 3 estilos:

- **Narrativa pura** (metáforas + técnica)
- **Dato de shock** (cifra + urgencia)
- **Contrarian/provocador** (cuestionar supuestos: “no necesitas sensor…”)

Luego se eligió el mejor y se mejoró evitando repetición de hooks.

## 3) Selección del concepto visual

Se compararon 3 formatos recurrentes:

- **Carrusel PDF (4:5):** ideal para “5 señales” o “paso a paso”.
- **Infografía técnica (1:1):** ideal para “mapa mental / árbol de señales / proceso”.
- **Fotografía humanizada:** buena para autoridad, pero menos didáctica.

## 4) Producción visual con prompts JSON

Se trabajó con prompts JSON como “brief estructurado” para generadores de imagen, definiendo:

- **layout** (zonas, jerarquía, márgenes)
- **estética** (infografía estilo periódico / Canva)
- **paleta** y tipografías
- **gráficas** con reglas físicas estrictas (especialmente para trackers)
- **branding** (logo Bitalize + esquina inferior derecha libre)
- **negative prompts** para evitar errores (cruces de curvas, textos largos, tipografía pequeña, etc.)

## 5) QA (control de calidad) + retroalimentación

En cada iteración se evaluó:

- ¿Cumple **aspect ratio** (1:1 o 4:5) realmente?
- ¿La **curva** representa un tracker (meseta central)?
- ¿La comparación “plana vs pendiente” está correcta (plana siempre por sobre pendiente)?
- ¿Legibilidad móvil? (tamaño de texto, número de líneas, grosor de trazos)
- ¿Alineación copy-visual? (mismos conceptos, mismas señales)
- ¿Branding y reglas de composición? (logo y esquina inferior derecha libre)

---

# Procedimiento documentable (SOP) para replicar esta forma de trabajo

## SOP — “Contenido LinkedIn Bitalize con prompts JSON”

### Paso 0 — Preparar insumos

- Tema (pérdida invisible): soiling / backtracking / mismatch / etc.
- Público objetivo: O&M / Asset Management / EPC
- Objetivo del post: Alcance / Nutrición / Conversión
- Recurso/CTA: plantilla, guía, checklist, palabra clave en comentarios

**Salida:** 1 párrafo de objetivo + 1 frase CTA + keyword

---

### Paso 1 — Esqueleto del post (copy)

1) Hook (1–2 líneas)
2) Problema (qué ocurre y cuándo)
3) Evidencia/Señales (3–5 bullets)
4) Interpretación (por qué el promedio lo oculta)
5) Pregunta o CTA (comentarios)

Generar 3 variantes:
- Narrativa / Dato / Contrarian

**Salida:** 3 copys + selección + versión final mejorada

---

### Paso 2 — Elegir formato visual

Elegir 1:
- 4:5 Carrusel (si hay “pasos” o “5 señales”)
- 1:1 Infografía (si hay “mapa/proceso/diagrama único”)
- Foto humanizada (si prima autoridad)

**Salida:** 1 concepto ganador + lista de elementos visuales obligatorios

---

### Paso 3 — Blueprint de layout

Definir zonas del diseño (wireframe):
- Header editorial
- Cajas: PROBLEMA / SÍNTOMAS / IMPACTO / GUÍA
- Visual central (planta/diagrama)
- CTA inferior

Reglas de legibilidad:
- máximo 2 líneas por caja explicativa
- gráficos con trazos gruesos y labels grandes
- márgenes de seguridad 6–8%

**Salida:** Descripción de layout por zonas

---

### Paso 4 — Prompt JSON (v1)

Construir JSON con:
- subject (mensaje + must_include)
- layout (aspect_ratio real + resolución)
- style (periódico/Canva, paleta, tipografía)
- data_viz_rules (reglas físicas para curvas)
- branding (logo y esquina inferior derecha libre)
- negative_prompt

**Salida:** JSON v1 listo para generar

---

### Paso 5 — Generación y QA

Revisar la imagen generada con checklist:

**Checklist Visual QA**
- [ ] Aspect ratio correcto
- [ ] Jerarquía clara en móvil
- [ ] Curva tracker con meseta central
- [ ] Comparativa plana vs pendiente: plana arriba todo el día
- [ ] Texto sin errores ortográficos
- [ ] Logo Bitalize correcto + esquina inf derecha libre
- [ ] Alineación con el copy

**Salida:** lista de correcciones (máx 5) + prioridad

---

### Paso 6 — Iteración (JSON v2 → vN)

Actualizar JSON:
- reforzar reglas físicas
- agrandar micrográficas
- reducir texto
- mejorar márgenes y contraste

**Salida:** JSON final aprobado

---

### Paso 7 — Publicación y captura de aprendizaje

Documentar:
- Copy final
- Creativo final
- Resultado (impresiones, comentarios, conversiones)
- Aprendizaje (qué funcionó / qué falló)

**Salida:** ficha de post (1 página)

---

# Plantillas rápidas para documentación

## A) Ficha de post (1 página)

- Fecha / Funnel:
- Tema técnico:
- Audiencia:
- Objetivo:
- Keyword CTA:
- Copy final:
- Formato creativo: 1:1 / 4:5
- JSON final (link o bloque):
- Checklist QA (OK / ajustes):
- Métricas (48h y 7 días):
- Aprendizaje:

## B) Registro de iteraciones (control de calidad)

- v1: qué salió mal
- v2: corrección aplicada
- v3: corrección aplicada
- Decisión final: por qué se aprueba

---

# Nota final

El diferenciador de este proyecto fue **hacer marketing técnico** sin perder precisión: cada afirmación del copy debía tener un correlato visual **físicamente correcto** (curvas, comparativas de zonas, señales AM/PM). Los prompts JSON se usaron como “contrato” de diseño: layout + estilo + reglas técnicas + QA.

