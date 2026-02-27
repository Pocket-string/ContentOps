'use client'

export interface PaletteOption {
  name: string
  rationale: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
}

interface PaletteSelectorProps {
  palettes: PaletteOption[]
  onApply: (palette: PaletteOption) => void
  isApplying?: boolean
}

const COLOR_LABELS: Array<{ key: keyof PaletteOption['colors']; label: string }> = [
  { key: 'primary', label: 'Primario' },
  { key: 'secondary', label: 'Secundario' },
  { key: 'accent', label: 'Acento' },
  { key: 'background', label: 'Fondo' },
  { key: 'text', label: 'Texto' },
]

function ColorSwatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-10 h-10 rounded-lg border border-black/10 shadow-sm flex-shrink-0"
        style={{ backgroundColor: hex }}
        title={`${label}: ${hex}`}
        aria-label={`${label}: ${hex}`}
      />
      <span className="text-[9px] text-muted-foreground font-mono leading-none">{hex}</span>
      <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
    </div>
  )
}

export function PaletteSelector({ palettes, onApply, isApplying = false }: PaletteSelectorProps) {
  if (palettes.length === 0) return null

  return (
    <div className="space-y-4">
      {palettes.map((palette, idx) => (
        <div
          key={idx}
          className="bg-background border border-border rounded-xl p-4 space-y-3"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">{palette.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{palette.rationale}</p>
            </div>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex-shrink-0">
              Opcion {idx + 1}
            </span>
          </div>

          {/* Color swatches */}
          <div className="flex items-end gap-3 flex-wrap">
            {COLOR_LABELS.map(({ key, label }) => (
              <ColorSwatch key={key} hex={palette.colors[key]} label={label} />
            ))}
          </div>

          {/* Apply button */}
          <button
            type="button"
            onClick={() => onApply(palette)}
            disabled={isApplying}
            className="w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? 'Aplicando...' : 'Aplicar esta paleta'}
          </button>
        </div>
      ))}
    </div>
  )
}
