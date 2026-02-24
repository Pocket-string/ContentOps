import { createServiceClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'visual-assets'

interface UploadResult {
  publicUrl: string
}

/**
 * Uploads a base64-encoded image to Supabase Storage.
 * Returns the public URL for direct use in <img> tags.
 * Uses service role client to bypass RLS.
 */
export async function uploadImageToStorage(
  workspaceId: string,
  visualVersionId: string,
  base64Data: string,
  mediaType: string
): Promise<{ data?: UploadResult; error?: string }> {
  try {
    const supabase = createServiceClient()

    const ext = mediaType === 'image/jpeg' ? 'jpg'
      : mediaType === 'image/webp' ? 'webp'
      : 'png'

    const filePath = `${workspaceId}/${visualVersionId}.${ext}`
    const buffer = Buffer.from(base64Data, 'base64')

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: mediaType,
        upsert: true,
      })

    if (uploadError) {
      console.error('[image-storage] Upload error:', uploadError)
      return { error: `Error al subir imagen: ${uploadError.message}` }
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return { data: { publicUrl: urlData.publicUrl } }
  } catch (err) {
    console.error('[image-storage] Unexpected error:', err)
    return { error: 'Error inesperado al subir la imagen' }
  }
}
