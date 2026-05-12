# ContentOps (Bitalize) — Context Pack

Paquete completo de documentacion para compartir el contexto de la app **LinkedIn ContentOps** de Bitalize.

**Dominio**: O&M fotovoltaico (operaciones y mantenimiento de plantas solares)
**Stack**: Next.js 16 + React 19 + TypeScript + Supabase + Tailwind + Vercel AI SDK + Gemini
**Deploy**: Dokploy en VPS (contentops.jonadata.cloud)

---

## Estructura

### 01-core/ — Identidad del proyecto
| Archivo | Contenido |
|---------|-----------|
| CLAUDE.md | Cerebro de la fabrica: stack, reglas de codigo, 27 aprendizajes, flujos, skills disponibles |
| README.md | Presentacion general del proyecto |
| GEMINI.md | Notas de configuracion del modelo Gemini |
| requerimiento_app_linked_in_content_ops_bitalize.md | Requerimiento original de la app |
| reporte_metodologia_de_creacion_de_posts_linked_in_bitalize.md | Metodologia de creacion de posts LinkedIn |

### 02-arquitectura/ — Como esta construido
| Archivo | Contenido |
|---------|-----------|
| architecture.md | Arquitectura tecnica + 8 capas de seguridad |
| database.md | Esquema completo de la base de datos |
| deployment.md | Guia de deploy (Dokploy + VPS + Docker) |
| current-state.md | Estado actual del desarrollo |
| app-logic-report.md | Reporte de logica de la aplicacion |

### 03-features-y-plan/ — Que hace y hacia donde va
| Archivo | Contenido |
|---------|-----------|
| INDEX.md | Indice maestro de documentacion |
| features.md | 28 user stories con criterios de aceptacion |
| action-plan.md | Plan maestro de 10 fases |
| improvement-plan.md | Plan de mejoras identificadas |
| plan-mejoras-ai-hybrid.md | Plan de mejoras del sistema AI hibrido |

### 04-ai-system/ — Motor de inteligencia artificial
| Archivo | Contenido |
|---------|-----------|
| ai-system.md | Modelos, prompts, pipelines, CopyCritic, VisualCritic, Karpathy Loop |

### 05-contenido-estrategia/ — Estrategia de contenido LinkedIn
| Archivo | Contenido |
|---------|-----------|
| analisis-estilo-ingeniero-poeta.md | Analisis del estilo "Ingeniero Poeta" con metricas reales |
| guia-copywriting.md | Guia estrategica de copywriting para LinkedIn |
| formatos-infografias-exitosos.md | Formatos visuales mas exitosos |
| investigacion-perfil-nicho.md | Perfil del autor y oportunidades de nicho |
| sop-semanal-publicaciones.md | SOP semanal de publicaciones |
| analisis-flujo.md | Analisis del flujo de contenido |
| comentarios-contentops.md | Feedback y comentarios del usuario |
| metodologia-prompts-json.md | Metodologia de trabajo con prompts JSON |
| tendencias-sector.md | Analisis de tendencias del sector fotovoltaico |

### 06-prps/ — Product Requirements Proposals
| Archivo | Contenido |
|---------|-----------|
| PRP-008-pipeline-agentico-contenido.md | Pipeline Agentico de Contenido (implementado) |
| PRP-009-formulas-ganadoras-karpathy-loop.md | Formulas Ganadoras + Karpathy Loop (en progreso) |
| prp-base.md | Template base para futuros PRPs |

### 07-reportes-campanas/ — Reportes de campanas ejecutadas
| Archivo | Contenido |
|---------|-----------|
| reporte-curtailment.md | Campana Curtailment (Feb 2026) |
| reporte-mismatch.md | Campana Mismatch |
| reporte-trackers.md | Campana Trackers — metodologia y aprendizajes |

### 08-memoria/ — Decisiones persistentes
| Archivo | Contenido |
|---------|-----------|
| feedback_no_hashtags.md | Regla: nunca generar hashtags en copy de LinkedIn |

---

## Orden de lectura recomendado

1. **01-core/CLAUDE.md** — Entender el stack, reglas y filosofia
2. **02-arquitectura/architecture.md** — Arquitectura tecnica
3. **03-features-y-plan/features.md** — Que hace la app
4. **04-ai-system/ai-system.md** — Como funciona la IA
5. **05-contenido-estrategia/analisis-estilo-ingeniero-poeta.md** — El framework de contenido
6. **06-prps/PRP-009-formulas-ganadoras-karpathy-loop.md** — La direccion actual

---

*Generado: 2026-04-07 | App: ContentOps v1 | Equipo: Bitalize*
