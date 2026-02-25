'use client'

import { VisualEditor } from '@/features/visuals/components'
import {
  createVisualVersionAction,
  updateVisualPromptAction,
  updateVisualStatusAction,
  updateVisualQAAction,
  uploadVisualImageAction,
} from '@/features/visuals/actions/visual-actions'
import type { VisualVersion, CarouselSlide } from '@/shared/types/content-ops'

interface Props {
  postId: string
  campaignId: string
  dayOfWeek: number
  postContent: string
  funnelStage: string
  topicTitle?: string
  keyword?: string
  visuals: VisualVersion[]
  carouselSlidesMap?: Record<string, CarouselSlide[]>
}

export function VisualEditorClient({
  postId,
  campaignId,
  dayOfWeek,
  postContent,
  funnelStage,
  topicTitle,
  keyword,
  visuals,
  carouselSlidesMap,
}: Props) {
  async function handleCreateVisual(formData: FormData) {
    const result = await createVisualVersionAction(formData)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleUpdatePrompt(visualId: string, promptJson: string) {
    const result = await updateVisualPromptAction(visualId, promptJson)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleUpdateStatus(visualId: string, status: string) {
    const result = await updateVisualStatusAction(visualId, status)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleUpdateQA(visualId: string, qaJson: string) {
    const result = await updateVisualQAAction(visualId, qaJson)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleUploadImage(visualId: string, imageUrl: string) {
    const result = await uploadVisualImageAction(visualId, imageUrl)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  return (
    <VisualEditor
      postId={postId}
      campaignId={campaignId}
      dayOfWeek={dayOfWeek}
      postContent={postContent}
      funnelStage={funnelStage}
      topicTitle={topicTitle}
      keyword={keyword}
      visuals={visuals}
      carouselSlidesMap={carouselSlidesMap}
      onCreateVisual={handleCreateVisual}
      onUpdatePrompt={handleUpdatePrompt}
      onUpdateStatus={handleUpdateStatus}
      onUpdateQA={handleUpdateQA}
      onUploadImage={handleUploadImage}
    />
  )
}
