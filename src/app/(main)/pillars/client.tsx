'use client'

import { PillarList } from '@/features/pillars/components'
import { deletePillarAction } from '@/features/pillars/actions/pillar-actions'
import type { ContentPillar } from '@/shared/types/content-ops'

interface Props {
  pillars: ContentPillar[]
}

export function PillarListClient({ pillars }: Props) {
  async function handleDelete(id: string) {
    const result = await deletePillarAction(id)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  return <PillarList pillars={pillars} onDelete={handleDelete} />
}
