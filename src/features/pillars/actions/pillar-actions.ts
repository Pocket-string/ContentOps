'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { track } from '@/lib/tracking'
import { createPillarSchema } from '@/shared/types/content-ops'
import {
  createPillar,
  updatePillar,
  deletePillar,
} from '../services/pillar-service'

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
 * Parse FormData fields for pillar forms.
 *
 * - name: required string.
 * - description: empty string becomes undefined so Zod's .optional() leaves
 *   it unset rather than storing "".
 * - color: hex string, defaults to '#6B7280' if missing.
 * - sort_order: comes as a string from <input type="number">, converted to
 *   number. Missing or non-numeric value yields 0.
 */
function parsePillarFormData(formData: FormData): Record<string, unknown> {
  const description = formData.get('description')
  const rawSortOrder = formData.get('sort_order')

  let sortOrder = 0
  if (typeof rawSortOrder === 'string' && rawSortOrder.trim().length > 0) {
    const num = Number(rawSortOrder)
    if (!Number.isNaN(num) && num >= 0) {
      sortOrder = num
    }
  }

  return {
    name: formData.get('name'),
    description:
      typeof description === 'string' && description.trim().length > 0
        ? description.trim()
        : undefined,
    color: formData.get('color') ?? '#6B7280',
    sort_order: sortOrder,
  }
}

// ============================================
// Server Actions
// ============================================

/**
 * Create a new content pillar.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: createPillarSchema.safeParse() validates all fields.
 * Step 3 — Execute:  createPillar() inserts the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes the list.
 */
export async function createPillarAction(formData: FormData): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate
  const raw = parsePillarFormData(formData)
  const parsed = createPillarSchema.safeParse(raw)

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
  const result = await createPillar(workspaceId, user.id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('pillar.created', {
    workspace_id: workspaceId,
    pillar_id: result.data?.id,
    name: parsed.data.name,
  })

  revalidatePath('/pillars')

  return { success: true }
}

/**
 * Update an existing content pillar by id.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: partial createPillarSchema validates provided fields.
 * Step 3 — Execute:  updatePillar() patches the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes list and detail.
 */
export async function updatePillarAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  if (!id || id.trim().length === 0) {
    return { error: 'ID de pilar requerido' }
  }

  // Step 2: Validate (partial — only provided fields are validated)
  const raw = parsePillarFormData(formData)
  const partialSchema = createPillarSchema.partial()
  const parsed = partialSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute
  const result = await updatePillar(id, parsed.data)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('pillar.updated', {
    user_id: user.id,
    pillar_id: id,
  })

  revalidatePath('/pillars')
  revalidatePath(`/pillars/${id}`)

  return { success: true }
}

/**
 * Delete a content pillar by id.
 *
 * Step 1 — Auth:     requireAuth() redirects if not authenticated.
 * Step 2 — Validate: id must be a non-empty string.
 * Step 3 — Execute:  deletePillar() removes the row via Supabase.
 * Step 4 — Side fx:  track() fires event, revalidatePath() refreshes the list.
 */
export async function deletePillarAction(id: string): Promise<ActionResult> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate id
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return { error: 'ID de pilar invalido' }
  }

  // Step 3: Execute
  const result = await deletePillar(id)

  if (result.error) {
    return { error: result.error }
  }

  // Step 4: Side effects
  track('pillar.deleted', {
    user_id: user.id,
    pillar_id: id,
  })

  revalidatePath('/pillars')

  return { success: true }
}
