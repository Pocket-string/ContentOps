'use client'

import type { BrandProfile, UpdateBrandProfileInput } from '@/shared/types/content-ops'
import { BrandEditor } from '@/features/brand/components/BrandEditor'
import { updateBrandProfileAction, createBrandProfileAction } from '@/features/brand/actions/brand-actions'

interface BrandSettingsClientProps {
  profiles: BrandProfile[]
}

export function BrandSettingsClient({ profiles }: BrandSettingsClientProps) {
  async function handleUpdate(
    profileId: string,
    data: UpdateBrandProfileInput
  ): Promise<{ error?: string }> {
    const result = await updateBrandProfileAction(profileId, data)
    return { error: result.error }
  }

  async function handleCreate(): Promise<{ error?: string }> {
    const result = await createBrandProfileAction()
    return { error: result.error }
  }

  return (
    <BrandEditor
      profiles={profiles}
      onUpdate={handleUpdate}
      onCreate={handleCreate}
    />
  )
}
