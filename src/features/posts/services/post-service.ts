import { createClient } from '@/lib/supabase/server'
import {
  postSchema,
  postVersionSchema,
  savePostVersionSchema,
  scorePostSchema,
  type Post,
  type PostVersion,
  type SavePostVersionInput,
  type ScorePostInput,
} from '@/shared/types/content-ops'
import { z } from 'zod'

// ============================================
// Types
// ============================================

export interface ServiceResult<T> {
  data?: T
  error?: string
}

/**
 * Post with all its versions ordered by version descending.
 */
export type PostWithVersions = Post & {
  versions: PostVersion[]
}

// ============================================
// Internal schemas for joined rows
// ============================================

const postWithVersionsSchema = postSchema.extend({
  post_versions: z.array(postVersionSchema),
})

type PostWithVersionsRaw = z.infer<typeof postWithVersionsSchema>

function toPostWithVersions(raw: PostWithVersionsRaw): PostWithVersions {
  const { post_versions, ...post } = raw
  return {
    ...post,
    versions: post_versions,
  }
}

// ============================================
// Queries
// ============================================

/**
 * Get a post by id with ALL its versions ordered by version descending.
 */
export async function getPostWithVersions(
  postId: string
): Promise<ServiceResult<PostWithVersions>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('posts')
      .select('*, post_versions(*)')
      .eq('id', postId)
      .order('version', { referencedTable: 'post_versions', ascending: false })
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = postWithVersionsSchema.safeParse(data)

    if (!parsed.success) {
      console.error('[post-service] getPostWithVersions parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    return { data: toPostWithVersions(parsed.data) }
  } catch (err) {
    console.error('[post-service] getPostWithVersions unexpected error', err)
    return { error: 'Error inesperado al obtener el post' }
  }
}

/**
 * Get a post by campaign and day_of_week, including all versions.
 */
export async function getPostByCampaignAndDay(
  campaignId: string,
  dayOfWeek: number
): Promise<ServiceResult<PostWithVersions>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('posts')
      .select('*, post_versions(*)')
      .eq('campaign_id', campaignId)
      .eq('day_of_week', dayOfWeek)
      .order('version', { referencedTable: 'post_versions', ascending: false })
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = postWithVersionsSchema.safeParse(data)

    if (!parsed.success) {
      console.error('[post-service] getPostByCampaignAndDay parse error', parsed.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    return { data: toPostWithVersions(parsed.data) }
  } catch (err) {
    console.error('[post-service] getPostByCampaignAndDay unexpected error', err)
    return { error: 'Error inesperado al obtener el post por dia' }
  }
}

// ============================================
// Mutations
// ============================================

/**
 * Create a new post_version for a given post.
 *
 * Three-step process:
 *   1. Query the max version number for this post.
 *   2. Insert the new version with version = max + 1.
 *   3. Set is_current = false on all existing versions, then is_current = true on the new one.
 *
 * Returns the newly created version.
 */
export async function createPostVersion(
  userId: string,
  data: SavePostVersionInput
): Promise<ServiceResult<PostVersion>> {
  try {
    const validated = savePostVersionSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de entrada invalidos' }
    }

    const supabase = await createClient()

    // Step 1: Get max version for this post
    const { data: maxRow, error: maxError } = await supabase
      .from('post_versions')
      .select('version')
      .eq('post_id', validated.data.post_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxError) {
      return { error: maxError.message }
    }

    const nextVersion = (maxRow?.version ?? 0) + 1

    // Step 2: Insert new version
    const { data: newVersionRow, error: insertError } = await supabase
      .from('post_versions')
      .insert({
        post_id: validated.data.post_id,
        version: nextVersion,
        variant: validated.data.variant,
        content: validated.data.content,
        notes: validated.data.notes ?? null,
        structured_content: validated.data.structured_content ?? null,
        score_json: null,
        is_current: true,
        created_by: userId,
      })
      .select()
      .single()

    if (insertError || !newVersionRow) {
      return { error: insertError?.message ?? 'Error al crear la version' }
    }

    // Step 3a: Unset is_current on all other versions
    const { error: unsetError } = await supabase
      .from('post_versions')
      .update({ is_current: false })
      .eq('post_id', validated.data.post_id)
      .neq('id', newVersionRow.id)

    if (unsetError) {
      return { error: unsetError.message }
    }

    const parsed = postVersionSchema.safeParse(newVersionRow)

    if (!parsed.success) {
      console.error('[post-service] createPostVersion parse error', parsed.error.flatten())
      return { error: 'Error al parsear la version creada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[post-service] createPostVersion unexpected error', err)
    return { error: 'Error inesperado al crear la version' }
  }
}

/**
 * Set a specific version as current, unsetting all others for the same post.
 *
 * Two-step process:
 *   1. Fetch the target version to get its post_id.
 *   2. Unset is_current on all sibling versions, then set is_current = true on the target.
 */
export async function setCurrentVersion(
  postVersionId: string
): Promise<ServiceResult<PostVersion>> {
  try {
    const supabase = await createClient()

    // Step 1: Fetch the target version to get post_id
    const { data: targetRow, error: fetchError } = await supabase
      .from('post_versions')
      .select('*')
      .eq('id', postVersionId)
      .single()

    if (fetchError || !targetRow) {
      return { error: fetchError?.message ?? 'Version no encontrada' }
    }

    const parsedTarget = postVersionSchema.safeParse(targetRow)

    if (!parsedTarget.success) {
      console.error('[post-service] setCurrentVersion parse error (fetch)', parsedTarget.error.flatten())
      return { error: 'Error al parsear datos de la base de datos' }
    }

    const postId = parsedTarget.data.post_id

    // Step 2a: Unset is_current on all other versions for this post
    const { error: unsetError } = await supabase
      .from('post_versions')
      .update({ is_current: false })
      .eq('post_id', postId)
      .neq('id', postVersionId)

    if (unsetError) {
      return { error: unsetError.message }
    }

    // Step 2b: Set is_current = true on the target version
    const { data: updatedRow, error: setError } = await supabase
      .from('post_versions')
      .update({ is_current: true })
      .eq('id', postVersionId)
      .select()
      .single()

    if (setError || !updatedRow) {
      return { error: setError?.message ?? 'Error al establecer la version actual' }
    }

    const parsed = postVersionSchema.safeParse(updatedRow)

    if (!parsed.success) {
      console.error('[post-service] setCurrentVersion parse error (update)', parsed.error.flatten())
      return { error: 'Error al parsear la version actualizada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[post-service] setCurrentVersion unexpected error', err)
    return { error: 'Error inesperado al establecer la version actual' }
  }
}

/**
 * Update score_json on a post_version.
 */
export async function scorePostVersion(
  data: ScorePostInput
): Promise<ServiceResult<PostVersion>> {
  try {
    const validated = scorePostSchema.safeParse(data)

    if (!validated.success) {
      return { error: 'Datos de puntuacion invalidos' }
    }

    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('post_versions')
      .update({ score_json: validated.data.score })
      .eq('id', validated.data.post_version_id)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = postVersionSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[post-service] scorePostVersion parse error', parsed.error.flatten())
      return { error: 'Error al parsear la version puntuada' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[post-service] scorePostVersion unexpected error', err)
    return { error: 'Error inesperado al puntuar la version' }
  }
}

/**
 * Update the status field on a post.
 */
export async function updatePostStatus(
  postId: string,
  status: string
): Promise<ServiceResult<Post>> {
  try {
    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('posts')
      .update({ status })
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = postSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[post-service] updatePostStatus parse error', parsed.error.flatten())
      return { error: 'Error al parsear el estado actualizado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[post-service] updatePostStatus unexpected error', err)
    return { error: 'Error inesperado al actualizar el estado del post' }
  }
}

/**
 * Update the objective field on a post.
 */
export async function updatePostObjective(
  postId: string,
  objective: string
): Promise<ServiceResult<Post>> {
  try {
    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('posts')
      .update({ objective })
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    const parsed = postSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[post-service] updatePostObjective parse error', parsed.error.flatten())
      return { error: 'Error al parsear el objetivo actualizado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[post-service] updatePostObjective unexpected error', err)
    return { error: 'Error inesperado al actualizar el objetivo del post' }
  }
}

/**
 * Update the day_of_week for a post (move it to another day).
 *
 * If the target day already has a post in the same campaign, the two posts
 * swap days atomically via a deferred constraint transaction (SQL RPC).
 */
export async function updatePostDayOfWeek(
  postId: string,
  dayOfWeek: number
): Promise<ServiceResult<Post>> {
  try {
    const supabase = await createClient()

    // Step 1: Fetch current post to get campaign_id and current day
    const { data: currentPost, error: fetchErr } = await supabase
      .from('posts')
      .select('id, campaign_id, day_of_week')
      .eq('id', postId)
      .single()

    if (fetchErr || !currentPost) {
      return { error: fetchErr?.message ?? 'Post no encontrado' }
    }

    if (currentPost.day_of_week === dayOfWeek) {
      // No change needed
      const { data: row } = await supabase.from('posts').select('*').eq('id', postId).single()
      const parsed = postSchema.safeParse(row)
      return parsed.success ? { data: parsed.data } : { error: 'Error al parsear post' }
    }

    // Step 2: Check if target day is occupied
    const { data: targetPost } = await supabase
      .from('posts')
      .select('id')
      .eq('campaign_id', currentPost.campaign_id)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle()

    if (targetPost) {
      // Swap: use SQL transaction to swap both days atomically
      const { error: swapErr } = await supabase.rpc('swap_post_days', {
        post_a_id: currentPost.id,
        post_b_id: targetPost.id,
      })

      if (swapErr) {
        console.error('[post-service] swap_post_days RPC error', swapErr)
        return { error: 'Error al intercambiar dias de publicacion' }
      }
    } else {
      // No conflict — direct update
      const { error: updateErr } = await supabase
        .from('posts')
        .update({ day_of_week: dayOfWeek })
        .eq('id', postId)

      if (updateErr) {
        return { error: updateErr.message }
      }
    }

    // Return updated post
    const { data: row, error: refetchErr } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (refetchErr) {
      return { error: refetchErr.message }
    }

    const parsed = postSchema.safeParse(row)

    if (!parsed.success) {
      console.error('[post-service] updatePostDayOfWeek parse error', parsed.error.flatten())
      return { error: 'Error al parsear el dia actualizado' }
    }

    return { data: parsed.data }
  } catch (err) {
    console.error('[post-service] updatePostDayOfWeek unexpected error', err)
    return { error: 'Error inesperado al actualizar el dia del post' }
  }
}
