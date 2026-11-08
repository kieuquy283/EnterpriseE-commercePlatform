type Context = {
  headers: Record<string, string | string[] | undefined>
  locale?: string
  auth_context?: unknown
}

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

const pending = new Map<string, Promise<unknown>>()
const cache = new Map<string, CacheEntry<unknown>>()

export function clearAnonymousCache() {
  cache.clear()
  pending.clear()
}

export function getCacheTtlMs(): number {
  if (process.env.RECOMMENDATION_CACHE_TTL_MS !== undefined) {
    const parsed = Number(process.env.RECOMMENDATION_CACHE_TTL_MS)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }
  // In test environment, default to 0 to ensure test isolation and immediate state reflection
  // In production or when explicitly enabled, default to 5000ms
  return process.env.NODE_ENV === "test" && process.env.ENABLE_RECOMMENDATION_CACHE !== "true" ? 0 : 5000
}

// Share in-flight work and optionally provide short-lived TTL caching for anonymous queries.
// Authenticated requests always get their own un-cached Medusa pricing context.
export async function coalesceAnonymous<T>(context: Context, query: Record<string, unknown>, work: () => Promise<T>): Promise<T> {
  const identity = context.auth_context as { actor_id?: string; auth_identity_id?: string } | undefined
  if (context.headers.authorization || context.headers.cookie || identity?.actor_id || identity?.auth_identity_id || pending.size >= 200) return work()

  const key = JSON.stringify([context.headers["x-publishable-api-key"], context.locale, context.headers["accept-language"], query])

  const ttl = getCacheTtlMs()
  if (ttl > 0) {
    const cached = cache.get(key)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T
    }
  }

  const previous = pending.get(key)
  if (previous) return previous as Promise<T>

  const operation = work()
    .then((result) => {
      if (ttl > 0) {
        cache.set(key, { data: result, expiresAt: Date.now() + ttl })
        if (cache.size > 1000) {
          const now = Date.now()
          for (const [k, v] of cache.entries()) {
            if (v.expiresAt <= now) cache.delete(k)
          }
        }
      }
      return result
    })

  pending.set(key, operation)
  try {
    return await operation
  } finally {
    if (pending.get(key) === operation) pending.delete(key)
  }
}
