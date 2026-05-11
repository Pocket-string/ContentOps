/**
 * PRP-013: Compose annotated overlay endpoint.
 *
 * Takes a base_image_url (real product screenshot) + post context + archetype
 * → Vision AI (Gemini) suggests annotation JSON
 * → sharp composes overlay on top of base
 * → uploads final composited image to Storage
 * → returns image_url
 *
 * CRITICAL: Vision AI ONLY suggests positions/text/colors of annotations.
 * It does NOT regenerate the UI. The base image stays intact.
 */

import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { getModel } from '@/shared/lib/ai-router'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { ARCHETYPE_SLUGS } from '@/features/visuals/types/archetype'
import { ARCHETYPE_REGISTRY } from '@/features/visuals/constants/archetypes'
import {
  composeOverlay,
  type Annotation,
  type AnnotationStyle,
  type AnnotationColor,
} from '@/features/visuals/services/screenshot-overlay-composer'

const BUCKET = 'visual-assets'

const inputSchema = z.object({
  base_image_url: z.string().url(),
  post_id: z.string().uuid().optional(),
  visual_version_id: z.string().uuid().optional(),
  archetype: z.enum(ARCHETYPE_SLUGS),
  post_content: z.string().min(1),
  format: z.enum(['1:1', '4:5', '16:9', '9:16']).default('1:1'),
})

const annotationSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  text: z.string().min(1).max(120),
  arrow: z.enum(['none', 'up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right']).optional(),
  style: z.enum(['callout', 'highlight', 'headline', 'arrow']).optional(),
  color: z.enum(['neutral', 'loss', 'accent', 'success', 'warning']).optional(),
})

const visionOutputSchema = z.object({
  annotations: z.array(annotationSchema).min(1).max(6),
  focal_point: z.object({ x: z.number().int(), y: z.number().int() }).optional(),
})

export async function POST(request: Request): Promise<Response> {
  const user = await requireAuth()
  const rate = aiRateLimiter.check(user.id)
  if (!rate.success) return Response.json({ error: 'Rate limit excedido' }, { status: 429 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo invalido' }, { status: 400 })
  }
  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }, { status: 400 })
  }

  const { base_image_url, post_id, archetype, post_content, format } = parsed.data
  const workspaceId = await getWorkspaceId()
  const def = ARCHETYPE_REGISTRY[archetype]

  // Dimensions per format
  const dims = format === '4:5' ? { width: 1080, height: 1350 } : { width: 1080, height: 1080 }

  // ============================================
  // 1. Vision AI suggests annotations
  // ============================================
  let annotations: Annotation[]
  try {
    const model = await getModel('critic-visual', workspaceId)
    const visionPrompt = `Analiza esta imagen base (screenshot real de un producto Bitalize en lucvia o mantenimiento) y sugiere ${def.annotationsMax} anotaciones overlay que destaquen el insight del post.

**Archetype**: ${archetype} (${def.displayName})
**Max anotaciones**: ${def.annotationsMax}
**Color rule**: ${def.colorAccentRole === 'loss_only' ? 'rojo SOLO en la pérdida/riesgo, otras anotaciones en navy neutral.' : def.colorAccentRole === 'method' ? 'naranja en el paso clave del método, navy en otros bloques.' : 'navy neutral, sin rojo decorativo.'}

**Copy del post asociado**:
"""
${post_content}
"""

CRITICAL:
- NO regeneres el UI. La imagen base queda intacta. Solo sugieres overlay annotations.
- Las coordenadas deben estar dentro de la imagen (${dims.width}x${dims.height}).
- Cada anotación: text corto (max 8 palabras), x/y enteros, opcional arrow (dirección hacia el elemento UI relevante), style ("callout" | "highlight" | "headline" | "arrow"), color ("neutral" | "loss" | "accent").
- UNA anotación debe ser el "headline insight" — texto más grande (style="headline"), color "loss" o "accent".
- Otras anotaciones son explicativas (style="callout"), color "neutral".
- Reserva la franja inferior 12% (${Math.round(dims.height * 0.88)}-${dims.height} en Y) — ahí va el logo, no pongas anotaciones.

Responde SOLO con JSON válido:
{
  "annotations": [
    { "x": 120, "y": 80, "text": "...", "arrow": "down", "style": "callout", "color": "neutral" },
    ...
  ],
  "focal_point": { "x": 540, "y": 320 }
}`

    const result = await generateText({
      model,
      system: 'Eres un Director de Arte de Bitalize especializado en anotar screenshots de productos para LinkedIn B2B SaaS. Tus anotaciones son precisas, mínimas y construyen autoridad.',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt },
            { type: 'image', image: base_image_url },
          ],
        },
      ],
    })

    let raw = result.text.trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }
    const parsedJson = JSON.parse(raw)
    const validated = visionOutputSchema.safeParse(parsedJson)
    if (!validated.success) {
      console.error('[compose-annotated] vision output validation failed:', validated.error.issues)
      return Response.json(
        { error: 'Vision AI output no validó', details: validated.error.issues },
        { status: 502 }
      )
    }
    annotations = validated.data.annotations.map((a) => ({
      x: a.x,
      y: a.y,
      width: a.width,
      height: a.height,
      text: a.text,
      arrow: a.arrow,
      style: (a.style ?? 'callout') as AnnotationStyle,
      color: (a.color ?? 'neutral') as AnnotationColor,
    }))
  } catch (e) {
    console.error('[compose-annotated] vision step error', e)
    return Response.json(
      { error: 'Vision AI no pudo sugerir anotaciones. ' + (e instanceof Error ? e.message : '') },
      { status: 500 }
    )
  }

  // ============================================
  // 2. Download base image
  // ============================================
  let baseBuffer: Buffer
  try {
    const r = await fetch(base_image_url)
    if (!r.ok) throw new Error(`fetch base_image_url failed: ${r.status}`)
    baseBuffer = Buffer.from(await r.arrayBuffer())
  } catch (e) {
    return Response.json(
      { error: 'No se pudo descargar la imagen base. ' + (e instanceof Error ? e.message : '') },
      { status: 500 }
    )
  }

  // ============================================
  // 3. Compose overlay via sharp
  // ============================================
  let finalBuffer: Buffer
  try {
    finalBuffer = await composeOverlay({
      baseImage: baseBuffer,
      annotations,
      addBrandStrip: true,
      targetWidth: dims.width,
      targetHeight: dims.height,
    })
  } catch (e) {
    console.error('[compose-annotated] sharp compose error', e)
    return Response.json(
      { error: 'Composer falló. ' + (e instanceof Error ? e.message : '') },
      { status: 500 }
    )
  }

  // ============================================
  // 4. Upload final to visual-assets bucket
  // ============================================
  const supabase = await createSupabaseServerClient()
  const path = `${workspaceId}/${post_id ?? 'misc'}/${Date.now()}-composed.png`
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, finalBuffer, { contentType: 'image/png', upsert: false })
  if (upErr) {
    console.error('[compose-annotated] upload error', upErr)
    return Response.json({ error: 'Upload falló: ' + upErr.message }, { status: 500 })
  }
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return Response.json({
    data: {
      image_url: pub.publicUrl,
      annotations,
    },
  })
}
