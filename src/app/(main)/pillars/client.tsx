'use client'

import { PillarList } from '@/features/pillars/components'
import { deletePillarAction, togglePillarActiveAction } from '@/features/pillars/actions/pillar-actions'
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

  async function handleToggleActive(id: string, isActive: boolean) {
    const result = await togglePillarActiveAction(id, isActive)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  return (
    <PillarList
      pillars={pillars}
      onDelete={handleDelete}
      onToggleActive={handleToggleActive}
    />
  )
}
