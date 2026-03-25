# Informe: Flujo Completo de Trabajo — Sistema de Contenido LinkedIn
## Proyecto "Marca Personal" · Bitalize / Jonathan Navarrete
### Herramientas: ChatGPT (Proyecto "Marca Personal") + Gemini (Nano Banana Pro)

---

## 1. Visión General del Sistema

Este proyecto no produce "posts sueltos". Es un **motor semanal de contenido** diseñado como mini-funnel que convierte un problema técnico del sector fotovoltaico (O&M + datos + IA) en una semana completa de publicaciones en LinkedIn, con autoridad técnica, engagement y captación de leads.

El sistema tiene dos grandes componentes:
1. **ChatGPT (Proyecto "Marca Personal")** → estrategia, copy, y producción de prompts JSON
2. **Gemini + Nano Banana Pro** → generación de imágenes a partir de los prompts JSON

El resultado final de cada semana es un **paquete completo** (copy + imagen + CTA operativo) listo para publicar de lunes a viernes.

---

## 2. Arquitectura del Flujo Semanal
```
INVESTIGACIÓN (Perplexity)
        ↓
SELECCIÓN DEL TEMA ("Enemigo Invisible")
        ↓
TESIS ÚNICA (One-liner)
        ↓
MINI-FUNNEL SEMANAL (L–M–X–J–V · TOFU/MOFU/BOFU)
        ↓
GENERACIÓN DE COPY (3 variantes · metodología D→G→P→I)
      ↕ Iteración
CONCEPTO VISUAL (3 opciones)
        ↓
PROMPT JSON (ChatGPT → brief ejecutable)
      ↕ QA + correcciones
GENERACIÓN DE IMAGEN (Gemini · Nano Banana Pro)
      ↕ Iteración (v1 → vN)
PUBLICACIÓN + CTA KEYWORD
        ↓
MÉTRICAS (48h y 7d)
        ↓
APRENDIZAJES → alimentan la semana siguiente
```

---

## 3. ETAPA 1 — Investigación profunda (Perplexity)

Los temas semanales **no nacen de la intuición**. Se originan en investigaciones profundas ejecutadas con **Perplexity**, mapeando tendencias activas del sector fotovoltaico: problemas emergentes, conversaciones en redes, fricciones operativas y prioridades de asset managers y equipos O&M.

### Criterios de selección (filtro de fit con Bitalize)
Los resultados de Perplexity se filtran con este criterio:

> *"Solo elegimos temas donde el lector pueda decir: 'mañana lo aplico en campo o lo reporto mejor' y que conviertan intuición en mini-procedimiento."*

El tema debe hacer fit con el core de Bitalize:
- O&M fotovoltaico con datos / SCADA / BI / IA
- Diagnóstico accionable
- Vínculo claro a impacto en performance y P&L

### Output de esta etapa
- **El "enemigo invisible"**: el fenómeno técnico que genera pérdidas no visibles (mismatch, curtailment mal declarado, mistracking, soiling heterogéneo, strings con underperformance, etc.)
- **Evidencia mínima**: qué señal simple puede detectar el lector en su propio SCADA
- **Recurso de conversión**: qué checklist/plantilla responde al problema

---

## 4. ETAPA 2 — Definición del tema: "Enemigo Invisible" + Tesis Única

Antes de escribir una sola línea de copy, se responden cuatro preguntas:

1. ¿Qué no se ve en SCADA o en promedios?
2. ¿Qué ejemplo de campo lo hace creíble?
3. ¿Qué señal simple puede detectar el lector?
4. ¿Qué promesa concreta tendrá el recurso?

El "enemigo invisible" define la temática de toda la semana. Luego se construye una **tesis única (one-liner)** que cierra el concepto en una frase irrefutable:

| Tema semanal | Tesis única |
|---|---|
| Mismatch | "Techo plano ≠ curtailment" |
| Curtailment | "ONLINE no es KPI" |
| PR global vs strings | "PR global OK ≠ planta sana" |

---

## 5. ETAPA 3 — Arquitectura de la semana (Mini-Funnel L–V)

Con el tema definido, se diseña la semana como una **secuencia de funnel**, no como publicaciones aisladas. Cada día tiene un rol específico:

| Día | Etapa | Objetivo |
|---|---|---|
| Lunes | TOFU / Problema | Instalar el dolor con hook contrarian + evidencia simple |
| Martes | MOFU / Problema | Profundizar en señales y diagnóstico |
| Miércoles | TOFU / Solución | Mostrar un enfoque sin vender; 1 idea accionable |
| Jueves | MOFU / Solución | Mini-método paso a paso + cómo evitar falsos positivos |
| Viernes | BOFU / Conversión | Recurso (checklist/plantilla) + CTA por keyword |

El **CTA se mantiene constante toda la semana** (misma keyword) para acumular demanda de forma progresiva.

### El "activo" de la semana (lead magnet)
Cada semana tiene un recurso accionable: checklist, plantilla, mini-diagnóstico. La entrega no se hace con un link en el cuerpo del post (LinkedIn penaliza el alcance externo), sino con un pipeline de conversión nativo:
```
Post con CTA keyword (ej: "Comenta SCADA")
        ↓
Respuesta/DM con link al formulario
        ↓
Google Forms para capturar email + contexto
        ↓
Envío automatizado del recurso (Apps Script)
```

---

## 6. ETAPA 4 — Generación de copy

### 6.1 Metodología: "Detener → Ganar → Provocar → Iniciar"

Todo el copy se produce y evalúa con esta metodología de cuatro pasos:

**DETENER**
- Objetivo: frenar el scroll con una frase que rompa un supuesto
- Herramientas: contrarian ("ONLINE no es KPI"), romper KPI, diagnóstico anti-mito
- Regla: el hook debe entenderse en 3–5 segundos

**GANAR**
- Objetivo: construir confianza y autoridad sin sonar académico
- Cómo: explicar el fenómeno con lenguaje de terreno (SCADA, MPPT, strings, trackers, PR), mostrar por qué importa en negocio, entregar 1–2 señales verificables

**PROVOCAR**
- Objetivo: generar fricción positiva, conversación y toma de postura
- Técnicas: contraste "promedio vs realidad", desafío directo, pregunta de criterio
- Regla: provocar no es pelear; es empujar a pensar con evidencia

**INICIAR**
- Objetivo: dar un siguiente paso concreto sin fricción
- CTAs típicos: keyword para comentar, guardar/compartir, mini-diagnóstico
- Regla: el CTA debe ser copiar/pegar sin placeholders ni nombres

### 6.2 Estilo de escritura (voz Bitalize / Jonathan)

| Rasgo | Descripción |
|---|---|
| Experto cercano | Rigor técnico sin jerga gratuita |
| Contrarian con evidencia | No "opinión", sino señales y criterio de diagnóstico |
| Puente técnico-financiero | Traduce alarmas a impacto en energía y P&L |
| Humano y de terreno | Historias reales anonimizadas, sin postureo |
| Frases cortas + punchlines | Legibilidad en móvil como prioridad |

**Estructura típica de un post:**
1. Hook (Detener)
2. Contexto de terreno (Ganar)
3. Señales / checklist breve (Ganar)
4. El "giro" / anti-mito (Provocar)
5. Pregunta o CTA (Iniciar)

**Reglas de forma:**
- Párrafos de 1–2 líneas
- Negritas solo para anclar ideas clave
- Números y unidades cuando corresponda (W/m², kW, % PR, $/día)
- Cero relleno: cada línea aporta o se elimina

**Lo que siempre se evita:**
- Frases vagas como "optimiza la eficiencia" sin señales concretas
- Soluciones sin evidencia
- Jerga por jerga (si un asset manager no lo entiende, se traduce)
- Cierres sin acción

### 6.3 Generación en 3 variantes + selección

Por cada post se generan **tres variantes** con enfoques distintos:

| Variante | Descripción |
|---|---|
| Narrativa | Historia de campo + tensión + personaje |
| Dato shock | Número contundente + implicancia financiera |
| Contrarian | Romper un supuesto: "X no es KPI", "Y ≠ Z" |

Luego se selecciona la ganadora y se refina con estas reglas adicionales:
- Evitar repetición de hooks dentro de la semana (rotar ángulos: evidencia, presupuesto, trazabilidad, "manual vs terreno real")
- Mantener coherencia copy-visual: si el copy habla de AM/PM, el visual debe mostrar AM/PM

---

## 7. ETAPA 5 — Concepto visual

### 7.1 Selección de formato (según intención del contenido)

La elección del formato **no es arbitraria**: la dicta la naturaleza del contenido.

| Contenido | Formato |
|---|---|
| Modelo mental / comparación única / diagrama | **Infografía 1:1** (1080×1080 px) |
| Paso a paso / 5 señales / mini SOP / secuencia educativa | **Carrusel 4:5** (1080×1350 px por slide) |
| Humanización / contexto emocional / campo | **Fotografía humanizada** |

### 7.2 Estética editorial (diferencial visual de Bitalize)

El look objetivo es **"periódico / brief técnico"**: papel, grano, jerarquía editorial, cajas y sellos, para que se sienta como evidencia auditada, no como marketing. Evolucionó durante el proyecto hacia dos líneas:

**Línea oscura (B2B data-driven):**
- Fondo navy oscuro (#020F3A)
- Tipografía alta de contraste en blanco
- Estética tech/premium

**Línea periódico moderno:**
- Fondo papel beige (#F6F1E8) con textura visible
- Jerarquía editorial fuerte (serif + sans)
- Full color con acentos de marca

### 7.3 Reglas de marca que se volvieron estándar

- **Logo Bitalize fiel al original**: nunca re-dibujado ni estilizado por el generador
- **Composición limpia**: 1 idea central por pieza, márgenes amplios
- **Legible en móvil**: texto mínimo, jerarquía clara, escaneable en 5 segundos
- **Esquina inferior derecha siempre vacía**: regla dura, sin decoración ni iconos
- **Banda blanca en la parte inferior**: 12% del alto, reservada para el logo

---

## 8. ETAPA 6 — El Prompt JSON (brief ejecutable)

### 8.1 Qué es el Prompt JSON

ChatGPT no genera la imagen directamente. En su lugar, produce un **Prompt JSON**: un brief técnico estructurado que actúa como contrato de diseño, especificando cada aspecto visual con precisión para ser ejecutado en Nano Banana Pro.

El JSON es la interfaz entre la estrategia (ChatGPT) y la generación visual (Gemini/Nano Banana Pro).

### 8.2 Estructura del Prompt JSON
```json
{
  "meta": {
    "format": "1:1",
    "platform": "linkedin",
    "dimensions": "1080x1080",
    "visual_type": "infographic",
    "funnel_stage": "MOFU",
    "objective": "..."
  },
  "brand": {
    "logo": {
      "use_logo": true,
      "placement": "bottom_left_on_white_band",
      "reference_description": "descripción exacta del logo Bitalize",
      "background_band": { "band_height_ratio": 0.12 }
    },
    "colors": {
      "primary": "#1E3A5F",
      "secondary": "#F97316",
      "accent": "#10B981",
      "text_main": "#1F2937",
      "background": "#FFFFFF"
    },
    "typography": { "title_font": "Inter Bold", "body_font": "Inter Regular" }
  },
  "layout": {
    "grid": "editorial_newspaper_grid",
    "background_style": "...",
    "empty_zone": {
      "position": "bottom-right",
      "must_remain_empty": true
    }
  },
  "content": {
    "title": "...",
    "subtitle": "...",
    "visual_elements": { "type": "...", "description": "...", "key_elements": [] },
    "cta": { "text": "Comenta LUCVIA", "placement": "lower-left_above_white_band" }
  },
  "prompt_overall": "Descripción completa del arte en un solo párrafo...",
  "negative_prompts": [
    "texto borroso o ilegible",
    "logos de competidores",
    "elementos 3D complejos",
    "estilo ecommerce/marketing genérico",
    "elementos en esquina inferior derecha"
  ],
  "style_guidelines": [
    "Mobile-first readability",
    "Un solo concepto visual por pieza",
    "Estética editorial técnica tipo periódico"
  ]
}
```

### 8.3 Por qué JSON (y no prompt de texto libre)

El JSON permite:
- **Control explícito** de layout, jerarquía, márgenes y zonas seguras
- **Versionado claro** (v1, v2, v3) para iterar sin perder el histórico
- **Reutilización** de reglas de marca entre piezas
- **Reducción de ambigüedad**: "barra horizontal con 3 categorías" es mejor que "un gráfico simple"
- **Negative prompts estructurados**: lista explícita de lo que el modelo no debe hacer

### 8.4 QA estratégico del JSON (antes de generar)

ChatGPT analiza cada JSON antes de pasarlo a Gemini y verifica:

- ¿El copy y el visual corresponden a la misma etapa del funnel (TOFU/MOFU/BOFU)?
- ¿Hay "split de mensaje" (educación + venta en la misma pieza)?
- ¿La legibilidad en móvil está garantizada?
- ¿No hay errores conceptuales en los diagramas técnicos?
- ¿El estilo se alinea con la dirección de arte de Bitalize?

---

## 9. ETAPA 7 — Generación de imagen con Gemini / Nano Banana Pro

### 9.1 Herramienta: Nano Banana Pro

**Nano Banana Pro** es el modelo de generación de imágenes usado en Gemini para renderizar las piezas visuales. Se accede directamente desde la interfaz de Gemini (Google). El JSON producido en ChatGPT se pega en el campo de prompt de Gemini para generar la imagen.

El campo `"engine": "Nano Banana Pro"` dentro del JSON especifica explícitamente qué motor de imágenes debe usarse.

### 9.2 Flujo de generación (fase por fase)

**Fase A — Definición del concepto visual**
- Define el mensaje único (1 frase, 1 promesa)
- Identifica la prueba/evidencia visual (diagrama simple, antes/después, 1 gráfico, 1 cifra)
- Regla: si la idea necesita 3 párrafos para explicarse, aún no está lista

**Fase B — Selección de formato y blueprint (wireframe)**
- Se elige formato: 1:1, 4:5 carrusel, fotografía humanizada
- Se define el blueprint con zonas: Headline → Subheadline → Módulo central (evidencia) → Bullets (máximo 4) → CTA → Branding

**Fase C — Preparación del texto (control estricto)**
- Se escriben los textos como strings exactos antes de armar el JSON
- Headline (≤10 palabras), Subheadline (1 línea), Bullets (cortos), CTA (1 línea)

**Fase D — Construcción del JSON (v1)**
- Se traduce el wireframe + reglas de marca a instrucciones ejecutables para Nano Banana Pro

**Fase E — Ejecución en Nano Banana Pro**
- Se pega el JSON en Gemini
- Se generan 1–3 variantes si el sistema lo permite

**Fase F — QA (control de calidad)**

Checklist rápido (móvil primero):

| Check | Criterio |
|---|---|
| Legibilidad | ¿Se entiende en 3 segundos en pantalla de teléfono? |
| Jerarquía | ¿Headline domina, subtítulo apoya, bullets mínimos? |
| Brand | ¿Paleta correcta, estilo consistente, sin look "genérico"? |
| Logo | ¿Fiel al original, sin deformación, posición correcta? |
| Composición | ¿Orden, aire, sin desorden visual? |
| Texto | ¿Ortografía correcta, no inventa frases? |
| Evidencia | ¿El diagrama no fabrica datos imposibles o topologías incorrectas? |
| Coherencia | ¿Copy y visual dicen exactamente lo mismo? |

**Fase G — Iteración (v2 → vN)**
- Se corrigen máximo 3–5 aspectos por ronda
- Patrones comunes: menos texto + más jerarquía, simplificar evidencia, endurecer negative prompts, corregir errores técnicos del diagrama
- Regla: iterar 1 variable por vez para saber qué causó la mejora

### 9.3 Decisión de rigor técnico

Cuando el generador falla en geometría o realismo técnico (ej: trackers mal inclinados, cables de strings entrando por el lado incorrecto del inversor), se toma una **decisión de representación**:

> *"Cambiar la representación: de 'vista dron' a 'evidencia SCADA impresa / KPI auditable'."*

Si el gráfico requiere precisión (curvas, comparativas técnicas), se genera como SVG/plot real y el generador se usa solo para el marco editorial.

---

## 10. ETAPA 8 — Publicación y operación de conversión

### 10.1 Principio: alcance nativo primero

LinkedIn penaliza los posts con enlaces externos en el cuerpo. Por eso el sistema opera con **CTAs nativos**:

- CTA con keyword (ej: "Comenta SCADA", "Comenta CURTAILMENT", "Comenta LUCVIA")
- No se incluye link en el cuerpo del post
- La entrega ocurre por DM o comentario fijado

### 10.2 Pipeline de conversión
```
Post publicado (copy + imagen + CTA keyword)
        ↓
Usuario comenta la keyword
        ↓
Respuesta manual o automatizada con link al formulario
        ↓
Google Forms: captura email + contexto del usuario
        ↓
Apps Script: envío automatizado del recurso (PDF/checklist)
        ↓
Lead registrado
```

### 10.3 Reglas operativas del CTA

- La keyword debe ser **copiar/pegar** (sin nombres ni placeholders)
- Cambia cada semana según el tema y recurso
- Se mantiene constante los 5 días para acumular demanda progresiva

---

## 11. ETAPA 9 — Medición, aprendizaje y mejora continua

### 11.1 Métricas que se miden

| Ventana | Métricas |
|---|---|
| 48 horas | Impresiones, comentarios, shares/guardados, volumen de keywords |
| 7 días | Seguidores nuevos, clicks al perfil, conversiones reales (formularios/DMs) |

### 11.2 Interpretación rápida

| Señal | Diagnóstico | Acción |
|---|---|---|
| Muchas impresiones + pocos comentarios | Hook/CTA o claridad mejorable | Iterar hook o redefinir CTA |
| Pocas views + buenos comentarios | Nicho correcto, distribución débil | Mejorar primeras líneas/visual/hora de publicación |

### 11.3 Registro y biblioteca de patrones

Los aprendizajes se guardan en fuentes del proyecto (archivos `.md`):
- Hooks ganadores, CTAs, formatos visuales y temas con su performance
- "Deltas de iteración": qué cambió y si el resultado mejoró
- La semana siguiente parte con ese conocimiento acumulado

> *"Lo que funcionó mejor fue traducirlo a 'regla auditable + recurso descargable'."*

---

## 12. Herramientas y roles en el sistema

| Herramienta | Rol en el sistema |
|---|---|
| **Perplexity** | Investigación profunda de tendencias del sector fotovoltaico |
| **ChatGPT (Proyecto "Marca Personal")** | Estrategia, copywriting, prompt JSON, QA estratégico, memoria del proyecto |
| **GPT "LinkedIn Master Content"** | GPT especializado dentro del proyecto para producción de copy y prompts |
| **Gemini** | Interfaz para ejecutar el modelo Nano Banana Pro |
| **Nano Banana Pro** | Motor de generación de imágenes (ejecutado desde Gemini) |
| **Google Forms + Apps Script** | Captación de leads y entrega automatizada de recursos |

---

## 13. Estructura de archivos del proyecto (fuentes en ChatGPT)

El proyecto mantiene una **biblioteca de aprendizajes y SOPs** en archivos `.md`:

| Archivo | Contenido |
|---|---|
| `sop_semanal_de_publicaciones_linkedin_bitalize_ingenieria_de_contexto_prp_rag.md` | SOP operativo completo del proceso semanal |
| `resumen_y_metodologia_de_trabajo_contenido_linkedin_bitalize_con_prompts_json.md` | Resumen metodológico con ejemplos de prompts JSON |
| `reporte_estrategia_semanal_mismatch_linkedin.md` | Caso real: Mismatch Week |
| `reporte_semanal_linkedin_bitalize_curtailment_feb_2026.md` | Caso real: Curtailment Week |
| `reporte_completo_semana_de_contenido_linkedin_trackers_metodologia_y_aprendizajes.md` | Caso real: Semana Trackers/Mistracking |
| `Formatos_y_Estilos_Más_Exitosos_de_Infografías_y_C.md` | Guía de formatos visuales de mayor rendimiento |

---

## 14. Errores comunes y cómo se evitan

| Error | Consecuencia | Solución |
|---|---|---|
| Demasiado texto en la imagen | Pieza ilegible en móvil | Convertir detalle en lead magnet; dejar solo lo esencial |
| Logo no fiel al original | Pérdida de confianza de marca | Reglas duras de fidelidad + descripción exacta en JSON |
| Estética inconsistente (look genérico) | Baja autoridad percibida | Definir claramente estética editorial + anti-estilos en negative prompts |
| Diagramas técnicos incorrectos | Pérdida de credibilidad ante audiencia técnica | Verificar plausibilidad física; cambiar representación si el modelo falla |
| Mezclar TOFU + BOFU en la misma pieza | El lector pasa de "me estás enseñando" a "me estás vendiendo" bruscamente | Separar etapas de funnel; 80% problema/método, 20% mención de solución |
| Repetir el mismo hook semana a semana | Audiencia se acostumbra; baja el impacto | Rotar ángulos: evidencia, presupuesto, trazabilidad, campo real |

---

## 15. Flujo completo resumido (vista operativa)
```
LUNES de cada semana
        │
        ▼
[1] INVESTIGACIÓN (Perplexity)
    Mapear tendencias fotovoltaicas → filtrar por fit Bitalize
        │
        ▼
[2] SELECCIÓN DE TEMA
    "Enemigo invisible" + Tesis única (one-liner)
        │
        ▼
[3] DISEÑO DE LA SEMANA
    Mini-funnel L–M–X–J–V (TOFU/MOFU/BOFU)
    Recurso de conversión + keyword CTA
        │
        ▼
[4] COPYWRITING (ChatGPT)
    ┌─────────────────────────────────────┐
    │  3 variantes (narrativa/shock/      │
    │  contrarian) · metodología D→G→P→I  │
    │  Iteración v1 → v2 (si aplica)      │
    └─────────────────────────────────────┘
        │
        ▼
[5] CONCEPTO VISUAL
    Elegir entre: Infografía 1:1 / Carrusel 4:5 / Foto humanizada
    Coherencia con el copy (mismas señales, mismo ángulo)
        │
        ▼
[6] PROMPT JSON (ChatGPT)
    Brief ejecutable: meta + brand + layout + content
    + style_guidelines + negative_prompts
    + QA estratégico (funnel, legibilidad, branding)
        │
        ▼
[7] GENERACIÓN DE IMAGEN (Gemini · Nano Banana Pro)
    ┌─────────────────────────────────────┐
    │  Pegar JSON → generar v1            │
    │  QA: legibilidad / marca / técnica  │
    │  Iterar JSON v2/v3 si aplica        │
    │  (máx 3–5 cambios por ronda)        │
    └─────────────────────────────────────┘
        │
        ▼
[8] PUBLICACIÓN
    Copy + imagen + CTA keyword
    Sin links externos en el cuerpo del post
        │
        ▼
[9] OPERACIÓN DE CONVERSIÓN
    Comentario → DM → Formulario → Recurso automático
        │
        ▼
[10] MÉTRICAS + APRENDIZAJES (48h y 7d)
    Registrar resultados → guardar patrones → ajustar
        │
        ▼
LUNES siguiente parte con ese conocimiento
```

---

## 16. Síntesis en una línea

> *"Elegimos un enemigo invisible + una tesis única + un recurso; lo desplegamos en 5 ángulos (funnel semanal); producimos con copy D→G→P→I + prompt JSON + Nano Banana Pro + QA; y cerramos con métricas para que la próxima semana salga más rápido y más fuerte."*

---

*Documento generado a partir del análisis del Proyecto "Marca Personal" en ChatGPT y las conversaciones asociadas en Gemini. Fecha de revisión: 24 de marzo de 2026.*