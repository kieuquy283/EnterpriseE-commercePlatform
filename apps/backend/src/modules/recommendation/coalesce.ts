type Context = {
  headers: Record<string, string | string[] | undefined>
  locale?: string
  auth_context?: unknown
}

const pending = new Map<string, Promise<unknown>>()

// Share only work that is currently running. No completed prices/stock are cached.
// Authenticated requests always get their own Medusa pricing context.
export async function coalesceAnonymous<T>(context: Context, query: Record<string, unknown>, work: () => Promise<T>): Promise<T> {
  const identity = context.auth_context as { actor_id?: string; auth_identity_id?: string } | undefined
  if (context.headers.authorization || context.headers.cookie || identity?.actor_id || identity?.auth_identity_id || pending.size >= 100) return work()
  const key = JSON.stringify([context.headers["x-publishable-api-key"], context.locale, context.headers["accept-language"], query])
  const previous = pending.get(key)
  if (previous) return previous as Promise<T>
  const operation = work()
  pending.set(key, operation)
  try {
    return await operation
  } finally {
    if (pending.get(key) === operation) pending.delete(key)
  }
}
