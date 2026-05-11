import type { EditorialStructure, EditorialStructureSlug } from '../types/structure'

/**
 * PRP-012 Fase 2: Structure Distributor
 *
 * Assigns 1 distinct editorial structure to each of N posts in a weekly campaign.
 * Constraints (from research validation 2025-2026):
 *   - 5 estructuras distintas por semana
 *   - NO repetir misma estructura 2 dias seguidos
 *   - Respetar weekday_default si la estructura lo tiene (preferencia, no constraint duro)
 *   - Si la estructura tiene ideal_funnel_stage que matchea el funnel del post, priorizar
 *
 * NO usa mix porcentual 30/25/20/15/10 (refutado por research — drop confirmado).
 */

export interface PostAssignmentInput {
  post_id: string
  day_of_week: number              // 1=Mon..7=Sun
  funnel_stage: string             // tofu_problem | mofu_problem | tofu_solution | mofu_solution | bofu_conversion
}

export interface PostAssignmentOutput {
  post_id: string
  editorial_structure_slug: EditorialStructureSlug
}

/**
 * Distribute structures across posts.
 * Greedy: prefer structures whose weekday_default matches day_of_week, then ideal_funnel_stage, then unused.
 */
export function distributeStructures(
  posts: PostAssignmentInput[],
  structures: EditorialStructure[]
): PostAssignmentOutput[] {
  // Use only non-default, active structures for distribution
  const pool = structures.filter((s) => s.is_active && s.slug !== 'default')

  // If we have fewer structures than posts, allow reuse — but never consecutive days
  // Sort posts by day_of_week ascending
  const sortedPosts = [...posts].sort((a, b) => a.day_of_week - b.day_of_week)

  const assignments: PostAssignmentOutput[] = []
  const lastSlugByDay = new Map<number, EditorialStructureSlug>()

  for (const post of sortedPosts) {
    const previousDaySlug = lastSlugByDay.get(post.day_of_week - 1)

    // Score each structure candidate
    const candidates = pool
      .filter((s) => s.slug !== previousDaySlug)            // no repetir dia consecutivo
      .map((s) => {
        let score = 0
        // +10 if weekday matches preference
        if (s.weekday_default === post.day_of_week) score += 10
        // +5 if funnel matches preference
        if (s.ideal_funnel_stage && s.ideal_funnel_stage === post.funnel_stage) score += 5
        // -3 if structure already used in this batch (avoid clustering)
        const alreadyUsed = assignments.some((a) => a.editorial_structure_slug === s.slug)
        if (alreadyUsed) score -= 3
        return { structure: s, score }
      })
      .sort((a, b) => b.score - a.score)

    const chosen = candidates[0]?.structure
    const slug = (chosen?.slug ?? 'default') as EditorialStructureSlug
    assignments.push({
      post_id: post.post_id,
      editorial_structure_slug: slug,
    })
    lastSlugByDay.set(post.day_of_week, slug)
  }

  return assignments
}
