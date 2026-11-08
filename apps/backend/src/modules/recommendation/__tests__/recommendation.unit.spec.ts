import { validateCandidates, type Candidate } from "../../../workflows/recommendation/publish"
import { GET, publicProduct, saleable } from "../../../api/store/recommendations/route"
import * as storeProducts from "../store-products"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

jest.mock("../store-products", () => ({ resolveStoreProducts: jest.fn() }))

const rows: Candidate[] = [
  { version: "test", placement: "home", context_key: "home", target_product_id: "prod_A", score: 2, rank: 1, strategy: "hm_purchase_popularity" },
  { version: "test", placement: "product_detail", context_key: "product:prod_B", target_product_id: "prod_A", score: .8, rank: 1, strategy: "hm_metadata_similarity" },
]

describe("recommendation contracts", () => {
  it("reports the active Hybrid strategy without changing Product projection", async () => {
    const previous = process.env.ENABLE_RECOMMENDATIONS
    process.env.ENABLE_RECOMMENDATIONS = "true"
    const product = (id: string) => ({ id, title: id, handle: id, variants: [{ id: `variant_${id}`, manage_inventory: false, calculated_price: { calculated_amount: 100, currency_code: "vnd" } }] })
    const resolve = jest.mocked(storeProducts.resolveStoreProducts).mockResolvedValue({ products: [product("prod_S"), product("prod_A")] })
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() }
    const request = { query: { placement: "product_detail", product_id: "prod_S", region_id: "reg_test", limit: "1" }, scope: { resolve: (name: string) => {
      if (name === "region") return { retrieveRegion: async () => ({ id: "reg_test" }) }
      if (name === "recommendation") return {
        listRecommendationActives: async () => [{ run_id: "run" }], retrieveRecommendationRun: async () => ({ status: "ready", version: "hyb_test" }),
        listRecommendationCandidates: async (filter: { placement: string }) => filter.placement === "home" ? [] : [{ target_product_id: "prod_A", strategy: "hm_hybrid_similarity" }],
      }
      throw new Error("Unexpected dependency")
    } } }
    try {
      await GET(request as unknown as MedusaRequest, response as unknown as MedusaResponse)
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ strategy: "hm_hybrid_similarity", version: "hyb_test", products: [publicProduct(product("prod_A"))] }))
    } finally {
      resolve.mockReset()
      if (previous === undefined) delete process.env.ENABLE_RECOMMENDATIONS
      else process.env.ENABLE_RECOMMENDATIONS = previous
    }
  })
  it("preserves candidate ranks and fills only missing slots in popularity order", async () => {
    const previous = process.env.ENABLE_RECOMMENDATIONS
    process.env.ENABLE_RECOMMENDATIONS = "true"
    const product = (id: string) => ({ id, title: id, handle: id, variants: [{ id: `variant_${id}`, manage_inventory: false, calculated_price: { calculated_amount: 100, currency_code: "vnd" } }] })
    const resolve = jest.mocked(storeProducts.resolveStoreProducts).mockImplementation(async (_req, query) => ({ products: [...(query.id as string[])].reverse().map(product) }))
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() }
    const request = { query: { placement: "product_detail", product_id: "prod_S", region_id: "reg_test" }, scope: { resolve: (name: string) => {
      if (name === "region") return { retrieveRegion: async () => ({ id: "reg_test" }) }
      if (name === "recommendation") return {
        listRecommendationActives: async () => [{ run_id: "run" }], retrieveRecommendationRun: async () => ({ status: "ready", version: "test" }),
        listRecommendationCandidates: async (filter: { placement: string }) => (filter.placement === "home" ? ["prod_A", "prod_D", "prod_C", "prod_E", "prod_F", "prod_G"] : ["prod_B", "prod_A"]).map((target_product_id) => ({ target_product_id, strategy: filter.placement === "home" ? "hm_purchase_popularity" : "hm_metadata_similarity" })),
      }
      throw new Error("Unexpected dependency")
    } } }
    try {
      await GET(request as unknown as MedusaRequest, response as unknown as MedusaResponse)
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ strategy: "hm_metadata_similarity_with_fallback", products: ["prod_B", "prod_A", "prod_D", "prod_C", "prod_E", "prod_F"].map((id) => publicProduct(product(id))) }))
      expect(resolve).toHaveBeenCalledTimes(2)
    } finally {
      resolve.mockReset()
      if (previous === undefined) delete process.env.ENABLE_RECOMMENDATIONS
      else process.env.ENABLE_RECOMMENDATIONS = previous
    }
  })

  it("uses commerce fallback for a failed candidate store and obeys disabled flag", async () => {
    const previous = process.env.ENABLE_RECOMMENDATIONS
    process.env.ENABLE_RECOMMENDATIONS = "true"
    const resolve = jest.mocked(storeProducts.resolveStoreProducts).mockResolvedValue({ products: [] })
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() }
    const request = { query: { placement: "home", region_id: "reg_test" }, scope: { resolve: (name: string) => {
      if (name === "region") return { retrieveRegion: async () => ({ id: "reg_test" }) }
      throw new Error("Injected candidate store outage")
    } } }
    try {
      await GET(request as unknown as MedusaRequest, response as unknown as MedusaResponse)
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ products: [], fallback_reason: "candidate_store_unavailable" }))
      process.env.ENABLE_RECOMMENDATIONS = "false"
      await GET(request as unknown as MedusaRequest, response as unknown as MedusaResponse)
      expect(response.status).toHaveBeenCalledWith(404)
      expect(resolve).toHaveBeenCalledTimes(1)
    } finally {
      resolve.mockReset()
      if (previous === undefined) delete process.env.ENABLE_RECOMMENDATIONS
      else process.env.ENABLE_RECOMMENDATIONS = previous
    }
  })
  it("fails safely when commerce validation is unavailable", async () => {
    const previous = process.env.ENABLE_RECOMMENDATIONS
    process.env.ENABLE_RECOMMENDATIONS = "true"
    const fault = jest.mocked(storeProducts.resolveStoreProducts).mockRejectedValueOnce(new Error("Injected commerce failure"))
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() }
    const request = { query: { placement: "home", region_id: "reg_test" }, scope: { resolve: (name: string) => {
      if (name === "region") return { retrieveRegion: async () => ({ id: "reg_test" }) }
      throw new Error("Injected candidate store failure")
    } } }
    try {
      await GET(request as unknown as MedusaRequest, response as unknown as MedusaResponse)
      expect(response.status).toHaveBeenCalledWith(503)
      expect(response.json).toHaveBeenCalledWith({ message: "Recommendation commerce dependency unavailable" })
    } finally {
      fault.mockReset()
      if (previous === undefined) delete process.env.ENABLE_RECOMMENDATIONS
      else process.env.ENABLE_RECOMMENDATIONS = previous
    }
  })
  it("accepts complete placement input and rejects corrupt import", () => {
    expect(() => validateCandidates({ version: "test", manifest: {}, candidates: rows })).not.toThrow()
    expect(() => validateCandidates({ version: "test", manifest: {}, candidates: [rows[0], { ...rows[1], strategy: "hm_hybrid_similarity" }] })).not.toThrow()
    expect(() => validateCandidates({ version: "test", manifest: {}, candidates: [rows[0], rows[1], { ...rows[1], target_product_id: "prod_C", rank: 2, strategy: "hm_hybrid_similarity" }] })).toThrow()
    expect(() => validateCandidates({ version: "test", manifest: {}, candidates: [rows[0], rows[0]] })).toThrow()
    expect(() => validateCandidates({ version: "test", manifest: {}, candidates: [rows[0], { ...rows[1], target_product_id: "prod_B" }] })).toThrow()
    expect(() => validateCandidates({ version: "test", manifest: {}, candidates: [rows[0], { ...rows[1], score: NaN }] })).toThrow()
  })

  it("uses calculated prices and Medusa inventory/backorder policy", () => {
    const product = { id: "prod_A", title: "A", handle: "a", variants: [{ id: "variant_a", manage_inventory: true, inventory_quantity: 0, calculated_price: { calculated_amount: 200, currency_code: "vnd" } }] }
    expect(saleable(product)).toBe(false)
    expect(saleable({ ...product, variants: [{ ...product.variants[0], allow_backorder: true }] })).toBe(true)
    expect(saleable({ ...product, variants: [{ ...product.variants[0], manage_inventory: false }] })).toBe(true)
    expect(saleable({ ...product, variants: [{ ...product.variants[0], calculated_price: undefined }] })).toBe(false)
    const projected = publicProduct({ ...product, variants: [product.variants[0], { ...product.variants[0], id: "available", inventory_quantity: 2 }] })
    expect(projected.variants?.map((variant) => variant.id)).toEqual(["available"])
  })

  it("projects no metadata, SKU or article options", () => {
    const result = publicProduct({ id: "prod_A", title: "A", handle: "a", metadata: { source: "private" }, variants: [{ id: "var_A", sku: "HM-private", options: [{ value: "private" }], calculated_price: { calculated_amount: 1 } }] } as never)
    expect(JSON.stringify(result)).not.toContain("private")
  })
})
