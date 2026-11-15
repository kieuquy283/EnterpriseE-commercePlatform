import { allFixtureVariants, buildProductVariants } from "./fixture"
import type { CatalogFixture, CatalogVariant } from "./types"

// Structural rules the seed depends on. Kept pure so the fixture can be
// validated in unit tests before any database connection exists.

const HANDLE_PATTERN = /^dm-[a-z0-9]+(?:-[a-z0-9]+)*$/
const SKU_PREFIX_PATTERN = /^DM-[A-Z]{3}-[A-Z]{3,5}$/
const SKU_PATTERN = /^DM-[A-Z]{3}-[A-Z]{3,5}-[A-Z]{3}-(?:S|M|L|XL|28|30|32|34|TU)$/
const PRODUCT_HANDLE = /^dm-/
const SIZE_SETS: Record<string, string[]> = {
  tops: ["S", "M", "L", "XL"],
  trousers: ["28", "30", "32", "34"],
  oneSize: ["TU"],
}

export type FixtureValidationResult = {
  ok: boolean
  errors: string[]
}

export function validateFixture(fixture: CatalogFixture): FixtureValidationResult {
  const errors: string[] = []

  if (!Number.isInteger(fixture.version) || fixture.version < 1) {
    errors.push("fixture.version must be a positive integer")
  }
  if (fixture.currencyCode !== "vnd") {
    errors.push(`fixture.currencyCode must be "vnd", received "${fixture.currencyCode}"`)
  }

  const collectionHandles = new Set<string>()
  for (const collection of fixture.collections) {
    if (!HANDLE_PATTERN.test(collection.handle)) {
      errors.push(`collection handle "${collection.handle}" must match dm-<lowercase-slug>`)
    }
    if (collectionHandles.has(collection.handle)) {
      errors.push(`duplicate collection handle "${collection.handle}"`)
    }
    collectionHandles.add(collection.handle)
    if (!collection.title.trim()) {
      errors.push(`collection "${collection.handle}" is missing a title`)
    }
  }

  const categoryHandles = new Set<string>()
  for (const category of fixture.categories) {
    if (!HANDLE_PATTERN.test(category.handle)) {
      errors.push(`category handle "${category.handle}" must match dm-<lowercase-slug>`)
    }
    if (categoryHandles.has(category.handle)) {
      errors.push(`duplicate category handle "${category.handle}"`)
    }
    categoryHandles.add(category.handle)
    if (!category.name.trim()) {
      errors.push(`category "${category.handle}" is missing a name`)
    }
  }

  const colourCodes = new Set(fixture.colours.map((colour) => colour.code))
  if (colourCodes.size !== fixture.colours.length) {
    errors.push("duplicate colour codes in fixture.colours")
  }

  const productHandles = new Set<string>()
  const skuOwner = new Map<string, string>()
  const skuPrefixes = new Set<string>()

  for (const product of fixture.products) {
    const where = `product "${product.handle}"`

    if (!PRODUCT_HANDLE.test(product.handle)) {
      errors.push(`${where} must start with the dm- handle prefix`)
    }
    if (productHandles.has(product.handle)) {
      errors.push(`duplicate product handle "${product.handle}"`)
    }
    productHandles.add(product.handle)

    if (!product.title.trim()) {
      errors.push(`${where} is missing a title`)
    }
    if (!product.description.trim()) {
      errors.push(`${where} is missing a description`)
    }

    if (!collectionHandles.has(product.collectionHandle)) {
      errors.push(`${where} references unknown collection "${product.collectionHandle}"`)
    }
    if (!categoryHandles.has(product.categoryHandle)) {
      errors.push(`${where} references unknown category "${product.categoryHandle}"`)
    }

    if (!Number.isInteger(product.priceVnd) || product.priceVnd <= 0) {
      errors.push(`${where} priceVnd must be a positive whole number of dong`)
    }
    if (product.priceVnd % 1 !== 0) {
      errors.push(`${where} priceVnd must not have a fractional part`)
    }

    if (!SKU_PREFIX_PATTERN.test(product.skuPrefix)) {
      errors.push(`${where} skuPrefix "${product.skuPrefix}" must match DM-<CAT>-<NAME>`)
    }
    if (skuPrefixes.has(product.skuPrefix)) {
      errors.push(`duplicate skuPrefix "${product.skuPrefix}"`)
    }
    skuPrefixes.add(product.skuPrefix)

    if (!product.sizes.length) {
      errors.push(`${where} must declare at least one size`)
    }
    const knownSizeSet = Object.values(SIZE_SETS).find(
      (sizes) => sizes.join(",") === [...product.sizes].join(","),
    )
    if (!knownSizeSet) {
      errors.push(
        `${where} sizes [${product.sizes.join(", ")}] must be a known size run: ${Object.values(
          SIZE_SETS,
        )
          .map((sizes) => `[${sizes.join(", ")}]`)
          .join(" or ")}`,
      )
    }

    if (product.colourCodes.length < 2) {
      errors.push(`${where} must offer at least two colours`)
    }
    if (new Set(product.colourCodes).size !== product.colourCodes.length) {
      errors.push(`${where} lists a duplicate colour code`)
    }
    for (const code of product.colourCodes) {
      if (!colourCodes.has(code)) {
        errors.push(`${where} references unknown colour code "${code}"`)
      }
    }

    if (!Number.isInteger(product.stockPerVariant) || product.stockPerVariant <= 0) {
      errors.push(`${where} stockPerVariant must be a positive integer`)
    }

    let variants: CatalogVariant[] = []
    try {
      variants = buildProductVariants(fixture, product)
    } catch (error) {
      errors.push(`${where} could not expand its size/colour matrix: ${(error as Error).message}`)
    }
    for (const variant of variants) {
      if (!SKU_PATTERN.test(variant.sku)) {
        errors.push(`${where} generated an off-pattern SKU "${variant.sku}"`)
      }
      const owner = skuOwner.get(variant.sku)
      if (owner) {
        errors.push(`duplicate SKU "${variant.sku}" in "${owner}" and "${product.handle}"`)
      }
      skuOwner.set(variant.sku, product.handle)
    }
  }

  const usedCollections = new Set(fixture.products.map((product) => product.collectionHandle))
  for (const handle of collectionHandles) {
    if (!usedCollections.has(handle)) {
      errors.push(`collection "${handle}" has no products`)
    }
  }
  const usedCategories = new Set(fixture.products.map((product) => product.categoryHandle))
  for (const handle of categoryHandles) {
    if (!usedCategories.has(handle)) {
      errors.push(`category "${handle}" has no products`)
    }
  }

  return { ok: errors.length === 0, errors }
}

export type FixtureStats = {
  products: number
  variants: number
  collections: number
  categories: number
  totalStockUnits: number
  minPriceVnd: number
  maxPriceVnd: number
}

export function summariseFixture(fixture: CatalogFixture): FixtureStats {
  const variants = allFixtureVariants(fixture)
  const prices = fixture.products.map((product) => product.priceVnd)
  return {
    products: fixture.products.length,
    variants: variants.length,
    collections: fixture.collections.length,
    categories: fixture.categories.length,
    totalStockUnits: variants.reduce((total, entry) => total + entry.product.stockPerVariant, 0),
    minPriceVnd: prices.length ? Math.min(...prices) : 0,
    maxPriceVnd: prices.length ? Math.max(...prices) : 0,
  }
}
