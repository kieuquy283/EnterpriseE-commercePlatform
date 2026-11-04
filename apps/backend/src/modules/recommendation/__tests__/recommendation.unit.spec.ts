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
