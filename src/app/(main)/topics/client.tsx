'use client'

import { TopicList } from '@/features/topics/components'
import { updateTopicStatusAction } from '@/features/topics/actions/topic-actions'
import type { Topic } from '@/shared/types/content-ops'

interface Props {
  topics: Topic[]
}

export function TopicListClient({ topics }: Props) {
  async function handleStatusChange(id: string, status: string) {
    const result = await updateTopicStatusAction(id, status)
    if ('error' in result) {
      return { error: result.error }
    }
  }

  return <TopicList topics={topics} onStatusChange={handleStatusChange} />
}
