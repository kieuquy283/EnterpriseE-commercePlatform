import { buildImportPlan, summarisePlan } from "../daymark-catalog/plan"
import type { CatalogSnapshot } from "../daymark-catalog/types"
import {
  appliedSnapshot,
  emptySnapshot,
  fixture,
  manifestWithMapping,
  totalVariantCount,
} from "./daymark-catalog-harness"

function plan(
  snapshot: CatalogSnapshot,
  imagesEnabled = false,
  manifest: ReturnType<typeof manifestWithMapping> | null = null,
  includeRepresentativeImages = false,
) {
  return buildImportPlan({
    fixture,
    snapshot,
    manifest,
    imagesEnabled,
    includeRepresentativeImages,
  })
}

describe("DAYMARK catalog import plan", () => {
  it("inserts everything on an empty but bootstrapped store", () => {
    const result = plan(emptySnapshot())
    const summary = summarisePlan(result)

    expect(result.blockers).toEqual([])
    expect(summary.collections.insert).toBe(fixture.collections.length)
    expect(summary.categories.insert).toBe(fixture.categories.length)
    expect(summary.products.insert).toBe(fixture.products.length)
    expect(summary.inventory.insert).toBe(totalVariantCount())
    expect(summary.products.update).toBe(0)
    expect(summary.products.conflict).toBe(0)
  })

  it("reports missing store scaffolding as blockers", () => {
    const result = plan(
      emptySnapshot({
        region: null,
        salesChannelId: null,
        stockLocation: null,
        shippingProfileId: null,
      }),
    )
    expect(result.blockers.length).toBe(4)
    expect(result.blockers.join(" ")).toContain("store bootstrap")
  })

  it("is idempotent against already-applied state", () => {
    const summary = summarisePlan(plan(appliedSnapshot()))
    expect(summary.collections).toEqual({ insert: 0, update: 0, skip: 3, conflict: 0 })
    expect(summary.categories).toEqual({ insert: 0, update: 0, skip: 6, conflict: 0 })
    expect(summary.products).toEqual({
      insert: 0,
      update: 0,
      skip: fixture.products.length,
      conflict: 0,
    })
    expect(summary.inventory.insert).toBe(0)
    expect(summary.inventory.update).toBe(0)
    expect(summary.images.insert).toBe(0)
  })

  it("updates only genuinely changed fields", () => {
    const snapshot = appliedSnapshot()
    const target = snapshot.products.find((product) => product.handle === "dm-tee-core")!
    target.title = "Old Core Tee"
    target.description = "stale copy"
    target.status = "draft"
    target.variants[0].prices[0].amount = 1

    const result = plan(snapshot)
    const operation = result.products.find((entry) => entry.key === "dm-tee-core")!
    expect(operation.action).toBe("update")
    const fields = operation.changes.map((change) => change.field)
    expect(fields).toContain("title")
    expect(fields).toContain("description")
    expect(fields).toContain("status")
    expect(fields).toContain(`variant.price:${target.variants[0].sku}`)
    expect(summarisePlan(result).products.update).toBe(1)
    expect(summarisePlan(result).products.skip).toBe(fixture.products.length - 1)
  })

  it("preserves existing stock after purchases or adjustments", () => {
    const snapshot = appliedSnapshot()
    const level = snapshot.inventoryLevels.find(
      (entry) => entry.inventoryItemId === "iitem_DM-TEE-CORE-IVR-M",
    )!
    level.stockedQuantity = 2

    const result = plan(snapshot)
    const operation = result.inventory.find((entry) => entry.key === "DM-TEE-CORE-IVR-M")!
    expect(operation.action).toBe("skip")
    expect(operation.reason).toContain("existing stock is preserved")
    expect(summarisePlan(result).inventory.update).toBe(0)
  })

  it("treats a SKU owned by another product as a conflict and never moves it", () => {
    const snapshot = appliedSnapshot()
    const victim = snapshot.products.find((product) => product.handle === "dm-tee-heavy")!
    const source = snapshot.products.find((product) => product.handle === "dm-tee-core")!
    victim.variants.push(source.variants[0])

    const result = plan(snapshot)
    const operation = result.products.find((entry) => entry.key === "dm-tee-core")!
    expect(operation.action).toBe("conflict")
    expect(operation.reason).toContain("SKU ownership conflict")
    expect(result.blockers.join(" ")).toContain("dm-tee-core")
  })

  it("refuses to rewrite an existing product whose option set differs", () => {
    const snapshot = appliedSnapshot()
    const target = snapshot.products.find((product) => product.handle === "dm-tee-core")!
    target.optionTitles = ["Variant"]
    target.optionValues = { Variant: ["Default"] }

    const result = plan(snapshot)
    const operation = result.products.find((entry) => entry.key === "dm-tee-core")!
    expect(operation.action).toBe("conflict")
    expect(operation.reason).toContain("option")
  })

  it("leaves products the fixture does not own out of the plan", () => {
    const snapshot = appliedSnapshot()
    snapshot.products.push({
      id: "prod_legacy",
      handle: "ao-thun-essential",
      title: "Ao thun Essential",
      description: "legacy seed product",
      status: "published",
      collectionId: null,
      categoryIds: [],
      optionTitles: ["Variant"],
      optionValues: { Variant: ["Default"] },
      variants: [
        {
          id: "var_legacy",
          sku: "TEE-ESSENTIAL-BLK",
          title: "Default",
          manageInventory: true,
          allowBackorder: false,
          prices: [{ id: "price_legacy", currencyCode: "vnd", amount: 249000 }],
        },
      ],
      imageUrls: [],
      thumbnail: null,
    })
    snapshot.inventoryItems.push({ id: "iitem_legacy", sku: "TEE-ESSENTIAL-BLK" })
    snapshot.inventoryLevels.push({
      id: "iilev_legacy",
      inventoryItemId: "iitem_legacy",
      locationId: "sloc_vn",
      stockedQuantity: 25,
      reservedQuantity: 0,
    })

    const result = plan(snapshot)
    expect(result.products.some((entry) => entry.key === "ao-thun-essential")).toBe(false)
    expect(result.inventory.some((entry) => entry.key === "TEE-ESSENTIAL-BLK")).toBe(false)
    expect(summarisePlan(result).products.update).toBe(0)
  })

  it("plans no image work unless images are requested", () => {
    const manifest = manifestWithMapping("dm-tee-core")
    const snapshot = appliedSnapshot()
    snapshot.products.find((product) => product.handle === "dm-tee-core")!.imageUrls = [
      "https://example.test/existing.jpg",
    ]
    expect(plan(snapshot, false, manifest).images).toEqual([])

    const withImages = plan(snapshot, true, manifest, true)
    expect(withImages.images.length).toBe(1)
    expect(withImages.images[0].action).toBe("skip")
    expect(withImages.images[0].reason).toContain("existing media")
  })

  it("degrades cleanly when no file provider is configured", () => {
    const snapshot = appliedSnapshot()
    snapshot.fileProviderAvailable = false
    const manifest = manifestWithMapping("dm-tee-core")

    const result = plan(snapshot, true, manifest, true)
    expect(result.images[0].action).toBe("skip")
    expect(result.images[0].reason).toContain("no file provider")
    expect(result.warnings.join(" ")).toContain("No file provider")
    expect(result.blockers.join(" ")).not.toContain("file provider")
    expect(summarisePlan(result).products.skip).toBe(fixture.products.length)
  })

  it("plans an image upload for a product without media", () => {
    const result = plan(emptySnapshot(), true, manifestWithMapping("dm-tee-core"), true)
    expect(result.images.length).toBe(1)
    expect(result.images[0].action).toBe("insert")
    expect(result.images[0].intent.matchConfidence).toBe("representative")
  })

  it("adds missing variants to an existing product without touching stale ones", () => {
    const snapshot = appliedSnapshot()
    const target = snapshot.products.find((product) => product.handle === "dm-tee-core")!
    const removed = target.variants.shift()!
    target.variants.push({
      ...removed,
      id: "var_legacy_extra",
      sku: "DM-TEE-CORE-IVR-XXL",
      title: "Ivory / XXL",
    })

    const result = plan(snapshot)
    const operation = result.products.find((entry) => entry.key === "dm-tee-core")!
    expect(operation.action).toBe("update")
    const fields = operation.changes.map((change) => change.field)
    expect(fields).toContain("variants.add")
    expect(fields.some((field) => field.startsWith("variants.stale"))).toBe(true)
    const stale = operation.changes.find((change) => change.field.startsWith("variants.stale"))
    expect(stale?.to).toBe("(left untouched)")
  })
})
