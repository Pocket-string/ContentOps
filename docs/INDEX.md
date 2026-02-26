# LinkedIn ContentOps (Bitalize) -- Indice de Documentacion

> Ultima actualizacion: 2026-02-26 | Build: `af6775c` | Estado: Produccion

## Que es esta App (30 segundos)

LinkedIn ContentOps sistematiza la creacion semanal de contenido LinkedIn para la audiencia de O&M fotovoltaico de Bitalize. Pipeline: **Research -> Topics -> Campaign (Lun-Vie) -> Copy (3 variantes AI) -> Visuals (JSON + imagen AI) -> Export ZIP -> Metrics**.

## Estado del Proyecto

| Area | Estado |
|------|--------|
| Pipeline completo | Research -> Topics -> Campaigns -> Posts -> Visuals -> Export -> Metrics |
| Capa AI | 12 endpoints, Gemini 2.5 Flash + GPT-4o-mini reviewer |
| Orchestrator | Chat AI con streaming, sessions, learning loop, 9 tools |
| Base de datos | 11 migraciones, 15+ tablas, RLS en todas |
| Deployment | Docker 4-stage -> Dokploy -> VPS (`contentops.jonadata.cloud`) |

---

## Navegacion Rapida

### Quiero saber que esta construido hoy
- [current-state.md](current-state.md) -- Snapshot del estado actual (feature map, rutas, API, schema, tech stack)

### Quiero entender la arquitectura tecnica
- [architecture.md](architecture.md) -- Stack, estructura Feature-First, patrones, seguridad
- [ai-system.md](ai-system.md) -- Modelos AI, endpoints, orchestrator, routing, fallbacks

### Quiero deployar o mantener la app
- [deployment.md](deployment.md) -- Docker, Dokploy, VPS, env vars, troubleshooting

### Quiero entender la base de datos
- [database.md](database.md) -- Schema completo, migraciones, RLS, funciones, storage

### Quiero trabajar en una feature especifica
- [current-state.md#feature-map](current-state.md) -- Mapa de las 15 features con rutas y componentes

### Quiero entender el producto (user stories)
- [features.md](features.md) -- 28 user stories con criterios de aceptacion

### Quiero planificar mejoras futuras
- [improvement-plan.md](improvement-plan.md) -- Fases 12-13 pendientes
- [plan-mejoras-ai-hybrid.md](plan-mejoras-ai-hybrid.md) -- Vision V3 AI (parcialmente implementada)

### Quiero entender la metodologia LinkedIn
- [Contenido/](Contenido/) -- 9 archivos de domain knowledge (analisis de estilos, SOP, reportes)
- [Metodologia de posts](../reporte_metodologia_de_creacion_de_posts_linked_in_bitalize.md) -- Metodologia D/G/P/I
- [Requerimiento original](../requerimiento_app_linked_in_content_ops_bitalize.md) -- Spec original del producto

---

## Registro de Documentos

| Documento | Proposito | Actualizado | Estado |
|-----------|-----------|-------------|--------|
| `INDEX.md` | Este archivo -- hub de navegacion | 2026-02-26 | Vigente |
| `current-state.md` | Snapshot del estado real del proyecto | 2026-02-26 | Vigente |
| `database.md` | Schema completo + migraciones + RLS | 2026-02-26 | Vigente |
| `deployment.md` | Runbook de operaciones y deploy | 2026-02-26 | Vigente |
| `ai-system.md` | Sistema AI: endpoints, orchestrator, modelos | 2026-02-26 | Vigente |
| `architecture.md` | Arquitectura tecnica + patrones + seguridad | 2026-02-23 (corregido) | Vigente* |
| `features.md` | 28 user stories con acceptance criteria | 2026-02-23 | Vigente |
| `action-plan.md` | Plan de construccion (10 fases) | 2026-02-23 | Historico (completado) |
| `app-logic-report.md` | Auditoria de logica de la app | 2026-02-24 | Parcialmente desactualizado |
| `improvement-plan.md` | Roadmap 13 fases (12-13 pendientes) | 2026-02-24 | Parcialmente vigente |
| `plan-mejoras-ai-hybrid.md` | Vision V3 AI (Gemini + ChatGPT) | 2026-02-24 | Aspiracional |
| `Contenido/` | 9 archivos de domain knowledge LinkedIn | Varios | Referencia |

\* Correcciones aplicadas el 2026-02-26: tech stack, deployment, AI provider.
