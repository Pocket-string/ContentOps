import { notFound } from 'next/navigation'
import { getPillarById } from '@/features/pillars/services/pillar-service'
import { PillarEditClient } from './client'

export const metadata = { title: 'Editar Pilar | ContentOps' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function PillarEditPage({ params }: Props) {
  const { id } = await params

  const result = await getPillarById(id)

  if (!result.data) {
    notFound()
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Editar Pilar</h1>
      <PillarEditClient pillar={result.data} />
    </div>
  )
}
