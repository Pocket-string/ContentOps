import { getResearchById } from '@/features/research/services/research-service'
import { getWorkspaceId } from '@/lib/workspace'
import { getPillarList } from '@/features/pillars/services/pillar-service'
import { deriveTopicFromResearch } from '@/features/topics/services/topic-derivation'
import { TopicNewClient } from './client'
import type { CreateTopicInput } from '@/shared/types/content-ops'

export const metadata = { title: 'Nuevo Tema | ContentOps' }

interface Props {
  searchParams: Promise<{
    from_research?: string
    title?: string
    angle?: string
    hook_idea?: string
    pillar_id?: string
  }>
}

export default async function NewTopicPage({ searchParams }: Props) {
  const { from_research, title, angle, hook_idea, pillar_id } = await searchParams

  const workspaceId = await getWorkspaceId()
  const pillarsResult = await getPillarList(workspaceId)

  let initialData: Partial<CreateTopicInput> = {}
  let isFromResearch = false

  if (from_research) {
    isFromResearch = true
    const result = await getResearchById(from_research)

    if (result.data) {
      const research = result.data

      // Extract ai_synthesis for context
      const synthesis = research.ai_synthesis as Record<string, unknown> | null
      const keyFindings = (synthesis && Array.isArray(synthesis['key_findings']))
        ? synthesis['key_findings'] as Array<{ finding: string; relevance: string; source: string }>
        : []
      const sources = (synthesis && Array.isArray(synthesis['sources']))
        ? synthesis['sources'] as string[]
        : research.evidence_links ?? []

      // If we have a specific topic selected (title + angle), use AI derivation
      if (title && angle) {
        const aiDerived = await deriveTopicFromResearch(
          workspaceId,
          {
            title: research.title,
            summary: typeof synthesis?.['summary'] === 'string' ? synthesis['summary'] as string : undefined,
            market_context: typeof synthesis?.['market_context'] === 'string' ? synthesis['market_context'] as string : undefined,
            key_findings: keyFindings,
            sources,
            pillar_id: research.pillar_id ?? pillar_id ?? undefined,
            fit_score: research.fit_score ?? undefined,
          },
          {
            title,
            angle,
            hook_idea: hook_idea ?? '',
          }
        )

        // AI derivation succeeded — use its output
        if (aiDerived.title) {
          initialData = aiDerived
        }
      }

      // Fallback: if AI derivation failed or no specific topic, use basic mapping
      if (!initialData.title) {
        initialData.title = title || research.title
        if (angle) initialData.hypothesis = angle
        if (hook_idea) initialData.evidence = hook_idea
        initialData.priority = 'high'
        initialData.pillar_id = research.pillar_id ?? pillar_id ?? undefined
        if (research.fit_score != null) initialData.fit_score = research.fit_score
      }
    }
  } else if (title ?? angle ?? hook_idea) {
    // Pre-fill directly from query params (no saved research)
    if (title) initialData.title = title
    if (angle) initialData.hypothesis = angle
    if (hook_idea) initialData.evidence = hook_idea
    if (pillar_id) initialData.pillar_id = pillar_id
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {isFromResearch ? 'Derivar Tema desde Research' : 'Nuevo Tema'}
      </h1>
      <TopicNewClient initialData={initialData} pillars={pillarsResult.data ?? []} />
    </div>
  )
}
