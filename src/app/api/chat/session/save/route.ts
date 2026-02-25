import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { saveMessages } from '@/features/orchestrator/services/session-service'

// ============================================
// Schema
// ============================================

const messageSchema = z.object({
  id: z.string(),
  role: z.string(),
  content: z.string(),
  timestamp: z.number(),
})

const saveMessagesSchema = z.object({
  sessionId: z.string().uuid('sessionId debe ser un UUID valido'),
  messages: z.array(messageSchema),
})

type SaveMessagesInput = z.infer<typeof saveMessagesSchema>

// ============================================
// POST — Save messages to session
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Auth
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

  const parsed = saveMessagesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  const { sessionId, messages }: SaveMessagesInput = parsed.data

  // 3. Execute — persist messages to the session
  try {
    const result = await saveMessages(sessionId, messages)

    if (result.error) {
      console.error('[chat/session/save] saveMessages error:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // 4. Response — acknowledge success; no side-effect revalidation needed
    return NextResponse.json({ saved: true })
  } catch (error) {
    console.error('[chat/session/save] Unexpected error (user=%s):', user.id, error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
