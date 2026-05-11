import { z } from 'zod'

export const editorialStructureSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  prompt_blueprint: z.string(),
  ideal_funnel_stage: z.string().nullable(),
  weekday_default: z.number().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export type EditorialStructure = z.infer<typeof editorialStructureSchema>

export const EDITORIAL_STRUCTURE_SLUGS = [
  'nicho_olvidado',
  'aprendizaje_cliente',
  'opinion_contraria_ia',
  'demo_pequena',
  'feature_kill',
  'default',
] as const

export type EditorialStructureSlug = (typeof EDITORIAL_STRUCTURE_SLUGS)[number]
