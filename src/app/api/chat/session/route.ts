import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  getActiveSession,
  createSession,
} from '@/features/orchestrator/services/session-service'

// ============================================
// Schema
// ============================================

const createSessionSchema = z.object({
  pageContext: z.record(z.unknown()),
})

type CreateSessionInput = z.infer<typeof createSessionSchema>

// ============================================
// GET — Load active session
// ============================================

export async function GET(): Promise<NextResponse> {
  // 1. Auth
  const user = await requireAuth()

  // 2. Execute — no input to validate for GET
  try {
    const result = await getActiveSession(user.id)

    if (result.error) {
      console.error('[chat/session] GET error:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // 3. Response — session is null when no active session exists
    return NextResponse.json({ session: result.data ?? null })
  } catch (error) {
    console.error('[chat/session] GET unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ============================================
// POST — Create new session
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

  const parsed = createSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  const { pageContext }: CreateSessionInput = parsed.data

  // 3. Execute — resolve workspace_id, then create session
  try {
    const supabase = await createClient()

    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'No se encontro workspace para el usuario' },
        { status: 422 }
      )
    }

    const result = await createSession({
      workspaceId: member.workspace_id as string,
      userId: user.id,
      pageContext,
    })

    if (result.error) {
      console.error('[chat/session] POST createSession error:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // 4. Response
    return NextResponse.json({ session: result.data })
  } catch (error) {
    console.error('[chat/session] POST unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
