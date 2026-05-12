# Features — LinkedIn ContentOps (Bitalize) MVP

> **Fecha**: 2026-02-23
> **Fuente**: requerimiento §4–§6 + metodología de copy

---

## 1. Autenticación y Workspace

### US-A1: Login/Signup
**Como** usuario, **quiero** registrarme e iniciar sesión **para** acceder al workspace.
- **AC**: Supabase Email/Password funcional; redirect a dashboard tras login.

### US-A2: Workspace con roles
**Como** admin, **quiero** gestionar miembros y roles **para** controlar accesos.
- **AC**: Puedo invitar usuarios y asignar rol (admin/editor/collaborator).
- **AC**: Cada rol tiene permisos diferenciados (ver §2 del requerimiento).

---

## 2. Research (Perplexity Ingest)

### US-R1: Crear Research Report
**Como** editor, **quiero** crear un Research Report pegando texto o subiendo archivo **para** guardar fuentes y tendencias.
- **AC**: Puedo crear report con título + texto libre (o upload .txt/.md).
- **AC**: Report se guarda con autor y timestamp.
- **AC**: Puedo editar el report después de crearlo.

### US-R2: Tagging de Research
**Como** editor, **quiero** agregar tags a un research **para** categorizarlo.
- **AC**: Tags disponibles: tema, dolor, buyer persona, geografía, urgencia.
- **AC**: Tags son chips con autocompletado.
- **AC**: Puedo filtrar la lista de research por tags.

### US-R3: Derivar temas desde Research
**Como** admin, **quiero** convertir un research en temas del backlog **para** alimentar el pipeline.
- **AC**: Desde la vista detalle, botón "Derivar Tema" pre-llena formulario de topic.
- **AC**: El topic queda asociado al research de origen.

---

## 3. Topic Backlog

### US-T1: CRUD de Temas
**Como** editor, **quiero** gestionar un backlog de temas **para** planificar campañas.
- **AC**: Formulario: título, hipótesis, evidencias, anti-mito, señales, fit score (0-10), prioridad (alta/media/baja), status (idea/validado/usado).
- **AC**: Vista tabla con sorting y filtros por status, prioridad, fit score.

### US-T2: Selección de "enemigo silencioso"
**Como** admin, **quiero** marcar un tema como "enemigo silencioso de la semana" **para** crear la campaña.
- **AC**: Campo `is_selected` o status especial.
- **AC**: Solo un tema activo a la vez por workspace.

---

## 4. Campaign Builder

### US-C1: Crear Campaña Semanal
**Como** admin, **quiero** crear una campaña desde un tema **para** planificar la semana.
- **AC**: Formulario: semana (fecha lunes), topic (selector), keyword CTA, recurso, buyer persona, objetivo.
- **AC**: Al crear, se generan automáticamente 5 posts (L-V) con funnel stage asignado.

### US-C2: Plan L-V Editable
**Como** editor, **quiero** ver y editar el plan semanal **para** ajustar la secuencia.
- **AC**: Vista grid 5 columnas (L-M-X-J-V).
- **AC**: Cada card muestra: día, funnel stage, objetivo, status del post.
- **AC**: Puedo cambiar el funnel stage y objetivo de cada día.

### US-C3: Asignación automática TOFU/MOFU/BOFU
**Como** sistema, al crear campaña **debo** asignar el funnel stage por defecto.
- **AC**: Lunes = TOFU/Problema, Martes = MOFU/Problema, Miércoles = TOFU/Solución, Jueves = MOFU/Solución, Viernes = BOFU/Conversión.
- **AC**: El usuario puede override manualmente.

### US-C4: Estados de Campaña
**Como** admin, **quiero** mover la campaña por estados **para** trackear progreso.
- **AC**: Estados: Draft → In Progress → Ready → Published → Archived.
- **AC**: Solo admin puede mover a Published.

---

## 5. Post Editor (Copy)

### US-P1: Generar 3 Variantes
**Como** editor, **quiero** generar 3 variantes de copy por día **para** comparar y elegir la mejor.
- **AC**: Variantes: Contrarian / Historia de terreno / Data-driven.
- **AC**: Cada variante se guarda como `post_version`.
- **AC**: Puedo "Set as Current" en la variante elegida.

### US-P2: Generación AI de Copy
**Como** editor, **quiero** que la AI genere las variantes **para** acelerar la producción.
- **AC**: Input: tema + context de campaña + funnel stage.
- **AC**: La AI sigue la metodología D/G/P/I y el estilo Bitalize.
- **AC**: Output: 3 variantes con estructura Hook → Contexto → Señales → Giro → CTA.

### US-P3: Rubrica D/G/P/I
**Como** admin/editor, **quiero** calificar cada variante con la rubrica **para** evaluar calidad.
- **AC**: 4 criterios, cada uno 0-5:
  - **Detener**: hook claro, contrarian, entendible en 3-5s.
  - **Ganar**: evidencia + señales + impacto negocio.
  - **Provocar**: pregunta/anti-mito que activa conversación.
  - **Iniciar**: CTA concreto, sin fricción, sin link externo.
- **AC**: Score total automático (0-20).
- **AC**: Notas por criterio.
- **AC**: Score se guarda en `score_json`.

### US-P4: Editor con Validaciones
**Como** editor, **quiero** un editor con reglas en vivo **para** mantener calidad.
- **AC**: Alerta si hay link externo en el cuerpo del post.
- **AC**: Alerta si CTA no contiene la keyword de la campaña.
- **AC**: Alerta si párrafos > 2 líneas.
- **AC**: Contador de caracteres.
- **AC**: Preview "mobile LinkedIn" (ancho fijo).

### US-P5: Estados del Post
**Como** editor, **quiero** mover el post por estados **para** gestionar el flujo de aprobación.
- **AC**: Draft → Review → Approved → Published.
- **AC**: Solo admin/editor puede aprobar.
- **AC**: Historial de cambios de estado con autor + timestamp.

### US-P6: Versionado de Copy
**Como** editor, **quiero** ver el historial de versiones **para** auditar cambios.
- **AC**: Timeline de versiones con diff visual.
- **AC**: Puedo revertir a una versión anterior ("Set as Current").

### US-P7: Iteración con Feedback
**Como** editor, **quiero** iterar el copy con feedback **para** mejorar sin reescribir.
- **AC**: Botón "Iterar" + textarea de feedback.
- **AC**: AI genera nueva versión incorporando el feedback.
- **AC**: Nueva versión se guarda como `post_version`.

---

## 6. Visual Generator (JSON → Nano Banana Pro)

### US-V1: Generar JSON desde Copy Aprobado
**Como** editor, **quiero** generar un prompt JSON **para** crear la visual en Nano Banana Pro.
- **AC**: JSON incluye: formato (1:1 default), layout, estilo editorial, tipografías, elementos de marca, negative prompts.
- **AC**: JSON se asocia al post.

### US-V2: Editor JSON con Validación
**Como** editor, **quiero** editar el JSON directamente **para** ajustar detalles.
- **AC**: Editor con syntax highlighting.
- **AC**: Validación de estructura en vivo.
- **AC**: Preview formateada ("visual brief").

### US-V3: Iterar JSON con Feedback
**Como** editor, **quiero** iterar el JSON con 3-5 cambios **para** refinar la visual.
- **AC**: Input: JSON actual + feedback textual.
- **AC**: Output: nueva versión del JSON.
- **AC**: Historial con diff semántico (resumen del cambio).

### US-V4: Subir Imagen + QA
**Como** editor, **quiero** subir la imagen generada y pasarla por QA **para** asegurar calidad.
- **AC**: Upload de imagen (drag & drop o file picker).
- **AC**: Checklist QA:
  - [ ] Formato correcto (1:1 o 4:5)
  - [ ] Estilo editorial consistente
  - [ ] Texto mínimo y legible en móvil
  - [ ] Logo fiel y bien integrado
- **AC**: Estado: Pending QA → Approved.

---

## 7. Conversión (Keyword + CTA)

### US-K1: Gestión de Keyword
**Como** admin, **quiero** definir la keyword CTA por campaña **para** activar la conversión.
- **AC**: Keyword se asocia a la campaña.
- **AC**: Keyword se muestra en el post editor como referencia.

### US-K2: Registro de Recurso
**Como** admin, **quiero** registrar el recurso de la semana **para** entregarlo al lead.
- **AC**: Formulario: tipo (checklist/plantilla/form), URL (Drive/Form), descripción.
- **AC**: Recurso asociado a la campaña.

### US-K3: Templates DM/Comentario
**Como** editor, **quiero** crear templates de DM copiar/pegar **para** responder rápido.
- **AC**: Templates sin placeholders que el humano tenga que editar.
- **AC**: Variables automáticas: {{keyword}}, {{recurso_nombre}}.
- **AC**: Preview del mensaje final + botón copiar.

---

## 8. Export "Campaign Pack"

### US-E1: Exportar Pack Completo
**Como** editor, **quiero** exportar la campaña como ZIP **para** tener todo listo para publicar.
- **AC**: Contenido del ZIP:
  - `copy.md` — posts L-V aprobados
  - `visual_prompts/` — un JSON por post
  - `checklist_publicacion.md` — checklist operativo
  - `links.md` — recursos, forms, keywords, DM templates
- **AC**: Preview antes de descargar.
- **AC**: Alertas si falta contenido (posts sin aprobar, etc.).

---

## 9. Métricas + Aprendizajes

### US-M1: Registrar Métricas
**Como** admin, **quiero** registrar métricas por post **para** medir performance.
- **AC**: Campos: impresiones, comentarios, guardados, shares, leads, notas.
- **AC**: Input manual.

### US-M2: Resumen Semanal
**Como** admin, **quiero** ver un resumen de la semana **para** evaluar la campaña.
- **AC**: Totales y promedios.
- **AC**: Gráfico simple de performance por día.
- **AC**: Comparación con semanas anteriores (si existen datos).

### US-M3: Weekly Learnings
**Como** admin, **quiero** registrar aprendizajes semanales **para** mejorar el proceso.
- **AC**: Editor de 3-5 bullets: hook, visual, CTA, fricción, oportunidades.
- **AC**: Aprendizajes consultables por campaña.

---

## NO MVP (explícitamente excluido)

- Publicación automática a LinkedIn
- Generación automática de imágenes (Nano Banana Pro no expone API)
- Integración directa Perplexity API
- Analytics automático / atribución
- Notificaciones push/email
- Multi-idioma
- App móvil nativa
- Scoring AI automático (solo manual en MVP)
- Templates de campañas reutilizables
- Calendario editorial drag & drop
- Colaboración en tiempo real (comentarios en posts)
