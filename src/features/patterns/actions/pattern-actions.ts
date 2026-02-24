'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { createPatternSchema, type Pattern, type CreatePatternInput } from '@/shared/types/content-ops'
import { getPatterns, createPattern, deletePattern } from '@/features/patterns/services/pattern-service'

interface ActionResult<T = undefined> {
  data?: T
  error?: string
}

/**
 * Step 1: Auth
 * Step 2: Get workspace
 * Step 3: Execute
 * Step 4: Return
 */
export async function getPatternsAction(
  patternType?: string
): Promise<ActionResult<Pattern[]>> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Get workspace
  const workspaceId = await getWorkspaceId()

  // Step 3: Execute
  const result = await getPatterns(workspaceId, patternType)
  if (result.error) return { error: result.error }

  return { data: result.data }
}

/**
 * Step 1: Auth
 * Step 2: Validate with Zod
 * Step 3: Execute
 * Step 4: Revalidate + return
 */
export async function createPatternAction(
  data: CreatePatternInput
): Promise<ActionResult<Pattern>> {
  // Step 1: Auth
  const user = await requireAuth()

  // Step 2: Validate with Zod
  const parsed = createPatternSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Get workspace + execute
  const workspaceId = await getWorkspaceId()
  const result = await createPattern(workspaceId, user.id, parsed.data)
  if (result.error) return { error: result.error }

  // Step 4: Side effects
  revalidatePath('/patterns')

  return { data: result.data }
}

/**
 * Step 1: Auth
 * Step 2: Execute
 * Step 3: Revalidate + return
 */
export async function deletePatternAction(
  patternId: string
): Promise<ActionResult> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Execute
  const result = await deletePattern(patternId)
  if (result.error) return { error: result.error }

  // Step 3: Side effects
  revalidatePath('/patterns')

  return {}
}
