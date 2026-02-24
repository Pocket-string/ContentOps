'use client'

import { useRouter } from 'next/navigation'
import { TopicForm } from '@/features/topics/components'
import { createTopicAction } from '@/features/topics/actions/topic-actions'
import type { CreateTopicInput } from '@/shared/types/content-ops'

interface Props {
  initialData?: Partial<CreateTopicInput>
}

export function TopicNewClient({ initialData }: Props) {
  const router = useRouter()

  async function handleSubmit(data: CreateTopicInput) {
    const formData = new FormData()
    formData.set('title', data.title)
    if (data.hypothesis) formData.set('hypothesis', data.hypothesis)
    if (data.evidence) formData.set('evidence', data.evidence)
    if (data.anti_myth) formData.set('anti_myth', data.anti_myth)
    if (data.signals_json.length > 0) formData.set('signals_json', JSON.stringify(data.signals_json))
    if (data.fit_score !== undefined) formData.set('fit_score', String(data.fit_score))
    formData.set('priority', data.priority)
    if (data.silent_enemy_name) formData.set('silent_enemy_name', data.silent_enemy_name)
    if (data.minimal_proof) formData.set('minimal_proof', data.minimal_proof)
    if (data.failure_modes.length > 0) formData.set('failure_modes', JSON.stringify(data.failure_modes))
    if (data.expected_business_impact) formData.set('expected_business_impact', data.expected_business_impact)

    const result = await createTopicAction(formData)

    if ('error' in result) {
      return { error: result.error }
    }
  }

  return (
    <TopicForm
      initialData={initialData}
      onSubmit={handleSubmit}
      onSuccess={() => router.push('/topics')}
    />
  )
}
