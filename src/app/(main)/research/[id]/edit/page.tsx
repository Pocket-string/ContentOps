import { notFound } from 'next/navigation'
import { getResearchById } from '@/features/research/services/research-service'
import { getAllTags } from '@/features/research/services/research-service'
import { getWorkspaceId } from '@/lib/workspace'
import { ResearchEditClient } from './client'

export const metadata = { title: 'Editar Research | ContentOps' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function ResearchEditPage({ params }: Props) {
  const { id } = await params

  const [researchResult, workspaceId] = await Promise.all([
    getResearchById(id),
    getWorkspaceId(),
  ])

  if (!researchResult.data) {
    notFound()
  }

  const tagsResult = await getAllTags(workspaceId)

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <ResearchEditClient
        research={researchResult.data}
        allTags={tagsResult.data ?? []}
      />
    </div>
  )
}
