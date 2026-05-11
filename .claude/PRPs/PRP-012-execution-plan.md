# PRP-012: Plan de Ejecución

> **Companion** al [PRP-012](.claude/PRPs/PRP-012-editorial-voice-system.md).
> Este documento contiene: (1) validación de supuestos vía deep research, (2) mapa exacto de cambios UI/UX, (3) plan de testeo con Karpathy en producción para la campaña semanal del 11-15 de mayo 2026.

**Fecha**: 2026-05-11 (lunes — primer día de la campaña de testeo)
**Estado**: Listo para ejecutar tras aprobar PRP-012

---

## 1. Validación de Supuestos (Deep Research)

Investigación con 30+ fuentes 2025-2026. Verdictos por supuesto:

| # | Supuesto del PRP-012 | Verdicto | Acción |
|---|---|---|---|
| 1 | Founder-led > corporate brand en B2B SaaS early-stage | **CONFIRMADO** (5-7x reach, 5-10x employee vs brand) | KEEP |
| 2 | AI content tiene -47% reach en LinkedIn | **PARCIAL** (rango real 30-55%; penalty se aplica a contenido GENÉRICO, no a todo lo AI) | REFINAR: hablar de "AI-genérico", no "AI" |
| 3 | Regla scene/data/decision | **PARCIAL** (números +67%, narrativa +34% por separado — no es regla unificada) | KEEP, reframe como heurística propia |
| 4 | Banned phrases reducen reach | **REFUTADO a nivel léxico** (algoritmo mira patrones templados, no palabras) | REFINAR: usar como filtro de CALIDAD, no como claim algorítmico |
| 5 | 5 archetypes founder-led | **INSUFICIENTE** para el set exacto (StartupGTM cita 6 distintos: Framework 42% / Relatability 17% / Community 17% / Credibility 8% / Contrarian 8% / Educational 8%) | REFINAR: nombrar como taxonomía propia de Bitalize, no estándar de industria |
| 6 | Mon/Wed/Fri + mix 30/25/20/15/10 | **PARCIAL** (3 posts/sem confirmado; mix específico no soportado) | DROP el mix exacto; mantener 3-5/sem |
| 7 | Sales ratio 1:8-10 | **REFUTADO** (estándar es 80/20 ≈ 1:4) | REFINAR a 80/20 |
| 8a | Feed-SR transformer (Feb 2026) | **CONFIRMADO** (arXiv 2602.12354, +2.10% time-spent A/B) | KEEP |
| 8b | Dwell + saves + comments substantivos > likes | **CONFIRMADO** (15.6% vs 1.2% engagement con dwell ≥61s) | KEEP |
| 8c | Posts resurface 2-3 semanas | **CONFIRMADO** | KEEP |
| 8d | Anti-bot heuristics (no leading emoji, max 2 emoji, 1500-2200 chars) | **PARCIAL** (1500-2200 chars CONFIRMADO; leading-emoji penalty NO medido) | KEEP longitud, DROP regla emoji |
| 8e | "80/3 rule" es MITO | **CONFIRMADO** (no source documents it) | KEEP |
| 8f | Link penalty ~6x en perfiles personales | **CONFIRMADO** (Hootsuite/Maverrik tests; LinkedIn lo niega oficialmente, empíricos persisten) | KEEP |

### Refinamientos exigidos al PRP-012

Antes de implementar, actualizar el PRP-012 con estos cambios (PR pequeño al doc):

1. **Reescribir Por Qué**: cambiar "AI-genérico 47% menos reach" → "AI-genérico 30-55% menos reach"
2. **Eliminar mix 30/25/20/15/10** del structure-distributor. Reemplazar por: "5 estructuras distintas/semana, prohibido repetir misma estructura dos días seguidos"
3. **Sales ratio 1:8 → 1:4** (80/20). El distribuidor permite 1 commercial dentro de 5 posts semanales
4. **Banned phrases**: documentar como "filtro de calidad anti-genérico" (no como "el algoritmo te castiga por esta frase específica")
5. **5 estructuras = propietarias de Bitalize** (no presentar como industria-standard)
6. **DROP el check "hook anti-bot por emoji"** del RecipeValidator. Mantener solo "max 2 emoji" como heurística de legibilidad
7. **Longitud óptima 1500-2200 chars confirmada** — mantener tal cual en RecipeValidator
8. **Agregar nuevo check**: "Contiene número específico O escena concreta O decisión explícita" (la regla scene/data/decision)

**Sources** (resumen): [a88lab founder-led](https://www.a88lab.com/blog/founder-led-content-b2b-saas), [arXiv 2602.12354 Feed-SR](https://arxiv.org/abs/2602.12354), [Maverrik link penalty](https://maverrik.io/blog/linkedin-link-in-post-algorithm-penalty/), [Storykit micro-data](https://storykit.io/blog/why-micro-data-beats-big-numbers-in-linkedin-headlines), [FSE 80/20 rule](https://www.fsedigital.com/blog/social-media-strategy-for-2025-why-the-80-20-rule-still-wins/) + 25 más documentadas en archivo de investigación adjunto.

---

## 2. Mapa Exacto de Cambios UI/UX

Por componente. Líneas de código del estado actual + delta visual.

### 2.1 CampaignBuilder ([src/features/campaigns/components/CampaignBuilder.tsx](src/features/campaigns/components/CampaignBuilder.tsx))

**ANTES** (líneas 556-678): header con metadata, keyword editable, status dropdown, posts summary, tabs Semana/Brief.

**DESPUÉS**: insertar nuevo panel "Contexto Operacional" entre líneas 617-622, antes del status dropdown.

```
┌─────────────────────────────────────────────────┐
│  📅 Semana del 11 may 2026                      │
│  📌 Tema: Pérdidas invisibles en plantas FV     │
│  🏷️ Keyword: pérdidas-invisibles-fv  [editar] │
│                                                  │
│  ╭─ Contexto Operacional ─────────────[NUEVO]─╮│
│  │  Pilar editorial                            ││
│  │  [▼ Pérdidas Invisibles FV              ]   ││
│  │                                              ││
│  │  Audiencia objetivo                         ││
│  │  [▼ Asset Manager                       ]   ││
│  ╰──────────────────────────────────────────────╯│
│                                                  │
│  Estado: [▼ Borrador]                           │
└─────────────────────────────────────────────────┘
```

**DayColumn cards** (líneas 314-483) reciben nuevo badge "Estructura: X":

```
┌─ Lunes 11 may ──────────────────┐
│  Funnel: TOFU                    │
│  Estructura: Nicho Olvidado [NUEVO]│
│  Status: Borrador  Score: 17/25 │
│  Variante: Revelación            │
│  "Todos miran el PR. Casi..."    │
│  [Publicado: No]                 │
│  [Copy]  [Visual]                │
└──────────────────────────────────┘
```

### 2.2 PostEditor ([src/features/posts/components/PostEditor.tsx](src/features/posts/components/PostEditor.tsx))

**Cambios visibles**:

**a)** Badge de estructura sobre la toolbar Unicode (línea ~872):

```
┌─────────────────────────────────────────────────┐
│  Revelación │ Terreno │ Framework  [Comparar]    │
│  ──────────                                       │
│  🏷️ Estructura: Nicho Olvidado [override ▼]     │
│  [B] [I] [U]  Unicode toolbar...                 │
│  ╭───────────────────────────────────╮           │
│  │ Textarea del copy (12 rows)       │           │
│  │ ...                                 │          │
│  ╰───────────────────────────────────╯           │
│  1842 / 3000 chars                                │
│  [Guardar] [Generar AI] [Copiar Prompt]          │
│  ────────────────────────────────────             │
│  [🎯 Elegir para publicar]                        │
│  ────────────────────────────────────             │
│  [✨ Iterar con AI]  [🪄 Humanizar [NUEVO]]      │
└─────────────────────────────────────────────────┘
```

**b)** Nuevo panel HumanizerPanel debajo del bloque de iteración (antes de línea 1079):

```
╭─ 🪄 Humanizer (Capa 1) ──────────────────────╮
│                                                │
│  ANTES (original)        │  DESPUÉS (humano)  │
│  ─────────────────────    ─────────────────── │
│  "La IA está revolu-    │  "La IA no arregla │
│   cionando el O&M..."   │   datos SCADA su-  │
│                          │   cios. Si los     │
│                          │   tags están..."   │
│                                                │
│  Cambios aplicados:                            │
│  • Eliminada frase "está revolucionando"      │
│  • Agregada escena concreta (tags SCADA)      │
│  • CTA cambió de genérica a específica        │
│                                                │
│  ⚠️ Riesgos detectados:                       │
│  • Ninguno                                     │
│                                                │
│  [Usar versión humanizada]  [Descartar]       │
╰────────────────────────────────────────────────╯
```

### 2.3 CriticPanel ([src/features/posts/components/CriticPanel.tsx](src/features/posts/components/CriticPanel.tsx))

**ANTES**: card único sin tabs, muestra D/G/P/I/R + findings + suggestions.

**DESPUÉS**: refactorizar con tabs (línea 243+):

```
╭─ CopyCritic AI ──────────────────────────────────╮
│  [Tab: D/G/P/I/R]  [Tab: Naturalidad [NUEVO]]    │
│  ─────────────────                                │
│                                                    │
│  TAB ACTIVO: Naturalidad                           │
│  ╭──────────────────────────────────────────────╮│
│  │  Score Naturalidad: 41/50  🟡                ││
│  │                                                ││
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░ ││
│  │  41/50 — Publicable con edición humana breve  ││
│  │                                                ││
│  │  Por criterio (1-5 c/u):                      ││
│  │  Especificidad técnica         ████░ 4/5      ││
│  │  Humanidad / voz natural       ███░░ 3/5      ││
│  │  Claridad del problema         █████ 5/5      ││
│  │  Escena/dato/decisión          ████░ 4/5      ││
│  │  Relevancia AM/O&M             ████░ 4/5      ││
│  │  Traducción técnico→negocio    ███░░ 3/5      ││
│  │  Ausencia clichés IA           ████░ 4/5      ││
│  │  Fuerza hook                   █████ 5/5      ││
│  │  Calidad CTA                   ███░░ 3/5      ││
│  │  Prob. comentarios reales      ████░ 4/5      ││
│  │                                                ││
│  │  🔴 Frases problemáticas:                     ││
│  │  • "aprovechar el potencial" (línea 3)        ││
│  │    → Sugerencia: "convertir [X] en [Y]"       ││
│  │                                                ││
│  │  ✅ Frases que conviene mantener:             ││
│  │  • "300 alarmas, 5 prioridades"               ││
│  │                                                ││
│  │  3 mejoras prioritarias:                      ││
│  │  1. Reescribir CTA con pregunta específica    ││
│  │  2. Agregar dato numérico al hook             ││
│  │  3. Eliminar "aprovechar el potencial"        ││
│  │                                                ││
│  │  ℹ️  Score informativo — NO bloquea publicar  ││
│  ╰────────────────────────────────────────────────╯│
╰─────────────────────────────────────────────────────╯
```

### 2.4 RecipeValidator ([src/features/posts/components/RecipeValidator.tsx](src/features/posts/components/RecipeValidator.tsx))

**Cambios**:
- Agregar check #20 "Contiene escena/dato/decisión" (validar contra patrones)
- Expandir banned-phrase detector con ~20 patrones del reporte (sección 18.1)
- Para cada banned phrase detectada, mostrar sugerencia inline desde tabla 18.3
- **DROP** el check #2 actual "Hook anti-bot por emoji inicial" (refutado)

Visualización:
```
Recipe Validator                    18/20 reglas
─────────────────────────────────────────────
✅ Hook presente
✅ Sin links externos
✅ Keyword presente
...
✅ Escena/dato/decisión [NUEVO]
🔴 Frase banned detectada [NUEVO]
   "transformación digital" → "pasar de X a Y"
```

### 2.5 Pipeline view (DayColumn list en CampaignBuilder)

Agregar mini-badge de estructura en cada card del strip semanal. Ya descrito en 2.1.

### 2.6 Resumen tabla de deltas

| Componente | Tipo de cambio | Líneas afectadas |
|---|---|---|
| `CampaignBuilder.tsx` | + 2 selects (pilar/audiencia) en panel nuevo | 617-622 |
| `CampaignBuilder.tsx` (DayColumn) | + badge "Estructura: X" en cada day card | 404-415 |
| `PostEditor.tsx` | + badge estructura + override dropdown | 872-877 |
| `PostEditor.tsx` | + botón "Humanizar" + panel diff | 1079 |
| `CriticPanel.tsx` | refactor a tabs + tab Naturalidad nueva | 243 → adelante |
| `RecipeValidator.tsx` | + check #20 + banned phrases ampliadas + sustituciones inline | 51-329 |
| `PipelineOrchestrator service` | invocar `distributeStructures()` antes de crear posts | nuevo |

Total: 6 archivos UI + 1 service + 2 endpoints nuevos (`humanize-copy`, `audit-naturalidad`).

---

## 3. Plan de Testeo Post-Deploy con Karpathy Loop

### 3.1 Objetivo del test

Generar la campaña semanal del **lunes 11 a viernes 15 de mayo 2026**, una publicación por día, asignando una estructura distinta a cada uno. Aplicar el loop de Karpathy a los 3 prompts críticos (generate-with-structure, humanize, audit-naturalidad) hasta obtener una campaña que cumpla ≥85% de criterios B2B SaaS marketing expert lens.

### 3.2 Pre-requisitos (gate antes de empezar)

- [ ] PRP-012 con refinamientos del §1 aplicados
- [ ] Fases 1-5 del PRP completadas y deployadas en `contentops.jonadata.cloud`
- [ ] Migraciones 017 + 018 en Supabase (verificar count: 6 pilares + 4 audiencias + 6 estructuras)
- [ ] Smoke check manual: login + crear campaña dummy + verificar UI nueva visible

### 3.3 Asignación semana 11-15 mayo

Distribución basada en cadencia validada (3-5 posts/sem) + heurística "estructura distinta por día":

| Día | Fecha | Estructura | Pilar | Audiencia | Funnel |
|-----|-------|-----------|-------|-----------|--------|
| Lun | 11-may | `opinion_contraria_ia` | Data Quality SCADA | Analista Performance | TOFU |
| Mar | 12-may | `aprendizaje_cliente` | Conversaciones Mercado | Asset Manager | MOFU |
| Mié | 13-may | `nicho_olvidado` | Pérdidas Invisibles FV | Asset Manager | TOFU |
| Jue | 14-may | `demo_pequena` | Proof in Public | Head of O&M | MOFU |
| Vie | 15-may | `feature_kill` | Proof in Public | Head of O&M | BOFU |

**Rationale**:
- Lun = provocación máxima (opinión contraria IA → reach)
- Mar = profundidad (historia cliente real → comentarios)
- Mié = nicho (forgotten problem → saves)
- Jue = producto suave (demo concreta → DM)
- Vie = proof in public (feature kill → confianza founder)

### 3.4 Criterios de evaluación (B2B SaaS marketing expert lens)

Por output generado, evaluación binaria PASS/FAIL. Threshold: ≥85% de checks pass por output, ≥4/5 outputs pass por día.

#### Para `generate-copy` con structure_blueprint (10 checks)

1. **Hook concreto**: ¿Abre con tensión específica? (NO "En el mundo de...", "Hoy quiero...", "Es importante destacar...")
2. **Scene/data/decision**: ¿Contiene UNA escena real, UN número específico, O UNA decisión concreta?
3. **Producto = consecuencia**: ¿Bitalize aparece DESPUÉS del problema, no como protagonista?
4. **Traducción técnico → negocio**: ¿PR/SCADA/alarmas se conectan a $/día, MWh, riesgo contractual o decisión operativa?
5. **CTA específico**: ¿Pregunta final pide experiencia concreta (no "¿qué opinas?")?
6. **Estructura reflejada**: ¿El post sigue el blueprint asignado? (ej: `feature_kill` tiene decisión + razón + aprendizaje + qué haremos ahora)
7. **Pilar reflejado**: ¿Toca el dolor central del pilar asignado?
8. **Audiencia reflejada**: ¿Habla en el lenguaje + dolor + métrica del ICP asignado?
9. **Anti-AI cliché**: ¿Evita las ~20 banned phrases del reporte?
10. **Voz fundador-técnico**: ¿Suena a Jonathan (Ingeniero Poeta), NO a consultora genérica?

#### Para `humanize-copy` (5 checks)

1. Cambios reales (≥3 cambios sustantivos, no cosméticos)
2. Score Naturalidad post-humanize > pre-humanize
3. Mantiene exactitud técnica (no inventa datos)
4. Mantiene UNA sola idea central
5. NO introduce promesas de ROI

#### Para `audit-naturalidad` (3 checks)

1. **Detección verdadera**: detecta las banned phrases que SÍ están en el post
2. **No falso positivo**: en un post real con engagement alto de Jonathan, score ≥45
3. **Correlación humana**: Jonathan revisa 10 outputs (blind), marca pass/fail, score auditor correlaciona ≥80%

### 3.5 Loop de Karpathy (mecánica exacta)

**Setup**:
```bash
mkdir -p .claude/karpathy-runs/prp-012/may-11-15
git checkout -b autoresearch/prp-012-week-may-11
```

Versionar 3 prompts iniciales como `src/features/editorial/prompts/versions/<prompt>-v1.ts` y commitear baseline.

**Loop por prompt** (max 5 iteraciones cada uno; hard stop):

```
ITER N para PROMPT P:

1. RUN (vía MCP Playwright contra contentops.jonadata.cloud)
   - mcp__playwright__browser_navigate → /login → autenticar
   - mcp__playwright__browser_navigate → /campaigns/new
   - Crear campaña con pilar+audiencia del día
   - Triggerar generate-copy → capturar 3 variantes (Revelación/Terreno/Framework)
   - mcp__playwright__browser_take_screenshot → guardar en e2e/screenshots/prp-012-karpathy/<prompt>/v<N>/day-<DD>.png
   - Capturar el output JSON vía Supabase MCP execute_sql:
     SELECT structured_content FROM posts WHERE id = '<post_id>'

2. EVAL (binario)
   - Aplicar los 10/5/3 checks del §3.4 a cada variante
   - Computar score = sum(pass) / total
   - Si humanizer/auditor: aplicar contra outputs de generate

3. SCORE & DECISION
   - Si score ≥ 0.85 Y mejor que vN-1 → KEEP vN
   - Si score < 0.85 O peor que vN-1 → DISCARD, decidir mutación:
     * Falló criterio 1-2 (hook/scene-data-decision): reforzar instrucciones anti-genérico en system prompt + 2 few-shot examples más de hooks fuertes de Jonathan
     * Falló criterio 3-4 (producto consecuencia / traducción técnico-negocio): inyectar más contexto del pilar + ejemplos de translation
     * Falló criterio 5 (CTA): expandir bank de CTAs específicas de la audiencia
     * Falló criterio 6 (estructura): expandir blueprint específico de la estructura fallada
     * Falló criterio 7-8 (pilar/audiencia): inyectar más contexto vertical
     * Falló criterio 9-10 (anti-AI / voz fundador): reforzar reglas de humanización + más ejemplos

4. MUTATE
   - Editar src/features/editorial/prompts/versions/<prompt>-v<N+1>.ts
   - Cambiar import en route handler
   - git commit -m "autoresearch(prp-012/<prompt>): iter N+1 — <hipótesis>"
   - Deploy con MCP Dokploy (cleanCache=false para iteraciones)
   - Esperar ~90s build

5. REPEAT (max 5 iter/prompt)
   - Si no converge a 0.85 en 5 iter → escalar a Jonathan, parar el loop para ese prompt
```

**Persistencia por iteración**:
```
.claude/karpathy-runs/prp-012/may-11-15/
├── generate-copy/
│   ├── v1/
│   │   ├── prompt.txt
│   │   ├── outputs/
│   │   │   ├── mon-opinion_contraria.json
│   │   │   ├── tue-aprendizaje.json
│   │   │   └── ...
│   │   ├── evals.json     # {criterion_1: 4/5, criterion_2: 5/5, ...}
│   │   └── decision.md    # "KEEP" o "DISCARD: mutate criteria 3,7"
│   ├── v2/...
│   └── winner -> v3       # symlink al ganador
├── humanize-copy/
│   └── v1, v2...
└── audit-naturalidad/
    └── v1, v2...
```

### 3.6 Cronograma del test (1 sesión de 4-6h, hoy 11-may)

| Hora | Bloque | Detalle |
|------|--------|---------|
| T+0 | Setup | Verificar deploy en prod responde, autenticación funciona, login con Playwright OK |
| T+15m | Baseline | Generar 5 posts (uno por día semana) con v1 prompts. Eval baseline → score X/50 |
| T+45m | Loop generate-copy | Hasta 5 iteraciones. Cada iter ~30 min (gen + eval + mutate + deploy + verify) |
| T+3h | Loop humanize | Aplicar humanizer al output ganador de generate. Iterar hasta ≥85% en 5 checks |
| T+4h | Loop audit | Validar auditor: inyectar post AI-genérico para verificar detección, validar contra post real de Jonathan |
| T+5h | Sanity check humano | Jonathan revisa los 5 outputs ganadores (blind, sin saber qué versión). Marcar ≥4/5 "suena a mí" |
| T+5.5h | Reporte final | Generar reporte de mejoras: prompts winners, deltas, screenshots |

**Hard limits** (aprendizaje MEMORY.md):
- Max 5 iteraciones por prompt (3 prompts × 5 = 15 total)
- Max 75 generaciones AI en producción
- Budget: ~$10-15 USD en tokens (Gemini 2.5 Flash es barato)
- Si después de 5h sin convergencia → parar, escalar

### 3.7 Resultados esperados

**Output del test** (qué entregamos al final):

1. **Campaña May 11-15 publicable**: 5 posts (uno por día) listos para Jonathan revisar y publicar manualmente en LinkedIn
2. **3 prompts versionados ganadores** en `src/features/editorial/prompts/versions/<prompt>-v<winner>.ts`
3. **Logs de Karpathy** en `.claude/karpathy-runs/prp-012/may-11-15/` (versionados en git)
4. **Reporte de mejoras** en este mismo archivo (sección §4 abajo, llenar tras ejecutar)
5. **Screenshots** del flow completo en `e2e/screenshots/prp-012-karpathy/`
6. **Memoria actualizada**: aprendizajes sobre qué tipo de mutaciones funcionaron en `.claude/memory/`

**Definición de "campaña perfecta"** (criterios de aceptación):
- [ ] 5/5 posts con score ≥85% en criterios generate-copy
- [ ] 5/5 posts con score Naturalidad ≥45/50
- [ ] 5/5 posts con 0 banned phrases detectadas
- [ ] 5/5 estructuras distintas reflejando blueprint asignado
- [ ] 5/5 posts con 1500-2200 chars
- [ ] Jonathan valida blind ≥4/5 outputs como "suena a mí"
- [ ] Cada post tiene scene OR data OR decision explícita
- [ ] Cada post tiene CTA específica de la audiencia asignada

### 3.8 Anti-patrones del test

- **NO** correr el loop en `localhost:3000`. SIEMPRE producción (`contentops.jonadata.cloud`)
- **NO** revelar a Jonathan qué versión generó qué output (sesgo confirmation)
- **NO** evaluar manualmente cada iteración — Claude aplica los checks; Jonathan solo valida blind al final
- **NO** copiar literalmente los criterios al system prompt (gaming del examen — regla autoresearch)
- **NO** exceder 5 iteraciones por prompt (hard stop)
- **NO** combinar 2+ mutaciones en una iteración (aislamiento de variables)
- **NO** deployar cambios que NO sean del prompt versionado (otros cambios contaminan la eval)
- **NO** declarar "ganador" si humanos no validaron con blind review
- **NO** publicar los posts en LinkedIn como parte del test — entregables son drafts, Jonathan publica manualmente

### 3.9 Plan B (si el loop no converge)

Si después de 5 iteraciones algún prompt no llega a 85%:

1. **Triage**: ¿Es problema de prompt o de input data? Si el topic/research del día es pobre, ningún prompt lo salva.
2. **Escalar a Jonathan**: presentar las 5 iteraciones lado a lado, dejar que elija manualmente o sugiera nueva dirección
3. **Reducir scope**: mantener prompt v1 para ese día específico, sin perfeccionarlo en esta sesión
4. **Documentar**: por qué no convergió va a CLAUDE.md como aprendizaje permanente

---

## 4. Reporte Post-Ejecución (a llenar tras correr el test)

### 4.1 Resumen ejecutivo
_Llenar tras Fase 6._

### 4.2 Deltas de prompts (v1 → vN)
_Diff resumido por prompt ganador._

### 4.3 Posts de la campaña (May 11-15)
_5 outputs finales aquí + permalink al post id en DB._

### 4.4 Aprendizajes (qué mutaciones funcionaron)
_Documentar en `.claude/memory/` patrones de mutación efectivos para futuras campañas._

### 4.5 Métricas tras publicación (semana del 18-may)
_Tras 7 días de publicado, registrar impresiones / reacciones / comentarios / shares / saves / DMs por cada post → comparar con baseline histórico de la app._

---

## Apéndice A — Refinamientos al PRP-012 (✅ APLICADOS 2026-05-11)

Estos 6 refinamientos ya están aplicados en [.claude/PRPs/PRP-012-editorial-voice-system.md](.claude/PRPs/PRP-012-editorial-voice-system.md):

1. ✅ "Por Qué" reescrito con tabla 3-columna (Problema | Solución | Evidencia 2025-2026) con sources linkeados (AI Monks, a88lab, Meet-Lea, arXiv Feed-SR, FSE Digital)
2. ✅ Mix 30/25/20/15/10 eliminado de Criterios, Comportamiento, SQL seed, y Anti-Patrones. Reemplazo: "5 estructuras distintas/semana, no repetir 2 días seguidos"
3. ✅ Anti-Patrones: agregadas 4 reglas nuevas — taxonomía propietaria no industria-standard, drop mix, distinguir IA-genérica vs IA con sustancia, drop check emoji
4. ✅ Fase 4 expandida: DROP check #2 emoji + ADD check #20 scene/data/decision (con patrones regex documentados) + amplía banned phrases de 6 a ~20 con tabla de sustitución
5. ✅ Gotchas: agregadas 4 reglas — sales ratio 80/20, Feed-SR es transformer (no léxico), longitud 1500-2200 confirmada, link penalty ~6x
6. ✅ Tabla "Por Qué": fila audiencia ahora incluye dato Meet-Lea (dwell ≥61s → 15.6% vs 1.2% engagement)

**Verificación**: `grep -n "30/25/20/15/10\|47%\|1:8-10" PRP-012-editorial-voice-system.md` solo retorna referencias en comentarios "NO usar X" (anti-patterns), confirmando que ningún flujo activo usa los valores deprecados.

---

## Apéndice B — Comandos exactos del test (cheat sheet)

```bash
# Setup
git checkout -b autoresearch/prp-012-week-may-11
mkdir -p .claude/karpathy-runs/prp-012/may-11-15/{generate-copy,humanize-copy,audit-naturalidad}/v1
mkdir -p e2e/screenshots/prp-012-karpathy

# Por iteración (ejemplo)
# 1. Editar prompt versionado
$EDITOR src/features/editorial/prompts/versions/generate-with-structure-v2.ts
# 2. Cambiar import
$EDITOR src/app/api/ai/generate-copy/route.ts
# 3. Commit
git add -A
git commit -m "autoresearch(prp-012/generate): iter 2 — refuerzo anti-genérico en hook"
# 4. Deploy
# (via MCP) mcp__dokploy__application-deploy(applicationId="T5h12sWPliBOeXYVLC75h", cleanCache=false)
# 5. Esperar
sleep 90 && curl -sf https://contentops.jonadata.cloud/api/health
# 6. Run + eval (via MCP Playwright + Supabase)
# 7. Persistir resultado
echo "..." > .claude/karpathy-runs/prp-012/may-11-15/generate-copy/v2/decision.md
```

---

*Plan de ejecución listo. Para arrancar: aprobar refinamientos del Apéndice A, luego ejecutar fases 1-5 del PRP-012 via `/bucle-agentico`, finalmente correr §3 (Karpathy en prod).*
