type CandidateCacheEntry = {
  ids: string[]
  strategy: string
  expiresAt: number
}

type PopularCacheEntry = {
  ids: string[]
  expiresAt: number
}

// Process-local state; publication clears only this process.
// TODO(perf): Bound every map and expire metadata across replicas — REC-01; ADR-07.
export const candidatesCache = new Map<string, CandidateCacheEntry>()
export const popularCache = new Map<string, PopularCacheEntry>()
export const productGroupCache = new Map<string, string>()
export const validRegions = new Set<string>()

export function clearRecommendationCache() {
  candidatesCache.clear()
  popularCache.clear()
  productGroupCache.clear()
  validRegions.clear()
}
