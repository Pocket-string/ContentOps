/**
 * PRP-013: Auditor visual 10-point anti-genérico.
 *
 * Evalúa una imagen ya generada contra 10 criterios binarios (B2B SaaS marketing lens).
 * Output: score 0-50 + 10 checks + verdict (publishable / retry_recommended / regenerate).
 *
 * NOTA: Endpoint nuevo separado del `critic-visual` legacy (que evalúa prompt_json, no imagen).
 */

import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { getModel } from '@/shared/lib/ai-router'
import { generateText } from 'ai'
import { ARCHETYPE_SLUGS } from '@/features/visuals/types/archetype'

// ============================================
// Schemas
// ============================================

const checkSchema = z.object({
  id: z.string(),
  label: z.string(),
  passed: z.boolean(),
  reason: z.string().optional().default(''),
})

const auditOutputSchema = z.object({
  checks: z.array(checkSchema).length(10),
  findings: z.array(z.string()).max(10),
  score: z.number().int().min(0).max(50),
  verdict: z.enum(['publishable', 'retry_recommended', 'regenerate']),
})

export type AuditVisualOutput = z.infer<typeof auditOutputSchema>

const inputSchema = z.object({
  image_url: z.string().url('image_url debe ser una URL válida'),
  post_content: z.string().min(1, 'Contenido del post requerido'),
  archetype: z.enum(ARCHETYPE_SLUGS).optional(),
  format: z.string().default('1:1'),
})

// ============================================
// The 10 binary checks (B2B SaaS marketing lens)
// ============================================

const CHECKS_SPEC = [
  { id: '3_second_clarity', label: '3-second clarity' },
  { id: 'real_fv_problem', label: 'Real FV problem (not abstract)' },
  { id: 'technical_element', label: 'Technical element recognizable (tracker/SCADA/PR/curve)' },
  { id: 'quantified_data', label: 'Quantified data (MW/$/% /kWh)' },
  { id: 'single_focus', label: 'Single focus (one idea)' },
  { id: 'mobile_readable', label: 'Mobile readable at 25% size' },
  { id: 'anti_stock', label: 'Anti-stock (no generic AI/stock photos)' },
  { id: 'decision_oriented', label: 'Decision-oriented (not decorative)' },
  { id: 'brand_compliant', label: 'Brand compliant (Bitalize glass-pill bottom-right, paleta, top-left clean)' },
  { id: 'anti_ai_template', label: 'Anti-AI template (no 360Brew penalty look)' },
] as const

// ============================================
// Handler
// ============================================

export async function POST(request: Request): Promise<Response> {
  const user = await requireAuth()

  const rateLimitResult = aiRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo de la solicitud invalido' }, { status: 400 })
  }

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  const workspaceId = await getWorkspaceId()
  const { image_url, post_content, archetype, format } = parsed.data

  // Build the audit prompt
  const checksList = CHECKS_SPEC.map((c, i) =>
    `${i + 1}. **${c.id}** — ${c.label}`
  ).join('\n')

  const systemPrompt = `Eres un experto en marketing B2B SaaS startup early-stage especializado en LinkedIn. Tu trabajo es AUDITAR un visual ya generado contra 10 criterios binarios anti-genérico (PRP-013).

Cada check es pass/fail. La suma da un score 0-50 (cada pass = +5 puntos).

## Los 10 checks

${checksList}

## Detalle de cada check

1. **3_second_clarity**: ¿Se entiende la idea principal en ≤3 segundos? Fail si requiere leer texto denso para entender.
2. **real_fv_problem**: ¿Muestra un problema FV específico (TRACKERS, SCADA, PR, alarmas, pérdidas)? Fail si es abstracto/decorativo o no-FV.
3. **technical_element**: ¿Tiene al menos UN elemento técnico FV reconocible (tracker, inversor, curva PR, dashboard SCADA, mapa de planta, panel anotado)?
4. **quantified_data**: ¿Aparece al menos 1 número concreto (MW, $/año, %, kWh, hr)? Fail si todo es cualitativo.
5. **single_focus**: ¿Una idea principal (no múltiples compitiendo)? Fail si hay >1 mensaje protagonista.
6. **mobile_readable**: ¿Texto legible al 25% del tamaño en mobile? Fail si tipografía muy pequeña o densa.
7. **anti_stock**: ¿NO es stock photo, robot IA, render 3D genérico, manos+teclado, paneles+sunset? Fail si tiene look de stock.
8. **decision_oriented**: ¿Conecta a una decisión operativa (qué mirar, qué priorizar, qué decidir)? Fail si es decorativo.
9. **brand_compliant**: PASS si TODAS estas condiciones se cumplen:
   (a) Logo Bitalize presente como pill semi-transparente bottom-right (NO franja blanca al pie, NO logo bottom-left).
   (b) Esquina top-left NO muestra logo de producto fuente (ej. lucvia, mantenimiento.jonadata.cloud) — debe estar limpia o cubierta.
   (c) Paleta azul marino + naranja, rojo SOLO en pérdidas/riesgo (no decorativo).
   FAIL si NO hay logo Bitalize visible, o si aparece franja blanca al pie, o si se ve logo del producto fuente, o si la paleta rompe la regla de color.
10. **anti_ai_template**: ¿NO parece template AI-generado (anti-360Brew penalty)? Fail si tiene look "startup futurista AI generic".

## Verdict

- **publishable**: score ≥ 45 (≥9 de 10 checks pass)
- **retry_recommended**: score 35-44 (7-8 checks pass)
- **regenerate**: score < 35 (≤6 checks pass)

## Findings

Lista accionable (máximo 10 items) — texto que el usuario puede pegar en "Regenerar con feedback". Cada finding empieza con verbo imperativo. Ejemplos: "Aumenta el tamaño de la fuente principal a 60pt", "Agrega un número de pérdida en \$/año", "Quita la flecha del centro que distrae", "Cubre el logo del producto fuente en la esquina superior izquierda".

IMPORTANTE: responde SOLO con JSON válido, sin markdown, sin backticks, sin texto adicional. Estructura:
{
  "checks": [
    { "id": "3_second_clarity", "label": "...", "passed": true|false, "reason": "..." },
    ... 10 items total
  ],
  "findings": ["...", "..."],
  "score": <number 0-50>,
  "verdict": "publishable" | "retry_recommended" | "regenerate"
}`

  const userPrompt = `Audita esta imagen visual:

**Formato target**: ${format}
${archetype ? `**Archetype**: ${archetype}` : ''}
**Imagen a auditar**: ${image_url}

**Copy del post asociado** (referencia para coherencia):
"""
${post_content}
"""

Aplica los 10 checks contra la imagen. El score debe ser exactamente 5 × (número de checks pass). Devuelve JSON exacto.`

  try {
    const model = await getModel('critic-visual', workspaceId)
    const result = await generateText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image', image: image_url },
          ],
        },
      ],
    })

    // Parse the JSON response
    let jsonText = result.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(jsonText)
    } catch (e) {
      console.error('[audit-visual] JSON parse error:', e, 'text:', jsonText.slice(0, 500))
      return Response.json(
        { error: 'AI response was not valid JSON. Try again.' },
        { status: 502 }
      )
    }

    const validated = auditOutputSchema.safeParse(parsedJson)
    if (!validated.success) {
      console.error('[audit-visual] schema validation failed:', validated.error.issues)
      return Response.json(
        { error: 'AI response did not match expected schema.', details: validated.error.issues },
        { status: 502 }
      )
    }

    // Sanity check: score = 5 * pass_count
    const passCount = validated.data.checks.filter((c) => c.passed).length
    const expectedScore = passCount * 5
    if (validated.data.score !== expectedScore) {
      // Auto-correct the score
      validated.data.score = expectedScore
    }

    // Recompute verdict from score (defensive)
    let verdict: 'publishable' | 'retry_recommended' | 'regenerate'
    if (validated.data.score >= 45) verdict = 'publishable'
    else if (validated.data.score >= 35) verdict = 'retry_recommended'
    else verdict = 'regenerate'
    validated.data.verdict = verdict

    return Response.json({ data: validated.data })
  } catch (error) {
    console.error('[audit-visual] error:', error)
    return Response.json(
      { error: 'Error al auditar el visual. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
