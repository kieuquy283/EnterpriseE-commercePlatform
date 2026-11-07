"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders } from "./cookies"

export async function getRecommendations(regionId: string, productId?: string) {
  if (process.env.NEXT_PUBLIC_ENABLE_RECOMMENDATIONS !== "true") return null
  try {
    return await sdk.client.fetch<{
      strategy: string
      products: HttpTypes.StoreProduct[]
    }>("/store/recommendations", {
      query: { placement: productId ? "product_detail" : "home", region_id: regionId, ...(productId ? { product_id: productId } : {}), limit: productId ? 6 : 12 },
      headers: { ...(await getAuthHeaders()) },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    })
  } catch {
    return null
  }
}
