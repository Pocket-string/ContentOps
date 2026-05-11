import { z } from 'zod'

export const audienceProfileSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  role: z.string(),
  dolor_principal: z.string(),
  formato_preferido: z.string(),
  hook_template: z.string(),
  cta_template: z.string(),
  angle_for_prompt: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export type AudienceProfile = z.infer<typeof audienceProfileSchema>

export const AUDIENCE_SLUGS = [
  'asset_manager',
  'head_om',
  'analista_performance',
  'ceo_cfo',
] as const

export type AudienceSlug = (typeof AUDIENCE_SLUGS)[number]
