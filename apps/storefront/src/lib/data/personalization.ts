"use server"

import { randomUUID } from "node:crypto"
import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders } from "./cookies"

const enabled = () => process.env.NEXT_PUBLIC_ENABLE_PERSONALIZED_RECOMMENDATIONS === "true"

export async function getPersonalizationConsent(): Promise<boolean | null> {
  if (!enabled()) return null
  const headers = await getAuthHeaders()
  if (!headers.authorization) return null
  try {
    const result = await sdk.client.fetch<{ granted: boolean }>("/store/personalization/consent", {
      headers, cache: "no-store", signal: AbortSignal.timeout(4000),
    })
    return result.granted
  } catch {
    return null
  }
}

export async function setPersonalizationConsent(granted: boolean): Promise<boolean> {
  if (!enabled() || typeof granted !== "boolean") return false
  const headers = await getAuthHeaders()
  if (!headers.authorization) return false
  try {
    await sdk.client.fetch("/store/personalization/consent", {
      method: "POST", headers, body: { granted, terms_version: "v1" },
      cache: "no-store", signal: AbortSignal.timeout(6000),
    })
    return true
  } catch {
    return false
  }
}

export async function getForYouRecommendations(regionId: string) {
  if (!enabled()) return null
  const headers = await getAuthHeaders()
  if (!headers.authorization) return null
  try {
    return await sdk.client.fetch<{
      personalized: boolean
      strategy: string
      products: HttpTypes.StoreProduct[]
    }>("/store/recommendations/for-you", {
      query: { region_id: regionId, limit: 12 }, headers,
      cache: "no-store", signal: AbortSignal.timeout(6000),
    })
  } catch {
    return null
  }
}

export async function trackPersonalizationView(productId: string): Promise<void> {
  if (!enabled() || process.env.NEXT_PUBLIC_ENABLE_PERSONALIZATION_EVENTS !== "true") return
  const headers = await getAuthHeaders()
  if (!headers.authorization || !/^prod_[a-zA-Z0-9]+$/.test(productId)) return
  try {
    await sdk.client.fetch("/store/personalization/events", {
      method: "POST", headers,
      body: { event_id: randomUUID(), event_type: "product_view", product_id: productId, placement: "product_detail" },
      cache: "no-store", signal: AbortSignal.timeout(3000),
    })
  } catch {
    // Tracking is optional and must never interrupt product browsing.
  }
}

export async function trackPersonalizationClick(productId: string): Promise<void> {
  if (!enabled() || process.env.NEXT_PUBLIC_ENABLE_PERSONALIZATION_EVENTS !== "true") return
  const headers = await getAuthHeaders()
  if (!headers.authorization || !/^prod_[a-zA-Z0-9]+$/.test(productId)) return
  try {
    await sdk.client.fetch("/store/personalization/events", {
      method: "POST", headers,
      body: { event_id: randomUUID(), event_type: "recommendation_click", product_id: productId, placement: "for_you" },
      cache: "no-store", signal: AbortSignal.timeout(3000),
    })
  } catch {
    // A click must continue navigation even if optional tracking fails.
  }
}
