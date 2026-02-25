interface RateLimiterConfig {
  maxRequests: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes to prevent memory drift
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key)
    }
  }, CLEANUP_INTERVAL_MS)
  // Allow Node.js process to exit even if interval is active
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }
}

export function createRateLimiter({ maxRequests, windowMs }: RateLimiterConfig) {
  ensureCleanup()
  return {
    check(key: string): { success: boolean; remaining: number; resetAt: number } {
      const now = Date.now()
      const entry = store.get(key)

      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs })
        return { success: true, remaining: maxRequests - 1, resetAt: now + windowMs }
      }

      if (entry.count >= maxRequests) {
        return { success: false, remaining: 0, resetAt: entry.resetAt }
      }

      entry.count++
      return { success: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
    },
  }
}

export const aiRateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 })
export const imageRateLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })
export const exportRateLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 })
export const researchRateLimiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 })
export const chatRateLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 })
