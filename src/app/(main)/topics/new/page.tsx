import { getResearchById } from '@/features/research/services/research-service'
import { TopicNewClient } from './client'
import type { CreateTopicInput } from '@/shared/types/content-ops'

export const metadata = { title: 'Nuevo Tema | ContentOps' }

interface Props {
  searchParams: Promise<{
    from_research?: string
    title?: string
    angle?: string
    hook_idea?: string
  }>
}

export default async function NewTopicPage({ searchParams }: Props) {
  const { from_research, title, angle, hook_idea } = await searchParams

  const initialData: Partial<CreateTopicInput> = {}
  let isFromResearch = false

  if (from_research) {
    isFromResearch = true
    const result = await getResearchById(from_research)

    if (result.data) {
      const research = result.data

      // Use query params first (specific topic selected), fall back to research title
      initialData.title = title || research.title

      // angle → hypothesis (the angle/thesis for this topic)
      if (angle) initialData.hypothesis = angle

      // Extract ai_synthesis for rich field population
      const synthesis = research.ai_synthesis as Record<string, unknown> | null

      // Build RICH evidence from ALL key findings (not just one hook_idea)
      // This is the core of "richer topic descriptions"
      if (synthesis && Array.isArray(synthesis['key_findings'])) {
        const findings = synthesis['key_findings'] as Array<Record<string, string>>
        const richEvidence = findings
          .map(f => {
            const src = f.source || f.source_hint
            return `${f.finding}${src ? ` (Fuente: ${src})` : ''}`
          })
          .join('\n\n')
        initialData.evidence = richEvidence.slice(0, 2000)
      } else if (hook_idea) {
        // Fallback to single hook_idea if no synthesis findings
        initialData.evidence = hook_idea
      } else if (research.raw_text) {
        // Last resort: raw text truncated
        initialData.evidence = research.raw_text.slice(0, 1000)
      }

      // Enrich signals from key_takeaways + finding relevance
      const signals: string[] = []
      if (research.key_takeaways.length > 0) {
        signals.push(...research.key_takeaways.slice(0, 5))
      }
      if (synthesis && Array.isArray(synthesis['key_findings'])) {
        const findings = synthesis['key_findings'] as Array<Record<string, string>>
        for (const f of findings) {
          if (f.relevance && signals.length < 8) {
            signals.push(f.relevance)
          }
        }
      }
      if (signals.length > 0) {
        initialData.signals_json = signals.slice(0, 8)
      }

      // Carry over fit_score from research if present
      if (research.fit_score != null) {
        initialData.fit_score = research.fit_score
      }

      // Extract sources for minimal_proof (V2 sources[] or evidence_links)
      if (synthesis && Array.isArray(synthesis['sources']) && (synthesis['sources'] as string[]).length > 0) {
        initialData.minimal_proof = (synthesis['sources'] as string[]).slice(0, 5).join('\n')
      } else if (research.evidence_links.length > 0) {
        initialData.minimal_proof = research.evidence_links.slice(0, 5).join('\n')
      }

      // Richer business impact from summary + market_context
      if (synthesis) {
        const impactParts: string[] = []
        if (typeof synthesis['summary'] === 'string') {
          impactParts.push(synthesis['summary'] as string)
        }
        if (typeof synthesis['market_context'] === 'string') {
          impactParts.push(synthesis['market_context'] as string)
        }
        if (impactParts.length > 0) {
          initialData.expected_business_impact = impactParts.join('\n\n').slice(0, 1000)
        }
      }

      // Default to high priority when derived from research
      initialData.priority = 'high'
    }
  } else if (title ?? angle ?? hook_idea) {
    // Pre-fill directly from query params (e.g. coming from DeepResearchPanel without saved research)
    if (title) initialData.title = title
    if (angle) initialData.hypothesis = angle
    if (hook_idea) initialData.evidence = hook_idea
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {isFromResearch ? 'Derivar Tema desde Research' : 'Nuevo Tema'}
      </h1>
      <TopicNewClient initialData={initialData} />
    </div>
  )
}
