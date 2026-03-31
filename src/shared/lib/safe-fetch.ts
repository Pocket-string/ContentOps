/**
 * Safe fetch wrapper that handles HTML error responses gracefully.
 * During deploys, API routes may return HTML instead of JSON,
 * causing "Unexpected token '<'" errors.
 */
export async function safeFetch<T>(
  url: string,
  options: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(url, options)
    const contentType = response.headers.get('content-type') ?? ''

    if (!contentType.includes('application/json')) {
      console.error(`[safeFetch] Non-JSON response from ${url}:`, contentType)
      return { error: 'El servidor respondio con un formato inesperado. Intenta de nuevo en unos segundos.' }
    }

    const json: unknown = await response.json()
    if (!response.ok) {
      const errJson = json as { error?: string }
      return { error: errJson.error ?? `Error ${response.status}` }
    }
    return { data: json as T }
  } catch (err) {
    if (err instanceof SyntaxError) {
      return { error: 'Error de conexion con el servidor. Intenta de nuevo.' }
    }
    return { error: 'Error de red. Verifica tu conexion.' }
  }
}
