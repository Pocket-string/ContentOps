import { z } from 'zod'

/** Schema for ChatGPT copy review output */
export const copyReviewSchema = z.object({
  overall_score: z.number().min(0).max(10),
  strengths: z.array(z.string()).max(3),
  weaknesses: z.array(z.string()).max(3),
  recommendation: z.enum(['publish', 'minor_edits', 'major_rewrite']),
  one_line_summary: z.string(),
})

export type CopyReview = z.infer<typeof copyReviewSchema>

/** Schema for ChatGPT visual prompt review output */
export const visualReviewSchema = z.object({
  coherence_score: z.number().min(0).max(10),
  brand_alignment: z.enum(['strong', 'adequate', 'weak']),
  issues: z.array(z.string()).max(3),
  recommendation: z.enum(['ready', 'needs_adjustments', 'rebuild']),
  one_line_summary: z.string(),
})

export type VisualReview = z.infer<typeof visualReviewSchema>
