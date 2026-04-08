import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { getModel } from '@/shared/lib/ai-router'

export const maxDuration = 60

const slideInputSchema = z.object({
  slide_index: z.number(),
  slide_role: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  body_text: z.string().nullable().optional(),
  prompt_json: z.record(z.unknown()).default({}),
})

const inputSchema = z.object({
  slides: z.array(slideInputSchema).min(2),
  post_content: z.string().optional(),
  funnel_stage: z.string().optional(),
})

const findingSchema = z.object({
  category: z.string(),
  severity: z.enum(['blocker', 'warning', 'suggestion']),
  description: z.string(),
  slide_index: z.number().nullable().optional(),
})

const criticOutputSchema = z.object({
  deck_verdict: z.enum(['pass', 'needs_work', 'rewrite']),
  deck_findings: z.array(findingSchema).default([]),
  slide_verdicts: z.record(z.string(), z.enum(['pass', 'needs_work', 'rewrite'])).default({}),
  slide_findings: z.record(z.string(), z.array(findingSchema)).default({}),
  suggestions: z.array(z.string()).default([]),
})

export async function POST(request: Request): Promise<Response> {
  const user = await requireAuth()
  const rl = aiRateLimiter.check(user.id)
  if (!rl.success) return Response.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })

  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Cuerpo invalido' }, { status: 400 }) }

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }, { status: 400 })

  const workspaceId = await getWorkspaceId()
  const { slides, post_content, funnel_stage } = parsed.data

  try {
    const model = await getModel('critic-copy', workspaceId)

    const slideSummary = slides.map(s =>
      `Slide ${s.slide_index} (${s.slide_role ?? 'unknown'}): "${s.headline ?? ''}" — ${s.body_text?.slice(0, 100) ?? ''}`
    ).join('\n')

    const { text: jsonText } = await generateText({
      model,
      system: `Eres un evaluador de calidad visual para carruseles de LinkedIn B2B fotovoltaico.

Evalua el carrusel en DOS capas:

CAPA 1 — PER-SLIDE:
Para cada slide, evalua:
- legibilidad: texto legible en movil, contraste adecuado
- composicion: layout limpio, jerarquia clara
- branding: colores de marca, logo presente segun rol
- coherencia: el slide cumple su rol narrativo (cover=hook, cta_close=CTA)

CAPA 2 — DECK-LEVEL:
- coherencia_narrativa: el carrusel fluye de hook → contenido → CTA
- consistencia_visual: misma estetica/paleta en todos los slides
- cover_impact: el slide 0 es suficientemente atractivo para detener scroll
- cta_effectiveness: el ultimo slide tiene CTA claro y accionable
- alineacion_copy: el carrusel complementa el copy del post

Responde UNICAMENTE con JSON (sin markdown):
{
  "deck_verdict": "pass|needs_work|rewrite",
  "deck_findings": [{"category": "coherencia_narrativa", "severity": "warning", "description": "...", "slide_index": null}],
  "slide_verdicts": {"0": "pass", "1": "needs_work", ...},
  "slide_findings": {"0": [{"category": "legibilidad", "severity": "suggestion", "description": "...", "slide_index": 0}], ...},
  "suggestions": ["sugerencia global 1", "sugerencia global 2"]
}`,
      prompt: `Evalua este carrusel de ${slides.length} slides:

${slideSummary}

${post_content ? `COPY DEL POST:\n${post_content.slice(0, 1000)}` : ''}
${funnel_stage ? `FUNNEL STAGE: ${funnel_stage}` : ''}

Evalua cada slide individualmente Y el carrusel como conjunto.`,
    })

    const cleaned = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return Response.json({ error: 'AI no retorno JSON valido' }, { status: 500 })

    let parsedResult: unknown
    try {
      parsedResult = JSON.parse(jsonMatch[0])
    } catch {
      let repaired = jsonMatch[0].replace(/,\s*"[^"]*":\s*"[^"]*$/, '').replace(/,\s*"[^"]*$/, '')
      const ob = (repaired.match(/\[/g) ?? []).length - (repaired.match(/\]/g) ?? []).length
      const oc = (repaired.match(/\{/g) ?? []).length - (repaired.match(/\}/g) ?? []).length
      repaired += ']'.repeat(Math.max(0, ob)) + '}'.repeat(Math.max(0, oc))
      parsedResult = JSON.parse(repaired)
    }

    const validated = criticOutputSchema.safeParse(parsedResult)
    if (!validated.success) {
      console.error('[critic-carousel] Validation failed:', validated.error.issues)
      return Response.json({ error: 'Formato de evaluacion invalido' }, { status: 500 })
    }

    return Response.json({ data: validated.data })
  } catch (error) {
    console.error('[critic-carousel] Error:', error)
    return Response.json({ error: `Error: ${error instanceof Error ? error.message : 'desconocido'}` }, { status: 500 })
  }
}
