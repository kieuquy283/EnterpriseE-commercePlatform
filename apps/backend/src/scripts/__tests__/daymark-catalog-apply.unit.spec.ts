import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow, uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import { applyImportPlan } from "../daymark-catalog/apply"
import { buildImportPlan } from "../daymark-catalog/plan"
import { readCatalogSnapshot } from "../daymark-catalog/snapshot"
import { catalogMediaUrl } from "../daymark-catalog/media-url"
import { appliedSnapshot, fixture, manifestWithMapping } from "./daymark-catalog-harness"

jest.mock("@medusajs/medusa/core-flows", () => {
  const workflow = () => jest.fn(() => ({ run: jest.fn().mockResolvedValue({ result: [] }) }))
  return {
    batchInventoryItemLevelsWorkflow: workflow(),
    createCollectionsWorkflow: workflow(),
    createProductCategoriesWorkflow: workflow(),
    createProductsWorkflow: workflow(),
    updateCollectionsWorkflow: workflow(),
    updateProductCategoriesWorkflow: workflow(),
    updateProductsWorkflow: workflow(),
    uploadFilesWorkflow: workflow(),
  }
})

describe("DAYMARK Medusa application boundary", () => {
  beforeEach(() => jest.clearAllMocks())

  it("uses query.graph, adds a missing VND price, and preserves other prices, categories, variants and existing stock", async () => {
    const snapshot = appliedSnapshot()
    const product = snapshot.products[0]
    product.variants[0].prices = [
      { id: "usd_price", currencyCode: "usd", amount: 20 },
      { id: "tier_price", currencyCode: "vnd", amount: 123000, isDefault: false },
    ]
    product.categoryIds.push("unrelated-category")
    product.variants.push({ ...product.variants[0], id: "extra-variant", sku: "extra-sku" })
    snapshot.inventoryLevels[0].stockedQuantity = 2
    snapshot.inventoryLevels[0].reservedQuantity = 1
    const graph = jest.fn(async ({ entity }) => ({
      data:
        entity === "inventory_item"
          ? snapshot.inventoryItems.map((item) => ({ id: item.id, sku: item.sku }))
          : snapshot.inventoryLevels.map((level) => ({
              id: level.id,
              inventory_item_id: level.inventoryItemId,
              location_id: level.locationId,
              stocked_quantity: level.stockedQuantity,
            })),
    }))
    const container = { resolve: () => ({ graph }) } as unknown as MedusaContainer
    const plan = buildImportPlan({ fixture, snapshot, manifest: null, imagesEnabled: false })
    const summary = await applyImportPlan(
      { container, fixture, manifest: null, assetDir: "unused", readAsset: jest.fn() },
      plan,
      snapshot,
    )
    expect(summary.inventory.update).toBe(0)
    expect(graph).toHaveBeenCalled()
    const run = (updateProductsWorkflow as unknown as jest.Mock).mock.results[0].value.run
    const update = run.mock.calls[0][0].input.update
    expect(update.variants[0].prices).toEqual([
      { id: "usd_price", amount: 20 },
      { id: "tier_price", amount: 123000 },
      { amount: fixture.products[0].priceVnd, currency_code: "vnd" },
    ])
    expect(update.category_ids).toContain("unrelated-category")
    expect(update.variants).toContainEqual({ id: "extra-variant" })
  })

  it("refuses blockers before invoking any workflow or upload", async () => {
    const snapshot = appliedSnapshot()
    const plan = buildImportPlan({ fixture, snapshot, manifest: null, imagesEnabled: false })
    plan.blockers.push("ownership conflict")
    await expect(
      applyImportPlan(
        {
          container: {} as MedusaContainer,
          fixture,
          manifest: null,
          assetDir: "unused",
          readAsset: jest.fn(),
        },
        plan,
        snapshot,
      ),
    ).rejects.toThrow(/blockers/)
    expect(updateProductsWorkflow).not.toHaveBeenCalled()
    expect(uploadFilesWorkflow).not.toHaveBeenCalled()
  })

  it("reads the installed graph object rather than calling the query registration", async () => {
    const graph = jest.fn().mockResolvedValue({ data: [] })
    const snapshot = await readCatalogSnapshot({
      resolve: (key) => {
        if (key === ContainerRegistrationKeys.QUERY) return { graph }
        throw new Error("No file provider")
      },
    })
    expect(snapshot.products).toEqual([])
    expect(snapshot.fileProviderAvailable).toBe(false)
    expect(graph).toHaveBeenCalledWith(
      expect.objectContaining({ entity: "product", pagination: { take: 500, skip: 0 } }),
    )
  })

  it("attaches missing media only in local demo mode", () => {
    const snapshot = appliedSnapshot()
    const manifest = manifestWithMapping(fixture.products[0].handle)
    const manifestMode = buildImportPlan({ fixture, snapshot, manifest, imagesEnabled: true })
    expect(manifestMode.images).toEqual([])
    expect(manifestMode.warnings.join(" ")).toContain("local demo image mode")

    const plan = buildImportPlan({
      fixture,
      snapshot,
      manifest,
      imagesEnabled: true,
      includeRepresentativeImages: true,
    })
    expect(plan.products[0].action).toBe("update")
    expect(plan.images).toHaveLength(1)
    expect(plan.images[0].action).toBe("insert")
  })

  it("accepts the configured proxy and refuses direct S3 URLs in proxy mode", () => {
    const env = {
      S3_PUBLIC_IMAGE_PROXY: "true",
      S3_FILE_URL: "https://api.example.test/product-images",
    }
    expect(
      catalogMediaUrl("https://api.example.test/product-images/public-images/photo.jpg", env),
    ).toContain("/product-images/public-images/")
    expect(() =>
      catalogMediaUrl(
        "https://bucket.s3.ap-southeast-2.amazonaws.com/public-images/photo.jpg",
        env,
      ),
    ).toThrow(/proxy|bucket/)
    expect(() =>
      catalogMediaUrl("https://api.example.test/product-images/public-images/sub/photo.jpg", env),
    ).toThrow()
  })
})
