'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import {
  updateBrandProfileSchema,
  type BrandProfile,
  type UpdateBrandProfileInput,
} from '@/shared/types/content-ops'
import {
  getBrandProfiles,
  createBrandProfile,
  updateBrandProfile,
  uploadLogoFile,
  removeLogoFile,
  updateBrandLogos,
  saveBrandAiPalettes,
} from '@/features/brand/services/brand-service'
import { z } from 'zod'
import type { LogoEntry } from '@/features/brand/components/LogoUploader'
import type { PaletteOption } from '@/features/brand/components/PaletteSelector'

interface ActionResult<T = undefined> {
  data?: T
  error?: string
}

// 1. List all brand profiles for the current workspace
export async function getBrandProfilesAction(): Promise<ActionResult<BrandProfile[]>> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Get workspace
  const workspaceId = await getWorkspaceId()

  // Step 3: Execute
  const result = await getBrandProfiles(workspaceId)
  if (result.error) return { error: result.error }

  return { data: result.data }
}

// 2. Create a new brand profile version
export async function createBrandProfileAction(): Promise<ActionResult<BrandProfile>> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Get workspace
  const workspaceId = await getWorkspaceId()

  // Step 3: Execute
  const result = await createBrandProfile(workspaceId)
  if (result.error) return { error: result.error }

  // Step 4: Side effects
  revalidatePath('/settings/brand')

  return { data: result.data }
}

// 3. Update an existing brand profile
export async function updateBrandProfileAction(
  profileId: string,
  data: UpdateBrandProfileInput
): Promise<ActionResult<BrandProfile>> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Validate input with Zod
  const parsed = updateBrandProfileSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Execute
  const result = await updateBrandProfile(profileId, parsed.data)
  if (result.error) return { error: result.error }

  // Step 4: Side effects
  revalidatePath('/settings/brand')

  return { data: result.data }
}

// Input schema for logo upload
const uploadLogoSchema = z.object({
  profileId: z.string().uuid('profileId debe ser un UUID valido'),
})

// 4. Upload a logo to Supabase Storage and update brand profile logo_urls
export async function uploadLogoAction(
  profileId: string,
  formData: FormData
): Promise<ActionResult<LogoEntry[]>> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Validate input
  const inputParsed = uploadLogoSchema.safeParse({ profileId })
  if (!inputParsed.success) {
    return { error: inputParsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { error: 'Archivo requerido' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'El archivo no debe superar 5 MB' }
  }

  const allowedTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Solo se aceptan archivos PNG, SVG o JPG' }
  }

  // Step 3: Fetch current logo_urls then upload
  const workspaceId = await getWorkspaceId()
  const profilesResult = await getBrandProfiles(workspaceId)
  if (profilesResult.error) return { error: profilesResult.error }

  const profile = profilesResult.data?.find((p) => p.id === profileId)
  if (!profile) return { error: 'Perfil de marca no encontrado' }

  const currentLogos: LogoEntry[] = (
    (profile as unknown as { logo_urls?: unknown }).logo_urls ?? []
  ) as LogoEntry[]

  if (currentLogos.length >= 2) {
    return { error: 'Maximo 2 logos permitidos. Elimina uno antes de subir otro.' }
  }

  const uploadResult = await uploadLogoFile(workspaceId, profileId, file)
  if (uploadResult.error) return { error: uploadResult.error }

  const newLogo: LogoEntry = { url: uploadResult.data!, name: file.name }
  const updatedLogos: LogoEntry[] = [...currentLogos, newLogo]

  // Step 3b: Persist updated logo_urls
  const updateResult = await updateBrandLogos(profileId, updatedLogos)
  if (updateResult.error) return { error: updateResult.error }

  // Step 4: Side effects
  revalidatePath('/settings/brand')

  return { data: updatedLogos }
}

// Input schema for logo removal
const removeLogoSchema = z.object({
  profileId: z.string().uuid('profileId debe ser un UUID valido'),
  logoIndex: z.number().int().min(0),
})

// 5. Remove a logo from Storage and update brand profile logo_urls
export async function removeLogoAction(
  profileId: string,
  logoIndex: number
): Promise<ActionResult<LogoEntry[]>> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Validate input
  const inputParsed = removeLogoSchema.safeParse({ profileId, logoIndex })
  if (!inputParsed.success) {
    return { error: inputParsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Fetch current logos
  const workspaceId = await getWorkspaceId()
  const profilesResult = await getBrandProfiles(workspaceId)
  if (profilesResult.error) return { error: profilesResult.error }

  const profile = profilesResult.data?.find((p) => p.id === profileId)
  if (!profile) return { error: 'Perfil de marca no encontrado' }

  const currentLogos: LogoEntry[] = (
    (profile as unknown as { logo_urls?: unknown }).logo_urls ?? []
  ) as LogoEntry[]

  if (logoIndex < 0 || logoIndex >= currentLogos.length) {
    return { error: 'Indice de logo invalido' }
  }

  const logoToRemove = currentLogos[logoIndex]

  // Delete from storage (non-fatal — still update DB if storage delete fails)
  const removeResult = await removeLogoFile(logoToRemove.url)
  if (removeResult.error) {
    console.warn('[brand-actions] Storage delete failed (continuing):', removeResult.error)
  }

  const updatedLogos = currentLogos.filter((_, i) => i !== logoIndex)
  const updateResult = await updateBrandLogos(profileId, updatedLogos)
  if (updateResult.error) return { error: updateResult.error }

  // Step 4: Side effects
  revalidatePath('/settings/brand')

  return { data: updatedLogos }
}

// Zod schema for palette option (mirrors PaletteOption interface)
const paletteColorsActionSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  text: z.string(),
})

const paletteOptionActionSchema = z.object({
  name: z.string(),
  rationale: z.string(),
  colors: paletteColorsActionSchema,
})

// 6. Analyze logos with Gemini Vision and persist returned palettes
// Note: Calls AI directly (no HTTP round-trip) — Server Actions run in the same process.
export async function analyzeLogoAction(
  profileId: string
): Promise<ActionResult<PaletteOption[]>> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Validate profileId
  const inputParsed = uploadLogoSchema.safeParse({ profileId })
  if (!inputParsed.success) {
    return { error: inputParsed.error.issues[0]?.message ?? 'Datos invalidos' }
  }

  // Step 3: Get current logo_urls for this profile
  const workspaceId = await getWorkspaceId()
  const profilesResult = await getBrandProfiles(workspaceId)
  if (profilesResult.error) return { error: profilesResult.error }

  const profile = profilesResult.data?.find((p) => p.id === profileId)
  if (!profile) return { error: 'Perfil de marca no encontrado' }

  const currentLogos: LogoEntry[] = (
    (profile as unknown as { logo_urls?: unknown }).logo_urls ?? []
  ) as LogoEntry[]

  if (currentLogos.length === 0) {
    return { error: 'Sube al menos un logo antes de analizar' }
  }

  const logoUrls = currentLogos.map((l) => l.url)

  // Step 3b: Call AI directly — per CLAUDE.md: use generateText (NOT generateObject) for inputs
  const { generateText } = await import('ai')
  const { getModel } = await import('@/shared/lib/ai-router')

  const model = await getModel('generate-visual-json', workspaceId)

  const systemPrompt = `Eres un director de arte experto en identidad visual y branding.
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
}`

  const userPrompt = `Analiza ${logoUrls.length === 1 ? 'el siguiente logo' : 'los siguientes logos'} y genera 2 paletas de colores de marca distintas:

${logoUrls.map((url, i) => `Logo ${i + 1}: ${url}`).join('\n')}

Extrae los colores dominantes del logo, el estilo visual y propone dos paletas complementarias distintas.
Una puede ser clara/corporativa y otra oscura/moderna. Responde SOLO con el JSON.`

  let aiText: string
  try {
    const result = await generateText({ model, system: systemPrompt, prompt: userPrompt })
    aiText = result.text
  } catch (err) {
    console.error('[brand-actions] analyzeLogoAction AI error:', err)
    return { error: 'Error al analizar el logo con IA. Intenta de nuevo.' }
  }

  // Parse response — per CLAUDE.md: never `as MyType`, always Zod
  let rawJson: unknown
  try {
    const clean = aiText
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    rawJson = JSON.parse(clean)
  } catch {
    console.error('[brand-actions] analyzeLogoAction JSON parse error:', aiText)
    return { error: 'La IA no devolvio un JSON valido. Intenta de nuevo.' }
  }

  const zodResult = z
    .object({ palettes: z.array(paletteOptionActionSchema).length(2) })
    .safeParse(rawJson)

  if (!zodResult.success) {
    console.error('[brand-actions] analyzeLogoAction Zod error:', zodResult.error.flatten())
    return { error: 'La respuesta de la IA no tiene el formato esperado. Intenta de nuevo.' }
  }

  const palettes: PaletteOption[] = zodResult.data.palettes

  // Step 3c: Persist palettes in DB
  const saveResult = await saveBrandAiPalettes(profileId, palettes)
  if (saveResult.error) return { error: saveResult.error }

  // Step 4: Side effects
  revalidatePath('/settings/brand')

  return { data: palettes }
}
