'use client'

import { useRouter } from 'next/navigation'
import { PillarForm } from '@/features/pillars/components'
import { createPillarAction } from '@/features/pillars/actions/pillar-actions'
import type { CreatePillarInput } from '@/shared/types/content-ops'

export function PillarNewClient() {
  const router = useRouter()

  async function handleSubmit(data: CreatePillarInput) {
    const formData = new FormData()
    formData.set('name', data.name)
    if (data.description) formData.set('description', data.description)
    formData.set('color', data.color)
    formData.set('sort_order', String(data.sort_order))

    const result = await createPillarAction(formData)

    if (result && 'error' in result) {
      return { error: result.error }
    }
  }

  return (
    <PillarForm
      onSubmit={handleSubmit}
      onSuccess={() => router.push('/pillars')}
    />
  )
}
