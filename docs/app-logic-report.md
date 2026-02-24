# LinkedIn ContentOps — Reporte de Logica de la Aplicacion

> **Fecha**: 2026-02-24
> **Version**: 1.0
> **Proposito**: Auditar el flujo de funcionamiento de la app desde el punto de vista del usuario y mapear el proceso completo de creacion de contenido en LinkedIn.

---

## 1. Vision General

LinkedIn ContentOps (Bitalize) es una herramienta interna de operaciones de contenido para LinkedIn, especializada en el sector de **O&M fotovoltaico** (operaciones y mantenimiento de plantas solares). La app sistematiza todo el ciclo de vida de creacion de contenido profesional en LinkedIn, desde la investigacion hasta la publicacion y analisis de metricas.

### Pipeline Completo

```
Research → Topics → Campaigns → Posts (Copy AI) → Visuals (JSON AI) → Conversion → Export → Metrics
```

### Stack Tecnologico

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Backend | Supabase (Auth + PostgreSQL + RLS + Storage) |
| AI Engine | Vercel AI SDK v5 + OpenRouter (Google Gemini 2.0 Flash) |
| Estilos | Tailwind CSS + shadcn/ui |
| Estado | Zustand |
| Validacion | Zod (runtime + compile-time) |
| Package Manager | pnpm |

---

## 2. Arquitectura de Rutas (24 rutas)

```
/                           → Redirect a /dashboard
/login                      → Login con email/password
/signup                     → Registro de nueva cuenta
/check-email                → Confirmacion de email enviado
/forgot-password            → Recuperacion de contrasena
/update-password            → Establecer nueva contrasena

/dashboard                  → Hub principal con estadisticas
/research                   → Lista de investigaciones
/research/new               → Crear nueva investigacion
/research/[id]              → Detalle de investigacion
/topics                     → Lista de temas
/topics/new                 → Crear nuevo tema
/campaigns                  → Lista de campanas
/campaigns/new              → Crear nueva campana
/campaigns/[id]             → Campaign Builder (vista semanal)
/campaigns/[id]/posts/[day] → Editor de post + AI Copy
/campaigns/[id]/visuals/[day] → Editor de visual JSON + AI
/campaigns/[id]/conversion  → Panel de conversion (recurso + templates)
/campaigns/[id]/export      → Export Pack (ZIP)
/campaigns/[id]/metrics     → Metricas + aprendizajes

/api/ai/generate-copy       → Genera 3 variantes de copy con AI
/api/ai/iterate             → Itera copy con feedback + AI
/api/ai/generate-visual-json → Genera JSON visual para Nano Banana Pro
/api/ai/iterate-visual      → Itera prompt visual con feedback + AI
```

---

## 3. Flujo de Autenticacion

### 3.1 Registro de Usuario

```
Usuario → /signup → Formulario (email + password)
  → Supabase Auth crea cuenta
  → Redirige a /check-email
  → Usuario confirma email via link
  → Puede hacer login
```

### 3.2 Login

```
Usuario → /login → Formulario (email + password)
  → Supabase Auth valida credenciales
  → Crea sesion en cookies
  → Middleware detecta sesion
  → Redirige a /dashboard
```

### 3.3 Middleware de Proteccion

El middleware (`src/middleware.ts`) intercepta **todas** las peticiones:

- **Rutas publicas** (sin auth): `/login`, `/signup`, `/check-email`, `/forgot-password`, `/update-password`
- **Rutas protegidas** (requieren auth): todo lo demas
- **Si no hay sesion** y ruta protegida → redirige a `/login`
- **Si hay sesion** y ruta publica → redirige a `/dashboard`

### 3.4 Workspace Auto-Creacion

Al primer acceso autenticado, el sistema crea automaticamente:
1. Un **workspace** "Mi Workspace" en la tabla `workspaces`
2. Una **membresia admin** en `workspace_members`

Todas las queries posteriores filtran datos por `workspace_id`, habilitando multi-tenancy.

---

## 4. Dashboard — Hub Central

**Ruta**: `/dashboard`

### Que ve el usuario

1. **Saludo personalizado**: "Buenos dias/tardes/noches, {nombre}"
2. **4 tarjetas de estadisticas** (queries paralelas a Supabase):
   - Campanas activas (status draft o in_progress)
   - Posts en borrador (status draft)
   - Score promedio D/G/P/I (0-20)
   - Pipeline: Research → Topics → Campaigns → Posts → Export
3. **Acciones rapidas** (4 botones):
   - Nueva Investigacion → `/research/new`
   - Nuevo Tema → `/topics/new`
   - Nueva Campana → `/campaigns/new`
   - Ver Campanas → `/campaigns`
4. **Campanas recientes** (3 ultimas con estado y keyword)

---

## 5. Fase 1: Research — Recopilacion de Informacion

**Ruta**: `/research`

### Proposito
Capturar informacion cruda: articulos, notas, datos de mercado, fuentes externas relevantes para el sector fotovoltaico.

### Modelo de Datos

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| title | text | Titulo de la investigacion |
| source | text (null) | URL o nombre de la fuente |
| raw_text | text | Contenido crudo (min 10 chars) |
| tags_json | string[] | Tags para categorizar |
| created_by | UUID | Usuario que la creo |

### Flujo del Usuario

```
1. /research → Lista con busqueda + filtro por tags
2. Click "Nuevo Research" → /research/new
3. Llenar formulario:
   - Titulo (requerido)
   - Fuente (opcional — URL o nombre)
   - Texto crudo (requerido, min 10 caracteres)
   - Tags (autocomplete de tags existentes en workspace)
4. Guardar → createResearchAction
   - Auth → Zod validate → Insert DB → Track evento → Revalidate
5. Redirige a /research
6. Click en card → /research/[id] → Vista detalle completa
7. Desde detalle, 3 acciones:
   a) "Derivar Tema" → /topics/new?from_research={id}
   b) "Editar" → Formulario de edicion
   c) "Eliminar" → Confirmacion modal → Delete
```

### Funcionalidades
- Busqueda full-text (titulo, texto, fuente)
- Filtro por tags (logica AND — debe tener TODOS los tags seleccionados)
- Autocomplete de tags existentes en el workspace
- Vista grid responsiva (1/2/3 columnas)
- Preview de 150 caracteres en cada card

---

## 6. Fase 2: Topics — Curaduria de Temas

**Ruta**: `/topics`

### Proposito
Transformar informacion cruda (Research) en **temas accionables** para LinkedIn: hipotesis a desafiar, mitos a derribar, senales de mercado.

### Modelo de Datos

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| title | text | Titulo del tema |
| hypothesis | text (null) | "Que creencia quieres desafiar?" |
| evidence | text (null) | "Datos/hechos que soportan tu posicion" |
| anti_myth | text (null) | "Mito que vas a derribar" |
| signals_json | string[] | Senales de mercado (preguntas, tendencias) |
| fit_score | number (null) | 0-10, que tan bien encaja con la audiencia |
| priority | enum | low / medium / high |
| status | enum | backlog / selected / used / archived |

### Pipeline Research → Topics

```
1. En /research/[id], click "Derivar Tema"
2. Navega a /topics/new?from_research={research_id}
3. El servidor obtiene el research y pre-llena:
   - title = research.title
   - evidence = research.raw_text (primeros 500 chars)
4. Usuario completa:
   - Hipotesis ("El polvo reduce la eficiencia mas de lo que crees")
   - Anti-Mito ("Limpiar cada mes es siempre rentable")
   - Senales de mercado
   - Fit Score (0-10)
   - Prioridad (baja/media/alta)
5. Status por defecto: "backlog"
```

### Flujo del Usuario

```
1. /topics → Lista con busqueda + filtros (status + prioridad)
2. Vista dual:
   - Desktop: Tabla con columnas (titulo, fit score, prioridad, status)
   - Mobile: Cards compactas con badges
3. Cambio rapido de status via dropdown en la fila (sin modal)
4. Workflow de status: backlog → selected → used → archived
5. Fit Score color-coded: <=3 rojo, 4-6 amarillo, 7+ verde
6. Click "Nuevo Tema" → /topics/new → Formulario completo
```

### Funcionalidades
- Busqueda en titulo, hipotesis, evidencia, anti-mito
- Filtro por status (4 estados)
- Filtro por prioridad (3 niveles)
- Cambio rapido de status (dropdown inline)
- Badges color-coded para score, prioridad y status

---

## 7. Fase 3: Campaigns — Planificacion Semanal

**Ruta**: `/campaigns`

### Proposito
Crear campanas semanales de 5 posts (Lunes a Viernes) con asignacion automatica de etapas del embudo de conversion.

### WEEKLY_PLAN — El Modelo de Embudo

| Dia | Etapa | Logica |
|-----|-------|--------|
| Lunes | TOFU Problema | Awareness: establecer el problema |
| Martes | MOFU Problema | Consideration: profundizar en el dolor |
| Miercoles | TOFU Solucion | Awareness: mostrar alternativas |
| Jueves | MOFU Solucion | Consideration: mejores practicas |
| Viernes | BOFU Conversion | Decision: CTA directo para convertir |

Este modelo crea un **arco narrativo semanal**: Problema → Solucion → Conversion.

### Modelo de Datos

**Campaign**:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| topic_id | UUID (null) | Tema asociado (de Topics) |
| week_start | date | Fecha de inicio de semana |
| keyword | text (null) | Keyword CTA (ej: "SCADA", "ALBEDO") |
| resource_json | JSONB | Config de conversion (recurso + templates) |
| audience_json | JSONB | Datos de audiencia |
| status | enum | draft / in_progress / ready / published / archived |

### Creacion de Campana (Auto-Generacion de Posts)

```
1. /campaigns/new → Formulario:
   - Fecha de inicio (requerido)
   - Tema asociado (dropdown de topics, opcional)
   - Keyword CTA (opcional)
   - Info: "Se generaran 5 posts (L-V) con asignacion TOFU/MOFU/BOFU"
2. Submit → createCampaignWithPosts():
   a) Inserta campana con status='draft'
   b) Auto-genera 5 posts (uno por dia):
      - dia 1 → funnel_stage: 'tofu_problem'
      - dia 2 → funnel_stage: 'mofu_problem'
      - dia 3 → funnel_stage: 'tofu_solution'
      - dia 4 → funnel_stage: 'mofu_solution'
      - dia 5 → funnel_stage: 'bofu_conversion'
   c) Cada post: status='draft'
3. Redirige a /campaigns
```

### Campaign Builder (Vista Semanal)

**Ruta**: `/campaigns/[id]`

```
+------------------------------------------------------------------+
| Semana 24/02/2026 | Tema: SCADA | #KEYWORD | Status: En Progreso |
| [Conversion] [Metricas] [Export]                                  |
+------------------------------------------------------------------+
| Lunes      | Martes     | Miercoles  | Jueves     | Viernes     |
| TOFU Prob  | MOFU Prob  | TOFU Sol   | MOFU Sol   | BOFU Conv   |
|            |            |            |            |              |
| Status:    | Status:    | Status:    | Status:    | Status:      |
| Borrador   | Aprobado   | En review  | Borrador   | Borrador     |
|            |            |            |            |              |
| Objetivo:  | Objetivo:  | Objetivo:  | Objetivo:  | Objetivo:    |
| "Mostrar   | "Profun... | "Presen... | "Best pr...| "CTA para...|
|  el probl."|            |            |            |              |
|            |            |            |            |              |
| [Copy]     | [Copy]     | [Copy]     | [Copy]     | [Copy]       |
| [Visual]   | [Visual]   | [Visual]   | [Visual]   | [Visual]     |
+------------------------------------------------------------------+
| Leyenda: TOFU (azul) | MOFU (morado) | BOFU (verde)             |
+------------------------------------------------------------------+
```

Cada columna (DayColumn) muestra:
- Dia + etapa del embudo (badge color-coded)
- Status del post (badge)
- Objetivo del post (3 lineas max)
- Boton "Copy" → abre PostEditor
- Boton "Visual" → abre VisualEditor

---

## 8. Fase 4: Post Editor — Copy AI + Rubrica D/G/P/I

**Ruta**: `/campaigns/[id]/posts/[day]`

### Proposito
Editar el copy de cada post con asistencia AI, evaluar con la rubrica D/G/P/I, y gestionar versiones.

### Layout del Editor

```
+------------------------------------------+---------------------------+
| EDITOR (2/3)                             | SIDEBAR (1/3, sticky)     |
|                                          |                           |
| [< Volver] Dia + Etapa + Keyword        | Status: [Dropdown]        |
|                                          |                           |
| Objetivo: [Input auto-save on blur]     | --- RUBRICA D/G/P/I ---   |
|                                          | D - Detener    [0-5] ■■■  |
| [Contrarian] [Historia] [Data-driven]   | G - Ganar      [0-5] ■■   |
|                                          | P - Provocar   [0-5] ■■■■ |
| +--------------------------------------+| I - Iniciar    [0-5] ■■■  |
| | Textarea (12 filas, max 3000 chars) ||                           |
| | ...contenido del post...             || TOTAL: 16/20 ●           |
| +--------------------------------------+| Notas: [Textarea]         |
|                                          | [Guardar Score]           |
| Reglas:                                  |                           |
| ✓ Sin link externo                      | --- TIMELINE ---           |
| ✓ Keyword presente                      | v3 - Contrarian ★18/20   |
| ✗ Parrafos cortos (>3 lineas)          |   "Tu IA no esta..."      |
|                                          |   [Actual]                |
| Caracteres: 2847 / 3000                 |                           |
|                                          | v2 - Historia ★14/20     |
| [Guardar Version] [Generar con AI]      |   "El ano pasado..."      |
|                                          |   [Usar esta]             |
| --- Panel de Iteracion ---               |                           |
| Feedback: [Textarea]                     | v1 - Data-driven          |
| [Iterar con AI]                          |   "El 73% de plantas..."  |
|                                          |   [Usar esta]             |
+------------------------------------------+---------------------------+
```

### Metodologia D/G/P/I

La rubrica evalua cada post en 4 dimensiones (0-5 cada una, total 0-20):

| Dimension | Pregunta | Que evalua |
|-----------|----------|------------|
| **D — Detener** | "Detiene el scroll?" | Hook inicial, sorpresa, dato contra-intuitivo |
| **G — Ganar** | "Gana la atencion?" | Valor real, perspectiva unica, insight no obvio |
| **P — Provocar** | "Provoca reaccion?" | Emocion o intelecto que genera comentarios |
| **I — Iniciar** | "Inicia conversacion?" | CTA claro que invita a la accion |

**Escala de color**:
- Verde: >= 16/20 (excelente)
- Amarillo: 10-15/20 (mejorable)
- Rojo: < 10/20 (requiere reescritura)

### Generacion AI de Copy

**Endpoint**: `POST /api/ai/generate-copy`

1. Usuario hace click en "Generar con AI"
2. Envia al endpoint:
   - topic (del tema asociado)
   - keyword (de la campana)
   - funnel_stage (del dia)
   - objective (si fue definido)
3. AI (Google Gemini 2.0 Flash via OpenRouter) genera **3 variantes**:

| Variante | Estilo | Ejemplo de Hook |
|----------|--------|-----------------|
| **Contrarian** | Posicion opuesta a creencia popular | "Creen que los paneles bifaciales son mas eficientes, pero..." |
| **Historia** | Narrativa real o realista, primera persona | "El ano pasado, nuestro cliente perdio 15% de generacion por..." |
| **Data-driven** | Estadisticas y datos especificos | "El 73% de plantas solares no optimizan su albedo..." |

4. Cada variante se guarda como `PostVersion` con `is_current=true`
5. UI muestra las 3 tabs para comparar

**Reglas de formato que sigue la AI**:
- Max 3000 caracteres
- Parrafos cortos (2-3 lineas max)
- Espacio entre parrafos
- NO links externos en el cuerpo
- CTA al final antes de hashtags
- Max 3-4 emojis
- 3-5 hashtags relevantes

### Iteracion AI de Copy

**Endpoint**: `POST /api/ai/iterate`

```
1. Usuario escribe feedback: "El hook no es suficientemente provocador"
2. Envia: contenido actual + feedback + variante + scores opcionales
3. AI devuelve:
   - content: version mejorada
   - hook: nuevo hook
   - cta: nuevo CTA
   - changes_made: ["Mejore el hook", "Acorte parrafos"]
4. Preview en recuadro azul con lista de cambios
5. Click "Usar esta version" → guarda como nueva PostVersion
```

### Control de Versiones

- Cada guardado crea una **nueva PostVersion** (v1, v2, v3...)
- Solo una version es `is_current=true` por post a la vez
- Timeline lateral muestra todas las versiones con:
  - Numero de version
  - Variante (badge)
  - Score (si fue evaluada)
  - Preview (100 chars)
  - Boton "Usar esta" para revertir
- Historial completo preservado (nunca se borra)

### Reglas de Validacion en Tiempo Real

El editor valida mientras se escribe:
- **Sin link externo**: Detecta http/https en el contenido
- **Keyword presente**: Si la campana tiene keyword, debe aparecer en el post
- **Parrafos cortos**: Advierte si hay parrafos de mas de 3 lineas

---

## 9. Fase 5: Visual Editor — JSON para Nano Banana Pro

**Ruta**: `/campaigns/[id]/visuals/[day]`

### Proposito
Generar un brief visual estructurado (JSON) que un disenador usa en Nano Banana Pro para crear la imagen del post.

### Brand Rules (Bitalize)

| Aspecto | Regla |
|---------|-------|
| Color primario | #1E3A5F (confianza, profesionalismo) |
| Color secundario | #F97316 (energia, innovacion) |
| Color acento | #10B981 (sostenibilidad, crecimiento) |
| Tipografia | Inter, sans-serif, moderna |
| Logo | Esquina inferior derecha, max 15% ancho |
| Estilo | Editorial + fotografia profesional |
| Mood | Tecnico pero accesible, innovador, sostenible |

### Formatos Disponibles

| Formato | Dimensiones | Uso |
|---------|-------------|-----|
| 1:1 | 1080x1080 | Feed (default) |
| 4:5 | 1080x1350 | Carrusel vertical |
| 16:9 | 1200x675 | Articulos/wide |
| 9:16 | 1080x1920 | Stories |

### Estructura del JSON Visual

```json
{
  "scene": {
    "description": "Planta solar al atardecer con overlay tecnico",
    "mood": "Profesional e innovador",
    "setting": "Centro de operaciones moderno"
  },
  "composition": {
    "layout": "Regla de tercios con datos a la izquierda",
    "focal_point": "Grafico de rendimiento mostrando anomalia",
    "text_placement": "Tercio inferior con espacio para respirar"
  },
  "text_overlay": {
    "headline": "Tu SCADA no miente — tus datos si",
    "subheadline": "Como las lecturas sucias arruinan tus modelos AI",
    "cta_text": "Verifica la calidad de tus datos ahora"
  },
  "style": {
    "aesthetic": "Editorial + infografia tecnica",
    "color_palette": ["#1E3A5F", "#F97316", "#10B981"],
    "photography_style": "Documental + mockups de UI nitidos",
    "lighting": "Luz natural + overhead suave"
  },
  "brand": {
    "logo_placement": "Esquina inferior derecha, 10% ancho",
    "brand_colors_used": ["#1E3A5F", "#F97316"],
    "typography_notes": "Inter Bold 48px titulo, Medium 24px subtitulo"
  },
  "technical": {
    "format": "1:1 (1080x1080px)",
    "dimensions": "1080x1080 pixeles, alta resolucion",
    "resolution_notes": "Minimo 300dpi, texto nitido en mobile"
  },
  "negative_prompts": [
    "Texto borroso", "Logos de competidores",
    "Imagenes pixeladas", "Colores neon"
  ]
}
```

### Estrategia Visual por Etapa del Embudo

| Etapa | Enfoque Visual |
|-------|---------------|
| TOFU Problema | Impacto visual, gran escala, naranja/verde vibrante |
| MOFU Problema | Infografias, graficos de rendimiento, azul dominante |
| TOFU Solucion | Diagramas de metodologia, pasos, tomas de solucion |
| MOFU Solucion | Mejores practicas, casos de estudio, mejoras |
| BOFU Conversion | Metricas de exito, testimonios, los 3 colores de marca |

### Flujo del Usuario

```
1. Desde CampaignBuilder, click "Visual" en un dia
2. /campaigns/[id]/visuals/[day] → VisualEditor
3. Seleccionar formato (1:1 default)
4. Opcion A: Editar JSON manualmente
   - Textarea monospace con validacion en tiempo real
   - Badge "JSON valido" o error de parseo
5. Opcion B: Generar con AI
   - Instrucciones opcionales
   - Click "Generar Prompt Visual"
   - POST /api/ai/generate-visual-json
   - JSON generado aparece en editor
6. Opcion C: Iterar con AI
   - Escribir feedback sobre JSON existente
   - POST /api/ai/iterate-visual
   - Preview de cambios realizados
   - "Aplicar Cambios" → actualiza DB
7. Subir imagen (URL de Supabase Storage)
   - Status cambia a pending_qa
8. Completar QA Checklist (9 items):
   - Formato correcto
   - Resolucion adecuada
   - Estilo editorial profesional
   - Colores de marca aplicados
   - Tono visual coherente
   - Texto legible sin errores
   - Jerarquia visual clara
   - Logo presente y bien ubicado
   - Sin elementos de negative prompts
9. Si todos pasan → status = approved automaticamente
```

---

## 10. Fase 6: Conversion — Keyword, Recurso y Templates

**Ruta**: `/campaigns/[id]/conversion`

### Proposito
Configurar la estrategia de conversion: que keyword CTA usan los posts, que recurso se ofrece al lector que responde, y que templates de respuesta (DM/comentarios) se usan.

### Modelo de Conversion

```
Post con CTA → Lector comenta "#KEYWORD" →
  → Respuesta automatizada con Template →
  → Entrega del Recurso (PDF, video, etc.)
```

### Tres Secciones del Panel

**1. Keyword CTA** (solo lectura)
- Muestra el `#KEYWORD` de la campana
- Explicacion: "Esta keyword es el CTA en tus posts. Los lectores la comentan o envian por DM para recibir el recurso."

**2. Recurso de Conversion** (formulario editable)
- Tipo: pdf / video / webinar / ebook / tool / other
- Nombre: "Guia SCADA 2024"
- URL: link de Drive, formulario, etc.
- Descripcion: breve explicacion del recurso
- Se guarda en `campaigns.resource_json`

**3. Templates DM / Comentario** (CRUD)
- 3 templates por defecto:
  - **DM Inicial**: "Hola {{nombre}}, gracias por tu interes en {{keyword}}! Aqui tienes: {{recurso_nombre}} — {{recurso_url}}"
  - **Respuesta Comentario**: "Gracias por comentar {{keyword}}! Te envio el recurso por DM."
  - **Follow-up**: "Hola {{nombre}}, te comparti {{recurso_nombre}} sobre {{keyword}}. Te fue util?"
- Variables disponibles: `{{keyword}}`, `{{nombre}}`, `{{recurso_nombre}}`, `{{recurso_url}}`
- Toggle Raw/Preview para ver template renderizado con valores reales
- Boton copiar al portapapeles (version renderizada)
- Agregar/eliminar templates custom

---

## 11. Fase 7: Export Pack — Descarga ZIP

**Ruta**: `/campaigns/[id]/export`

### Proposito
Generar un paquete descargable con todo lo necesario para publicar la campana de la semana.

### Checklist Pre-Publicacion

| Item | Severidad | Criterio |
|------|-----------|----------|
| Posts aprobados | Requerido | Todos los posts status = approved o published |
| Keyword definida | Recomendado | campaign.keyword no es null |
| Recurso registrado | Recomendado | resource_json tiene recurso |
| Templates configurados | Recomendado | resource_json tiene templates |
| Imagenes con QA | Recomendado | Todos los visuals status = approved |

### Estructura del ZIP

```
campaign-pack-2026-02-24.zip
├── copy.md                          # Posts + scores por dia
│   ├── ## Lunes — TOFU Problema
│   │   └── Contenido + Score: 18/20
│   ├── ## Martes — MOFU Problema
│   │   └── Contenido + Score: 16/20
│   └── ...
│
├── visual_prompts/                  # JSONs para Nano Banana Pro
│   ├── dia-1-tofu-problem-v1.json
│   ├── dia-2-mofu-problem-v1.json
│   └── ...
│
├── checklist_publicacion.md         # Estado de preparacion
│   ├── ## Requeridos
│   │   └── [x] Todos los posts aprobados
│   └── ## Recomendados
│       ├── [x] Keyword definida
│       └── [ ] Imagenes con QA aprobado
│
└── links.md                         # Recurso + templates renderizados
    ├── ## Keyword CTA
    ├── ## Recurso de Conversion
    └── ## Templates de Respuesta
```

### Flujo del Usuario

```
1. /campaigns/[id]/export → Carga datos del pack
2. Ve checklist con items pendientes (amarillo) o listos (verde)
3. Preview de 4 cards:
   - copy.md: N posts con contenido
   - visual_prompts/: N archivos JSON
   - checklist: X% completado
   - links.md: keyword + recurso
4. Si faltan items requeridos → puede exportar igual con advertencia
5. Click "Descargar Campaign Pack (.zip)"
6. JSZip genera ZIP en cliente (sin server)
7. Descarga automatica con nombre sanitizado
```

### Seguridad en Nombres de Archivo
- `sanitizeFilename()`: lowercase, solo alfanumericos y guiones
- Previene inyeccion de headers HTTP en Content-Disposition
- Ejemplo: "Dia 1 — TOFU Problema" → "dia-1-tofu-problema"

---

## 12. Fase 8: Metricas y Aprendizajes

**Ruta**: `/campaigns/[id]/metrics`

### Proposito
Registrar metricas de LinkedIn post-publicacion y documentar aprendizajes para mejorar campanas futuras.

### Tres Secciones del Panel

**1. Resumen Semanal**

5 tarjetas de estadisticas:
- Impresiones (total + promedio)
- Comentarios (total + promedio)
- Guardados (total + promedio)
- Compartidos (total + promedio)
- Leads (total + promedio)
- **Engagement Rate**: (comentarios + guardados + compartidos) / impresiones * 100

Grafico de barras horizontales (CSS puro, sin libreria):
- Una barra por dia (Lunes a Viernes)
- Color por etapa del embudo (azul TOFU, morado MOFU, verde BOFU)
- Ancho proporcional al dia con mas impresiones

**2. Metricas por Post**

Un formulario por dia (L-V):
- 5 campos numericos: impresiones, comentarios, guardados, compartidos, leads
- Campo de notas (textarea)
- Boton "Guardar" por dia
- Patron upsert: si ya existen metricas, actualiza; si no, inserta

**3. Aprendizajes Semanales**

- Lista de insights documentados (mas recientes primero)
- Cada aprendizaje tiene:
  - Resumen (titulo corto)
  - Bullets (3-5 puntos clave)
  - Fecha de captura
  - Boton eliminar
- Formulario para agregar:
  - Input "Resumen" (insight principal)
  - Bullets dinamicos (agregar/eliminar con + y trash)
  - Hint de categorias: Hook, Visual, CTA, Friccion, Oportunidades
  - Guardar → validacion Zod → insert

---

## 13. Seguridad — 8 Capas

| Capa | Implementacion | Archivo |
|------|---------------|---------|
| 1. Validacion de Entorno | Zod valida env vars al arrancar | `src/lib/env.ts` |
| 2. Security Headers | CSP, X-Frame-Options, nosniff, Referrer-Policy | `next.config.ts` |
| 3. Validacion de Inputs | Zod en Server Actions y API Routes | Cada action/route |
| 4. RLS | Row Level Security en todas las tablas | Migraciones Supabase |
| 5. Rate Limiting | 10 req/min en endpoints AI | `src/lib/rate-limit.ts` |
| 6. Auth Middleware | Rutas publicas configurables | `src/middleware.ts` |
| 7. Secrets | .env en .gitignore, nunca hardcodeados | `.gitignore` |
| 8. Sanitizacion | Filenames en exports/descargas | `export-service.ts` |

---

## 14. Mapa Completo del Proceso

```
╔══════════════════════════════════════════════════════════════════════╗
║                    PIPELINE DE CONTENIDO LINKEDIN                   ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐    ║
║  │   RESEARCH    │────>│    TOPICS     │────>│    CAMPAIGNS     │    ║
║  │              │     │              │     │                  │    ║
║  │ Articulos    │     │ Hipotesis    │     │ Semana L-V       │    ║
║  │ Notas        │     │ Anti-mitos   │     │ TOFU/MOFU/BOFU   │    ║
║  │ Fuentes      │     │ Senales      │     │ 5 posts auto     │    ║
║  │ Tags         │     │ Fit Score    │     │ Keyword CTA      │    ║
║  └──────────────┘     └──────────────┘     └────────┬─────────┘    ║
║                                                      │              ║
║                        ┌─────────────────────────────┼──────┐      ║
║                        │           POR CADA DIA (1-5) │      │      ║
║                        │                              ▼      │      ║
║                        │  ┌──────────────┐  ┌──────────────┐│      ║
║                        │  │  POST EDITOR  │  │VISUAL EDITOR ││      ║
║                        │  │              │  │              ││      ║
║                        │  │ 3 variantes  │  │ JSON brief   ││      ║
║                        │  │ AI generate  │  │ AI generate  ││      ║
║                        │  │ AI iterate   │  │ Brand rules  ││      ║
║                        │  │ D/G/P/I score│  │ QA checklist ││      ║
║                        │  │ Versiones    │  │ Versiones    ││      ║
║                        │  └──────────────┘  └──────────────┘│      ║
║                        └─────────────────────────────────────┘      ║
║                                         │                           ║
║                        ┌────────────────┼────────────────┐         ║
║                        ▼                ▼                ▼         ║
║              ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   ║
║              │  CONVERSION   │ │  EXPORT PACK  │ │   METRICAS    │   ║
║              │              │ │              │ │              │   ║
║              │ Keyword CTA  │ │ copy.md      │ │ Impresiones  │   ║
║              │ Recurso      │ │ visuals/*.json│ │ Comentarios  │   ║
║              │ Templates DM │ │ checklist.md │ │ Engagement % │   ║
║              │ {{variables}}│ │ links.md     │ │ Aprendizajes │   ║
║              └──────────────┘ └──────────────┘ └──────────────┘   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 15. Patron de Server Actions (Estandar en toda la app)

Todas las acciones de escritura siguen el patron de 4 pasos:

```
1. AUTH        → requireAuth() — redirige a /login si no hay sesion
2. VALIDATE    → Zod parse de FormData — rechaza si no cumple schema
3. EXECUTE     → Service function (Supabase query) — retorna ServiceResult<T>
4. SIDE EFFECTS → track(evento) + revalidatePath() — actualiza cache
```

Esto garantiza que:
- Ningun dato se escribe sin autenticacion
- Ningun dato se escribe sin validacion de tipos en runtime
- Todos los eventos son rastreables
- La UI siempre refleja el estado mas reciente

---

## 16. Base de Datos — 11 Tablas

```
workspaces
  └── workspace_members (user_id, role: admin/editor/collaborator)

research_reports (workspace_id, title, source, raw_text, tags_json)

topics (workspace_id, title, hypothesis, evidence, anti_myth, signals_json,
        fit_score, priority, status)

campaigns (workspace_id, topic_id → topics, week_start, keyword,
           resource_json, audience_json, status)
  └── posts (campaign_id, day_of_week: 1-5, funnel_stage, objective, status)
      ├── post_versions (post_id, version, variant, content, score_json,
      │                  is_current, created_by)
      ├── visual_versions (post_id, version, format, prompt_json, qa_json,
      │                    image_url, status, created_by)
      └── metrics (post_id, impressions, comments, saves, shares, leads)

learnings (campaign_id, summary, bullets_json, created_by)

assets (workspace_id, name, type, url, size_bytes, uploaded_by)
```

Todas las tablas tienen:
- RLS habilitado desde la migracion de creacion
- `created_at` y `updated_at` con trigger automatico
- Filtrado por `workspace_id` para multi-tenancy

---

*Documento generado automaticamente desde el codigo fuente de LinkedIn ContentOps v0.1.0*
