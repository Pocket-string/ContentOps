'use client'

import { PostEditor } from '@/features/posts/components'
import {
  savePostVersionAction,
  setCurrentVersionAction,
  scorePostVersionAction,
  updatePostStatusAction,
  updatePostObjectiveAction,
  updatePostDayAction,
  selectVariantAction,
} from '@/features/posts/actions/post-actions'
import type { Post, PostVersion, WeeklyBrief } from '@/shared/types/content-ops'

interface Props {
  post: Post & { versions: PostVersion[] }
  campaignId: string
  topicTitle?: string
  keyword?: string
  weeklyBrief?: WeeklyBrief
  topicContext?: string
  previousHooks?: string[]
  siblingPosts?: { day_of_week: string; funnel_stage: string; content_preview: string }[]
  pillarContext?: string
  editorialPillarContext?: string | null
  audienceAngle?: string | null
  structureBlueprint?: string | null
  structureName?: string | null
  structureSlug?: string | null
}

export function PostEditorClient({
  post, campaignId, topicTitle, keyword, weeklyBrief, topicContext, previousHooks, siblingPosts, pillarContext,
  editorialPillarContext, audienceAngle, structureBlueprint, structureName, structureSlug,
}: Props) {
  async function handleSaveVersion(formData: FormData) {
    const result = await savePostVersionAction(formData)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleSetCurrent(versionId: string) {
    const result = await setCurrentVersionAction(versionId)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleScore(versionId: string, score: unknown) {
    const result = await scorePostVersionAction(versionId, score)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleStatusChange(postId: string, status: string) {
    const result = await updatePostStatusAction(postId, status)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleObjectiveChange(postId: string, objective: string) {
    const result = await updatePostObjectiveAction(postId, objective)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleDayChange(postId: string, dayOfWeek: number) {
    const result = await updatePostDayAction(postId, dayOfWeek)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  async function handleSelectVariant(postId: string, variant: string) {
    const result = await selectVariantAction(postId, variant)
    if ('error' in result) {
      return { error: result.error }
    }
    return { success: true as const }
  }

  return (
    <PostEditor
      post={post}
      campaignId={campaignId}
      topicTitle={topicTitle}
      keyword={keyword}
      weeklyBrief={weeklyBrief}
      topicContext={topicContext}
      previousHooks={previousHooks}
      siblingPosts={siblingPosts}
      pillarContext={pillarContext}
      editorialPillarContext={editorialPillarContext}
      audienceAngle={audienceAngle}
      structureBlueprint={structureBlueprint}
      structureName={structureName}
      structureSlug={structureSlug}
      onSaveVersion={handleSaveVersion}
      onSetCurrent={handleSetCurrent}
      onScore={handleScore}
      onStatusChange={handleStatusChange}
      onObjectiveChange={handleObjectiveChange}
      onDayChange={handleDayChange}
      onSelectVariant={handleSelectVariant}
    />
  )
}
