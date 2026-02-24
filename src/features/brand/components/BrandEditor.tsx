'use client'

import { useState } from 'react'
import type { BrandProfile, UpdateBrandProfileInput } from '@/shared/types/content-ops'

interface BrandEditorProps {
  profiles: BrandProfile[]
  onUpdate: (profileId: string, data: UpdateBrandProfileInput) => Promise<{ error?: string }>
  onCreate: () => Promise<{ error?: string }>
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-surface"
        aria-label={label}
      />
      <div className="flex-1">
        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full mt-0.5 text-sm font-mono bg-surface border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
    </div>
  )
}

function TagList({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    const trimmed = newItem.trim()
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed])
      setNewItem('')
    }
  }

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full"
          >
            {item}
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="text-primary/60 hover:text-primary transition-colors"
              aria-label={`Eliminar ${item}`}
            >
              x
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          placeholder="Nuevo elemento..."
          className="flex-1 text-sm bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-2 bg-primary/10 text-primary text-sm rounded-lg hover:bg-primary/20 transition-colors font-medium"
        >
          Agregar
        </button>
      </div>
    </div>
  )
}

export function BrandEditor({ profiles, onUpdate, onCreate }: BrandEditorProps) {
  const activeProfile = profiles.find((p) => p.is_active) ?? profiles[0]
  const [selected, setSelected] = useState<BrandProfile | null>(activeProfile ?? null)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Local editable state
  const [form, setForm] = useState<UpdateBrandProfileInput>(
    selected
      ? {
          name: selected.name,
          colors: { ...selected.colors },
          typography: { ...selected.typography },
          logo_rules: { ...selected.logo_rules },
          imagery: {
            ...selected.imagery,
            subjects: [...selected.imagery.subjects],
          },
          tone: selected.tone,
          negative_prompts: [...selected.negative_prompts],
          qa_checklist: [...selected.qa_checklist],
        }
      : {}
  )

  const selectProfile = (profile: BrandProfile) => {
    setSelected(profile)
    setSaveError(null)
    setSaveSuccess(false)
    setForm({
      name: profile.name,
      colors: { ...profile.colors },
      typography: { ...profile.typography },
      logo_rules: { ...profile.logo_rules },
      imagery: { ...profile.imagery, subjects: [...profile.imagery.subjects] },
      tone: profile.tone,
      negative_prompts: [...profile.negative_prompts],
      qa_checklist: [...profile.qa_checklist],
    })
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    const result = await onUpdate(selected.id, form)
    setSaving(false)
    if (result.error) {
      setSaveError(result.error)
    } else {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    const result = await onCreate()
    setCreating(false)
    if (result.error) setSaveError(result.error)
  }

  if (profiles.length === 0 || !selected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-muted-foreground">No hay perfiles de marca configurados.</p>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {creating ? 'Creando...' : 'Crear Perfil de Marca'}
        </button>
        {saveError && <p className="text-sm text-red-500">{saveError}</p>}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Version history sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-surface border border-border rounded-2xl shadow-card p-4">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Versiones</h3>
          <div className="space-y-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProfile(p)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  selected.id === p.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-primary/5 text-foreground'
                }`}
              >
                <span className="font-medium">v{p.version}</span>
                {p.is_active && (
                  <span className="ml-2 text-[10px] bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
                    activa
                  </span>
                )}
                <span className="block text-xs opacity-60 mt-0.5">{p.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full mt-3 px-3 py-2 border border-dashed border-border text-muted-foreground text-sm rounded-xl hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {creating ? 'Creando...' : '+ Nueva version'}
          </button>
        </div>
      </div>

      {/* Editor main area */}
      <div className="lg:col-span-3 space-y-6">
        {/* Name */}
        <div className="bg-surface border border-border rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Nombre del Perfil</h3>
          <input
            type="text"
            value={form.name ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Ej. Bitalize v2 — Verano 2026"
          />
        </div>

        {/* Colors */}
        <div className="bg-surface border border-border rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Colores de Marca</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.colors &&
              (
                [
                  ['primary', 'Primario'],
                  ['secondary', 'Secundario'],
                  ['accent', 'Acento'],
                  ['background', 'Fondo'],
                  ['text', 'Texto'],
                ] as [keyof typeof form.colors, string][]
              ).map(([key, label]) => (
                <ColorField
                  key={key}
                  label={label}
                  value={form.colors![key]}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      colors: { ...f.colors!, [key]: v },
                    }))
                  }
                />
              ))}
          </div>
        </div>

        {/* Typography */}
        <div className="bg-surface border border-border rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Tipografia</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['heading', 'Encabezado'],
              ['body', 'Cuerpo'],
              ['style', 'Estilo'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  value={form.typography?.[key as keyof typeof form.typography] ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      typography: { ...f.typography!, [key]: e.target.value },
                    }))
                  }
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Logo Rules */}
        <div className="bg-surface border border-border rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Reglas del Logo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                Posicion
              </label>
              <select
                value={form.logo_rules?.placement ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    logo_rules: { ...f.logo_rules!, placement: e.target.value },
                  }))
                }
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {[
                  'esquina inferior derecha',
                  'esquina inferior izquierda',
                  'esquina superior derecha',
                  'esquina superior izquierda',
                  'centro inferior',
                ].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                Tamano
              </label>
              <select
                value={form.logo_rules?.size ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    logo_rules: { ...f.logo_rules!, size: e.target.value },
                  }))
                }
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {[
                  'discreto, no dominante',
                  'mediano, visible',
                  'grande, prominente',
                ].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeAlways"
                checked={form.logo_rules?.includeAlways ?? true}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    logo_rules: { ...f.logo_rules!, includeAlways: e.target.checked },
                  }))
                }
                className="w-4 h-4 rounded border-border accent-primary"
              />
              <label htmlFor="includeAlways" className="text-sm text-foreground">
                Incluir logo siempre
              </label>
            </div>
          </div>
        </div>

        {/* Imagery */}
        <div className="bg-surface border border-border rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Estilo de Imagen</h3>
          <div className="space-y-4">
            {[
              ['style', 'Estilo visual'],
              ['mood', 'Mood / Tono visual'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  value={form.imagery?.[key as 'style' | 'mood'] ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      imagery: { ...f.imagery!, [key]: e.target.value },
                    }))
                  }
                  className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            ))}
            <TagList
              label="Sujetos permitidos"
              items={form.imagery?.subjects ?? []}
              onChange={(items) =>
                setForm((f) => ({ ...f, imagery: { ...f.imagery!, subjects: items } }))
              }
            />
          </div>
        </div>

        {/* Tone */}
        <div className="bg-surface border border-border rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Tono de Marca</h3>
          <textarea
            value={form.tone ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
            rows={3}
            className="w-full text-sm bg-surface border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            placeholder="Ej. profesional, tecnico pero accesible, confiable"
          />
        </div>

        {/* Negative Prompts */}
        <div className="bg-surface border border-border rounded-2xl shadow-card p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Negative Prompts</h3>
          <TagList
            label="Elementos a evitar en los visuales"
            items={form.negative_prompts ?? []}
            onChange={(items) => setForm((f) => ({ ...f, negative_prompts: items }))}
          />
        </div>

        {/* Save actions */}
        <div className="flex items-center justify-between bg-surface border border-border rounded-2xl shadow-card p-4">
          <div>
            {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            {saveSuccess && (
              <p className="text-sm text-green-600 font-medium">Guardado correctamente</p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !selected}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
