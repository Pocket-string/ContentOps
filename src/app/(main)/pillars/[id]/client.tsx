'use client'

import { useRouter } from 'next/navigation'
import { PillarForm } from '@/features/pillars/components'
import { updatePillarAction } from '@/features/pillars/actions/pillar-actions'
import type { ContentPillar, CreatePillarInput } from '@/shared/types/content-ops'

interface Props {
  pillar: ContentPillar
}

export function PillarEditClient({ pillar }: Props) {
  const router = useRouter()

  async function handleSubmit(data: CreatePillarInput) {
    const formData = new FormData()
    formData.set('name', data.name)
    if (data.description) formData.set('description', data.description)
    formData.set('color', data.color)
    formData.set('sort_order', String(data.sort_order))

    const result = await updatePillarAction(pillar.id, formData)

    if ('error' in result) {
      return { error: result.error }
    }
  }

  return (
    <PillarForm
      pillar={pillar}
      onSubmit={handleSubmit}
      onSuccess={() => router.push('/pillars')}
    />
  )
}
