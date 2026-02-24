'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import {
  updateBrandProfileSchema,
  type BrandProfile,
  type UpdateBrandProfileInput,
} from '@/shared/types/content-ops'
import {
  getBrandProfiles,
  createBrandProfile,
  updateBrandProfile,
} from '@/features/brand/services/brand-service'

interface ActionResult<T = undefined> {
  data?: T
  error?: string
}

// 1. List all brand profiles for the current workspace
export async function getBrandProfilesAction(): Promise<ActionResult<BrandProfile[]>> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Get workspace
  const workspaceId = await getWorkspaceId()

  // Step 3: Execute
  const result = await getBrandProfiles(workspaceId)
  if (result.error) return { error: result.error }

  return { data: result.data }
}

// 2. Create a new brand profile version
export async function createBrandProfileAction(): Promise<ActionResult<BrandProfile>> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Get workspace
  const workspaceId = await getWorkspaceId()

  // Step 3: Execute
  const result = await createBrandProfile(workspaceId)
  if (result.error) return { error: result.error }

  // Step 4: Side effects
  revalidatePath('/settings/brand')

  return { data: result.data }
}

// 3. Update an existing brand profile
export async function updateBrandProfileAction(
  profileId: string,
  data: UpdateBrandProfileInput
): Promise<ActionResult<BrandProfile>> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Validate input with Zod
  const parsed = updateBrandProfileSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute
  const result = await updateBrandProfile(profileId, parsed.data)
  if (result.error) return { error: result.error }

  // Step 4: Side effects
  revalidatePath('/settings/brand')

  return { data: result.data }
}
