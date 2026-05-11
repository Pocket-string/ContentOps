-- ============================================================
-- PRP-013: Visual Strategy — 9 archetypes + 10-point auditor + overlay pipeline
-- ============================================================

-- 1. visual_versions: nuevas columnas para archetype, auditor, base image
ALTER TABLE visual_versions
  ADD COLUMN IF NOT EXISTS archetype TEXT
    CHECK (archetype IN (
      'screenshot_annotated',
      'dashboard_annotated',
      'carousel_mini_report',
      'data_decision_flow',
      'before_after',
      'field_photo_overlay',
      'founder_proof',
      'technical_report',
      'risk_card'
    ));

ALTER TABLE visual_versions
  ADD COLUMN IF NOT EXISTS auditor_score INTEGER
    CHECK (auditor_score BETWEEN 0 AND 50);

ALTER TABLE visual_versions
  ADD COLUMN IF NOT EXISTS auditor_findings JSONB DEFAULT '[]'::jsonb;

ALTER TABLE visual_versions
  ADD COLUMN IF NOT EXISTS auditor_verdict TEXT
    CHECK (auditor_verdict IN ('publishable', 'retry_recommended', 'regenerate'));

ALTER TABLE visual_versions
  ADD COLUMN IF NOT EXISTS auditor_checks JSONB DEFAULT '[]'::jsonb;

-- Pipeline overlay-only: base image source
ALTER TABLE visual_versions
  ADD COLUMN IF NOT EXISTS base_image_url TEXT;

ALTER TABLE visual_versions
  ADD COLUMN IF NOT EXISTS base_image_source TEXT
    CHECK (base_image_source IN ('playwright_capture', 'manual_upload', 'ai_generated'));

ALTER TABLE visual_versions
  ADD COLUMN IF NOT EXISTS annotations_json JSONB DEFAULT '[]'::jsonb;

-- 2. carousel_slides: extender slide_role para mini-report (7 roles)
-- El check actual permite: cover, context, deep_dive, evidence, method, cta_close
-- Mini-report agrega: problem, why_matters, breakdown, example, framework
-- Solucion: drop+add check con union de ambos sets
ALTER TABLE carousel_slides
  DROP CONSTRAINT IF EXISTS carousel_slides_slide_role_check;

ALTER TABLE carousel_slides
  ADD CONSTRAINT carousel_slides_slide_role_check
  CHECK (slide_role IN (
    -- PRP-011 originales
    'cover', 'context', 'deep_dive', 'evidence', 'method', 'cta_close',
    -- PRP-013 nuevos (carousel_mini_report)
    'problem', 'why_matters', 'breakdown', 'example', 'framework'
  ));

-- carousel_slides puede tener base_image_url propio (cuando un slide es captura real)
ALTER TABLE carousel_slides
  ADD COLUMN IF NOT EXISTS base_image_url TEXT;

ALTER TABLE carousel_slides
  ADD COLUMN IF NOT EXISTS annotations_json JSONB DEFAULT '[]'::jsonb;

-- 3. brand_profiles: biblioteca de plantillas JSON por archetype
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS visual_templates JSONB DEFAULT '{}'::jsonb;

-- 4. Seed visual_templates para workspaces activos
-- (idempotente: solo escribe si visual_templates está vacío)
UPDATE brand_profiles
SET visual_templates = jsonb_build_object(
  'screenshot_annotated', jsonb_build_object(
    'prompt_overall', 'Real screenshot of Bitalize product UI (lucvia.com or mantenimiento.jonadata.cloud). Use as base image - DO NOT regenerate the UI. AI suggests 2-4 annotation overlays only.',
    'layout', '1:1',
    'annotations_max', 4,
    'style', 'editorial_sober_with_callouts',
    'negative_prompts', jsonb_build_array('stock photo', 'robot AI', 'futuristic 3D', 'sunset gradient', 'fake UI'),
    'color_accent_role', 'loss_only'
  ),
  'dashboard_annotated', jsonb_build_object(
    'prompt_overall', 'Real Bitalize dashboard view (curva de potencia, performance ratio, alarmas). Zoom on one insight. AI suggests 2-3 annotations highlighting the key signal.',
    'layout', '1:1',
    'annotations_max', 3,
    'style', 'editorial_sober_with_one_focus',
    'negative_prompts', jsonb_build_array('dashboard limpio sin contexto', 'todo verde', 'multiple competing insights'),
    'color_accent_role', 'loss_only'
  ),
  'carousel_mini_report', jsonb_build_object(
    'prompt_overall', '7-slide carousel PDF, 4:5 aspect ratio. Roles: cover -> problem -> why_matters -> breakdown -> example -> framework -> cta_close. Slides 4-5 may use real Bitalize captures; rest AI conceptual.',
    'layout', '4:5',
    'slide_count', 7,
    'annotations_max', 4,
    'style', 'mini_report_editorial',
    'negative_prompts', jsonb_build_array('more than 15 slides', 'mixing aspect ratios', 'text > 280 chars per slide'),
    'color_accent_role', 'loss_only'
  ),
  'data_decision_flow', jsonb_build_object(
    'prompt_overall', 'Horizontal or circular flow diagram with 4-6 blocks. Each block: 1 verb + micro-icon. Arrows labeled with transformation. Example: SCADA raw -> validation -> event -> $/day loss -> priority -> O&M action.',
    'layout', '1:1',
    'annotations_max', 6,
    'style', 'clean_diagram_with_labeled_arrows',
    'negative_prompts', jsonb_build_array('consulting boxes with no content', 'more than 6 blocks', 'generic icons'),
    'color_accent_role', 'method'
  ),
  'before_after', jsonb_build_object(
    'prompt_overall', 'Split-screen 50/50 vertical. Left: previous state (gray, chaotic, dense). Right: new state (clear, prioritized, actionable). Max 2-3 elements per side.',
    'layout', '1:1',
    'annotations_max', 3,
    'style', 'split_screen_contrast',
    'negative_prompts', jsonb_build_array('exaggerated antes side', 'more than 3 elements per side', 'stock photo before-after'),
    'color_accent_role', 'neutral'
  ),
  'field_photo_overlay', jsonb_build_object(
    'prompt_overall', 'Real field photo (solar plant, tracker, control room - NEVER stock). Photo fills 70-80% of frame. Brief text overlay (1 sentence + optional stat). No staged poses.',
    'layout', '1:1',
    'annotations_max', 2,
    'style', 'documentary_overlay',
    'negative_prompts', jsonb_build_array('stock photo with posed model', 'office people', 'futuristic 3D render', 'sunset gradient', 'avatars'),
    'color_accent_role', 'loss_only'
  ),
  'founder_proof', jsonb_build_object(
    'prompt_overall', 'Whiteboard sketch, Miro board capture, notebook diagram, or product decision artifact. Intentionally imperfect - that IS the founder proof. Minimal overlay (title + 1 sentence).',
    'layout', '1:1',
    'annotations_max', 3,
    'style', 'authentic_artifact',
    'negative_prompts', jsonb_build_array('clean staged whiteboard', 'polished wireframes', 'futuristic startup aesthetic', 'product renders'),
    'color_accent_role', 'neutral'
  ),
  'technical_report', jsonb_build_object(
    'prompt_overall', 'Engineering note style. Light/white background, title at top in technical report format. ONE simple central chart (NOT a dashboard). Short technical note below. Source/assumption at foot.',
    'layout', '4:5',
    'annotations_max', 3,
    'style', 'paper_engineering_note',
    'negative_prompts', jsonb_build_array('multiple charts in one visual', 'no source cited', 'dense academic tone'),
    'color_accent_role', 'loss_only'
  ),
  'risk_card', jsonb_build_object(
    'prompt_overall', 'Insurance-style risk card with 5 fields: cause, impact ($/year), diagnostic confidence (high/med/low), suggested action, priority traffic light. Card layout, clean.',
    'layout', '1:1',
    'annotations_max', 5,
    'style', 'insurtech_card',
    'negative_prompts', jsonb_build_array('fabricated data', 'more than 5 fields', 'generic SaaS card look', 'any client name'),
    'color_accent_role', 'loss_only'
  )
)
WHERE is_active = true
  AND (visual_templates IS NULL OR visual_templates = '{}'::jsonb);

-- 5. Indices auxiliares (no obligatorios, performance hints)
CREATE INDEX IF NOT EXISTS idx_visual_versions_archetype
  ON visual_versions(archetype) WHERE archetype IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_visual_versions_auditor_verdict
  ON visual_versions(auditor_verdict) WHERE auditor_verdict IS NOT NULL;

-- ============================================================
-- Storage bucket for base images (capture-overlay pipeline)
-- ============================================================
-- IMPORTANTE: el bucket se crea por separado vía Supabase MCP o dashboard,
-- no en migración SQL (limitación de supabase.storage en migraciones).
-- Nombre: visual-base-images
-- RLS: workspace_members read/write archivos de su workspace
-- (Se aplica como step separado en Fase 2)

-- ============================================================
-- Notes
-- ============================================================
-- - concept_type pre-existente NO se modifica (retrocompat con PRP-011)
-- - archetype es columna nueva paralela
-- - is_current y selected_variant lógica NO cambia
-- - RLS hereda de visual_versions / carousel_slides / brand_profiles existentes
