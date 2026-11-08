import { buildInterestProfile, rankForYou } from "../rank"

describe("behavioral recommendation baseline", () => {
  const now = new Date("2026-11-07T12:00:00Z")

  it("uses recent distinct interests and caps repeated views", () => {
    const events = [
      ...Array.from({ length: 20 }, (_, index) => ({ id: String(index), event_type: "product_view" as const, product_id: "prod_shirt", created_at: now })),
      { id: "click", event_type: "recommendation_click" as const, product_id: "prod_dress", created_at: now },
      { id: "old", event_type: "product_view" as const, product_id: "prod_old", created_at: "2026-01-01T00:00:00Z" },
    ]
    expect(buildInterestProfile(events, now).source_products).toEqual([
      { product_id: "prod_shirt", weight: 5 }, { product_id: "prod_dress", weight: 2 },
    ])
  })

  it("separates two histories, excludes source items and breaks ties deterministically", () => {
    const neighbors = [
      { source_product_id: "prod_shirt", target_product_id: "prod_tee", score: .9, rank: 1 },
      { source_product_id: "prod_shirt", target_product_id: "prod_shirt", score: 1, rank: 2 },
      { source_product_id: "prod_dress", target_product_id: "prod_skirt", score: .9, rank: 1 },
    ]
    const popular = [{ product_id: "prod_popular", rank: 1 }]
    expect(rankForYou({ source_products: [{ product_id: "prod_shirt", weight: 5 }] }, neighbors, popular)[0]).toBe("prod_tee")
    expect(rankForYou({ source_products: [{ product_id: "prod_dress", weight: 5 }] }, neighbors, popular)[0]).toBe("prod_skirt")
    expect(rankForYou({ source_products: [{ product_id: "prod_shirt", weight: 5 }] }, neighbors, popular)).not.toContain("prod_shirt")
    expect(rankForYou({ source_products: [] }, [], popular)).toEqual(["prod_popular"])
  })

  it("uses an order placement as interest but cancels it even when events arrive out of order", () => {
    const placed = { id: "placed", event_type: "order_placed" as const, product_id: "prod_shirt", created_at: now, order_line_key: "order:line" }
    const canceled = { id: "canceled", event_type: "order_canceled" as const, product_id: "prod_shirt", created_at: now, order_line_key: "order:line" }
    expect(buildInterestProfile([placed], now).source_products).toEqual([{ product_id: "prod_shirt", weight: 5 }])
    expect(buildInterestProfile([canceled, placed], now).source_products).toEqual([])
  })
})
