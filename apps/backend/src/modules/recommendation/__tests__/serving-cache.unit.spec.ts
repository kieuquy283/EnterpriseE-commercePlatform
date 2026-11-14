import {
  candidatesCache,
  clearRecommendationCache,
  popularCache,
  productGroupCache,
  validRegions,
} from "../serving-cache"

describe("recommendation serving cache invalidation", () => {
  afterEach(clearRecommendationCache)

  it("clears every serving metadata cache used by publication", () => {
    candidatesCache.set("run:home:home", { ids: ["prod_A"], strategy: "popular", expiresAt: 1 })
    popularCache.set("run", { ids: ["prod_A"], expiresAt: 1 })
    productGroupCache.set("prod_A", "clothing")
    validRegions.add("reg_A")

    clearRecommendationCache()

    expect([
      candidatesCache.size,
      popularCache.size,
      productGroupCache.size,
      validRegions.size,
    ]).toEqual([0, 0, 0, 0])
  })
})
