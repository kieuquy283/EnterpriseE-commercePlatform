import { writeFile } from "node:fs/promises"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createApiKeysWorkflow, createShippingProfilesWorkflow, linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"
import seedCommerce from "./seed-commerce"
import { publishRecommendations, type Candidate } from "../workflows/recommendation/publish"
import RecommendationModuleService from "../modules/recommendation/service"

export default async function seed({ container }: ExecArgs) {
  if (process.env.NODE_ENV !== "test" || !process.env.DATABASE_URL?.includes("/recommendation_test")) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This fixture seed requires the dedicated recommendation_test database")
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const profiles = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  if (!profiles.data.length) await createShippingProfilesWorkflow(container).run({ input: { data: [{ name: "Default", type: "default" }] } })
  await seedCommerce({ container, args: [] })
  const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id"], filters: { name: "Online Store" } })
  const { result: [key] } = await createApiKeysWorkflow(container).run({ input: { api_keys: [{ title: "Private recommendation fixture", type: "publishable", created_by: "" }] } })
  await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channels[0].id] } })
  const { data: products } = await query.graph({ entity: "product", fields: ["id", "handle"], filters: { handle: ["ao-thun-essential", "tui-canvas-daily", "binh-giu-nhiet-500ml"] } })
  products.sort((a, b) => a.id.localeCompare(b.id))
  const { data: regions } = await query.graph({ entity: "region", fields: ["id"] })
  const version = "recommendation-fixture-v2"
  const candidates: Candidate[] = products.map((product, index) => ({ version, placement: "home", context_key: "home", target_product_id: product.id, score: products.length - index, rank: index + 1, strategy: "hm_purchase_popularity" }))
  for (const product of products) {
    products.filter((p) => p.id !== product.id).forEach((p, index) => candidates.push({ version, placement: "product_detail", context_key: `product:${product.id}`, target_product_id: p.id, score: .8 - index * .1, rank: index + 1, strategy: "hm_metadata_similarity" }))
  }
  const service: RecommendationModuleService = container.resolve("recommendation")
  const active = await service.listRecommendationActives({ id: "recommendation_active" })
  if (!active.length) await publishRecommendations(container, { version, manifest: { synthetic_fixture: true }, candidates })
  await writeFile("/tmp/recommendation-test-context.json", JSON.stringify({ publishable_key: key.token, region_id: regions[0].id, product_id: products[0].id, handle: products[0].handle }), { mode: 0o600 })
  console.log("Synthetic recommendation fixture prepared; private context stored in /tmp")
}
