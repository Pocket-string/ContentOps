import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getExportPackData } from '@/features/export/services/export-service'
import { ExportPanel } from '@/features/export/components'

export const metadata = { title: 'Export Pack | ContentOps' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function ExportPage({ params }: Props) {
  const { id: campaignId } = await params

  const result = await getExportPackData(campaignId)

  if (!result.data) {
    notFound()
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href={`/campaigns/${campaignId}`}
          className="text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          &larr; Volver a campana
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-1">
          Export Campaign Pack
        </h1>
        <p className="text-sm text-foreground-muted mt-0.5">
          {result.data.topicTitle && <span>Tema: {result.data.topicTitle} &middot; </span>}
          Semana del {new Date(result.data.weekStart + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <ExportPanel data={result.data} />
    </div>
  )
}
