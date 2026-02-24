'use client'

import Link from 'next/link'
import { ConversionPanel } from '@/features/conversion/components'
import {
  updateResourceAction,
  updateTemplatesAction,
  updatePinnedCommentAction,
} from '@/features/conversion/actions/conversion-actions'

interface Props {
  campaignId: string
  keyword: string | null
  topicTitle?: string
  weekStart: string
  config: {
    resource?: {
      type: string
      url: string
      name: string
      description: string
    }
    templates?: {
      id: string
      name: string
      content: string
    }[]
    pinned_comment?: string
  }
}

export function ConversionClient({ campaignId, keyword, topicTitle, weekStart, config }: Props) {
  async function handleUpdateResource(id: string, resourceJson: string) {
    const result = await updateResourceAction(id, resourceJson)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleUpdateTemplates(id: string, templatesJson: string) {
    const result = await updateTemplatesAction(id, templatesJson)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleUpdatePinnedComment(id: string, pinnedComment: string) {
    const result = await updatePinnedCommentAction(id, pinnedComment)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/campaigns/${campaignId}`}
            className="text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            &larr; Volver a campana
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            Conversion
          </h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            {topicTitle && <span>Tema: {topicTitle} &middot; </span>}
            Semana del {new Date(weekStart).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      <ConversionPanel
        campaignId={campaignId}
        keyword={keyword}
        config={config}
        onUpdateResource={handleUpdateResource}
        onUpdateTemplates={handleUpdateTemplates}
        onUpdatePinnedComment={handleUpdatePinnedComment}
      />
    </div>
  )
}
