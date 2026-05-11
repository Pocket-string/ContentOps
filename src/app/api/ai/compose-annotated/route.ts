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
import { ARCHETYPE_REGISTRY, isCaptureOverlayArchetype } from '@/features/visuals/constants/archetypes'
import { getActiveBrandProfile } from '@/features/brand/services/brand-service'
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
  // PRP-013 iter 1 hotfix: when true, skip Vision AI annotations (SVG text in sharp
  // currently renders as tofu in prod Docker — font issue, Patch #9 backlog) and
  // skip white-out top-left (avoid the white-patch artifact over dark dashboards).
  // The base must already be cropped to exclude the source-product header.
  skip_annotations: z.boolean().optional().default(false),
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

  const { base_image_url, post_id, visual_version_id, archetype, post_content, format, skip_annotations } = parsed.data
  const workspaceId = await getWorkspaceId()
  const def = ARCHETYPE_REGISTRY[archetype]

  // Dimensions per format
  const dims = format === '4:5' ? { width: 1080, height: 1350 } : { width: 1080, height: 1080 }

  // ============================================
  // 1. Vision AI suggests annotations (skipped when skip_annotations=true)
  // ============================================
  let annotations: Annotation[] = []
  if (skip_annotations) {
    // No-op: leave annotations empty, base + pill only
  } else {
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
- Reserva la esquina inferior-derecha (x > ${Math.round(dims.width * 0.72)} AND y > ${Math.round(dims.height * 0.88)}) — ahí va el pill con el logo Bitalize, no pongas anotaciones en esa esquina.
- ${isCaptureOverlayArchetype(archetype) ? `IMPORTANTE: la esquina superior-izquierda (x < ${Math.round(dims.width * 0.22)} AND y < ${Math.round(dims.height * 0.07)}) se cubrirá con blanco para ocultar el logo del producto fuente (lucvia/mantenimiento) — el visual debe leerse como Bitalize. No pongas anotaciones ahí ni hagas referencias al logo del producto fuente.` : ''}

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
  // 3. Fetch Bitalize logo from active brand profile (PRP-013 Patch #1)
  // ============================================
  let logoBuffer: Buffer | undefined
  try {
    const brandResult = await getActiveBrandProfile(workspaceId)
    const logoUrl = brandResult.data?.logo_urls?.[0]?.url
    if (logoUrl) {
      const r = await fetch(logoUrl)
      if (r.ok) {
        logoBuffer = Buffer.from(await r.arrayBuffer())
      } else {
        console.warn('[compose-annotated] logo fetch non-ok:', r.status)
      }
    } else {
      console.warn('[compose-annotated] no brand logo configured — band will render without logo')
    }
  } catch (e) {
    console.warn('[compose-annotated] logo fetch error (non-fatal):', e instanceof Error ? e.message : e)
  }

  // ============================================
  // 4. Compose overlay via sharp
  // ============================================
  // PRP-013 Patch #3: for capture-overlay archetypes the base is a real screenshot
  // of lucvia.com / mantenimiento.jonadata.cloud whose top-left holds the source
  // product logo. We white-out that region so the visual reads as Bitalize.
  // When skip_annotations=true we expect the caller passed a pre-cropped base
  // (no source header), so skip the white-out to avoid the ugly white patch.
  const whiteOutRegions = isCaptureOverlayArchetype(archetype) && !skip_annotations
    ? [
        {
          x: 0,
          y: 0,
          width: Math.round(dims.width * 0.22),
          height: Math.round(dims.height * 0.07),
        },
      ]
    : undefined

  let finalBuffer: Buffer
  try {
    finalBuffer = await composeOverlay({
      baseImage: baseBuffer,
      annotations,
      addBrandStrip: true,
      logoBuffer,
      targetWidth: dims.width,
      targetHeight: dims.height,
      whiteOutRegions,
    })
  } catch (e) {
    console.error('[compose-annotated] sharp compose error', e)
    return Response.json(
      { error: 'Composer falló. ' + (e instanceof Error ? e.message : '') },
      { status: 500 }
    )
  }

  // ============================================
  // 5. Upload final to visual-assets bucket
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
  const finalImageUrl = pub.publicUrl

  // ============================================
  // 6. PRP-013 Patch #10: persist to visual_versions when visual_version_id provided
  // ============================================
  // Without this, callers that bypass the editor UI (Karpathy loop, automated
  // pipelines) compose images that never surface in the editor. The image lives
  // in Storage but the DB row still points at the previous version.
  let persisted = false
  if (visual_version_id) {
    const { error: updErr } = await supabase
      .from('visual_versions')
      .update({
        image_url: finalImageUrl,
        annotations_json: annotations,
        base_image_url,
      })
      .eq('id', visual_version_id)
    if (updErr) {
      console.error('[compose-annotated] visual_version update failed (non-fatal):', updErr)
    } else {
      persisted = true
    }
  }

  return Response.json({
    data: {
      image_url: finalImageUrl,
      annotations,
      persisted,
    },
  })
}
