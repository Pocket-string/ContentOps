import { notFound } from 'next/navigation'
import { getResearchById } from '@/features/research/services/research-service'
import { ResearchDetailClient } from './client'

export const metadata = { title: 'Research | ContentOps' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function ResearchDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getResearchById(id)

  if (!result.data) {
    notFound()
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <ResearchDetailClient research={result.data} />
    </div>
  )
}
