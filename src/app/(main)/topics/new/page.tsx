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

      // hook_idea → evidence (the hook serves as evidence/data point)
      if (hook_idea) initialData.evidence = hook_idea

      // Enrich from research metadata — extract key_takeaways as signals
      if (research.key_takeaways.length > 0) {
        initialData.signals_json = research.key_takeaways.slice(0, 5)
      }

      // Carry over fit_score from research if present
      if (research.fit_score != null) {
        initialData.fit_score = research.fit_score
      }

      // Build richer evidence from research if hook_idea alone isn't enough
      if (!hook_idea && research.raw_text) {
        initialData.evidence = research.raw_text.slice(0, 800)
      }

      // Extract anti_myth from ai_synthesis if available (look for contrarian angles)
      const synthesis = research.ai_synthesis as Record<string, unknown> | null
      if (synthesis) {
        // Build business impact from synthesis summary
        if (typeof synthesis['summary'] === 'string') {
          initialData.expected_business_impact = (synthesis['summary'] as string).slice(0, 500)
        }

        // Auto-populate evidence_links → minimal_proof if available
        if (research.evidence_links.length > 0) {
          initialData.minimal_proof = research.evidence_links.slice(0, 3).join('\n')
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
