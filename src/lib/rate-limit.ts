interface RateLimiterConfig {
  maxRequests: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export function createRateLimiter({ maxRequests, windowMs }: RateLimiterConfig) {
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
