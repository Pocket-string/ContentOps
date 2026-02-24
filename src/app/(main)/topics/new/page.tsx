import { getResearchById } from '@/features/research/services/research-service'
import { TopicNewClient } from './client'

export const metadata = { title: 'Nuevo Tema | ContentOps' }

interface Props {
  searchParams: Promise<{ from_research?: string }>
}

export default async function NewTopicPage({ searchParams }: Props) {
  const { from_research } = await searchParams

  // Pre-fill from research if derivando
  let initialTitle = ''
  let initialEvidence = ''

  if (from_research) {
    const result = await getResearchById(from_research)
    if (result.data) {
      initialTitle = result.data.title
      initialEvidence = result.data.raw_text.slice(0, 500)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {from_research ? 'Derivar Tema desde Research' : 'Nuevo Tema'}
      </h1>
      <TopicNewClient
        initialData={{
          title: initialTitle,
          evidence: initialEvidence || undefined,
        }}
      />
    </div>
  )
}
