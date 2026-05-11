-- PRP-012 Fase 1: Editorial Pillars + Audience Profiles
-- Taxonomia fija de Bitalize (NO workspace-scoped). Solo 6 pilares + 4 audiencias.
-- Diferente de content_pillars (workspace-customizable, existente desde mig 019).

-- ============================================
-- 1. editorial_pillars (global taxonomy)
-- ============================================

CREATE TABLE public.editorial_pillars (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  name                text NOT NULL,
  description         text NOT NULL,
  target_dolor        text NOT NULL,
  hook_examples       jsonb NOT NULL DEFAULT '[]'::jsonb,
  context_for_prompt  text NOT NULL,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.editorial_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "editorial_pillars_read_authenticated"
  ON public.editorial_pillars
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================
-- 2. audience_profiles (global taxonomy)
-- ============================================

CREATE TABLE public.audience_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  role              text NOT NULL,
  dolor_principal   text NOT NULL,
  formato_preferido text NOT NULL,
  hook_template     text NOT NULL,
  cta_template      text NOT NULL,
  angle_for_prompt  text NOT NULL,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audience_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audience_profiles_read_authenticated"
  ON public.audience_profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================
-- 3. Campaign FKs
-- ============================================

ALTER TABLE public.campaigns
  ADD COLUMN editorial_pillar_id uuid REFERENCES public.editorial_pillars(id) ON DELETE SET NULL,
  ADD COLUMN target_audience_id  uuid REFERENCES public.audience_profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_campaigns_editorial_pillar ON public.campaigns(editorial_pillar_id);
CREATE INDEX idx_campaigns_target_audience  ON public.campaigns(target_audience_id);

-- ============================================
-- 4. Seeds: 6 pilares editoriales
-- ============================================

INSERT INTO public.editorial_pillars (slug, name, description, target_dolor, hook_examples, context_for_prompt) VALUES
('perdidas_invisibles_fv',
 'Pérdidas Invisibles FV',
 'Construir la categoría mental de pérdidas que no aparecen en reportes estándar',
 'PR aceptable + caja incómoda; pérdidas que no aparecen en reporte mensual',
 '["Todos miran el PR. Casi nadie mira cuánto dinero se escapa entre reportes.", "Tu PR puede verse aceptable y aun así estar perdiendo caja todos los días.", "Hay pérdidas que no aparecen como alarma. Aparecen como margen que se va."]'::jsonb,
 'Pilar: PÉRDIDAS INVISIBLES FV. El post debe ayudar a construir la categoría mental de pérdidas que NO aparecen en el reporte mensual estándar (soiling, curtailment, clipping, trackers, strings degradados). Conectar siempre lo técnico al impacto en $/día o caja perdida. Audiencia siente: "mi reporte dice que todo está bien, pero la caja dice otra cosa".'
),
('alarm_fatigue',
 'Alarm Fatigue y Backlog',
 'Conectar con Head of O&M sobre el ruido de alarmas y backlog sin priorización económica',
 'Exceso de alarmas, backlog, cuadrillas limitadas, presión por responder rápido',
 '["No todas las alarmas merecen el mismo camión.", "Un backlog de 300 tickets no es un problema técnico. Es un problema de priorización.", "El problema no era la alarma. Era que todas parecían igual de urgentes."]'::jsonb,
 'Pilar: ALARM FATIGUE Y BACKLOG. El post debe abordar el dolor de equipos O&M ahogados en alarmas mal priorizadas. Argumento central: no se necesitan más alarmas, se necesita priorización económica ($/día) para decidir qué cuadrilla va primero. Audiencia siente: "no quiero otro dashboard, quiero saber qué visitar primero".'
),
('data_quality_scada',
 'Data Quality SCADA',
 'Autoridad técnica sobre la calidad de datos como prerequisito para análisis e IA',
 'Datos sucios, tags inconsistentes, reportes manuales, modelos poco confiables',
 '["La IA no arregla datos SCADA sucios.", "Si pasas más tiempo limpiando datos que analizando pérdidas, el problema no eres tú.", "Un bug de fechas puede explicar más pérdidas que un modelo sofisticado."]'::jsonb,
 'Pilar: DATA QUALITY SCADA. El post debe demostrar autoridad técnica sobre el verdadero stack de problemas de O&M: tags cruzados, timestamps inconsistentes, sensores fuera de rango, drift. Argumento central: la IA no rescata datos malos; primero hay que ordenar la señal. Audiencia siente: "mi modelo falla porque mi data está mala, no porque la IA sea mala".'
),
('proof_in_public',
 'Producto en Construcción / Proof in Public',
 'Confianza founder + validación de producto vía decisiones de construcción públicas',
 'Falta de confianza en startup early-stage; necesidad de demostrar criterio, no solo promesas',
 '["Hoy eliminamos una vista del dashboard. Era bonita, pero no ayudaba a decidir.", "Hoy matamos una feature.", "Probamos priorizar por severidad técnica. Falló. Cuando los ordenamos por $/día, la conversación cambió."]'::jsonb,
 'Pilar: PROOF IN PUBLIC. El post debe mostrar evidencia útil del proceso real de construcción de Bitalize. Screenshots anonimizados, features descartadas, aprendizajes de demos, criterios de priorización. Argumento central: confianza founder via criterio demostrado, NO fingir tracción. Audiencia siente: "esta gente realmente entiende el problema, no solo vende".'
),
('traduccion_tecnico_negocio',
 'Traducción Técnico → Negocio',
 'Conectar Asset Manager + O&M + CFO via traducción de métricas técnicas a impacto económico',
 'Métricas técnicas (PR, availability, alarmas) sin traducción a decisiones de caja/riesgo',
 '["El problema no era explicar el PR. Era explicar qué decisión tomar con ese PR.", "Una reunión de performance cambió cuando dejamos de hablar de kWh y empezamos a hablar de $/día.", "Un dashboard de O&M es útil cuando cambia una decisión económica."]'::jsonb,
 'Pilar: TRADUCCIÓN TÉCNICO → NEGOCIO. El post debe traducir explícitamente métricas técnicas a impacto operativo y económico: PR → $/día, availability → riesgo contractual, alarmas → impacto operativo, MWh → presupuesto, backlog → priorización económica. Argumento central: el dato técnico importa cuando cambia una decisión de negocio. Audiencia siente: "ahora puedo explicar esto al directorio".'
),
('conversaciones_mercado',
 'Conversaciones con el Mercado',
 'Market learning + conversación con ICP via aprendizajes de reuniones reales',
 'Decisiones de producto desconectadas del cliente real; objeciones recurrentes no documentadas',
 '["Esta semana escuchamos la misma frase en tres reuniones: no quiero otro dashboard.", "En 12 conversaciones con O&M apareció el mismo patrón.", "Hablamos con un Asset Manager y nos dijo algo simple..."]'::jsonb,
 'Pilar: CONVERSACIONES CON EL MERCADO. El post debe destilar aprendizajes de reuniones reales con ICP: objeciones recurrentes, frases textuales (anonimizadas), dilemas del mercado, preguntas que aparecen una y otra vez. Argumento central: el producto se construye desde lo que escuchamos, no desde lo que imaginamos. Audiencia siente: "esta gente habla con personas como yo, no con avatars".'
);

-- ============================================
-- 5. Seeds: 4 audiencias ICP
-- ============================================

INSERT INTO public.audience_profiles (slug, role, dolor_principal, formato_preferido, hook_template, cta_template, angle_for_prompt) VALUES
('asset_manager',
 'Asset Manager',
 'Explicar performance, riesgo y caja ante dueños/fondos/directorio',
 'Mini caso con números, gráfico waterfall, carrusel ejecutivo',
 'Tu PR puede verse aceptable y aun así [problema económico].',
 '¿Qué pérdida te cuesta más explicar hoy: [opción A], [opción B] o [opción C]?',
 'Audiencia: ASSET MANAGER. Habla en términos de $/día, $/MW/año, riesgo contractual, exposición financiera, P&L del fondo. NO uses jerga SCADA pura (tags, sensores) — traducir siempre a impacto económico. El AM necesita poder defender la decisión ante directorio/dueños. CTA típico: preguntas sobre qué pérdida le cuesta más explicar, qué decisión tomó la última vez ante el directorio.'
),
('head_om',
 'Head of O&M',
 'Exceso de alarmas, backlog, cuadrillas limitadas, presión por responder rápido',
 'Historia de terreno, opinión contraria, checklist operativa',
 'Un backlog de [N] tickets no es un problema técnico. Es un problema de [criterio].',
 '¿Qué criterio usas hoy para decidir qué [acción operativa] atacar primero?',
 'Audiencia: HEAD OF O&M. Habla en términos de cuadrillas, backlog, tickets, tiempo de respuesta, priorización operativa. Usa lenguaje de terreno (escenas, fricciones reales del día a día). El Head O&M está saturado de información — necesita criterio para decidir, no más datos. CTA típico: preguntas sobre cómo priorizan hoy, qué visitan primero, qué patrones ven en operación.'
),
('analista_performance',
 'Analista de Performance',
 'Datos sucios, tags inconsistentes, reportes manuales, Excel eterno, modelos poco confiables',
 'Diagnóstico experto, carrusel técnico, mini demo',
 'La IA no [acción esperada] si tu [recurso técnico] está [problema].',
 '¿Dónde se rompe más seguido tu pipeline de datos: [opciones técnicas]?',
 'Audiencia: ANALISTA DE PERFORMANCE. Habla en términos técnicos finos: tags SCADA, timestamps, drift de sensores, modelos, normalización, validación. Reconoce su experiencia (no es nivel intro). El analista vive entre Excel y dashboards intentando confiar en su data. CTA típico: preguntas técnicas sobre dónde se rompe el pipeline, qué herramienta usa para X.'
),
('ceo_cfo',
 'CEO / CFO / Dueño de Activo',
 'Caja, riesgo, exposición financiera, presupuesto de O&M, payback',
 'Texto + dato macro, ejecutivo de 1500 chars',
 'Perder [%] de [recurso] invisible puede costar más que [mejora visible].',
 '¿Qué nivel de pérdida anual consideras tolerable antes de revisar tu operación con lupa?',
 'Audiencia: CEO / CFO / DUEÑO DE ACTIVO. Habla en términos puramente financieros: caja, riesgo, payback, presupuesto, exposición. Cero jerga técnica (PR, SCADA, availability son OK con definición rápida). El CEO/CFO necesita evidencia simple para decidir si revisar la operación o no. CTA típico: preguntas sobre tolerancia a pérdida, qué nivel de riesgo aceptan.'
);

COMMENT ON TABLE public.editorial_pillars IS 'PRP-012 Fase 1: 6 pilares editoriales globales de Bitalize. Taxonomía fija, no workspace-scoped (diferente de content_pillars).';
COMMENT ON TABLE public.audience_profiles IS 'PRP-012 Fase 1: 4 perfiles ICP globales de Bitalize. Taxonomía fija para inyección de angle en system prompt.';
