import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type {
  CatalogSnapshot,
  SnapshotCategory,
  SnapshotCollection,
  SnapshotInventoryItem,
  SnapshotInventoryLevel,
  SnapshotProduct,
  SnapshotVariant,
} from "./types"

// Reads the current commerce state the plan is computed against. This module
// only performs reads through the query graph; it never writes.

type GraphQuery = <T = Record<string, unknown>>(input: {
  entity: string
  fields: string[]
  filters?: Record<string, unknown>
  pagination?: { take: number; skip: number }
}) => Promise<{ data: T[] }>

type Resolver = {
  resolve: (key: unknown) => unknown
}

async function graph<T>(
  query: GraphQuery,
  input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  },
): Promise<T[]> {
  const rows: T[] = []
  const take = 500
  for (let skip = 0; ; skip += take) {
    const result = await query<T>({ ...input, pagination: { take, skip } })
    rows.push(...result.data)
    if (result.data.length < take) return rows
  }
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null
}

export function mapSnapshotProducts(rows: Record<string, unknown>[]): SnapshotProduct[] {
  return rows.map((row) => {
    const options = Array.isArray(row.options) ? (row.options as Record<string, unknown>[]) : []
    const optionValues: Record<string, string[]> = {}
    for (const option of options) {
      const title = toStringValue(option.title)
      const values = Array.isArray(option.values)
        ? (option.values as Record<string, unknown>[])
        : []
      optionValues[title] = values.map((value) => toStringValue(value.value))
    }
    const categories = Array.isArray(row.categories)
      ? (row.categories as Record<string, unknown>[])
      : []
    const variants = Array.isArray(row.variants) ? (row.variants as Record<string, unknown>[]) : []
    const images = Array.isArray(row.images) ? (row.images as Record<string, unknown>[]) : []

    return {
      dataset: (row.metadata as Record<string, unknown> | null)?.daymark_dataset as
        | string
        | undefined,
      id: toStringValue(row.id),
      handle: toStringValue(row.handle),
      title: toStringValue(row.title),
      description: toNullableString(row.description),
      status: toStringValue(row.status),
      collectionId: toNullableString(row.collection_id),
      categoryIds: categories.map((category) => toStringValue(category.id)),
      optionTitles: options.map((option) => toStringValue(option.title)),
      optionValues,
      thumbnail: toNullableString(row.thumbnail),
      imageUrls: images
        .map((image) => toNullableString(image.url))
        .filter((url): url is string => Boolean(url)),
      variants: variants.map((variant): SnapshotVariant => {
        const prices = Array.isArray(variant.prices)
          ? (variant.prices as Record<string, unknown>[])
          : []
        return {
          id: toStringValue(variant.id),
          sku: toNullableString(variant.sku),
          title: toStringValue(variant.title),
          manageInventory: variant.manage_inventory === true,
          allowBackorder: variant.allow_backorder === true,
          prices: prices.map((price) => ({
            isDefault:
              !price.price_list_id &&
              !Number(price.rules_count ?? 0) &&
              price.min_quantity == null &&
              price.max_quantity == null,
            id: toStringValue(price.id),
            currencyCode: toStringValue(price.currency_code).toLowerCase(),
            amount: toNumber(price.amount),
          })),
        }
      }),
    }
  })
}

export async function readCatalogSnapshot(
  resolver: Resolver,
  options: { regionName?: string } = {},
): Promise<CatalogSnapshot> {
  const query = resolver.resolve(ContainerRegistrationKeys.QUERY) as { graph: GraphQuery }
  const regionName = options.regionName ?? "Vietnam"

  const regions = await graph<Record<string, unknown>>(query.graph.bind(query), {
    entity: "region",
    fields: ["id", "name"],
    filters: { name: regionName },
  })
  const region = regions.length
    ? { id: toStringValue(regions[0].id), name: toStringValue(regions[0].name) }
    : null

  const stores = await graph<Record<string, unknown>>(query.graph.bind(query), {
    entity: "store",
    fields: ["id", "default_sales_channel_id", "default_location_id"],
  })
  const store = stores[0] ?? {}
  const salesChannelId = toNullableString(store.default_sales_channel_id)
  const locationId = toNullableString(store.default_location_id)

  let stockLocation: CatalogSnapshot["stockLocation"] = null
  if (locationId) {
    const locations = await graph<Record<string, unknown>>(query.graph.bind(query), {
      entity: "stock_location",
      fields: ["id", "name"],
      filters: { id: locationId },
    })
    if (locations.length) {
      stockLocation = {
        id: toStringValue(locations[0].id),
        name: toStringValue(locations[0].name),
      }
    }
  }

  const profiles = await graph<Record<string, unknown>>(query.graph.bind(query), {
    entity: "shipping_profile",
    fields: ["id"],
    filters: { type: "default" },
  })
  const shippingProfileId = profiles.length ? toStringValue(profiles[0].id) : null

  const collectionRows = await graph<Record<string, unknown>>(query.graph.bind(query), {
    entity: "product_collection",
    fields: ["id", "handle", "title", "metadata"],
  })
  const collections: SnapshotCollection[] = collectionRows.map((row) => ({
    dataset: (row.metadata as Record<string, unknown> | null)?.daymark_dataset as
      | string
      | undefined,
    id: toStringValue(row.id),
    handle: toStringValue(row.handle),
    title: toStringValue(row.title),
  }))

  const categoryRows = await graph<Record<string, unknown>>(query.graph.bind(query), {
    entity: "product_category",
    fields: ["id", "handle", "name", "metadata"],
  })
  const categories: SnapshotCategory[] = categoryRows.map((row) => ({
    dataset: (row.metadata as Record<string, unknown> | null)?.daymark_dataset as
      | string
      | undefined,
    id: toStringValue(row.id),
    handle: toStringValue(row.handle),
    name: toStringValue(row.name),
  }))

  const productRows = await graph<Record<string, unknown>>(query.graph.bind(query), {
    entity: "product",
    fields: [
      "id",
      "handle",
      "title",
      "description",
      "status",
      "thumbnail",
      "metadata",
      "collection_id",
      "categories.id",
      "categories.handle",
      "options.id",
      "options.title",
      "options.values.id",
      "options.values.value",
      "images.id",
      "images.url",
      "variants.id",
      "variants.sku",
      "variants.title",
      "variants.manage_inventory",
      "variants.allow_backorder",
      "variants.prices.id",
      "variants.prices.currency_code",
      "variants.prices.amount",
      "variants.prices.rules_count",
      "variants.prices.price_list_id",
      "variants.prices.min_quantity",
      "variants.prices.max_quantity",
    ],
  })

  const inventoryItemRows = await graph<Record<string, unknown>>(query.graph.bind(query), {
    entity: "inventory_item",
    fields: ["id", "sku"],
  })
  const inventoryItems: SnapshotInventoryItem[] = inventoryItemRows.map((row) => ({
    id: toStringValue(row.id),
    sku: toNullableString(row.sku),
  }))

  const levelRows = await graph<Record<string, unknown>>(query.graph.bind(query), {
    entity: "inventory_level",
    fields: ["id", "inventory_item_id", "location_id", "stocked_quantity", "reserved_quantity"],
  })
  const inventoryLevels: SnapshotInventoryLevel[] = levelRows.map((row) => ({
    id: toStringValue(row.id),
    inventoryItemId: toStringValue(row.inventory_item_id),
    locationId: toStringValue(row.location_id),
    stockedQuantity: toNumber(row.stocked_quantity),
    reservedQuantity: toNumber(row.reserved_quantity),
  }))

  return {
    region,
    salesChannelId,
    stockLocation,
    shippingProfileId,
    collections,
    categories,
    products: mapSnapshotProducts(productRows),
    inventoryItems,
    inventoryLevels,
    fileProviderAvailable: detectFileProvider(resolver),
  }
}

function detectFileProvider(resolver: Resolver): boolean {
  try {
    return Boolean(resolver.resolve(Modules.FILE))
  } catch {
    // The file module is optional in development; a missing provider must not
    // stop the catalog import.
    return false
  }
}
