# SOP semanal de publicaciones en LinkedIn (Bitalize)

> **Propósito:** documentar el procedimiento **repetible** que hemos usado en este proyecto para crear publicaciones semanales (copy + visual + CTA + entrega de lead magnet), con un ciclo iterativo de mejora basado en métricas.

---

## 0) Resultado esperado (qué significa “hecho”)

Una semana de publicaciones queda “hecha” cuando:

- Existe un **plan semanal (lunes–viernes)** con objetivo por etapa del funnel.
- Cada post tiene:
  - copy final (aprobado),
  - visual final (aprobado) con **relación de aspecto correcta**,
  - CTA (palabra clave) y flujo de entrega del recurso,
  - respuestas tipo para comentarios frecuentes.
- Se registran métricas (48h y 7d) + aprendizajes en un log.
- Se actualiza la “biblioteca” (copys, prompts JSON, piezas ganadoras, checklists).

---

# 1) Contexto general (Ingeniería de Contexto)

## 1.1 Contexto de negocio

- **Marca:** Bitalize.
- **Oferta:** mejora de performance y operación en activos fotovoltaicos mediante datos (SCADA/BI/IA).
- **Objetivo de LinkedIn:** crecimiento orgánico + autoridad técnica + captación de leads mediante recursos (checklists/plantillas/guías) con CTA “Comenta: PALABRA”.

## 1.2 Buyer persona (resumen operativo)

- O&M / Asset Management / EPC / TA (perfiles técnicos y de gestión).
- Dolor: “la planta parece OK” pero hay **pérdidas silenciosas** sin alarmas claras.
- Busca: diagnóstico accionable + justificación de O&M con evidencia + priorización inteligente.

## 1.3 Principio editorial del proyecto

**Marketing técnico con evidencia:**

- Un post vale si el lector puede decir: *“mañana lo aplico en campo o lo puedo reportar mejor”*.
- El diferencial es convertir una intuición (“esto afecta”) en un **mini-procedimiento** (“mido/registro/decido/valido”).

---

# 2) Proceso iterativo para construir contexto (los 10 pasos)

A continuación está el proceso tal como lo ejecutamos semanalmente, mapeado al framework de ingeniería de contexto.

## 2.1 Requisitos brutos (Raw Requirements)

Entradas típicas:

- Tema técnico de la semana (ej. albedo decay / desbroce / instrumentación POA rear).
- Objetivo del día (alcance vs nutrición vs conversión; problema vs solución).
- Recurso/lead magnet (ej. “Albedo Checklist 10 min”).

**Salida:** en 3–5 líneas: *qué quiero que pase* + *qué acción quiero del lector*.

## 2.2 Diseño del contexto (Context Design)

Preguntas que resolvemos antes de escribir:

- ¿Cuál es el “enemigo invisible” del post? (lo que no se ve en SCADA o en promedios)
- ¿Qué ejemplo de campo/realidad lo vuelve creíble?
- ¿Qué señal simple puede detectar el lector?
- ¿Cuál es la promesa concreta del recurso?

**Salida:** 1 frase de “idea central” + 3 puntos de evidencia.

## 2.3 Estructura del contexto (Context Structure)

Organizamos el post como:

- Hook → Problema → Señal/Evidencia → Solución → CTA.

**Salida:** outline de 5 bloques (sin redactar aún).

## 2.4 Implementación de PRP (Product Requirement Prompt)

Creamos un PRP reutilizable (plantilla) para que la IA entregue:

- 3 variantes de copy (Narrativa / Dato shock / Contrarian),
- 3 conceptos visuales,
- prompt JSON para el diseño,
- checklist QA y plan de iteración.

(Ver PRP en la sección 5.)

## 2.5 Validación del contexto (Context Validation)

Antes de generar la pieza, validamos:

- ¿Hay coherencia entre copy y lo que *sí puede mostrar* el visual?
- ¿La promesa del recurso es concreta y creíble?
- ¿Hay riesgo de repetir el mismo ángulo que el día anterior?

## 2.6 Respuesta de la IA (AI Response)

- La IA entrega copy + concepto visual + prompt JSON (v1).

## 2.7 Evaluación del resultado (Outcome Evaluation)

Checklist rápido:

- ¿Se entiende en 5 segundos?
- ¿Se puede aplicar sin herramientas raras?
- ¿El CTA es simple?
- ¿El diseño será legible en móvil?

## 2.8 Punto de decisión crítico (Critical Decision Point)

Si el resultado no es bueno:

- no reiniciamos desde cero,
- afinamos **solo** el contexto que falló (hook, concepto visual, o reglas del prompt).

## 2.9 Refinamiento del contexto (Context Refinement)

Refinamos con correcciones dirigidas, máximo 3–5 por iteración:

- menos texto, más jerarquía,
- un gráfico más simple,
- reglas más estrictas (aspect ratio, ubicación de logo, etc.).

## 2.10 Despliegue del contexto (Context Deployment)

Cuando una pieza funciona:

- se guarda como **patrón** (copy + estructura + prompt JSON),
- se incorpora a biblioteca para acelerar semanas futuras.

---

# 3) Capas de contexto aplicadas al flujo de contenido

## 3.1 System Context Layer

Define “cómo piensa” la IA en este proyecto:

- rol: estratega de marketing técnico FV + editor + director de arte.
- tono: directo, cercano, sin exceso de jerga.
- enfoque: valor práctico, evidencia, claridad.

## 3.2 Domain Context Layer

Conocimiento base del dominio FV:

- conceptos: albedo, bifacial gain, POA front/rear, vegetación/humedad, riesgo operacional.
- realidad O&M: presupuesto, accesos, seguridad, incendios, puntos calientes, trazabilidad para asset manager.

## 3.3 Task Context Layer

Qué tarea se hace en cada día:

- escribir copy con objetivo del día,
- definir CTA y entrega de recurso,
- generar visual (infografía/carrusel) con reglas de marca.

## 3.4 Interaction Context Layer

Cómo iteramos:

- generamos 3 variantes → elegimos 1 → mejoramos.
- revisamos imagen generada → anotamos fortalezas/debilidades → ajustamos prompt.

## 3.5 Response Context Layer

Formato de salida estándar:

- Copy (final) + CTA.
- Concepto visual ganador.
- Prompt JSON listo para generador de imágenes.
- Checklist QA (máximo 8 checks).

---

# 4) Procedimiento semanal (lunes a viernes)

> Este proyecto trabaja por **tema semanal** y rota objetivos por día para mover el funnel.

## 4.1 Calendario editorial base

- **Lunes — Alcance (problema):** instalar el dolor con evidencia de campo.
- **Martes — Nutrición (problema):** profundizar la causa (trampas / errores típicos / instrumentación).
- **Miércoles — Alcance (solución):** introducir el enfoque correcto (cambio de paradigma).
- **Jueves — Nutrición (solución):** mini SOP / procedimiento aplicable.
- **Viernes — Conversión:** recurso + CTA fuerte (lead magnet) y cierre de semana.

> Nota de formato: **infografías y carruseles de Bitalize suelen ser 1:1** salvo que se pida explícitamente otra relación (ej. 4:5).

## 4.2 Ritual diario (SOP por post)

### Paso A — Objetivo del día (2 minutos)

- Funnel stage + (problema/solución) + acción esperada.

### Paso B — Copy v1 (10–15 minutos)

- Generar 3 variantes:
  1. Narrativa,
  2. Dato de shock,
  3. Contrarian.
- Elegir la mejor según: claridad + aplicabilidad + potencial de conversación.

### Paso C — Concepto visual (5–10 minutos)

- Elegir 1 de 3 formatos:
  - Infografía técnica (1:1),
  - Carrusel (4:5),
  - Foto humanizada.
- Regla práctica: si hay “pasos”, gana carrusel; si hay “modelo mental”, gana infografía.

### Paso D — Prompt JSON (v1)

- Definir layout, jerarquía, iconografía, estilo (periódico/educativo), y reglas negativas.

### Paso E — Generación + QA

- Revisar legibilidad móvil.
- Revisar fidelidad del recurso si aparece “preview real” (sin inventar texto).
- Ajustar prompt → v2.

### Paso F — Publicación + operación

- Publicar.
- Responder comentarios (tono cercano).
- Enviar lead magnet a quien comente palabra clave.

### Paso G — Registro

- Guardar copy final + prompt final + pieza final.
- Métricas a 48h y 7d.
- 3 aprendizajes: qué funcionó / qué no / qué probar.

---

# 5) PRP reutilizable (Product Requirement Prompt) para construir un post

## 5.1 PRP — Entrada (lo que se le entrega a la IA)

**Business Context**

- Marca, audiencia, objetivo del funnel, recurso a entregar.

**Stakeholder Analysis**

- Usuario primario: O&M / Asset Manager.
- Decisor: Asset Manager / Owner.
- Restricciones: legibilidad móvil, tono cercano, rigor técnico.

**Requirement Extraction**

- Qué idea central + qué evidencia.
- Qué señal simple + qué “acción”.
- CTA + palabra clave.

**Technical Translation**

- Si aplica: qué métricas o señales se mencionan (sin sobrecargar).

**Specification Output**

- 3 copys, 3 conceptos visuales, 1 seleccionado mejorado.
- Prompt JSON final.
- Checklist QA.

**Validation Framework**

- ¿Es entendible en 5 segundos?
- ¿Tiene aplicabilidad en terreno?
- ¿El visual representa fielmente lo prometido?

## 5.2 PRP — Plantilla (lista para copiar/pegar)

```text
[Objetivo del día]
- Funnel: (alcance/nutrición/conversión)
- Ángulo: (problema/solución)
- Acción: (comentar X / guardar / compartir / DM)

[Tema técnico de la semana]
- Fenómeno: …
- Error común: …
- Señal simple: …
- Mini-solución: …

[Recurso / Lead magnet]
- Nombre: …
- Promesa concreta (1 línea): …
- CTA keyword: …

[Restricciones]
- Tono cercano, sin jerga innecesaria
- Visual: 1:1 (salvo indicación)
- Branding: logo Bitalize abajo-izq, esquina abajo-der libre
- Estética: periódico/educativo (papel + tipografía editorial)

[Entrega]
1) 3 variantes de copy (narrativa / shock / contrarian)
2) Selección + copy final mejorado
3) 3 conceptos visuales + selección
4) Prompt JSON (v1) + checklist QA
```

---

# 6) RAG: cómo incorporamos conocimiento “vivo” (docs, assets, analytics)

## 6.1 Fuentes típicas de recuperación

- Biblioteca de prompts JSON y reglas de marca.
- Plantillas de carruseles/infografías.
- Analytics de LinkedIn por post (impressions, reactions, comments, shares, clicks, seguidores, etc.).
- Recursos entregables (PDF checklist) para asegurar **fidelidad** en previews.

## 6.2 Flujo RAG (operativo)

1. Recuperar lo relevante (tema/estilo/reglas/ejemplos).
2. Resumir “lo que no se puede olvidar” (constraints).
3. Generar salida.
4. Validar con QA.

## 6.3 Reglas de fidelidad (importante)

- Si el visual incluye “preview real” de un PDF, debe:
  - usar captura fiel (sin reescribir texto),
  - evitar texto inventado o ilegible,
  - priorizar “miniatura” y no intentar re-render completo si la IA distorsiona.

---

# 7) Diseño visual: reglas del proyecto

## 7.1 Formatos

- **Infografía:** 1:1 (cuadrada) por defecto.
- **Carrusel:** 4:5 cuando el objetivo es “paso a paso” (mini SOP) o “5 señales”.

## 7.2 Estética editorial (periódico/anuncio)

- Fondo: papel periódico (grain sutil, manchas suaves, bordes ligeramente imperfectos).
- Tipografía: serif editorial para titulares + sans/serif legible para cuerpo.
- Jerarquía: 1 gran titular + 1 subtítulo + 3–5 bloques máximos.

## 7.3 Iconografía “meme educativo”

- Íconos grandes, simples, coloridos (no infantiles), estilo sticker/educativo.
- Siempre al servicio de la idea (no decoración).

## 7.4 Branding

- Logo Bitalize visible.
- Mantener zona inferior derecha libre cuando aplique.

---

# 8) Operación de conversión (lead magnet)

## 8.1 CTA estándar

- “Comenta **ALBEDO** y te lo envío (PDF)”.

## 8.2 Mensaje DM para entrega

- 1 línea de agradecimiento.
- 1 línea de contexto (para qué sirve).
- Link / formulario.
- Cierre: “si te cuesta aplicarlo, dime qué planta/tipo de problema”.

## 8.3 Manejo de comentarios (guía rápida)

- Humor (ovejas/pastoreo): validar la idea y sumar “condiciones y costos reales” sin pelear.
- Ambiental: reconocer biodiversidad/impacto, enfatizar control responsable (no “dejar pelado”).
- Técnico: agradecer y pedir ejemplo (“¿cómo lo miden hoy?”).

---

# 9) Medición y evaluación semanal

## 9.1 Qué miramos a 48h

- Impresiones (alcance).
- Comentarios (conversación y señales de dolor real).
- Shares/guardados (valor percibido).
- CTA: cuántos comentan la keyword.

## 9.2 Qué miramos a 7 días

- Seguidores nuevos.
- Perfil visit / clicks si está disponible.
- Conversión real (formularios completados / DMs respondidos).

## 9.3 Interpretación rápida

- Mucha impresión + pocos comentarios → hook/CTA mejorables o tema muy “broadcast”.
- Pocos views pero buenos comentarios → nicho correcto; mejorar distribución (horario/primeras líneas/visual).
- Muchos comentarios de broma → el post es “memético”, falta amarrar valor técnico con claridad.

---

# 10) Errores comunes y soluciones

- **Demasiado técnico:** bajar jerga, subir ejemplos de terreno.
- **Repetición de hook en la semana:** rotar ángulo (instrumentación / riesgo operativo / presupuesto / trazabilidad).
- **Visual no refleja el copy:** simplificar el mensaje o cambiar formato (infografía → carrusel).
- **Aspect ratio equivocado:** bloquear la regla en el prompt (1:1 por defecto).
- **Preview de PDF “inventado”:** usar miniatura real (captura) o reemplazar por “mock” claramente etiquetado.

---

# Anexos

## A) Checklist QA (antes de publicar)

- **Copy (contenido)**

- **CTA + funnel**

- **Visual (diseño)**

- **Fidelidad y rigor**

- **Operación (comentarios y seguimiento)**

## B) Registro semanal (plantilla)

- Tema de la semana:
- Recurso/keyword:
- Lunes:
- Martes:
- Miércoles:
- Jueves:
- Viernes:
- Mejor post (por qué):
- Peor post (por qué):
- 3 aprendizajes:
- 3 experimentos próxima semana:

