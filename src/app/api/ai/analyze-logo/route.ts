import { z } from 'zod'
import { generateText } from 'ai'
import { requireAuth } from '@/lib/auth'
import { aiRateLimiter } from '@/lib/rate-limit'
import { getWorkspaceId } from '@/lib/workspace'
import { getModel } from '@/shared/lib/ai-router'
import type { PaletteOption } from '@/features/brand/components/PaletteSelector'

// Input schema — validated before touching the AI
const inputSchema = z.object({
  logo_urls: z.array(z.string().url()).min(1, 'Se requiere al menos un logo').max(2),
})

// Zod schema for AI response — per CLAUDE.md: never `as MyType`, always parse with Zod
const paletteColorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string(),
})

const paletteItemSchema = z.object({
  name: z.string(),
  rationale: z.string(),
  colors: paletteColorsSchema,
})

const paletteResponseSchema = z.object({
  palettes: z.array(paletteItemSchema).length(2),
})

const SYSTEM_PROMPT = `Eres un director de arte experto en identidad visual y branding.
Tu tarea es analizar logos de marcas y sugerir paletas de colores de marca coherentes.

CRITICO: Tu respuesta DEBE ser un objeto JSON válido y nada más. No incluyas markdown ni texto adicional.

El JSON debe tener exactamente esta estructura:
{
  "palettes": [
    {
      "name": "Nombre de la paleta",
      "rationale": "Breve explicacion de por que esta paleta funciona para la marca (max 2 oraciones)",
      "colors": {
        "primary": "#HEXCODE",
        "secondary": "#HEXCODE",
        "accent": "#HEXCODE",
        "background": "#HEXCODE",
        "text": "#HEXCODE"
      }
    },
    {
      "name": "Nombre de la segunda paleta",
      "rationale": "Breve explicacion...",
      "colors": {
        "primary": "#HEXCODE",
        "secondary": "#HEXCODE",
        "accent": "#HEXCODE",
        "background": "#HEXCODE",
        "text": "#HEXCODE"
      }
    }
  ]
}

Reglas para los colores:
- primary: color dominante de la marca extraido o inspirado en el logo
- secondary: color complementario que armoniza con el primario
- accent: color de acento para llamadas a la accion, highlights
- background: fondo recomendado (blanco, crema, gris claro o dark navy)
- text: color de texto principal (casi negro, dark navy u oscuro legible)
- Todos los valores DEBEN ser hex codes validos (#RRGGBB)
- Las dos paletas deben ser distintas: una puede ser clara/corporativa, la otra oscura/moderna
`

export async function POST(request: Request): Promise<Response> {
  // 1. Auth
  const user = await requireAuth()

  // 2. Rate limit (10 req/min per user — shared AI limiter)
  const rateLimitResult = aiRateLimiter.check(user.id)
  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    )
  }

  // 3. Validate input with Zod
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

  // 4. Get workspace & model
  const workspaceId = await getWorkspaceId()
  const model = await getModel('generate-visual-json', workspaceId)

  // 5. Call AI — per CLAUDE.md: use generateText (NOT generateObject) for long inputs
  // The response is parsed manually with Zod to validate the JSON
  try {
    const { logo_urls } = parsed.data

    const userPrompt = `Analiza ${logo_urls.length === 1 ? 'el siguiente logo' : 'los siguientes logos'} y genera 2 paletas de colores de marca distintas:

${logo_urls.map((url, i) => `Logo ${i + 1}: ${url}`).join('\n')}

Extrae los colores dominantes del logo, el estilo visual (minimalista, corporativo, moderno, etc.) y propone dos paletas complementarias que funcionen bien juntas y sean coherentes con la identidad visual percibida.

Responde SOLO con el JSON. Nada de texto adicional.`

    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    })

    // 6. Parse AI response with Zod — never use `as MyType`
    let rawJson: unknown
    try {
      // Strip potential markdown code fences (```json ... ```)
      const clean = result.text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      rawJson = JSON.parse(clean)
    } catch {
      console.error('[analyze-logo] Failed to parse AI JSON:', result.text)
      return Response.json(
        { error: 'La IA no devolvio un JSON valido. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const zodResult = paletteResponseSchema.safeParse(rawJson)
    if (!zodResult.success) {
      console.error('[analyze-logo] Zod validation failed:', zodResult.error.flatten())
      return Response.json(
        { error: 'La respuesta de la IA no tiene el formato esperado. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const palettes: PaletteOption[] = zodResult.data.palettes

    return Response.json({ data: { palettes } })
  } catch (error) {
    console.error('[analyze-logo] AI error:', error)
    return Response.json(
      { error: 'Error al analizar el logo. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
