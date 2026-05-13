// Throwaway smoke test for the 2026 LinkedIn xlsx parser.
// Mirrors parseUnifiedSheet + toPercentageFlexible in src/app/api/analytics/import-xlsx/route.ts.
// Run with: node scripts/smoke-test-xlsx-parser.mjs

import * as XLSX from 'xlsx'
import { readFileSync } from 'node:fs'

const PERFORMANCE_KEY_MAP = {
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

function toInt(v) {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Math.max(0, Math.round(v))
  const c = String(v).trim().replace(/\./g, '').replace(',', '.')
  const n = Number(c)
  return isFinite(n) ? Math.max(0, Math.round(n)) : 0
}
function toStringOrNull(v) {
  if (v == null || v === '') return null
  return String(v).trim() || null
}
function toPercentageFlexible(v) {
  if (v == null || v === '') return 0
  if (typeof v === 'number') {
    if (!isFinite(v)) return 0
    return Math.min(1, Math.max(0, v <= 1 ? v : v / 100))
  }
  const raw = String(v)
  const hasPct = raw.includes('%')
  const cleaned = raw.replace(/[%\s]/g, '').replace(',', '.')
  const n = Number(cleaned)
  if (!isFinite(n)) return 0
  const dec = hasPct || n > 1 ? n / 100 : n
  return Math.min(1, Math.max(0, dec))
}

function parseUnifiedSheet(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })
  const performance = {
    impressions: 0, comments: 0, saves: 0, shares: 0, reactions: 0,
    members_reached: 0, followers_gained: 0, profile_views: 0, sends: 0,
    post_url: null, publish_date: null,
  }
  const demographics = {}
  let mode = 'metrics'
  for (const row of rows) {
    const a = row?.[0] ?? null
    const b = row?.[1] ?? null
    const c = row?.[2] ?? null
    if (a === null) continue
    const keyA = String(a).trim()
    if (!keyA) continue
    if (mode === 'metrics') {
      if (keyA === 'Categoría' && b !== null && String(b).trim() === 'Valor') {
        mode = 'demographics'
        continue
      }
      const f = PERFORMANCE_KEY_MAP[keyA]
      if (!f) continue
      if (f === 'post_url' || f === 'publish_date') performance[f] = toStringOrNull(b)
      else performance[f] = toInt(b)
    } else {
      const cat = toStringOrNull(a)
      const val = toStringOrNull(b)
      if (!cat || !val) continue
      const pct = toPercentageFlexible(c)
      ;(demographics[cat] ??= []).push({ value: val, percentage: pct })
    }
  }
  return { performance, highlights: null, demographics }
}

const buf = readFileSync('src/app/api/analytics/import-xlsx/__fixtures__/analisis-2026-05-11.xlsx')
const wb = XLSX.read(buf, { type: 'buffer' })
console.log('Sheet names:', wb.SheetNames)
const sheet = wb.Sheets['Análisis de la publicación']
if (!sheet) { console.error('FAIL: sheet not found'); process.exit(1) }
const out = parseUnifiedSheet(sheet)
console.log('\nPerformance:', out.performance)
console.log('\nDemographics categories:', Object.keys(out.demographics))
console.log('Cargo entries:', out.demographics['Cargo']?.length)
console.log('First Cargo:', out.demographics['Cargo']?.[0])
console.log('First Ubicación:', out.demographics['Ubicación']?.[0])
console.log('First Sector:', out.demographics['Sector']?.[0])

const assert = (cond, msg) => {
  if (cond) console.log('  PASS:', msg)
  else { console.error('  FAIL:', msg); process.exit(1) }
}
console.log('\n--- Assertions ---')
assert(out.performance.impressions === 900, 'impressions = 900')
assert(out.performance.members_reached === 576, 'members_reached = 576')
assert(out.performance.reactions === 10, 'reactions = 10')
assert(out.performance.comments === 4, 'comments = 4')
assert(out.performance.saves === 2, 'saves = 2')
assert(out.performance.shares === 0, 'shares = 0')
assert(out.performance.sends === 1, 'sends = 1')
assert(out.performance.profile_views === 4, 'profile_views = 4')
assert(out.performance.followers_gained === 0, 'followers_gained = 0')
assert(out.performance.post_url?.includes('linkedin.com'), 'post_url is LinkedIn URL')
assert(out.performance.publish_date === '11/5/2026', 'publish_date = 11/5/2026')
assert(out.highlights === null, 'highlights is null')
assert(out.demographics['Cargo']?.length === 9, 'Cargo has 9 entries')
const topUbi = out.demographics['Ubicación']?.[0]
assert(topUbi?.value?.includes('Santiago'), 'top Ubicación is Santiago')
assert(Math.abs((topUbi?.percentage ?? 0) - 0.36) < 0.001, `top Ubicación pct ≈ 0.36 (got ${topUbi?.percentage})`)
const topSector = out.demographics['Sector']?.[0]
assert(Math.abs((topSector?.percentage ?? 0) - 0.30) < 0.001, `top Sector pct ≈ 0.30 (got ${topSector?.percentage})`)
console.log('\nAll assertions passed.')
