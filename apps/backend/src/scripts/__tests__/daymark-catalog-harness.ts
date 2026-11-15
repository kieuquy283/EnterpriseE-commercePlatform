import { buildProductVariants, DAYMARK_CATALOG_FIXTURE } from "../daymark-catalog/fixture"
import type {
  CatalogFixture,
  CatalogImageManifest,
  CatalogSnapshot,
  SnapshotProduct,
} from "../daymark-catalog/types"

// Shared builders for the DAYMARK catalog unit tests. This file is not a test
// file itself; it deliberately does not match the `*.unit.spec.ts` pattern.

export const fixture = DAYMARK_CATALOG_FIXTURE

export function scaffolding() {
  return {
    region: { id: "reg_vn", name: "Vietnam" },
    salesChannelId: "sc_online",
    stockLocation: { id: "sloc_vn", name: "Vietnam Warehouse" },
    shippingProfileId: "sp_default",
    fileProviderAvailable: true,
  }
}

export function emptySnapshot(overrides: Partial<CatalogSnapshot> = {}): CatalogSnapshot {
  return {
    ...scaffolding(),
    collections: [],
    categories: [],
    products: [],
    inventoryItems: [],
    inventoryLevels: [],
    ...overrides,
  }
}

/** Snapshot representing the fixture fully applied, for idempotency checks. */
export function appliedSnapshot(source: CatalogFixture = fixture): CatalogSnapshot {
  const collectionId = (handle: string) => `pcol_${handle}`
  const categoryId = (handle: string) => `pcat_${handle}`

  const products: SnapshotProduct[] = source.products.map((product) => ({
    id: `prod_${product.handle}`,
    dataset: "daymark-catalog",
    handle: product.handle,
    title: product.title,
    description: product.description,
    status: "published",
    collectionId: collectionId(product.collectionHandle),
    categoryIds: [categoryId(product.categoryHandle)],
    optionTitles: ["Colour", "Size"],
    optionValues: {
      Size: [...product.sizes],
      Colour: [...product.colourCodes],
    },
    variants: buildProductVariants(source, product).map((variant) => ({
      id: `var_${variant.sku}`,
      sku: variant.sku,
      title: variant.title,
      manageInventory: true,
      allowBackorder: false,
      prices: [
        {
          id: `price_${variant.sku}`,
          currencyCode: "vnd",
          amount: product.priceVnd,
        },
      ],
    })),
    imageUrls: [],
    thumbnail: null,
  }))

  const inventoryItems = source.products.flatMap((product) =>
    buildProductVariants(source, product).map((variant) => ({
      id: `iitem_${variant.sku}`,
      sku: variant.sku,
    })),
  )

  const inventoryLevels = source.products.flatMap((product) =>
    buildProductVariants(source, product).map((variant) => ({
      id: `iilev_${variant.sku}`,
      inventoryItemId: `iitem_${variant.sku}`,
      locationId: "sloc_vn",
      stockedQuantity: product.stockPerVariant,
      reservedQuantity: 0,
    })),
  )

  return {
    ...scaffolding(),
    collections: source.collections.map((collection) => ({
      id: collectionId(collection.handle),
      dataset: "daymark-catalog",
      handle: collection.handle,
      title: collection.title,
    })),
    categories: source.categories.map((category) => ({
      id: categoryId(category.handle),
      dataset: "daymark-catalog",
      handle: category.handle,
      name: category.name,
    })),
    products,
    inventoryItems,
    inventoryLevels,
  }
}

export function totalVariantCount(source: CatalogFixture = fixture): number {
  return source.products.reduce(
    (total, product) => total + product.sizes.length * product.colourCodes.length,
    0,
  )
}

export function manifestWithMapping(
  productHandle: string,
  overrides: Partial<CatalogImageManifest["assets"][number]> = {},
): CatalogImageManifest {
  return {
    manifestVersion: 1,
    assets: [
      {
        id: "dm-editorial-900",
        filename: "dm-editorial-900.jpg",
        role: "product",
        sha256: "0".repeat(64),
        bytes: 1024,
        width: 960,
        height: 640,
        mimeType: "image/jpeg",
        productMappings: [
          {
            productHandle,
            matchConfidence: "representative",
          },
        ],
        ...overrides,
      },
    ],
  }
}

export function editorialManifest(): CatalogImageManifest {
  return {
    manifestVersion: 1,
    assets: [
      {
        id: "dm-editorial-901",
        filename: "dm-editorial-901.jpg",
        role: "editorial",
        sha256: "1".repeat(64),
        bytes: 2048,
        width: 960,
        height: 640,
        mimeType: "image/jpeg",
        productMappings: [],
      },
    ],
  }
}
