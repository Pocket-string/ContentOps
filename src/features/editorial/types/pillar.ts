import { z } from 'zod'

export const editorialPillarSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  target_dolor: z.string(),
  hook_examples: z.array(z.string()).default([]),
  context_for_prompt: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export type EditorialPillar = z.infer<typeof editorialPillarSchema>

export const EDITORIAL_PILLAR_SLUGS = [
  'perdidas_invisibles_fv',
  'alarm_fatigue',
  'data_quality_scada',
  'proof_in_public',
  'traduccion_tecnico_negocio',
  'conversaciones_mercado',
] as const

export type EditorialPillarSlug = (typeof EDITORIAL_PILLAR_SLUGS)[number]
