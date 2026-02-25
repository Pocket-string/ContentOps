import * as XLSX from 'xlsx'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'

// ============================================
// Output types and Zod schemas
// ============================================

const performanceSchema = z.object({
  impressions: z.number().int().min(0),
  comments: z.number().int().min(0),
  saves: z.number().int().min(0),
  shares: z.number().int().min(0),
  reactions: z.number().int().min(0),
  members_reached: z.number().int().min(0),
  followers_gained: z.number().int().min(0),
  profile_views: z.number().int().min(0),
  sends: z.number().int().min(0),
  post_url: z.string().nullable(),
  publish_date: z.string().nullable(),
})

const highlightGroupSchema = z.object({
  top_role: z.string().nullable(),
  top_location: z.string().nullable(),
  top_industry: z.string().nullable(),
})

const highlightsSchema = z.object({
  reactions: highlightGroupSchema,
  comments: highlightGroupSchema,
})

const demographicEntrySchema = z.object({
  value: z.string(),
  percentage: z.number().min(0).max(1),
})

const importOutputSchema = z.object({
  performance: performanceSchema,
  highlights: highlightsSchema,
  demographics: z.record(z.string(), z.array(demographicEntrySchema)),
})

export type ImportXlsxOutput = z.infer<typeof importOutputSchema>

// ============================================
// Internal parser helpers
// ============================================

/**
 * Safely coerce a cell value to a non-negative integer.
 * Returns 0 for nullish, non-numeric, or negative values.
 */
function toInt(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  const n = Number(value)
  if (!isFinite(n)) return 0
  return Math.max(0, Math.round(n))
}

/**
 * Safely coerce a cell value to a string or null.
 */
function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value).trim() || null
}

/**
 * Safely coerce a cell value to a 0–1 float percentage.
 * LinkedIn exports percentages as decimals (e.g. 0.45 for 45%).
 */
function toPercentage(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  const n = Number(value)
  if (!isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

// ============================================
// Sheet parsers
// ============================================

/**
 * Map of Spanish LinkedIn metric labels to output field names.
 */
const PERFORMANCE_KEY_MAP: Record<string, keyof z.infer<typeof performanceSchema>> = {
  'Impresiones': 'impressions',
  'Comentarios': 'comments',
  'Veces guardado': 'saves',
  'Veces compartido': 'shares',
  'Reacciones': 'reactions',
  'Miembros alcanzados': 'members_reached',
  'Seguidores obtenidos a través de esta publicación': 'followers_gained',
  'Visualizaciones del perfil desde esta publicación': 'profile_views',
  'Envíos en LinkedIn': 'sends',
  'URL de la publicación': 'post_url',
  'Fecha de publicación': 'publish_date',
}

// Labels that mark the start of a highlight section
const HIGHLIGHT_SECTION_LABELS: Record<string, 'reactions' | 'comments'> = {
  'Datos destacados de reacciones': 'reactions',
  'Datos destacados de comentarios': 'comments',
}

// Labels within a highlight section mapped to output keys
const HIGHLIGHT_ROW_MAP: Record<string, keyof z.infer<typeof highlightGroupSchema>> = {
  'Cargo principal': 'top_role',
  'Ubicación principal': 'top_location',
  'Sector principal': 'top_industry',
}

interface ParseRendimientoResult {
  performance: z.infer<typeof performanceSchema>
  highlights: z.infer<typeof highlightsSchema>
}

/**
 * Parse the "RENDIMIENTO" sheet.
 *
 * The sheet has key-value pairs in columns A (key) and B (value).
 * Numeric metrics are cast to integers; string metrics kept as-is.
 * Highlights sections are parsed when their header label is encountered.
 */
function parseRendimiento(sheet: XLSX.WorkSheet): ParseRendimientoResult {
  const rows = XLSX.utils.sheet_to_json<[unknown, unknown]>(sheet, {
    header: 1,
    defval: null,
  }) as Array<[unknown, unknown]>

  const performance: z.infer<typeof performanceSchema> = {
    impressions: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    reactions: 0,
    members_reached: 0,
    followers_gained: 0,
    profile_views: 0,
    sends: 0,
    post_url: null,
    publish_date: null,
  }

  const highlights: z.infer<typeof highlightsSchema> = {
    reactions: { top_role: null, top_location: null, top_industry: null },
    comments: { top_role: null, top_location: null, top_industry: null },
  }

  // Track active highlight section (reactions or comments)
  let activeHighlightSection: 'reactions' | 'comments' | null = null

  for (const row of rows) {
    const keyRaw = row[0]
    const valueRaw = row[1]

    if (keyRaw === null || keyRaw === undefined) {
      continue
    }

    const key = String(keyRaw).trim()

    // Check if this row starts a highlight section (header includes date range suffix)
    const highlightSection = Object.entries(HIGHLIGHT_SECTION_LABELS).find(([label]) => key.startsWith(label))?.[1]
    if (highlightSection !== undefined) {
      activeHighlightSection = highlightSection
      continue
    }

    // If we're inside a highlight section, check for sub-rows
    if (activeHighlightSection !== null) {
      const highlightField = HIGHLIGHT_ROW_MAP[key]
      if (highlightField !== undefined) {
        highlights[activeHighlightSection][highlightField] = toStringOrNull(valueRaw)
        continue
      }
      // Any row outside of known highlight sub-rows resets the section
      if (!Object.keys(HIGHLIGHT_ROW_MAP).includes(key)) {
        activeHighlightSection = null
      }
    }

    // Map to performance field
    const perfField = PERFORMANCE_KEY_MAP[key]
    if (perfField === undefined) continue

    if (perfField === 'post_url' || perfField === 'publish_date') {
      performance[perfField] = toStringOrNull(valueRaw)
    } else {
      // All remaining fields are numeric integers
      ;(performance[perfField] as number) = toInt(valueRaw)
    }
  }

  return { performance, highlights }
}

// Known category labels in "INFORMACIÓN DETALLADA PRINCIPAL"
const KNOWN_CATEGORIES = new Set([
  'Tamaño de la empresa',
  'Cargo',
  'Ubicación',
  'Empresa',
  'Sector',
  'Nivel de responsabilidad',
])

/**
 * Parse the "INFORMACIÓN DETALLADA PRINCIPAL" sheet.
 *
 * The sheet is a 3-column table: Categoría | Valor | %
 * We group rows by their Categoría value and build arrays of { value, percentage }.
 * Unknown categories are accepted — the schema uses Record<string, ...>.
 */
function parseInformacionDetallada(
  sheet: XLSX.WorkSheet
): Record<string, Array<z.infer<typeof demographicEntrySchema>>> {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  })

  const demographics: Record<string, Array<z.infer<typeof demographicEntrySchema>>> = {}

  for (const row of rows) {
    // The first column is the category, second is the value, third is the percentage.
    // LinkedIn uses Spanish column headers; we read by position via header: 1 approach
    // but sheet_to_json without header:1 uses first-row headers.
    // Column headers: Categoría, Valor, %
    const keys = Object.keys(row)
    if (keys.length < 3) continue

    const category = toStringOrNull(row[keys[0]])
    const value = toStringOrNull(row[keys[1]])
    const percentage = toPercentage(row[keys[2]])

    if (!category || !value) continue

    if (!demographics[category]) {
      demographics[category] = []
    }

    demographics[category].push({ value, percentage })
  }

  return demographics
}

// ============================================
// Route handler
// ============================================

export async function POST(request: Request): Promise<Response> {
  // Step 1: Auth
  await requireAuth()

  // Step 2: Validate — parse multipart form data and extract the file
  let fileBuffer: Buffer

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return Response.json(
        { error: 'Campo "file" requerido. Enviar un archivo XLSX.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    fileBuffer = Buffer.from(arrayBuffer)

    if (fileBuffer.byteLength === 0) {
      return Response.json(
        { error: 'El archivo esta vacio.' },
        { status: 400 }
      )
    }
  } catch (err) {
    console.error('[import-xlsx] Error reading multipart form:', err)
    return Response.json(
      { error: 'No se pudo leer el archivo enviado.' },
      { status: 400 }
    )
  }

  // Step 3: Execute — parse XLSX and extract data from both sheets
  let workbook: XLSX.WorkBook

  try {
    workbook = XLSX.read(fileBuffer, { type: 'buffer' })
  } catch (err) {
    console.error('[import-xlsx] Error parsing XLSX:', err)
    return Response.json(
      { error: 'El archivo no es un XLSX valido o esta corrupto.' },
      { status: 422 }
    )
  }

  // Locate required sheets by name
  const rendimientoSheet = workbook.Sheets['RENDIMIENTO']
  const detalladaSheet = workbook.Sheets['INFORMACIÓN DETALLADA PRINCIPAL']

  if (!rendimientoSheet) {
    return Response.json(
      { error: 'Hoja "RENDIMIENTO" no encontrada. Verifica que el archivo sea el export correcto de LinkedIn.' },
      { status: 422 }
    )
  }

  if (!detalladaSheet) {
    return Response.json(
      { error: 'Hoja "INFORMACIÓN DETALLADA PRINCIPAL" no encontrada. Verifica que el archivo sea el export correcto de LinkedIn.' },
      { status: 422 }
    )
  }

  let parsed: ImportXlsxOutput

  try {
    const { performance, highlights } = parseRendimiento(rendimientoSheet)
    const demographics = parseInformacionDetallada(detalladaSheet)

    const raw = { performance, highlights, demographics }

    const validated = importOutputSchema.safeParse(raw)

    if (!validated.success) {
      console.error('[import-xlsx] Zod validation failed:', validated.error.issues)
      return Response.json(
        { error: 'El archivo no coincide con el formato esperado de LinkedIn. Comprueba que no este modificado.' },
        { status: 422 }
      )
    }

    parsed = validated.data
  } catch (err) {
    console.error('[import-xlsx] Error parsing sheet data:', err)
    return Response.json(
      { error: 'Error al procesar el contenido del archivo XLSX.' },
      { status: 500 }
    )
  }

  // Step 4: Return structured result
  return Response.json({ data: parsed })
}
