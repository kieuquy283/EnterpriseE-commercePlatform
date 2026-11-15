"use server"

import { sdk } from "@lib/config"
import type { HttpTypes } from "@medusajs/types"

export async function listProductOptions(): Promise<HttpTypes.StoreProductOption[]> {
  const response = await sdk.client.fetch<{ product_options?: HttpTypes.StoreProductOption[] }>(
    "/store/product-options",
    {
      method: "GET",
      query: { is_exclusive: false, fields: "*values" },
      cache: "no-store",
    },
  )
  return response.product_options ?? []
}
