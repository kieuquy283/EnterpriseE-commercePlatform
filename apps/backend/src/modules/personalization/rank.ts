export type InterestEvent = {
  id: string
  event_type: "product_view" | "recommendation_click" | "order_placed" | "order_canceled"
  product_id: string
  created_at: Date | string
  occurred_at?: Date | string
  order_line_key?: string | null
}

export type InterestProfile = { source_products: { product_id: string; weight: number }[] }
export type Neighbor = { source_product_id: string; target_product_id: string; score: number; rank: number }
export type Popular = { product_id: string; rank: number }

export function buildInterestProfile(events: InterestEvent[], now = new Date()): InterestProfile {
  const earliest = now.getTime() - 30 * 24 * 60 * 60 * 1000
  const sorted = [...events].filter((event) => {
    const time = new Date(event.occurred_at ?? event.created_at).getTime()
    return Number.isFinite(time) && time <= now.getTime() && time >= earliest
  }).sort((a, b) => new Date(b.occurred_at ?? b.created_at).getTime() - new Date(a.occurred_at ?? a.created_at).getTime() || a.id.localeCompare(b.id))
  const canceledLines = new Set(sorted.filter((event) => event.event_type === "order_canceled")
    .map((event) => event.order_line_key).filter((key): key is string => !!key))
  const weights = new Map<string, number>()
  for (const event of sorted.slice(0, 100)) {
    if (event.event_type === "order_canceled" ||
      (event.event_type === "order_placed" && event.order_line_key && canceledLines.has(event.order_line_key))) continue
    const weight = event.event_type === "order_placed" ? 5 : event.event_type === "recommendation_click" ? 2 : 1
    weights.set(event.product_id, Math.min(5, (weights.get(event.product_id) ?? 0) + weight))
  }
  return { source_products: [...weights].map(([product_id, weight]) => ({ product_id, weight }))
    .sort((a, b) => b.weight - a.weight || a.product_id.localeCompare(b.product_id)).slice(0, 10) }
}

export function rankForYou(profile: InterestProfile, neighbors: Neighbor[], popular: Popular[], limit = 12): string[] {
  if (!Number.isInteger(limit) || limit < 1 || limit > 12) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid limit")
  const interests = new Map(profile.source_products.map((row) => [row.product_id, row.weight]))
  const sourceIds = new Set(interests.keys())
  const totalWeight = [...interests.values()].reduce((sum, weight) => sum + weight, 0) || 1
  const scored = new Map<string, number>()
  for (const row of neighbors) {
    const weight = interests.get(row.source_product_id)
    if (!weight || sourceIds.has(row.target_product_id) || !Number.isFinite(row.score) || row.score < 0) continue
    scored.set(row.target_product_id, (scored.get(row.target_product_id) ?? 0) +
      0.85 * weight / totalWeight * Math.min(1, row.score))
  }
  for (const row of popular) {
    if (sourceIds.has(row.product_id)) continue
    const prior = 0.15 / Math.max(1, row.rank)
    scored.set(row.product_id, (scored.get(row.product_id) ?? 0) + prior)
  }
  return [...scored].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit).map(([productId]) => productId)
}
import { MedusaError } from "@medusajs/framework/utils"
