'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { createClient } from '@/lib/supabase/server'
import { executeWeekPipeline } from '@/features/pipeline/services/pipeline-orchestrator'
import type { PipelineStatus } from '@/shared/types/content-ops'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionResult {
  error?: string
  data?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const startPipelineSchema = z.object({
  tema: z.string().min(3, 'El tema debe tener al menos 3 caracteres'),
  buyer_persona: z.string().optional(),
  keyword: z.string().optional(),
  pillar_id: z.string().uuid().optional(),
  week_start: z.string().min(1, 'Fecha de inicio requerida'),
})

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function startPipelineAction(formData: FormData): Promise<ActionResult> {
  // 1. Auth
  const user = await requireAuth()

  // 2. Validate
  const raw = {
    tema: formData.get('tema'),
    buyer_persona: formData.get('buyer_persona') || undefined,
    keyword: formData.get('keyword') || undefined,
    pillar_id: formData.get('pillar_id') || undefined,
    week_start: formData.get('week_start'),
  }

  const parsed = startPipelineSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  // 3. Execute pipeline (async — returns campaign ID immediately, pipeline runs in background)
  const workspaceId = await getWorkspaceId()

  try {
    const result = await executeWeekPipeline({
      workspaceId,
      userId: user.id,
      tema: parsed.data.tema,
      buyerPersona: parsed.data.buyer_persona,
      keyword: parsed.data.keyword,
      pillarId: parsed.data.pillar_id,
      weekStart: parsed.data.week_start,
    })

    // 4. Side effects
    revalidatePath('/campaigns')

    if (result.errors.length > 0 && !result.campaignId) {
      return { error: result.errors[0]?.message ?? 'Error en el pipeline' }
    }

    return { data: { campaignId: result.campaignId } }
  } catch (err) {
    console.error('[pipeline-actions] startPipeline error:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function getPipelineStatusAction(campaignId: string): Promise<{
  status: PipelineStatus | null
  error?: string
}> {
  await requireAuth()

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('campaigns')
      .select('pipeline_status')
      .eq('id', campaignId)
      .single()

    if (error) return { status: null, error: error.message }

    return { status: (data?.pipeline_status as PipelineStatus) ?? null }
  } catch {
    return { status: null, error: 'Error al obtener estado' }
  }
}

export async function rejectPieceAction(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth()

  const postId = formData.get('post_id') as string
  const feedback = formData.get('feedback') as string
  const type = formData.get('type') as string // 'copy' or 'visual'

  if (!postId || !feedback) {
    return { error: 'Post ID y feedback son requeridos' }
  }

  try {
    const supabase = await createClient()

    if (type === 'visual') {
      // Reject visual version
      const visualVersionId = formData.get('visual_version_id') as string
      if (visualVersionId) {
        await supabase
          .from('visual_versions')
          .update({ rejection_feedback: feedback, status: 'rejected' })
          .eq('id', visualVersionId)
      }
    } else {
      // Reject copy — save feedback on post
      await supabase
        .from('posts')
        .update({ rejection_feedback: feedback, status: 'needs_human_review' })
        .eq('id', postId)
    }

    revalidatePath(`/campaigns`)
    return { data: { success: true } }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al rechazar' }
  }
}

export async function approvePieceAction(postId: string): Promise<ActionResult> {
  await requireAuth()

  try {
    const supabase = await createClient()
    await supabase
      .from('posts')
      .update({ status: 'approved', rejection_feedback: null })
      .eq('id', postId)

    revalidatePath('/campaigns')
    return { data: { success: true } }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al aprobar' }
  }
}

export async function approveAllAction(campaignId: string): Promise<ActionResult> {
  await requireAuth()

  try {
    const supabase = await createClient()

    // Approve all posts in the campaign
    await supabase
      .from('posts')
      .update({ status: 'approved', rejection_feedback: null })
      .eq('campaign_id', campaignId)

    // Update campaign status to 'ready'
    await supabase
      .from('campaigns')
      .update({ status: 'ready' })
      .eq('id', campaignId)

    revalidatePath('/campaigns')
    return { data: { success: true } }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al aprobar todo' }
  }
}
