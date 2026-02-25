import { getResearchById } from '@/features/research/services/research-service'
import { TopicNewClient } from './client'

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

  let initialTitle = ''
  let initialHypothesis = ''
  let initialEvidence = ''

  if (from_research) {
    // Derive from a saved research report by UUID
    const result = await getResearchById(from_research)
    if (result.data) {
      initialTitle = result.data.title
      initialEvidence = result.data.raw_text.slice(0, 500)
    }
  } else if (title ?? angle ?? hook_idea) {
    // Pre-fill directly from query params (e.g. coming from DeepResearchPanel)
    initialTitle = title ?? ''
    initialHypothesis = angle ?? ''
    // hook_idea maps to evidence as a creative starting point
    initialEvidence = hook_idea ?? ''
  }

  const isFromResearch = Boolean(from_research)

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {isFromResearch ? 'Derivar Tema desde Research' : 'Nuevo Tema'}
      </h1>
      <TopicNewClient
        initialData={{
          title: initialTitle,
          hypothesis: initialHypothesis || undefined,
          evidence: initialEvidence || undefined,
        }}
      />
    </div>
  )
}
