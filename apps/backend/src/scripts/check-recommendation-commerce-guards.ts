import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createApiKeysWorkflow, linkSalesChannelsToApiKeyWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function checkGuards({ container }: ExecArgs) {
  if (process.env.NODE_ENV !== "test" || new URL(process.env.DATABASE_URL!).pathname !== "/recommendation_test") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Dedicated recommendation_test database required")
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({ entity: "product", fields: ["id", "status"], filters: { handle: "ao-thun-essential" } })
  const product = products[0]
  const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id"], filters: { name: "Online Store" } })
  const { data: regions } = await query.graph({ entity: "region", fields: ["id"], filters: { name: "Vietnam" } })
  const { result: [key] } = await createApiKeysWorkflow(container).run({ input: { api_keys: [{ title: "Commerce guard fixture", type: "publishable", created_by: "" }] } })
  await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channels[0].id] } })
  const { data: items } = await query.graph({ entity: "inventory_item", fields: ["id"], filters: { sku: "TEE-ESSENTIAL-BLK" } })
  const { data: levels } = await query.graph({ entity: "inventory_level", fields: ["location_id", "inventory_item_id", "stocked_quantity"], filters: { inventory_item_id: items[0].id } })
  const level = levels[0]
  const inventory = container.resolve(Modules.INVENTORY)
  const url = `http://127.0.0.1:9002/store/recommendations?placement=product_detail&product_id=${product.id}&region_id=${regions[0].id}`
  const status = async () => {
    try {
      return (await fetch(url, { headers: { "x-publishable-api-key": key.token }, signal: AbortSignal.timeout(1000) })).status
    } catch { return 0 }
  }
  const requireStatus = async (expected: number) => {
    for (let attempt = 0; attempt < 40; attempt++) {
      if (await status() === expected) return
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Recommendation commerce guard verification failed")
  }
  try {
    await requireStatus(200)
    await updateProductsWorkflow(container).run({ input: { products: [{ id: product.id, status: "draft" }] } })
    await requireStatus(404)
    await updateProductsWorkflow(container).run({ input: { products: [{ id: product.id, status: "published" }] } })
    await requireStatus(200)
    await inventory.updateInventoryLevels({ inventory_item_id: level.inventory_item_id, location_id: level.location_id, stocked_quantity: 0 })
    await requireStatus(404)
    console.log("PASS: real Redis/native pipeline hides unpublished and unavailable target products")
  } finally {
    await inventory.updateInventoryLevels({ inventory_item_id: level.inventory_item_id, location_id: level.location_id, stocked_quantity: level.stocked_quantity })
    await updateProductsWorkflow(container).run({ input: { products: [{ id: product.id, status: product.status }] } })
  }
}
