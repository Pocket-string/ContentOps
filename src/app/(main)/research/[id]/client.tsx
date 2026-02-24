'use client'

import { useRouter } from 'next/navigation'
import { ResearchDetail } from '@/features/research/components/ResearchDetail'
import { deleteResearchAction } from '@/features/research/actions/research-actions'
import type { ResearchReport } from '@/shared/types/content-ops'

interface Props {
  research: ResearchReport
}

export function ResearchDetailClient({ research }: Props) {
  const router = useRouter()

  async function handleDelete() {
    const result = await deleteResearchAction(research.id)

    if ('error' in result) {
      return { error: result.error }
    }

    router.push('/research')
  }

  return <ResearchDetail research={research} onDelete={handleDelete} />
}
