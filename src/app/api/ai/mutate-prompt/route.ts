import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { getModel } from '@/shared/lib/ai-router'
import { analyzeForOptimization, applyMutation } from '@/features/prompts/services/prompt-optimizer'
import { seedBaseline } from '@/features/prompts/services/prompt-version-service'
import type { PromptType } from '@/shared/types/content-ops'

const inputSchema = z.object({
  prompt_type: z.enum(['copy_system', 'research_system', 'topic_deepening_system', 'critic_system']),
  action: z.enum(['analyze', 'mutate', 'seed_baseline']),
  baseline_content: z.string().optional(),
})

export async function POST(request: Request): Promise<Response> {
  const user = await requireAuth()

  const rl = aiRateLimiter.check(user.id)
  if (!rl.success) {
    return Response.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo invalido' }, { status: 400 })
  }

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }, { status: 400 })
  }

  const workspaceId = await getWorkspaceId()
  const { prompt_type: promptType, action, baseline_content: baselineContent } = parsed.data

  try {
    // Action: seed baseline from hardcoded prompt
    if (action === 'seed_baseline') {
      if (!baselineContent) {
        return Response.json({ error: 'baseline_content requerido para seed_baseline' }, { status: 400 })
      }
      const result = await seedBaseline(workspaceId, promptType as PromptType, baselineContent)
      if (!result) {
        return Response.json({ message: 'Baseline ya existe', seeded: false })
      }
      return Response.json({ message: 'Baseline creado', seeded: true, version: result })
    }

    // Action: analyze current prompt performance
    if (action === 'analyze') {
      const analysis = await analyzeForOptimization(workspaceId, promptType as PromptType)
      return Response.json(analysis)
    }

    // Action: mutate — generate a new prompt version with ONE change
    if (action === 'mutate') {
      const analysis = await analyzeForOptimization(workspaceId, promptType as PromptType)

      if (!analysis.activeVersion) {
        return Response.json({ error: 'No hay version activa. Ejecuta seed_baseline primero.' }, { status: 400 })
      }

      if (analysis.recommendation === 'insufficient_data') {
        return Response.json({
          error: 'Datos insuficientes. Se necesitan al menos 5 posts con metricas para evaluar.',
          post_count: analysis.postCount,
        }, { status: 400 })
      }

      if (analysis.recommendation === 'performing_well') {
        return Response.json({
          message: 'El prompt actual esta rindiendo bien. No se requiere mutacion.',
          score: analysis.currentScore,
          post_count: analysis.postCount,
        })
      }

      // Generate mutation via AI
      const model = await getModel('synthesize-research', workspaceId)
      const { text: mutationText } = await generateText({
        model,
        system: `Eres un experto en prompt engineering para generacion de copy de LinkedIn.
Tu tarea es mejorar un system prompt existente haciendo UN SOLO cambio dirigido.

REGLAS CRITICAS:
- Cambia SOLO UNA seccion o instruccion del prompt
- El cambio debe ser especifico y medible
- NO agregues criterios de evaluacion al prompt (eso seria gaming)
- NO cambies la estructura general del prompt
- Enfocate en mejorar las areas que estan fallando
- Mantiene el tono y estilo "Ingeniero Poeta"

Responde UNICAMENTE con JSON (sin markdown):
{
  "hypothesis": "hipotesis de por que este cambio mejorara el rendimiento",
  "change_description": "descripcion del cambio realizado",
  "mutated_prompt": "el prompt completo con el cambio aplicado"
}`,
        prompt: `PROMPT ACTUAL (version ${analysis.activeVersion.version}):\n${analysis.activeVersion.content.slice(0, 6000)}\n\nSCORE ACTUAL: ${analysis.currentScore}/6\n\nEVALS QUE FALLAN (>50% de posts):\n${analysis.failingEvals.join('\n')}\n\nGenera una mutacion que mejore las evals que estan fallando.`,
      })

      const cleaned = mutationText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return Response.json({ error: 'AI no pudo generar mutacion valida' }, { status: 500 })
      }

      const mutation = JSON.parse(jsonMatch[0]) as {
        hypothesis: string
        change_description: string
        mutated_prompt: string
      }

      // Apply the mutation
      const result = await applyMutation(
        workspaceId,
        promptType as PromptType,
        mutation.mutated_prompt,
        mutation.hypothesis,
        mutation.change_description,
        analysis.activeVersion.id,
        analysis.currentScore ?? 0,
      )

      return Response.json({
        message: 'Mutacion aplicada',
        hypothesis: mutation.hypothesis,
        change_description: mutation.change_description,
        new_version: result,
        previous_score: analysis.currentScore,
      })
    }

    return Response.json({ error: 'Accion no reconocida' }, { status: 400 })
  } catch (error) {
    console.error('[mutate-prompt] Error:', error)
    return Response.json(
      { error: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    )
  }
}
