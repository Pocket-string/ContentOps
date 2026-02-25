import { notFound } from 'next/navigation'
import { getTopicById } from '@/features/topics/services/topic-service'
import { TopicDetailClient } from './client'

export const metadata = { title: 'Topic | ContentOps' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function TopicDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getTopicById(id)

  if (!result.data) {
    notFound()
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <TopicDetailClient topic={result.data} />
    </div>
  )
}
