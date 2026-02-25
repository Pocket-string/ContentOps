import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

// Input schema — validated before any DB operation
const feedbackInputSchema = z.object({
  messageId: z.string().min(1, 'messageId requerido'),
  positive: z.boolean(),
  module: z.string().min(1, 'module requerido'),
})

type FeedbackInput = z.infer<typeof feedbackInputSchema>

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Auth — redirect/throw if unauthenticated
  const user = await requireAuth()

  // 2. Validate input with Zod — fail fast on bad data
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo de la solicitud invalido' },
      { status: 400 }
    )
  }

  const parsed = feedbackInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  const { messageId, positive, module }: FeedbackInput = parsed.data

  // 3. Execute — resolve workspace_id and insert learning record
  try {
    const supabase = await createClient()

    // Get workspace_id from workspace_members
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'No se encontro workspace para el usuario' },
        { status: 422 }
      )
    }

    const feedbackType = positive ? 'positive' : 'negative'
    const feedbackText = positive
      ? 'Feedback positivo del chat'
      : 'Feedback negativo del chat'

    const { error: insertError } = await supabase
      .from('orchestrator_learnings')
      .insert({
        workspace_id: member.workspace_id,
        agent_type: module,
        feedback_type: feedbackType,
        feedback_text: feedbackText,
        context_json: { messageId, module, source: 'chat_feedback' },
        created_by: user.id,
      })

    if (insertError) {
      console.error('[chat/feedback] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Error al registrar feedback' },
        { status: 500 }
      )
    }

    // 4. Side effects — none required for feedback recording
    return NextResponse.json({ recorded: true })
  } catch (error) {
    console.error('[chat/feedback] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
