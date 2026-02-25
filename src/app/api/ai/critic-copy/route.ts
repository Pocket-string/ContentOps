import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { weeklyBriefSchema } from '@/shared/types/content-ops'
import { getModel } from '@/shared/lib/ai-router'

// Zod schema for single variant evaluation
const variantEvalSchema = z.object({
  variant: z.string(),
  score: z.object({
    detener: z.number().min(0).max(5),
    ganar: z.number().min(0).max(5),
    provocar: z.number().min(0).max(5),
    iniciar: z.number().min(0).max(5),
    total: z.number().min(0).max(20),
  }),
  findings: z.array(z.object({
    category: z.string(),
    severity: z.enum(['blocker', 'warning', 'suggestion']),
    description: z.string(),
  })),
  suggestions: z.array(z.string()).max(3),
  verdict: z.enum(['pass', 'needs_work', 'rewrite']),
})

// Full critic output — evaluates ALL variants and recommends the best
const criticOutputSchema = z.object({
  evaluations: z.array(variantEvalSchema).min(1),
  recommended_variant: z.string(),
  recommendation_reason: z.string(),
})

export type CriticCopyOutput = z.infer<typeof criticOutputSchema>

// Input schema — can receive single or multiple variants
const variantInputSchema = z.object({
  variant: z.string().min(1),
  content: z.string().min(1),
})

const inputSchema = z.object({
  variants: z.array(variantInputSchema).min(1).max(3),
  funnel_stage: z.string().min(1),
  weekly_brief: weeklyBriefSchema.optional(),
  keyword: z.string().optional(),
  topic: z.string().optional(),
  context: z.string().optional(),
})

export async function POST(request: Request): Promise<Response> {
  // 1. Auth
  const user = await requireAuth()

  // 2. Rate limit (10 req/min per user)
  const rateLimitResult = aiRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  // 3. Validate input with Zod
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo de la solicitud invalido' }, { status: 400 })
  }

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  // 4. Evaluate with AI (text-based JSON)
  try {
    const { variants, funnel_stage, weekly_brief, keyword, topic, context } = parsed.data

    const variantLabels: Record<string, string> = {
      contrarian: 'Contrarian',
      story: 'Narrativa',
      data_driven: 'Dato de Shock',
    }

    const variantsBlock = variants.map((v, i) => {
      const label = variantLabels[v.variant] ?? v.variant
      return `--- VARIANTE ${i + 1}: ${label} (${v.variant}) ---\n${v.content}`
    }).join('\n\n')

    const result = await generateText({
      model: getModel('critic-copy'),
      system: `Eres un critico experto de copy LinkedIn para O&M fotovoltaico (operacion y mantenimiento de plantas solares).
Eres exigente pero justo. Tu mision: que cada post sea excelente antes de publicarse.

Tu trabajo es evaluar posts de LinkedIn usando la rubrica D/G/P/I:
- **Detener (D, 0-5)**: El hook detiene el scroll? Usa datos sorprendentes, preguntas provocadoras?
- **Ganar (G, 0-5)**: El contenido gana la atencion con valor real e insights unicos?
- **Provocar (P, 0-5)**: Provoca reaccion emocional o intelectual que lleve a comentar?
- **Iniciar (I, 0-5)**: Inicia una conversacion con CTA claro?

Detectas estos problemas:
- **generico**: Contenido que podria ser de cualquier sector
- **sin_evidencia**: Afirmaciones sin datos ni fuentes
- **jerga**: Jerga tecnica excesiva sin explicacion
- **cta_debil**: CTA vago o ausente
- **hook_debil**: Primera linea que no detiene el scroll
- **longitud**: Demasiado largo (>3000 chars) o corto (<800 chars)
- **formato**: Parrafos largos, sin espaciado, sin hashtags

Reglas:
- MAXIMO 3 findings por variante (los mas impactantes)
- MAXIMO 3 suggestions por variante (cambios concretos, accionables)
- Severity: blocker (debe corregirse), warning (recomendado), suggestion (opcional)
- Verdict: pass (score >= 16), needs_work (10-15), rewrite (< 10)
- total = detener + ganar + provocar + iniciar
- SIEMPRE recomienda la MEJOR variante para publicar con una razon clara

IMPORTANTE: Responde UNICAMENTE con un JSON valido, sin markdown, sin backticks, sin texto adicional.`,
      prompt: `Evalua estas variantes de un post de LinkedIn:

**Etapa del funnel**: ${funnel_stage}
${keyword ? `**Keyword**: ${keyword}` : ''}
${topic ? `**Tema**: ${topic}` : ''}
${context ? `**Contexto**: ${context}` : ''}
${weekly_brief ? `**Brief semanal**: Tema: ${weekly_brief.tema}, Enemigo silencioso: ${weekly_brief.enemigo_silencioso ?? 'N/A'}, Anti-mito: ${weekly_brief.anti_mito ?? 'N/A'}` : ''}

${variantsBlock}

Responde con este JSON exacto:
{
  "evaluations": [
    {
      "variant": "contrarian",
      "score": { "detener": 4, "ganar": 3, "provocar": 4, "iniciar": 3, "total": 14 },
      "findings": [
        { "category": "hook_debil", "severity": "warning", "description": "El hook podria ser mas provocador" }
      ],
      "suggestions": ["Agregar un dato especifico en el hook", "Hacer el CTA mas directo"],
      "verdict": "needs_work"
    }
  ],
  "recommended_variant": "contrarian",
  "recommendation_reason": "Mejor hook y mayor provocacion para esta etapa del funnel"
}`,
    })

    // Parse JSON from text response
    let jsonText = result.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    let parsed_ai: unknown
    try {
      parsed_ai = JSON.parse(jsonText)
    } catch {
      console.error('[critic-copy] Failed to parse AI JSON:', jsonText.slice(0, 500))
      return Response.json(
        { error: 'Error al parsear la evaluacion. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const validated = criticOutputSchema.safeParse(parsed_ai)
    if (!validated.success) {
      console.error('[critic-copy] Zod validation failed:', validated.error.issues)
      return Response.json(
        { error: 'La IA genero un formato invalido. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    return Response.json({ data: validated.data })
  } catch (error) {
    console.error('[critic-copy] AI error:', error)
    return Response.json(
      { error: 'Error al evaluar el contenido. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
