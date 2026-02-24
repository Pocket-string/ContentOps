'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { VisualConcept } from '@/shared/types/content-ops'

interface ConceptSelectorProps {
  concepts: VisualConcept[]
  postContent: string
  funnelStage: string
  topicTitle?: string
  keyword?: string
  onGenerate: () => Promise<void>
  onSelect: (conceptId: string) => Promise<{ error?: string } | void>
  isGenerating: boolean
}

const CONCEPT_TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  infographic_1x1: { label: 'Infografia 1:1', emoji: '📊', color: 'border-blue-300 bg-blue-50' },
  carousel_4x5: { label: 'Carrusel 4:5', emoji: '📑', color: 'border-purple-300 bg-purple-50' },
  humanized_photo: { label: 'Foto Humanizada', emoji: '📸', color: 'border-green-300 bg-green-50' },
  data_chart: { label: 'Data Chart', emoji: '📈', color: 'border-teal-300 bg-teal-50' },
  custom: { label: 'Custom', emoji: '🎨', color: 'border-orange-300 bg-orange-50' },
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function ConceptSelector({
  concepts,
  onGenerate,
  onSelect,
  isGenerating,
}: ConceptSelectorProps) {
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleSelect(conceptId: string) {
    setSelectingId(conceptId)
    setError('')
    try {
      const result = await onSelect(conceptId)
      if (result && 'error' in result) {
        setError(result.error ?? '')
      }
    } finally {
      setSelectingId(null)
    }
  }

  const selectedConcept = concepts.find(c => c.selected)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Conceptos Visuales</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerate}
          isLoading={isGenerating}
          leftIcon={<SparklesIcon className="w-4 h-4" />}
        >
          {concepts.length > 0 ? 'Regenerar' : 'Generar Conceptos'}
        </Button>
      </div>

      {error && <p className="text-sm text-error-500">{error}</p>}

      {concepts.length === 0 && !isGenerating && (
        <p className="text-xs text-foreground-muted text-center py-4">
          Genera 3 conceptos visuales para elegir el mejor formato
        </p>
      )}

      {concepts.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {concepts.map((concept) => {
            const meta = CONCEPT_TYPE_META[concept.concept_type] ?? CONCEPT_TYPE_META.custom
            const isSelected = concept.selected

            return (
              <div
                key={concept.id}
                className={`
                  rounded-xl border-2 p-4 transition-all duration-200
                  ${isSelected ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-200' : `${meta.color} hover:shadow-md`}
                `}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                  </div>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-700">
                      <CheckIcon className="w-3 h-3" />
                      Seleccionado
                    </span>
                  )}
                </div>

                <p className="text-xs text-foreground-secondary mb-2">{concept.rationale}</p>

                {concept.layout && (
                  <p className="text-xs text-foreground-muted">
                    <span className="font-medium">Layout:</span> {concept.layout}
                  </p>
                )}
                {concept.risk_notes && (
                  <p className="text-xs text-yellow-600 mt-1">
                    <span className="font-medium">Riesgo:</span> {concept.risk_notes}
                  </p>
                )}

                {!isSelected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelect(concept.id)}
                    isLoading={selectingId === concept.id}
                    className="mt-2 w-full text-xs"
                  >
                    Seleccionar
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedConcept && (
        <p className="text-xs text-foreground-muted text-center">
          Concepto seleccionado. Continua generando el prompt visual abajo.
        </p>
      )}
    </div>
  )
}
