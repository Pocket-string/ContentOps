'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------
interface KeyFinding {
  finding: string
  relevance: string
  source_hint?: string
}

interface SuggestedTopic {
  title: string
  angle: string
  hook_idea: string
}

interface ResearchResult {
  summary: string
  key_findings: KeyFinding[]
  suggested_topics: SuggestedTopic[]
  market_context?: string
}

interface DeepResearchPanelProps {
  /** If provided, saves results to this existing research report */
  researchId?: string
  /** Pre-fill the topic input */
  defaultTema?: string
  /** Pre-fill buyer persona */
  defaultBuyerPersona?: string
  /** Pre-fill region */
  defaultRegion?: string
}

// -----------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------
const BUYER_PERSONAS = [
  'Asset Manager',
  'O&M Manager',
  'Ingeniero de Planta',
  'Director Tecnico',
  'Inversor Renovable',
]

const REGIONS = [
  'Global',
  'Europa',
  'LATAM',
  'Norteamerica',
  'Asia-Pacifico',
  'Espana',
  'Mexico',
  'Chile',
]

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------
export function DeepResearchPanel({
  researchId,
  defaultTema = '',
  defaultBuyerPersona = '',
  defaultRegion = '',
}: DeepResearchPanelProps) {
  const router = useRouter()

  const [tema, setTema] = useState(defaultTema)
  const [buyerPersona, setBuyerPersona] = useState(defaultBuyerPersona)
  const [region, setRegion] = useState(defaultRegion)
  const [isResearching, setIsResearching] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  // -----------------------------------------------------------------------
  // Handler
  // -----------------------------------------------------------------------
  const handleResearch = useCallback(async () => {
    if (!tema.trim()) return
    setIsResearching(true)
    setError('')
    setResult(null)
    setSavedId(null)

    try {
      const res = await fetch('/api/research/grounded-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema: tema.trim(),
          buyer_persona: buyerPersona || undefined,
          region: region || undefined,
          research_id: researchId || undefined,
        }),
      })

      const json: unknown = await res.json()

      if (!res.ok) {
        setError((json as { error?: string }).error ?? 'Error al investigar')
        return
      }

      const { data, research_id: returnedId } = json as {
        data: ResearchResult
        research_id?: string
      }
      setResult(data)
      if (returnedId) {
        setSavedId(returnedId)
      }
    } catch {
      setError('Error de red al investigar')
    } finally {
      setIsResearching(false)
    }
  }, [tema, buyerPersona, region, researchId])

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Input section */}
      <Card>
        <CardContent>
          <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-4">
            Investigacion AI
          </h2>

          <div className="space-y-3">
            {/* Tema input */}
            <div>
              <label
                htmlFor="research-tema"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Tema a investigar
              </label>
              <input
                id="research-tema"
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tema.trim() && !isResearching) {
                    void handleResearch()
                  }
                }}
                placeholder="Ej: Tendencias en limpieza robotizada de paneles solares 2025"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                disabled={isResearching}
                aria-required="true"
              />
            </div>

            {/* Buyer Persona + Region row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="research-persona"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Buyer Persona
                </label>
                <select
                  id="research-persona"
                  value={buyerPersona}
                  onChange={(e) => setBuyerPersona(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  disabled={isResearching}
                >
                  <option value="">Cualquiera</option>
                  {BUYER_PERSONAS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="research-region"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Region
                </label>
                <select
                  id="research-region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  disabled={isResearching}
                >
                  <option value="">Global</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl bg-error-50 border border-error-500 p-3"
              >
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            {/* Research button */}
            <Button
              variant="primary"
              onClick={() => void handleResearch()}
              isLoading={isResearching}
              disabled={!tema.trim()}
              className="w-full"
            >
              {result ? 'Reinvestigar' : 'Investigar con AI'}
            </Button>

            {isResearching && (
              <p className="text-xs text-foreground-muted text-center" aria-live="polite">
                Investigando con Gemini + Google Search... esto puede tardar 15-30 segundos
              </p>
            )}

            {/* Auto-save indicator */}
            {savedId && !isResearching && (
              <div className="flex items-center justify-between rounded-xl bg-success-50 border border-success-300 px-3 py-2">
                <p className="text-xs text-success-700">
                  Guardado automaticamente
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/research/${savedId}`)}
                  className="text-xs text-success-700 hover:text-success-900 h-auto py-0 px-1"
                >
                  Ver Research
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results section */}
      {result && (
        <div className="space-y-4" aria-label="Resultados de investigacion">
          {/* Summary */}
          <Card>
            <CardContent>
              <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-3">
                Resumen
              </h2>
              <p className="text-sm text-foreground leading-relaxed border-l-2 border-accent-400 pl-3">
                {result.summary}
              </p>
              {result.market_context && (
                <p className="text-xs text-foreground-muted mt-3 italic">
                  {result.market_context}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Key Findings */}
          {result.key_findings.length > 0 && (
            <Card>
              <CardContent>
                <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-3">
                  Hallazgos Clave ({result.key_findings.length})
                </h2>
                <div className="space-y-3">
                  {result.key_findings.map((finding, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border bg-surface p-3"
                    >
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {finding.finding}
                      </p>
                      <p className="text-xs text-foreground-secondary mt-1">
                        {finding.relevance}
                      </p>
                      {finding.source_hint && (
                        <p className="text-xs text-foreground-muted mt-1 italic">
                          Fuente: {finding.source_hint}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested Topics */}
          {result.suggested_topics.length > 0 && (
            <Card>
              <CardContent>
                <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-3">
                  Topics Sugeridos ({result.suggested_topics.length})
                </h2>
                <div className="space-y-3">
                  {result.suggested_topics.map((topic, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-start gap-3"
                    >
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {topic.title}
                        </p>
                        <p className="text-xs text-foreground-secondary">
                          Angulo: {topic.angle}
                        </p>
                        <p className="text-xs text-foreground-muted italic">
                          Hook: {topic.hook_idea}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/topics/new?title=${encodeURIComponent(topic.title)}&angle=${encodeURIComponent(topic.angle)}&hook_idea=${encodeURIComponent(topic.hook_idea)}`
                          )
                        }
                        className="shrink-0 self-start"
                      >
                        Crear Topic
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
