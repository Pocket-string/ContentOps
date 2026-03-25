import { z } from 'zod'
import { generateImage } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { generateObjectWithFallback, getImageModel } from '@/shared/lib/ai-router'
import { getActiveBrandProfile } from '@/features/brand/services/brand-service'
import { buildImagePrompt } from '@/features/visuals/services/image-prompt-builder'
import { uploadImageToStorage } from '@/features/visuals/services/image-storage-service'
import { updateVisualImageUrl, createVisualVersion } from '@/features/visuals/services/visual-service'
import { compositeLogoOnImage } from '@/features/visuals/services/logo-compositor'
import { selectVisualFormat } from '@/features/visuals/services/visual-format-selector'
import { FORMAT_TO_ASPECT_RATIO } from '@/features/visuals/constants/image-models'
import { visualPromptSchemaV2 } from '@/features/visuals/schemas/visual-prompt-schema'
import {
  BRAND_COLORS_SEMANTIC,
  BRAND_SIGNATURE,
  BRAND_STYLE,
  NEGATIVE_PROMPTS,
  FORMAT_DIMENSIONS,
  type VisualFormat,
} from '@/features/visuals/constants/brand-rules'

export const maxDuration = 120

const inputSchema = z.object({
  post_id: z.string().uuid(),
  post_content: z.string().min(1),
  funnel_stage: z.string().min(1),
  visual_version_id: z.string().uuid().nullable().optional(),
  feedback: z.string().nullable().optional(),
  format: z.enum(['1:1', '4:5', '16:9', '9:16']).nullable().optional(),
  topic: z.string().nullable().optional(),
  keyword: z.string().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
})

function buildSystemPrompt(brandOverrides: {
  colors: { primary: string; secondary: string; accent: string }
  tone: string
  imagerySubjects: string[]
  mood: string
  typographyHeading: string
  imageryStyle: string
  negativePrompts: string[]
  authorSignature?: string
}): string {
  const { colors, tone, imagerySubjects, mood, typographyHeading, imageryStyle, negativePrompts } = brandOverrides
  const sigText = brandOverrides.authorSignature ?? BRAND_SIGNATURE.text

  return `## ROL
Eres el Director de Arte Senior de Bitalize. Generas prompt JSONs estructurados (schema V2) para crear visuales de LinkedIn con modelos de imagen AI.

## FORMATO DE SALIDA
Responde UNICAMENTE con JSON valido segun el schema V2.

## PRIORIDAD MAXIMA: prompt_overall
El campo prompt_overall es el MAS IMPORTANTE del JSON. Es lo que se envia DIRECTAMENTE al modelo de generacion de imagenes.

Reglas para prompt_overall:
- Incluir texto EXACTO a renderizar (entre comillas dentro del prompt)
- Describir colores naturalmente (no CSS hex en prompt_overall)
- Layout con porcentajes/ratios
- Incluir: "solid white band at the bottom (12% height) reserved for logo"
- Firma del autor: "${sigText}"
- NUNCA incluir specs tecnicos como "Inter Bold 48px #FFFFFF" — el modelo los renderiza literalmente
- Ser PRECISO pero VISUAL, no tecnico

## IDENTIDAD DE MARCA
Colores: primario ${colors.primary}, secundario ${colors.secondary}, acento ${colors.accent}
Texto principal: ${BRAND_COLORS_SEMANTIC.text_main}
Tipografia: ${typographyHeading}
Estilo: ${imageryStyle}
Sujetos: ${imagerySubjects.join(', ')}
Mood: ${mood} | Tono: ${tone}

## NEGATIVE PROMPTS
${negativePrompts.map((p) => `- ${p}`).join('\n')}

## ESTETICA
NotebookLM educational + newspaper. Full color. Legible en movil. Sin fotos stock.`
}

export async function POST(request: Request): Promise<Response> {
  const user = await requireAuth()

  const rl = aiRateLimiter.check(user.id)
  if (!rl.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Cuerpo invalido' }, { status: 400 })
  }

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' },
      { status: 400 }
    )
  }

  const { post_id, post_content, funnel_stage, feedback, topic, keyword, logo_url } = parsed.data
  let { visual_version_id, format } = parsed.data

  // Auto-select format if not provided
  if (!format) {
    format = selectVisualFormat(funnel_stage, post_content)
  }

  const workspaceId = await getWorkspaceId()

  try {
    // Step 1: Fetch brand profile
    const brandResult = await getActiveBrandProfile(workspaceId)
    const brand = brandResult.data

    const brandConfig = {
      colors: brand?.colors ?? {
        primary: BRAND_COLORS_SEMANTIC.primary,
        secondary: BRAND_COLORS_SEMANTIC.secondary,
        accent: BRAND_COLORS_SEMANTIC.accent,
      },
      tone: brand?.tone ?? BRAND_STYLE.tone,
      imagerySubjects: brand?.imagery.subjects ?? [...BRAND_STYLE.imagery.subjects],
      mood: brand?.imagery.mood ?? BRAND_STYLE.imagery.mood,
      typographyHeading: brand?.typography.heading ?? BRAND_STYLE.typography.heading,
      imageryStyle: brand?.imagery.style ?? BRAND_STYLE.imagery.style,
      negativePrompts: brand?.negative_prompts ?? [...NEGATIVE_PROMPTS],
      authorSignature: brand?.author_signature ?? BRAND_SIGNATURE.text,
    }

    // Step 2: Auto-create visual version if needed
    if (!visual_version_id) {
      const createResult = await createVisualVersion(user.id, {
        post_id,
        format: format ?? '1:1',
        prompt_json: {},
      })
      if (createResult.error || !createResult.data) {
        return Response.json(
          { error: createResult.error ?? 'Error al crear version visual' },
          { status: 500 }
        )
      }
      visual_version_id = createResult.data.id
    }

    // Step 3: Generate visual JSON
    const dims = FORMAT_DIMENSIONS[format as VisualFormat] ?? FORMAT_DIMENSIONS['1:1']
    const dimensionsStr = `${dims.width}x${dims.height}`
    const systemPrompt = buildSystemPrompt(brandConfig)

    const feedbackSection = feedback
      ? `\n\n**FEEDBACK DEL USUARIO (PRIORIDAD MAXIMA)**: ${feedback}\nAjusta el visual segun este feedback manteniendo la identidad de marca.`
      : ''

    const jsonResult = await generateObjectWithFallback({
      task: 'generate-visual-json',
      workspaceId,
      schema: visualPromptSchemaV2,
      system: systemPrompt,
      prompt: `Genera el prompt JSON V2 para este visual de LinkedIn.

**Contenido del post**:
${post_content}

**Etapa del funnel**: ${funnel_stage}
**Formato**: ${format} (${dimensionsStr})
${topic ? `**Tema**: ${topic}` : ''}
${keyword ? `**Keyword**: ${keyword}` : ''}${feedbackSection}

RECUERDA: prompt_overall debe ser EXHAUSTIVO. Incluye logo Bitalize con banda blanca inferior y firma "${brandConfig.authorSignature}".`,
    })

    const promptJson = jsonResult.object as Record<string, unknown>

    // Step 3b: Save JSON to DB (user never sees it)
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    await supabase
      .from('visual_versions')
      .update({ prompt_json: promptJson })
      .eq('id', visual_version_id)

    // Step 4: Generate image from JSON
    const textPrompt = buildImagePrompt(promptJson, format as VisualFormat)
    const aspectRatio = FORMAT_TO_ASPECT_RATIO[format as VisualFormat]

    const imageResult = await generateImage({
      model: await getImageModel('gemini-3-pro-image-preview', workspaceId),
      prompt: textPrompt,
      aspectRatio,
      providerOptions: {
        google: { personGeneration: 'allow_adult' },
      },
    })

    // Step 5: Composite logo
    let finalBase64 = imageResult.image.base64
    let finalMediaType: string = imageResult.image.mediaType
    if (logo_url) {
      try {
        const composited = await compositeLogoOnImage(finalBase64, finalMediaType, logo_url)
        finalBase64 = composited.buffer.toString('base64')
        finalMediaType = composited.mediaType
      } catch (err) {
        console.error('[generate-visual-complete] Logo compositing failed (using original):', err)
      }
    }

    // Step 6: Upload to storage
    const uploadResult = await uploadImageToStorage(
      workspaceId,
      visual_version_id,
      finalBase64,
      finalMediaType
    )

    if (uploadResult.error) {
      return Response.json({ error: uploadResult.error }, { status: 500 })
    }

    const publicUrl = uploadResult.data!.publicUrl

    // Step 7: Update DB with image URL
    const updateResult = await updateVisualImageUrl(visual_version_id, publicUrl)
    if (updateResult.error) {
      console.error('[generate-visual-complete] DB update failed:', updateResult.error)
    }

    return Response.json({
      data: {
        image_url: publicUrl,
        visual_version_id,
        format,
      },
    })
  } catch (error) {
    console.error('[generate-visual-complete] Error:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return Response.json(
      { error: `Error al generar visual completo: ${message}` },
      { status: 500 }
    )
  }
}
