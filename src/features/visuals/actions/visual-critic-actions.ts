'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { createCriticReview } from '@/features/posts/services/critic-service'

/**
 * Persists a visual critic review to the critic_reviews table.
 * Uses post_version_id column to store the visual_version_id UUID
 * since the table accepts any UUID reference for both critic types.
 */
export async function saveVisualCriticAction(
  visualVersionId: string,
  scoreJson: unknown,
  findings: unknown[],
  suggestions: string[],
  verdict: string,
  campaignId: string
): Promise<{ success?: true; error?: string }> {
  await requireAuth()

  const result = await createCriticReview(
    visualVersionId,
    'visual',
    scoreJson,
    findings,
    suggestions,
    verdict
  )

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true }
}
