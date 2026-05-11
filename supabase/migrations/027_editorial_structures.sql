-- PRP-012 Fase 2: Editorial Structures (5 post-archetypes founder-led)
-- Taxonomia propietaria de Bitalize. Diferente de variantes (Revelacion/Terreno/Framework).
-- Estructuras = post-archetypes (formato editorial). Variantes = angulos de ataque.

CREATE TABLE public.editorial_structures (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text UNIQUE NOT NULL,
  name               text NOT NULL,
  description        text NOT NULL,
  prompt_blueprint   text NOT NULL,
  ideal_funnel_stage text,                  -- TOFU/MOFU/BOFU o NULL
  weekday_default    smallint,              -- 1=Mon..5=Fri o NULL (preferencia)
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.editorial_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "editorial_structures_read_authenticated"
  ON public.editorial_structures
  FOR SELECT
  TO authenticated
  USING (is_active = true);

ALTER TABLE public.posts
  ADD COLUMN editorial_structure_slug text NOT NULL DEFAULT 'default'
    REFERENCES public.editorial_structures(slug) ON DELETE SET DEFAULT;

CREATE INDEX idx_posts_editorial_structure ON public.posts(editorial_structure_slug);

INSERT INTO public.editorial_structures (slug, name, description, ideal_funnel_stage, weekday_default, prompt_blueprint) VALUES
('nicho_olvidado',
 'Nicho Olvidado',
 'Todos hablan de X, casi nadie habla de Y, y ahi se pierde dinero',
 'tofu_problem',
 1,
 E'ESTRUCTURA EDITORIAL: NICHO OLVIDADO\n\nObjetivo: alcance y diferenciacion mostrando un problema que la mayoria ignora.\n\nFlujo:\n1. ABRIR con lo que todos miran (algo obvio del sector)\n2. CONTRASTAR con lo que casi nadie mira (el nicho olvidado)\n3. EJEMPLIFICAR donde se pierde dinero/tiempo en ese nicho\n4. CERRAR con pregunta de experiencia concreta\n\nReglas:\n- El hook NO puede ser generico ("En el mundo de...")\n- Mostrar 1 contraste explicito (X vs Y)\n- Si no hay un nicho real olvidado, NO uses esta estructura\n- Producto Bitalize aparece SOLO como consecuencia natural, no como protagonista'
),
('aprendizaje_cliente',
 'Aprendizaje de Cliente',
 'Lo que aprendimos hablando con X clientes',
 'mofu_problem',
 2,
 E'ESTRUCTURA EDITORIAL: APRENDIZAJE DE CLIENTE\n\nObjetivo: autoridad temprana via discovery real, conexion con ICP.\n\nFlujo:\n1. Hablamos con X profesionales (numero especifico, rol especifico)\n2. Pensabamos que el dolor era A\n3. APARECIO B (giro inesperado)\n4. Eso cambia C en como pensamos el producto\n5. Por eso construimos D\n6. Pregunta abierta a la audiencia\n\nReglas:\n- DEBE incluir frase textual de un cliente (anonimizada)\n- DEBE incluir numero especifico (X conversaciones, Y clientes)\n- El giro B debe ser sorprendente, no obvio\n- NO promesas de ROI, solo aprendizaje'
),
('opinion_contraria_ia',
 'La IA no es magia',
 'Tesis contraria con matiz tecnico',
 'tofu_solution',
 3,
 E'ESTRUCTURA EDITORIAL: LA IA NO ES MAGIA (OPINION CONTRARIA)\n\nObjetivo: diferenciacion frente a consultores genericos de IA + autoridad tecnica.\n\nFlujo:\n1. Creencia comun (lo que se asume sobre la IA/tecnologia/dashboards)\n2. Tesis contraria explicita (1 oracion fuerte)\n3. Evidencia tecnica concreta (datos sucios, drift, tags cruzados, etc)\n4. Matiz (cuando SI funciona, no es absolutismo)\n5. Implicancia practica para la audiencia\n6. Pregunta tecnica especifica\n\nReglas:\n- NO atacar a personas, atacar a la creencia\n- Demostrar conocimiento tecnico fino (tags, timestamps, drift)\n- El matiz es OBLIGATORIO (no ser absolutista)\n- Cerrar con pregunta tecnica, no generica'
),
('demo_pequena',
 'Demo pequena, problema grande',
 'Un screenshot/feature que responde una pregunta grande',
 'mofu_solution',
 4,
 E'ESTRUCTURA EDITORIAL: DEMO PEQUENA, PROBLEMA GRANDE\n\nObjetivo: producto + leads + validacion suave.\n\nFlujo:\n1. Sintoma comun (el problema que el equipo sufre)\n2. Screenshot/descripcion de la vista del producto\n3. Que muestra (1-2 frases)\n4. Por que importa (conecta a decision)\n5. Que decision habilita (el cambio que provoca)\n6. CTA suave: "si quieres verlo con tus datos..."\n\nReglas:\n- El producto APARECE pero no es protagonista del hook\n- Conectar siempre a $/dia o decision operativa\n- CTA NO es pregunta abierta vacia, es invitacion a ver con datos propios\n- Si no hay un screenshot/feature concreto, NO uses esta estructura'
),
('feature_kill',
 'Hoy matamos una feature',
 'Proof in public: una decision fuerte de descartar algo',
 'bofu_conversion',
 5,
 E'ESTRUCTURA EDITORIAL: HOY MATAMOS UNA FEATURE\n\nObjetivo: proof in public, confianza, criterio de producto.\n\nFlujo:\n1. DECISION FUERTE (lo que descartamos, eliminamos, cambiamos)\n2. Que feature/vista/idea era (descripcion concreta)\n3. Por que NO servia (razon honesta)\n4. Que aprendimos del fallo\n5. Que haremos ahora (siguiente version del producto)\n6. Pregunta abierta de preferencia\n\nReglas:\n- DEBE ser una decision real, no inventada\n- La razon de fallo debe ser concreta (no generica)\n- Demostrar criterio: no eliminamos por capricho, eliminamos por dato/feedback\n- Cerrar con preferencia (que prefieres tu, mas X o mas Y)'
),
('default',
 'Default (sin archetype editorial)',
 'Sin estructura especifica; flujo del Framework Solar Story estandar',
 NULL,
 NULL,
 'Sin estructura editorial especifica. Sigue el Framework Solar Story estandar de Jonathan Navarrete (PRP-009).'
);

COMMENT ON TABLE public.editorial_structures IS 'PRP-012 Fase 2: 5 post-archetypes founder-led + 1 default. Inyectados como structure_blueprint al system prompt de generate-copy.';
COMMENT ON COLUMN public.posts.editorial_structure_slug IS 'PRP-012: assigned by structure-distributor antes de generar copy. Override manual via PostEditor.';
