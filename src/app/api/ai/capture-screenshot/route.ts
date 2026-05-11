/**
 * PRP-013: Capture screenshot endpoint.
 *
 * Two modes:
 * - POST: server-side Playwright capture (NOT IMPLEMENTED yet — fallback to manual upload).
 * - PUT: manual upload (multipart/form-data with file).
 *
 * Both modes upload to Supabase Storage bucket `visual-base-images`
 * and return the public URL.
 */

import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

const BUCKET = 'visual-base-images'

const postInputSchema = z.object({
  url: z.string().url(),
  viewport: z.enum(['1080x1080', '1080x1350']).default('1080x1080'),
  post_id: z.string().uuid().optional(),
  visual_version_id: z.string().uuid().optional(),
  /** Optional: caller (e.g. Claude in Karpathy loop) can provide base64-encoded image bytes
   *  if it already captured the screenshot via its own Playwright. */
  image_data_base64: z.string().optional(),
  mime_type: z.enum(['image/png', 'image/jpeg', 'image/webp']).default('image/png'),
})

// ============================================
// POST — capture via URL (or accept pre-captured base64)
// ============================================

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
  const parsed = postInputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }, { status: 400 })
  }

  const { url, viewport, post_id, image_data_base64, mime_type } = parsed.data
  const workspaceId = await getWorkspaceId()

  let imageBuffer: Buffer

  if (image_data_base64) {
    // Use the caller-provided bytes (Karpathy loop path).
    try {
      const cleaned = image_data_base64.replace(/^data:image\/\w+;base64,/, '')
      imageBuffer = Buffer.from(cleaned, 'base64')
    } catch {
      return Response.json({ error: 'image_data_base64 invalido' }, { status: 400 })
    }
  } else {
    // Server-side Playwright capture path — NOT IMPLEMENTED yet (would require puppeteer-core + chromium binary).
    return Response.json(
      {
        error:
          'Server-side Playwright capture no implementado todavía. Provee `image_data_base64` (capturado client-side / Karpathy loop) o usa PUT con file upload.',
        url_target: url,
        viewport,
      },
      { status: 501 }
    )
  }

  const supabase = await createSupabaseServerClient()
  const ext = mime_type === 'image/jpeg' ? 'jpg' : mime_type === 'image/webp' ? 'webp' : 'png'
  const path = `${workspaceId}/${post_id ?? 'misc'}/${Date.now()}-base.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageBuffer, { contentType: mime_type, upsert: false })
  if (uploadErr) {
    console.error('[capture-screenshot] upload error', uploadErr)
    return Response.json({ error: 'Upload a Storage falló: ' + uploadErr.message }, { status: 500 })
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return Response.json({
    data: {
      base_image_url: pub.publicUrl,
      base_image_source: 'playwright_capture',
      captured_from_url: url,
    },
  })
}

// ============================================
// PUT — manual upload (multipart/form-data)
// ============================================

export async function PUT(request: Request): Promise<Response> {
  const user = await requireAuth()
  const rate = aiRateLimiter.check(user.id)
  if (!rate.success) return Response.json({ error: 'Rate limit excedido' }, { status: 429 })

  const form = await request.formData()
  const file = form.get('file')
  const postId = form.get('post_id')?.toString()
  if (!(file instanceof File)) {
    return Response.json({ error: 'file requerido' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'Archivo > 10MB' }, { status: 400 })
  }
  const mime = file.type
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) {
    return Response.json({ error: 'Mime type no soportado' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const workspaceId = await getWorkspaceId()
  const supabase = await createSupabaseServerClient()
  const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'
  const path = `${workspaceId}/${postId ?? 'misc'}/${Date.now()}-base.${ext}`

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false })
  if (upErr) {
    return Response.json({ error: 'Upload falló: ' + upErr.message }, { status: 500 })
  }
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return Response.json({
    data: {
      base_image_url: pub.publicUrl,
      base_image_source: 'manual_upload',
    },
  })
}
