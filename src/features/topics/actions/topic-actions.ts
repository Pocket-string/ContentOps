'use server'

import { revalidatePath } from 'next/cache'
import { createTopicSchema, TOPIC_STATUSES } from '@/shared/types/content-ops'
import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { track } from '@/lib/tracking'
import { z } from 'zod'
import {
  createTopic,
  updateTopic,
  deleteTopic,
} from '@/features/topics/services/topic-service'

// ============================================
// Result types
// ============================================

interface ActionSuccess {
  success: true
}

interface ActionError {
  error: string
}

type ActionResult = ActionSuccess | ActionError

// ============================================
// FormData parser
// ============================================

/**
 * Parse FormData fields for topic forms.
 *
 * - signals_json: accepts JSON array string ("[\"a\",\"b\"]") or
 *   comma-separated ("a,b"). Empty string yields [].
 * - fit_score: comes as a string from <input type="number">, converted to number.
 *   Empty string or missing value yields undefined so the field stays nullable.
 * - priority and status: plain string values from <select> dropdowns.
 * - Optional text fields (hypothesis, evidence, anti_myth): empty strings become
 *   undefined so Zod's .optional() leaves them unset rather than storing "".
 */
function parseTopicFormData(formData: FormData): Record<string, unknown> {
  // --- signals_json ---
  const rawSignals = formData.get('signals_json')
  let signals: string[] = []

  if (typeof rawSignals === 'string' && rawSignals.trim().length > 0) {
    if (rawSignals.trim().startsWith('[')) {
      try {
        const arr = JSON.parse(rawSignals)
        if (Array.isArray(arr)) {
          signals = arr.filter((s): s is string => typeof s === 'string')
        }
      } catch {
        signals = []
      }
    } else {
      signals = rawSignals.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  // --- fit_score ---
  const rawFitScore = formData.get('fit_score')
  let fitScore: number | undefined = undefined

  if (typeof rawFitScore === 'string' && rawFitScore.trim().length > 0) {
    const num = Number(rawFitScore)
    if (!Number.isNaN(num)) {
      fitScore = num
    }
  }

  // --- optional text fields ---
  const hypothesis = formData.get('hypothesis')
  const evidence = formData.get('evidence')
  const antiMyth = formData.get('anti_myth')
  const silentEnemyName = formData.get('silent_enemy_name')
  const minimalProof = formData.get('minimal_proof')
  const expectedBusinessImpact = formData.get('expected_business_impact')
  const sourceContext = formData.get('source_context')
  const targetAudience = formData.get('target_audience')
  const marketCtx = formData.get('market_context')

  // --- failure_modes (JSON array or comma-separated) ---
  const rawFailureModes = formData.get('failure_modes')
  let failureModes: string[] = []

  if (typeof rawFailureModes === 'string' && rawFailureModes.trim().length > 0) {
    if (rawFailureModes.trim().startsWith('[')) {
      try {
        const arr = JSON.parse(rawFailureModes)
        if (Array.isArray(arr)) {
          failureModes = arr.filter((s): s is string => typeof s === 'string')
        }
      } catch {
        failureModes = []
      }
    } else {
      failureModes = rawFailureModes.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  // --- content_angles (JSON array or comma-separated) ---
  const rawContentAngles = formData.get('content_angles')
  let contentAngles: string[] = []

  if (typeof rawContentAngles === 'string' && rawContentAngles.trim().length > 0) {
    if (rawContentAngles.trim().startsWith('[')) {
      try {
        const arr = JSON.parse(rawContentAngles)
        if (Array.isArray(arr)) {
          contentAngles = arr.filter((s): s is string => typeof s === 'string')
        }
      } catch {
        contentAngles = []
      }
    } else {
      contentAngles = rawContentAngles.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  // --- key_data_points (JSON array of {stat, source, context} objects) ---
  const rawKeyDataPoints = formData.get('key_data_points')
  let keyDataPoints: Array<{ stat: string; source: string; context: string }> = []

  if (typeof rawKeyDataPoints === 'string' && rawKeyDataPoints.trim().length > 0) {
    try {
      const arr = JSON.parse(rawKeyDataPoints)
      if (Array.isArray(arr)) {
        keyDataPoints = arr.filter(
          (item): item is { stat: string; source: string; context: string } =>
            typeof item === 'object' && item !== null &&
            typeof item.stat === 'string' &&
            typeof item.source === 'string' &&
            typeof item.context === 'string'
        )
      }
    } catch {
      keyDataPoints = []
    }
  }

  // --- solution_framework (JSON object) ---
  const rawSolutionFramework = formData.get('solution_framework')
  let solutionFramework: { name: string; mechanism: string; benefits: string[]; implementation: string } | undefined

  if (typeof rawSolutionFramework === 'string' && rawSolutionFramework.trim().length > 0) {
    try {
      const parsed = JSON.parse(rawSolutionFramework)
      if (typeof parsed === 'object' && parsed !== null && typeof parsed.name === 'string') {
        solutionFramework = parsed
      }
    } catch {
      // ignore malformed JSON
    }
  }

  return {
    title: formData.get('title'),
    hypothesis: typeof hypothesis === 'string' && hypothesis.trim().length > 0
      ? hypothesis.trim()
      : undefined,
    evidence: typeof evidence === 'string' && evidence.trim().length > 0
      ? evidence.trim()
      : undefined,
    anti_myth: typeof antiMyth === 'string' && antiMyth.trim().length > 0
      ? antiMyth.trim()
      : undefined,
    signals_json: signals,
    fit_score: fitScore,
    priority: formData.get('priority') ?? 'medium',
    silent_enemy_name: typeof silentEnemyName === 'string' && silentEnemyName.trim().length > 0
      ? silentEnemyName.trim()
      : undefined,
    minimal_proof: typeof minimalProof === 'string' && minimalProof.trim().length > 0
      ? minimalProof.trim()
      : undefined,
    failure_modes: failureModes,
    expected_business_impact: typeof expectedBusinessImpact === 'string' && expectedBusinessImpact.trim().length > 0
      ? expectedBusinessImpact.trim()
      : undefined,
    source_context: typeof sourceContext === 'string' && sourceContext.trim().length > 0
      ? sourceContext.trim() : undefined,
    content_angles: contentAngles,
    key_data_points: keyDataPoints,
    target_audience: typeof targetAudience === 'string' && targetAudience.trim().length > 0
      ? targetAudience.trim() : undefined,
    market_context: typeof marketCtx === 'string' && marketCtx.trim().length > 0
      ? marketCtx.trim() : undefined,
    solution_framework: solutionFramework,
  }
}

// ============================================
// Server Actions
// ============================================

/**
 * Create a new topic.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: createTopicSchema.safeParse() validates all fields.
 * Step 3 — Execute:  createTopic() inserts the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes the list.
 */
export async function createTopicAction(formData: FormData): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  const raw = parseTopicFormData(formData)
  const parsed = createTopicSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos invalidos' }
  }

  // Resolve workspace
  let workspaceId: string
  try {
    workspaceId = await getWorkspaceId()
  } catch {
    return { error: 'No se pudo obtener el workspace' }
  }

  // Step 3: Execute
  const result = await createTopic(workspaceId, user.id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('topic.created', {
    workspace_id: workspaceId,
    topic_id: result.data?.id,
    title: parsed.data.title,
    priority: parsed.data.priority,
  })

  revalidatePath('/topics')

  return { success: true }
}

/**
 * Update an existing topic by id.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: partial createTopicSchema validates provided fields.
 * Step 3 — Execute:  updateTopic() patches the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes list and detail.
 */
export async function updateTopicAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  if (!id || id.trim().length === 0) {
    return { error: 'ID de topic requerido' }
  }

  // Step 2: Validate (partial — only provided fields are validated)
  const raw = parseTopicFormData(formData)
  const partialSchema = createTopicSchema.partial()
  const parsed = partialSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute
  const result = await updateTopic(id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('topic.updated', {
    user_id: user.id,
    topic_id: id,
  })

  revalidatePath('/topics')
  revalidatePath(`/topics/${id}`)

  return { success: true }
}

/**
 * Delete a topic by id.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: id must be a non-empty string.
 * Step 3 — Execute:  deleteTopic() removes the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes the list.
 */
export async function deleteTopicAction(id: string): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate id
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { error: 'ID de topic invalido' }
  }

  // Step 3: Execute
  const result = await deleteTopic(id)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('topic.deleted', {
    user_id: user.id,
    topic_id: id,
  })

  revalidatePath('/topics')

  return { success: true }
}

/**
 * Quick status change for a topic (e.g. backlog → selected → used → archived).
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: id and status are validated (status must be a valid TOPIC_STATUS value).
 * Step 3 — Execute:  updateTopic() patches only the status field.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes list and detail.
 */
export async function updateTopicStatusAction(
  id: string,
  status: string
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { error: 'ID de topic invalido' }
  }

  const statusSchema = z.enum(TOPIC_STATUSES)
  const parsedStatus = statusSchema.safeParse(status)

  if (!parsedStatus.success) {
    return {
      error: `Estado invalido. Valores permitidos: ${TOPIC_STATUSES.join(', ')}`,
    }
  }

  // Step 3: Execute
  const result = await updateTopic(id, { status: parsedStatus.data })

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('topic.status_changed', {
    user_id: user.id,
    topic_id: id,
    status: parsedStatus.data,
  })

  revalidatePath('/topics')
  revalidatePath(`/topics/${id}`)

  return { success: true }
}
