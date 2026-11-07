import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createApiKeysWorkflow, createRegionsWorkflow, createSalesChannelsWorkflow, createShippingProfilesWorkflow, linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"
import seedCommerce from "../../src/scripts/seed-commerce"
import { publishRecommendations, type Candidate } from "../../src/workflows/recommendation/publish"
import RecommendationModuleService from "../../src/modules/recommendation/service"
import { MedusaAppLoader } from "@medusajs/framework"

jest.setTimeout(180_000)

medusaIntegrationTestRunner({
  env: { REDIS_URL: "", ENABLE_RECOMMENDATIONS: "true" },
  testSuite: ({ api, getContainer }) => {
    it("publishes idempotently, serves region-priced products, validates input and rolls back", async () => {
      const container = getContainer()
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      await createShippingProfilesWorkflow(container).run({ input: { data: [{ name: "Default", type: "default" }] } })
      await seedCommerce({ container, args: [] })
      const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id"], filters: { name: "Online Store" } })
      const { result: [key] } = await createApiKeysWorkflow(container).run({ input: { api_keys: [{ title: "Recommendations test", type: "publishable", created_by: "" }] } })
      await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channels[0].id] } })
      const headers = { "x-publishable-api-key": key.token }
      const { data: regions } = await api.get("/store/regions", { headers })
      const region = regions.regions[0].id
      const { data: response } = await api.get(`/store/products?region_id=${region}`, { headers })
      const products = response.products
      expect(products.length).toBeGreaterThanOrEqual(2)
      const candidates: Candidate[] = [
        { version: "integration-v1", placement: "home", context_key: "home", target_product_id: products[0].id, score: 20, rank: 1, strategy: "hm_purchase_popularity" },
        { version: "integration-v1", placement: "product_detail", context_key: `product:${products[1].id}`, target_product_id: products[0].id, score: .8, rank: 1, strategy: "hm_metadata_similarity" },
      ]
      const input = { version: "integration-v1", manifest: { fixture: true }, candidates }
      await publishRecommendations(container, input)
      await publishRecommendations(container, input)
      const service: RecommendationModuleService = container.resolve("recommendation")
      const [run] = await service.listRecommendationRuns({ version: input.version })
      const [, count] = await service.listAndCountRecommendationCandidates({ run_id: run.id })
      expect(count).toBe(2)
      const home = await api.get(`/store/recommendations?placement=home&region_id=${region}`, { headers })
      expect(home.status).toBe(200)
      const homeBatches = Number(home.headers["server-timing"].match(/desc="(\d+) batches"/)[1])
      expect(homeBatches).toBeLessThanOrEqual(2)
      expect(home.data.products[0].id).toBe(products[0].id)
      expect(home.data.products[0].variants[0].calculated_price.currency_code).toBe("vnd")
      expect(home.data.products[0]).not.toHaveProperty("metadata")
      const similar = await api.get(`/store/recommendations?placement=product_detail&product_id=${products[1].id}&region_id=${region}`, { headers })
      expect(similar.data.products.every((p: { id: string }) => p.id !== products[1].id)).toBe(true)
      const detailBatches = Number(similar.headers["server-timing"].match(/desc="(\d+) batches"/)[1])
      expect(detailBatches).toBeLessThanOrEqual(4)
      expect(similar.data.products.length).toBeLessThanOrEqual(6)
      expect(new Set(similar.data.products.map((p: { id: string }) => p.id)).size).toBe(similar.data.products.length)
      expect(similar.data.products[0].id).toBe(products[0].id)
      for (const suffix of ["limit=0", "limit=1.5", "limit=25", "unexpected=1", "customer_id=other", "region_id=invalid", "placement=invalid", "product_id=invalid"]) {
        const params = new URLSearchParams({ placement: "product_detail", product_id: products[1].id, region_id: region })
        const [name, value] = suffix.split("=")
        params.set(name, value)
        await expect(api.get(`/store/recommendations?${params}`, { headers })).rejects.toMatchObject({ response: { status: 400 } })
      }
      await expect(api.get(`/store/recommendations?placement=home&region_id=${region}&customer_id=other`, { headers })).rejects.toMatchObject({ response: { status: 400 } })
      await expect(api.get(`/store/recommendations?placement=home&region_id=${region}&limit=25`, { headers })).rejects.toMatchObject({ response: { status: 400 } })
      await expect(api.get(`/store/recommendations?placement=product_detail&product_id=prod_missing&region_id=${region}`, { headers })).rejects.toMatchObject({ response: { status: 404 } })
      await expect(publishRecommendations(container, { ...input, candidates: [...candidates, candidates[0]] })).rejects.toThrow()
      const originalCreate = service.createRecommendationCandidates.bind(service)
      const fault = jest.spyOn(service, "createRecommendationCandidates").mockImplementationOnce(async (data) => {
        await originalCreate(data)
        throw new Error("Injected failure after writing a staging batch")
      })
      await expect(publishRecommendations(container, { ...input, version: "integration-failed", candidates: candidates.map((row) => ({ ...row, version: "integration-failed" })) })).rejects.toThrow()
      fault.mockRestore()
      const [failed] = await service.listRecommendationRuns({ version: "integration-failed" })
      expect(failed.status).toBe("failed")
      const [pointer] = await service.listRecommendationActives({ id: "recommendation_active" })
      expect(pointer.run_id).toBe(run.id)
      await service.updateRecommendationActives({ id: pointer.id, run_id: "missing" })
      const fallback = await api.get(`/store/recommendations?placement=home&region_id=${region}`, { headers })
      expect(fallback.data.strategy).toBe("catalog_featured")
      await service.updateRecommendationActives({ id: pointer.id, run_id: run.id })
      const restored = await api.get(`/store/recommendations?placement=home&region_id=${region}`, { headers })
      expect(restored.data.version).toBe("integration-v1")
      const productService = container.resolve(Modules.PRODUCT)
      await productService.updateProducts(products[0].id, { status: "draft" })
      const unpublished = await api.get(`/store/recommendations?placement=home&region_id=${region}`, { headers })
      expect(unpublished.data.products.some((p: { id: string }) => p.id === products[0].id)).toBe(false)
      await productService.updateProducts(products[0].id, { status: "published" })
      const { data: inventoryItems } = await query.graph({ entity: "inventory_item", fields: ["id"], filters: { sku: "TEE-ESSENTIAL-BLK" } })
      const { data: levels } = await query.graph({ entity: "inventory_level", fields: ["id", "location_id", "inventory_item_id", "stocked_quantity"], filters: { inventory_item_id: inventoryItems[0].id } })
      await container.resolve(Modules.INVENTORY).updateInventoryLevels({ inventory_item_id: levels[0].inventory_item_id, location_id: levels[0].location_id, stocked_quantity: 0 })
      const unavailable = await api.get(`/store/recommendations?placement=home&region_id=${region}`, { headers })
      expect(unavailable.data.products.some((p: { handle: string }) => p.handle === "ao-thun-essential")).toBe(false)
      const [teeVariant] = await productService.listProductVariants({ sku: "TEE-ESSENTIAL-BLK" }, { select: ["id", "product_id", "allow_backorder"] })
      await expect(api.get(`/store/recommendations?placement=product_detail&product_id=${teeVariant.product_id}&region_id=${region}`, { headers })).rejects.toMatchObject({ response: { status: 404 } })
      await productService.updateProductVariants(teeVariant.id, { allow_backorder: true })
      const backorder = await api.get(`/store/recommendations?placement=product_detail&product_id=${teeVariant.product_id}&region_id=${region}`, { headers })
      expect(backorder.status).toBe(200)
      await productService.updateProductVariants(teeVariant.id, { allow_backorder: teeVariant.allow_backorder })
      await container.resolve(Modules.INVENTORY).updateInventoryLevels({ inventory_item_id: levels[0].inventory_item_id, location_id: levels[0].location_id, stocked_quantity: levels[0].stocked_quantity })
      await expect(api.get(`/store/recommendations?placement=home&region_id=reg_missing`, { headers })).rejects.toMatchObject({ response: { status: 400 } })
      const { result: [emptyChannel] } = await createSalesChannelsWorkflow(container).run({ input: { salesChannelsData: [{ name: "Empty channel" }] } })
      const { result: [otherKey] } = await createApiKeysWorkflow(container).run({ input: { api_keys: [{ title: "Other channel", type: "publishable", created_by: "" }] } })
      await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: otherKey.id, add: [emptyChannel.id] } })
      const isolated = await api.get(`/store/recommendations?placement=home&region_id=${region}`, { headers: { "x-publishable-api-key": otherKey.token } })
      expect(isolated.data.products).toEqual([])
      const { result: [unpricedRegion] } = await createRegionsWorkflow(container).run({ input: { regions: [{ name: "Unpriced", currency_code: "usd", countries: ["us"] }] } })
      const unpriced = await api.get(`/store/recommendations?placement=home&region_id=${unpricedRegion.id}`, { headers })
      expect(unpriced.data.products).toEqual([])
      // Only the runner-owned, disposable database may exercise migration down.
      const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
      expect(new URL(config.projectConfig.databaseUrl!).pathname).toMatch(/^\/medusa-.+-integration-\d+$/)
      const loader = new MedusaAppLoader({ container })
      await loader.runModulesMigrations({ action: "revert", moduleNames: ["recommendation"] })
      await loader.runModulesMigrations({ action: "run" })
      expect(await service.listRecommendationRuns({ version: "integration-v1" })).toHaveLength(0)
    })
  },
})
