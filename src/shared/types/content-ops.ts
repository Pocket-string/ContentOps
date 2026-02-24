import { z } from 'zod'

// ============================================
// Enums & Constants
// ============================================

export const WORKSPACE_ROLES = ['admin', 'editor', 'collaborator'] as const
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number]

export const TOPIC_PRIORITIES = ['low', 'medium', 'high'] as const
export type TopicPriority = (typeof TOPIC_PRIORITIES)[number]

export const TOPIC_STATUSES = ['backlog', 'selected', 'used', 'archived'] as const
export type TopicStatus = (typeof TOPIC_STATUSES)[number]

export const CAMPAIGN_STATUSES = ['draft', 'in_progress', 'ready', 'published', 'archived'] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

export const POST_STATUSES = ['draft', 'review', 'needs_human_review', 'approved', 'published'] as const
export type PostStatus = (typeof POST_STATUSES)[number]

export const FUNNEL_STAGES = ['tofu_problem', 'mofu_problem', 'tofu_solution', 'mofu_solution', 'bofu_conversion'] as const
export type FunnelStage = (typeof FUNNEL_STAGES)[number]

export const POST_VARIANTS = ['contrarian', 'story', 'data_driven'] as const
export type PostVariant = (typeof POST_VARIANTS)[number]

export const VISUAL_STATUSES = ['draft', 'pending_qa', 'approved', 'rejected'] as const
export type VisualStatus = (typeof VISUAL_STATUSES)[number]

export const ASSET_TYPES = ['image', 'document', 'other'] as const
export type AssetType = (typeof ASSET_TYPES)[number]

// Weekly plan mapping: day → funnel stage
export const WEEKLY_PLAN: Record<number, { label: string; stage: FunnelStage }> = {
  1: { label: 'Lunes', stage: 'tofu_problem' },
  2: { label: 'Martes', stage: 'mofu_problem' },
  3: { label: 'Miércoles', stage: 'tofu_solution' },
  4: { label: 'Jueves', stage: 'mofu_solution' },
  5: { label: 'Viernes', stage: 'bofu_conversion' },
}

// D/G/P/I Score
export const scoreJsonSchema = z.object({
  detener: z.number().min(0).max(5),
  ganar: z.number().min(0).max(5),
  provocar: z.number().min(0).max(5),
  iniciar: z.number().min(0).max(5),
  total: z.number().min(0).max(20),
  notes: z.string().optional(),
})

export type ScoreJson = z.infer<typeof scoreJsonSchema>

// Phase 3: Weekly Brief
export const weeklyBriefSchema = z.object({
  tema: z.string().min(1),
  enemigo_silencioso: z.string().optional(),
  evidencia_clave: z.string().optional(),
  senales_mercado: z.array(z.string()).default([]),
  anti_mito: z.string().optional(),
  buyer_persona: z.string().optional(),
  keyword: z.string().optional(),
  recurso: z.string().optional(),
  restriccion_links: z.boolean().default(true),
  tone_rules: z.string().optional(),
})

export type WeeklyBrief = z.infer<typeof weeklyBriefSchema>

export const publishingPlanEntrySchema = z.object({
  suggested_time: z.string().optional(),
  notes: z.string().optional(),
})

export const publishingPlanSchema = z.record(z.string(), publishingPlanEntrySchema)

export type PublishingPlan = z.infer<typeof publishingPlanSchema>

export const updateBriefSchema = z.object({
  weekly_brief: weeklyBriefSchema,
  publishing_plan: publishingPlanSchema.optional(),
})

export type UpdateBriefInput = z.infer<typeof updateBriefSchema>

// Phase 4: Structured Content
export const structuredContentSchema = z.object({
  hook: z.string().optional(),
  context: z.string().optional(),
  signals: z.string().optional(),
  provocation: z.string().optional(),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
})

export type StructuredContent = z.infer<typeof structuredContentSchema>

// ============================================
// Zod Schemas (for parsing external data)
// ============================================

export const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string(),
})

export const workspaceMemberSchema = z.object({
  workspace_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(WORKSPACE_ROLES),
  joined_at: z.string(),
})

export const researchReportSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  title: z.string().min(1),
  source: z.string().nullable(),
  raw_text: z.string().min(1),
  tags_json: z.array(z.string()),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  // Phase 1: Research Estructurado
  recency_date: z.string().nullable(),
  market_region: z.string().nullable(),
  buyer_persona: z.string().nullable(),
  trend_score: z.number().min(0).max(10).nullable(),
  fit_score: z.number().min(0).max(10).nullable(),
  evidence_links: z.array(z.string()).default([]),
  key_takeaways: z.array(z.string()).default([]),
  recommended_angles: z.array(z.string()).default([]),
  ai_synthesis: z.record(z.unknown()).nullable(),
})

export const topicSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  title: z.string().min(1),
  hypothesis: z.string().nullable(),
  evidence: z.string().nullable(),
  anti_myth: z.string().nullable(),
  signals_json: z.array(z.string()),
  fit_score: z.number().min(0).max(10).nullable(),
  priority: z.enum(TOPIC_PRIORITIES),
  status: z.enum(TOPIC_STATUSES),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  // Phase 2: Topics Enriquecidos
  silent_enemy_name: z.string().nullable(),
  minimal_proof: z.string().nullable(),
  failure_modes: z.array(z.string()).default([]),
  expected_business_impact: z.string().nullable(),
  recommended_week_structure: z.record(z.unknown()).nullable(),
})

export const campaignSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  topic_id: z.string().uuid().nullable(),
  week_start: z.string(),
  keyword: z.string().nullable(),
  resource_json: z.record(z.unknown()),
  audience_json: z.record(z.unknown()),
  status: z.enum(CAMPAIGN_STATUSES),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  // Phase 3: Weekly Brief
  weekly_brief: weeklyBriefSchema.nullable(),
  publishing_plan: publishingPlanSchema.nullable(),
})

export const postSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  day_of_week: z.number().min(1).max(5),
  funnel_stage: z.enum(FUNNEL_STAGES),
  objective: z.string().nullable(),
  status: z.enum(POST_STATUSES),
  created_at: z.string(),
  updated_at: z.string(),
})

export const postVersionSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  version: z.number().min(1),
  variant: z.enum(POST_VARIANTS),
  content: z.string(),
  score_json: scoreJsonSchema.nullable(),
  notes: z.string().nullable(),
  is_current: z.boolean(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  // Phase 4: Structured Content
  structured_content: structuredContentSchema.nullable(),
})

export const visualVersionSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  version: z.number().min(1),
  format: z.string(),
  prompt_json: z.record(z.unknown()),
  qa_json: z.record(z.unknown()).nullable(),
  image_url: z.string().nullable(),
  status: z.enum(VISUAL_STATUSES),
  created_by: z.string().uuid(),
  created_at: z.string(),
  // Phase 6: Visual Concepts
  concept_type: z.string().nullable(),
  // Phase 9: Nano Banana Pro iterations
  nanobanana_run_id: z.string().nullable(),
  output_asset_id: z.string().uuid().nullable(),
  qa_notes: z.string().nullable(),
  iteration_reason: z.string().nullable(),
})

export const assetSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  type: z.enum(ASSET_TYPES),
  url: z.string().url(),
  metadata_json: z.record(z.unknown()),
  created_at: z.string(),
})

export const metricsSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  impressions: z.number().int().min(0),
  comments: z.number().int().min(0),
  saves: z.number().int().min(0),
  shares: z.number().int().min(0),
  leads: z.number().int().min(0),
  notes: z.string().nullable(),
  captured_at: z.string(),
})

export const learningSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  summary: z.string().min(1),
  bullets_json: z.array(z.string()),
  created_by: z.string().uuid(),
  created_at: z.string(),
})

// ============================================
// TypeScript Types (inferred from Zod)
// ============================================

export type Workspace = z.infer<typeof workspaceSchema>
export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>
export type ResearchReport = z.infer<typeof researchReportSchema>
export type Topic = z.infer<typeof topicSchema>
export type Campaign = z.infer<typeof campaignSchema>
export type Post = z.infer<typeof postSchema>
export type PostVersion = z.infer<typeof postVersionSchema>
export type VisualVersion = z.infer<typeof visualVersionSchema>
export type Asset = z.infer<typeof assetSchema>
export type Metrics = z.infer<typeof metricsSchema>
export type Learning = z.infer<typeof learningSchema>

// ============================================
// Input schemas (for forms / Server Actions)
// ============================================

export const createResearchSchema = z.object({
  title: z.string().min(1, 'Titulo requerido'),
  source: z.string().optional(),
  raw_text: z.string().min(10, 'El texto debe tener al menos 10 caracteres'),
  tags_json: z.array(z.string()).default([]),
  // Phase 1: Research Estructurado (all optional for backward compat)
  recency_date: z.string().optional(),
  market_region: z.string().optional(),
  buyer_persona: z.string().optional(),
  trend_score: z.number().min(0).max(10).optional(),
  fit_score: z.number().min(0).max(10).optional(),
  evidence_links: z.array(z.string()).default([]),
  key_takeaways: z.array(z.string()).default([]),
  recommended_angles: z.array(z.string()).default([]),
})

export const createTopicSchema = z.object({
  title: z.string().min(1, 'Titulo requerido'),
  hypothesis: z.string().optional(),
  evidence: z.string().optional(),
  anti_myth: z.string().optional(),
  signals_json: z.array(z.string()).default([]),
  fit_score: z.number().min(0).max(10).optional(),
  priority: z.enum(TOPIC_PRIORITIES).default('medium'),
  // Phase 2: Topics Enriquecidos (all optional for backward compat)
  silent_enemy_name: z.string().optional(),
  minimal_proof: z.string().optional(),
  failure_modes: z.array(z.string()).default([]),
  expected_business_impact: z.string().optional(),
})

export const createCampaignSchema = z.object({
  topic_id: z.string().uuid().optional(),
  week_start: z.string().min(1, 'Fecha de inicio requerida'),
  keyword: z.string().optional(),
  resource_json: z.record(z.unknown()).default({}),
  audience_json: z.record(z.unknown()).default({}),
})

export const savePostVersionSchema = z.object({
  post_id: z.string().uuid(),
  variant: z.enum(POST_VARIANTS),
  content: z.string().min(1, 'Contenido requerido'),
  notes: z.string().optional(),
  // Phase 4: Structured Content
  structured_content: structuredContentSchema.optional(),
})

export const scorePostSchema = z.object({
  post_version_id: z.string().uuid(),
  score: scoreJsonSchema,
})

export const saveMetricsSchema = z.object({
  post_id: z.string().uuid(),
  impressions: z.number().int().min(0).default(0),
  comments: z.number().int().min(0).default(0),
  saves: z.number().int().min(0).default(0),
  shares: z.number().int().min(0).default(0),
  leads: z.number().int().min(0).default(0),
  notes: z.string().optional(),
})

export const saveLearningSchema = z.object({
  campaign_id: z.string().uuid(),
  summary: z.string().min(1, 'Resumen requerido'),
  bullets_json: z.array(z.string()).min(1, 'Al menos un bullet requerido'),
})

export type CreateResearchInput = z.infer<typeof createResearchSchema>
export type CreateTopicInput = z.infer<typeof createTopicSchema>
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type SavePostVersionInput = z.infer<typeof savePostVersionSchema>
export type ScorePostInput = z.infer<typeof scorePostSchema>
export type SaveMetricsInput = z.infer<typeof saveMetricsSchema>
export type SaveLearningInput = z.infer<typeof saveLearningSchema>

// ============================================
// Phase 5: CopyCritic
// ============================================

export const CRITIC_TYPES = ['copy', 'visual'] as const
export type CriticType = (typeof CRITIC_TYPES)[number]

export const CRITIC_VERDICTS = ['pass', 'needs_work', 'rewrite'] as const
export type CriticVerdict = (typeof CRITIC_VERDICTS)[number]

export const FINDING_SEVERITIES = ['blocker', 'warning', 'suggestion'] as const
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number]

export const criticFindingSchema = z.object({
  category: z.string(),
  severity: z.enum(FINDING_SEVERITIES),
  description: z.string(),
  location: z.string().optional(),
})

export type CriticFinding = z.infer<typeof criticFindingSchema>

export const criticReviewSchema = z.object({
  id: z.string().uuid(),
  post_version_id: z.string().uuid(),
  critic_type: z.enum(CRITIC_TYPES),
  score_json: scoreJsonSchema.nullable(),
  findings: z.array(criticFindingSchema),
  suggestions: z.array(z.string()),
  verdict: z.enum(CRITIC_VERDICTS).nullable(),
  created_at: z.string(),
})

export type CriticReview = z.infer<typeof criticReviewSchema>

// ============================================
// Phase 6: Visual Concepts
// ============================================

export const CONCEPT_TYPES = ['infographic_1x1', 'carousel_4x5', 'humanized_photo', 'data_chart', 'custom'] as const
export type ConceptType = (typeof CONCEPT_TYPES)[number]

export const visualConceptSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  concept_type: z.enum(CONCEPT_TYPES),
  rationale: z.string(),
  layout: z.string().nullable(),
  text_budget: z.string().nullable(),
  data_evidence: z.string().nullable(),
  risk_notes: z.string().nullable(),
  selected: z.boolean(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
})

export type VisualConcept = z.infer<typeof visualConceptSchema>

// ============================================
// Phase 8: Brand Profiles
// ============================================

export const brandColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string(),
})

export const brandTypographySchema = z.object({
  heading: z.string(),
  body: z.string(),
  style: z.string(),
})

export const brandLogoRulesSchema = z.object({
  placement: z.string(),
  size: z.string(),
  includeAlways: z.boolean(),
})

export const brandImagerySchema = z.object({
  style: z.string(),
  subjects: z.array(z.string()),
  mood: z.string(),
})

export const brandProfileSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string(),
  version: z.number(),
  is_active: z.boolean(),
  colors: brandColorsSchema,
  typography: brandTypographySchema,
  logo_rules: brandLogoRulesSchema,
  imagery: brandImagerySchema,
  tone: z.string(),
  negative_prompts: z.array(z.string()),
  qa_checklist: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
})

export type BrandProfile = z.infer<typeof brandProfileSchema>
export type BrandColors = z.infer<typeof brandColorsSchema>
export type BrandTypography = z.infer<typeof brandTypographySchema>
export type BrandLogoRules = z.infer<typeof brandLogoRulesSchema>
export type BrandImagery = z.infer<typeof brandImagerySchema>

export const updateBrandProfileSchema = z.object({
  name: z.string().min(1).optional(),
  colors: brandColorsSchema.optional(),
  typography: brandTypographySchema.optional(),
  logo_rules: brandLogoRulesSchema.optional(),
  imagery: brandImagerySchema.optional(),
  tone: z.string().optional(),
  negative_prompts: z.array(z.string()).optional(),
  qa_checklist: z.array(z.string()).optional(),
})

export type UpdateBrandProfileInput = z.infer<typeof updateBrandProfileSchema>

// ============================================
// Phase 12: Pattern Library
// ============================================

export const PATTERN_TYPES = ['hook', 'cta', 'visual_format', 'topic_angle', 'content_structure'] as const
export type PatternType = (typeof PATTERN_TYPES)[number]

export const patternContextSchema = z.object({
  funnel_stage: z.string().optional(),
  variant: z.string().optional(),
  topic: z.string().optional(),
  persona: z.string().optional(),
})

export const patternPerformanceSchema = z.object({
  impressions: z.number().optional(),
  comments: z.number().optional(),
  engagement_rate: z.number().optional(),
  dgpi_score: z.number().optional(),
})

export const patternSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  pattern_type: z.enum(PATTERN_TYPES),
  content: z.string(),
  context: patternContextSchema,
  performance: patternPerformanceSchema,
  source_post_version_id: z.string().uuid().nullable(),
  source_campaign_id: z.string().uuid().nullable(),
  tags: z.array(z.string()),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
})

export type Pattern = z.infer<typeof patternSchema>

export const createPatternSchema = z.object({
  pattern_type: z.enum(PATTERN_TYPES),
  content: z.string().min(1, 'Contenido requerido'),
  context: patternContextSchema.optional(),
  performance: patternPerformanceSchema.optional(),
  source_post_version_id: z.string().uuid().optional(),
  source_campaign_id: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
})

export type CreatePatternInput = z.infer<typeof createPatternSchema>
