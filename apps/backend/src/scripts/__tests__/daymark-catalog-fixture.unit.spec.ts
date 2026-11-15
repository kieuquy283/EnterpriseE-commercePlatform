import {
  allFixtureVariants,
  DAYMARK_CATALOG_FIXTURE,
  buildProductVariants,
} from "../daymark-catalog/fixture"
import { summariseFixture, validateFixture } from "../daymark-catalog/validate-fixture"
import type { CatalogFixture } from "../daymark-catalog/types"

const fixture = DAYMARK_CATALOG_FIXTURE

function cloneFixture(): CatalogFixture {
  return JSON.parse(JSON.stringify(fixture)) as CatalogFixture
}

describe("DAYMARK catalog fixture", () => {
  it("is structurally valid", () => {
    const result = validateFixture(fixture)
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })

  it("covers the 24-36 product target with three collections and one category per product", () => {
    const stats = summariseFixture(fixture)
    expect(stats.products).toBeGreaterThanOrEqual(24)
    expect(stats.products).toBeLessThanOrEqual(36)
    expect(stats.collections).toBe(3)
    expect(fixture.collections.map((collection) => collection.title).sort()).toEqual([
      "Daily Essentials",
      "Off Hours",
      "Workday",
    ])
    for (const product of fixture.products) {
      expect(product.collectionHandle).toMatch(/^dm-/)
      expect(product.categoryHandle).toMatch(/^dm-/)
    }
  })

  it("uses DAYMARK-owned stable identifiers", () => {
    for (const collection of fixture.collections) {
      expect(collection.handle).toMatch(/^dm-/)
    }
    for (const category of fixture.categories) {
      expect(category.handle).toMatch(/^dm-/)
    }
    for (const product of fixture.products) {
      expect(product.handle).toMatch(/^dm-[a-z0-9-]+$/)
      expect(product.skuPrefix).toMatch(/^DM-[A-Z]{3}-[A-Z]{3,5}$/)
      for (const variant of buildProductVariants(fixture, product)) {
        expect(variant.sku).toMatch(/^DM-[A-Z]{3}-[A-Z]{3,5}-[A-Z]{3}-(?:S|M|L|XL|28|30|32|34|TU)$/)
        expect(variant.sku.startsWith(product.skuPrefix)).toBe(true)
      }
    }
  })

  it("has unique handles and SKUs", () => {
    const handles = fixture.products.map((product) => product.handle)
    expect(new Set(handles).size).toBe(handles.length)
    const skus = allFixtureVariants(fixture).map((entry) => entry.variant.sku)
    expect(new Set(skus).size).toBe(skus.length)
  })

  it("prices are whole positive dong", () => {
    for (const product of fixture.products) {
      expect(Number.isInteger(product.priceVnd)).toBe(true)
      expect(product.priceVnd).toBeGreaterThan(0)
    }
    const stats = summariseFixture(fixture)
    expect(stats.minPriceVnd).toBeGreaterThanOrEqual(100000)
    expect(stats.maxPriceVnd).toBeLessThanOrEqual(2000000)
  })

  it("keeps a consistent size and colour matrix per product", () => {
    for (const product of fixture.products) {
      const variants = buildProductVariants(fixture, product)
      expect(variants.length).toBe(product.sizes.length * product.colourCodes.length)
      expect(new Set(product.colourCodes).size).toBe(product.colourCodes.length)
      for (const variant of variants) {
        expect(product.sizes).toContain(variant.size)
        expect(product.colourCodes).toContain(variant.colourCode)
      }
    }
  })

  it("uses S/M/L/XL for tops and 28/30/32/34 for trousers", () => {
    for (const product of fixture.products) {
      const sizes = [...product.sizes]
      if (product.categoryHandle === "dm-trousers") {
        expect(sizes).toEqual(["28", "30", "32", "34"])
      } else if (product.categoryHandle === "dm-bags") {
        expect(sizes).toEqual(["TU"])
      } else {
        expect(sizes).toEqual(["S", "M", "L", "XL"])
      }
    }
  })

  it("rejects duplicate handles, unknown references and bad prices", () => {
    const duplicated = cloneFixture()
    duplicated.products[1].handle = duplicated.products[0].handle
    expect(validateFixture(duplicated).errors.join(" ")).toContain("duplicate product handle")

    const unknownCollection = cloneFixture()
    unknownCollection.products[0].collectionHandle = "dm-does-not-exist"
    expect(validateFixture(unknownCollection).errors.join(" ")).toContain(
      "references unknown collection",
    )

    const unknownCategory = cloneFixture()
    unknownCategory.products[0].categoryHandle = "dm-nope"
    expect(validateFixture(unknownCategory).errors.join(" ")).toContain(
      "references unknown category",
    )

    const badPrice = cloneFixture()
    badPrice.products[0].priceVnd = 249000.5
    expect(validateFixture(badPrice).errors.join(" ")).toContain("positive whole number")

    const zeroPrice = cloneFixture()
    zeroPrice.products[0].priceVnd = 0
    expect(validateFixture(zeroPrice).ok).toBe(false)
  })

  it("rejects duplicate SKUs across products", () => {
    const duplicated = cloneFixture()
    duplicated.products[1].skuPrefix = duplicated.products[0].skuPrefix
    const errors = validateFixture(duplicated).errors.join(" ")
    expect(errors).toContain("duplicate skuPrefix")
    expect(errors).toContain("duplicate SKU")
  })

  it("rejects a product with a single colour or an unknown colour", () => {
    const oneColour = cloneFixture()
    const product = oneColour.products[0] as unknown as { colourCodes: string[] }
    product.colourCodes = ["IVR"]
    expect(validateFixture(oneColour).errors.join(" ")).toContain("at least two colours")

    const unknownColour = cloneFixture()
    const target = unknownColour.products[0] as unknown as { colourCodes: string[] }
    target.colourCodes = ["IVR", "ZZZ"]
    expect(validateFixture(unknownColour).errors.join(" ")).toContain("unknown colour code")
  })

  it("rejects an off-pattern size run", () => {
    const fixtureWithBadSizes = cloneFixture()
    const product = fixtureWithBadSizes.products[0] as unknown as { sizes: string[] }
    product.sizes = ["S", "M"]
    expect(validateFixture(fixtureWithBadSizes).errors.join(" ")).toContain("known size run")
  })
})
