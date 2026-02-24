# Reporte completo del trabajo realizado en este chat

## 1) Resumen ejecutivo
Durante este chat construimos y operamos una **mini‑campaña de contenido LinkedIn** para Bitalize enfocada en **mismatch/mistracking en sistemas de trackers**, con un enfoque de funnel:
- **Alcance:** instalar el “problema invisible” (tracker “online” ≠ precisión).
- **Nutrición:** entregar una **rutina SCADA** para detectar desvíos >2° sin sensores nuevos, y demostrar persistencia.
- **Conversión:** capturar leads con comentario **“TRACKER”** y entregar un **recurso (Checklist Tracker SCADA)** vía formulario + automatización de envío.

En paralelo, dejamos una base reutilizable de **metodología de copy + prompts JSON + control de calidad visual** (estilo editorial/periódico) para ejecutar semanas temáticas repetibles.

> Nota: Parte de los aprendizajes y estructura base de campaña ya estaban consolidados en el reporte semanal anterior de “Curtailment”, que usamos como referencia de método y funnel. fileciteturn20file7

---

## 2) Objetivos y lógica de funnel
### 2.1 Objetivo de negocio
Generar conversaciones calificadas con equipos de **O&M / Asset Managers** y convertirlas en:
- Solicitudes del recurso (Checklist),
- Acceso a extractos SCADA,
- Oportunidades de análisis avanzado / ranking de energía recuperable (Bitalize).

### 2.2 Objetivo editorial
Elevar la conversación desde **“estado online”** (presencia) hacia **“precisión + persistencia”** (impacto energético recuperable).

### 2.3 Mensaje rector
**“ONLINE no es KPI.”**
Si no mides **minutos fuera de tolerancia + racha máxima + frecuencia**, no estás midiendo desempeño.

---

## 3) Entregables producidos en el chat

### 3.1 Copy (posts y variantes)
- Variantes de copy por estilo: **Narrativa**, **Dato de shock**, **Contrarian/Provocador**.
- Ajustes para MOFU (nutrición): menos “shock” y más **rutina accionable**.
- Iteraciones para evitar repetición (ej. no reiterar “6–8°” y usar el umbral operacional **>2°**).
- Refinamientos de lenguaje (ej. evitar palabra “pico”).

### 3.2 Sistema visual (prompts JSON)
- Construcción de estilo **editorial/periódico** (papel, grano, pliegues, líneas de imprenta, jerarquía tipográfica).
- Ajustes de formato:
  - Carrusel: **4:5**.
  - Post estático: **1:1**.
- Reglas de marca:
  - Logo Bitalize **fiel al original** (no reinterpretar).
  - Esquina inferior derecha **libre solo donde aparece la chapa/ícono del generador** (restricción acotada).
  - Tipografía consistente (títulos con serif editorial / cuerpo con sans legible o serif secundaria coherente).
- Cambio de estrategia visual por problema reiterado:
  - La representación aérea de “mistracking” inducía **inclinaciones indebidas** en trackers.
  - Se migró a evidencia SCADA/infografía (“mistracking probado por datos”) en vez de “mistracking visto desde dron”.

### 3.3 Lead magnet y operación (conversión)
- Recurso: **Checklist Tracker SCADA** (rutina 10–15 min + señales rápidas + filtros).
- Formulario de captura + banner del header.
- Mensajes DM para quienes comentan “TRACKER” + enlace al formulario.
- Apps Script (Google Forms) para envío automático por email:
  - Se actualizó el link del PDF.
  - Plantilla de correo HTML + plain text.
  - Control anti-duplicados por responseId.

---

## 4) Metodología implementada (copy + visual + operación)

### 4.1 Framework de copy (estructura repetible)
**A. Hook (detener scroll)**
- Un hecho técnico o tensión: “ONLINE no mide precisión”, “>2° sostenido te cuesta energía”.

**B. Reframe (dar claridad)**
- Cambiar el KPI mental: de “estado” a “desempeño medible”.

**C. Método (pasos accionables)**
- Rutina corta, numerada, ejecutable con SCADA existente.

**D. Cierre (conversión)**
- CTA con palabra clave (TRACKER) + promesa clara del recurso.

**E. Pregunta final (interacción)**
- Una pregunta que invite caso real (“¿mides online o minutos fuera de tolerancia?”).

### 4.2 Cadencia semanal (alcance → nutrición → conversión)
- **Día 1 (Alcance):** instalar “pérdida invisible” y el error común.
- **Día 2 (Nutrición):** método y evidencia (sin sensores nuevos).
- **Día 3 (Conversión):** recurso + oferta de ayuda (Bitalize analiza extracto SCADA / rankea recuperable).

### 4.3 Método de producción visual (prompting + QA)
**Regla 1: Una idea por pieza.**
- Titular único + 2 columnas máximo.

**Regla 2: Control estricto de texto.**
- Texto “exact match” o se reduce/omite el bloque.

**Regla 3: Visual “meme educativo” (evidencia + metáfora).**
- Comparativo “lo que dice el SCADA” vs “lo que importa”.

**Regla 4: Marca y legibilidad primero.**
- Logo fiel + jerarquía + espaciado + consistencia tipográfica.

**Regla 5: Si el generador falla en geometría técnica, cambia de representación.**
- Lo que pasó con trackers inclinados: se resolvió cambiando el enfoque visual.

---

## 5) Hallazgos y aprendizajes (semana)

### 5.1 Aprendizajes de contenido (mensaje)
1) **El dolor que engancha no es “mistracking”: es “KPIs que mienten”.**
2) En B2B técnico, **la credibilidad sube** cuando entregas:
   - criterios, umbrales, persistencia, filtros de día correcto,
   - y un camino auditable.
3) Repetir grados “6–8°” cansa; en nutrición funciona mejor:
   - un umbral operacional (p.ej. **>2°**) + persistencia (racha/minutos) + comparación con pares.

### 5.2 Aprendizajes de visual (diseño)
1) El estilo **periódico** funciona cuando:
   - el papel ocupa el 100% del slide,
   - hay textura realista y márgenes editoriales,
   - y jerarquía clara (titular enorme + sub + módulo visual).
2) “Solo texto” baja el scroll‑stop. Mejor:
   - un “recorte” de SCADA impreso,
   - un gráfico simple,
   - sellos/estampas (“PATRÓN”, “PRESENCIA ≠ PRECISIÓN”).
3) **Logo**: si el generador lo “reinventa”, se pierde confianza.

### 5.3 Aprendizajes de operación (conversión)
1) CTA por palabra (“TRACKER”) + DM + Form + Email automatizado = **pipeline simple**.
2) El mensaje DM debe:
   - ser corto,
   - decir qué recibe y en cuánto tiempo,
   - y dar opción de “si quieres, revisamos tu SCADA con Bitalize”.

---

## 6) Recomendaciones concretas para mejorar publicaciones futuras

### 6.1 Copy (más fuerte)
- Abrir con un hecho cuantificable (sin sobreprometer):
  - “Si tu tracker pasa X minutos fuera de tolerancia, no es ‘online’: es energía recuperable.”
- Mantener método en 4 pasos máximo.
- Cerrar con CTA + 1 frase de oferta:
  - “Bitalize puede rankear bloques por energía recuperable con tu extracto SCADA.”

### 6.2 Visual (más efectivo)
- Para posts estáticos 1:1:
  - **Titular + 2 columnas + CTA**.
  - 1 gráfico simple o recorte “SCADA impreso”.
- Para carrusel 4:5:
  - Slide 1 = titular (scroll‑stop),
  - Slide 2–6 = método (1 idea/slide),
  - Slide 7 = KPI recomendado,
  - Slide 8 = CTA + recurso.

### 6.3 QA antes de publicar (check rápido)
- ¿El papel cubre el 100%?
- ¿Solo 1 idea central?
- ¿Logo fiel?
- ¿Tipografías consistentes?
- ¿Texto sin palabras prohibidas (“pico”) y sin errores?
- ¿CTA visible en 1 línea?

---

## 7) Templates reutilizables

### 7.1 Copy template (MOFU – solución)
1) **Hook:** “ONLINE no es KPI.”
2) **Reframe:** “Mide precisión: minutos fuera de tolerancia + racha + frecuencia.”
3) **Método 4 pasos:** día correcto, error, persistencia, cuantificación vs pares.
4) **Cierre:** “Comenta TRACKER y te envío la rutina.”

### 7.2 Visual template (editorial/periódico)
- Header: “O&M BRIEF • TRACKERS” + “PÉRDIDA INVISIBLE”
- Titular: 6–9 palabras máximo.
- Sub: 1 línea.
- Cuerpo: 2 columnas (izquierda evidencia, derecha KPI real).
- CTA: 1 línea bold.
- Footer: marca + nota breve.

---

## 8) Próximos pasos sugeridos (para la próxima semana)
1) Estandarizar 2 estilos visuales:
   - “SCADA impreso” (evidencia)
   - “KPI real” (métrica)
2) A/B test de CTA:
   - “Comenta TRACKER” vs “Comenta TRACKER y te envío el checklist + plantilla”.
3) Agregar un mini‑caso (anónimo):
   - “Bloque B07: 97 min >2°, racha 55 min, frecuencia 3/día”.
4) En conversión (viernes): ofrecer **diagnóstico express**:
   - “Si me mandas extracto 1 día, te devuelvo ranking por energía recuperable”.

---

## Cierre
El resultado más valioso de la semana fue convertir un tema técnico (mismatch en trackers) en:
- una regla simple,
- un KPI defendible,
- un recurso descargable,
- y un sistema operativo completo (post → comentario → DM → form → email).

