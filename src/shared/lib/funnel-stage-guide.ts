import type { FunnelStage } from '@/shared/types/content-ops'

interface FunnelStageConfig {
  objective: string
  tone: string
  hook_style: string
  cta_type: string
  content_depth: string
  example_cta: string
  critic_penalty: string
}

export const FUNNEL_STAGE_GUIDE: Record<FunnelStage, FunnelStageConfig> = {
  tofu_problem: {
    objective: 'Identificar un dolor que la audiencia no sabe que tiene (o subestima)',
    tone: 'Provocador — "te esta pasando esto y no lo sabes"',
    hook_style: 'Dato impactante o pregunta provocadora que revela un problema oculto',
    cta_type: 'Pregunta abierta que invite a reflexionar, o "guarda este post"',
    content_depth: 'Superficial pero memorable — el lector debe irse pensando "tengo que investigar esto"',
    example_cta: '"Te ha pasado? Cuentame en comentarios" / "Guarda esto para cuando revises tu planta"',
    critic_penalty: 'CTA no debe pedir demo/contacto/descarga. Penalizar si el CTA es comercial en etapa de awareness',
  },
  mofu_problem: {
    objective: 'Profundizar el diagnostico — mostrar el mecanismo real del problema',
    tone: 'Educativo tecnico — "asi funciona realmente lo que te esta costando dinero"',
    hook_style: 'Contradiccion o revelacion tecnica que rompe una asuncion comun',
    cta_type: 'Invitar a comentar su experiencia, seguir para mas contenido tecnico',
    content_depth: 'Mecanismo tecnico detallado con datos — el lector debe entender el POR QUE del problema',
    example_cta: '"Has medido esto en tu planta? Comenta tu experiencia" / "Sigueme para mas analisis"',
    critic_penalty: 'CTA no debe pedir accion comercial. Penalizar si falta profundidad tecnica o evidencia',
  },
  tofu_solution: {
    objective: 'Revelar que existe una solucion (sin vender) — generar esperanza',
    tone: 'Esperanzador — "hay una forma mejor de hacer esto"',
    hook_style: 'Antes/despues o transformacion — mostrar el contraste',
    cta_type: 'Guardar el post, explorar mas sobre la solucion',
    content_depth: 'Overview de la solucion sin entrar en detalles de implementacion',
    example_cta: '"Guarda este framework" / "Quieres saber como se implementa? Comenta"',
    critic_penalty: 'Penalizar si suena a pitch de ventas. El tono debe ser educativo, no comercial',
  },
  mofu_solution: {
    objective: 'Demostrar la solucion con evidencia concreta (caso de exito, metricas reales)',
    tone: 'Autoridad tecnica con caso concreto — "asi lo resolvimos y estos fueron los resultados"',
    hook_style: 'Caso de exito con dato verificable o resultado medible',
    cta_type: 'DM para recurso, descargar guia, link en primer comentario',
    content_depth: 'Caso detallado con metricas — el lector debe ver que la solucion FUNCIONA',
    example_cta: '"Quieres el framework completo? Enviame DM" / "Link al recurso en primer comentario"',
    critic_penalty: 'Penalizar si no hay evidencia concreta o metricas. El caso debe ser verificable',
  },
  bofu_conversion: {
    objective: 'Convertir interes acumulado en accion concreta — keyword en comentarios, DM o recurso descargable',
    tone: 'Directo, orientado a decision, sin humo. El lector ya conoce el problema y la solucion — no re-explicar',
    hook_style: 'Dolor operativo concreto o costo de no actuar — que el lector se reconozca en la situacion',
    cta_type: 'UN solo CTA: comentar la palabra clave para recibir el recurso, o DM para caso especifico',
    content_depth: 'Propuesta de valor directa — diagnostico del dolor operativo + costo de no actuar + siguiente paso simple',
    example_cta: '"Comenta PRSTC y te envio el checklist" / "Escribeme por DM si quieres revisar tu portafolio"',
    critic_penalty: 'Penalizar si hay multiples CTAs, si suena a hype/promesas exageradas, o si re-explica el problema/solucion en lugar de convertir',
  },
}
