// Shared types for the DAYMARK catalog fixture, plan and importer.
// This module is intentionally free of Medusa runtime imports so the plan
// computation and validation can be unit tested without a container.

export type CatalogColourCode =
  | "IVR"
  | "BLK"
  | "OLV"
  | "CHR"
  | "NAT"
  | "WHT"
  | "BLU"
  | "SKY"
  | "NVY"
  | "STN"
  | "OAT"
  | "SLT"
  | "STR"
  | "GRY"

export type CatalogColour = {
  code: CatalogColourCode
  name: string
}

export type CatalogCollection = {
  handle: string
  title: string
  description: string
}

export type CatalogCategory = {
  handle: string
  name: string
  description: string
}

export type CatalogProduct = {
  handle: string
  title: string
  description: string
  collectionHandle: string
  categoryHandle: string
  /** Whole Vietnamese dong. Medusa prices are written in the region's major unit. */
  priceVnd: number
  /** DAYMARK-owned stable identifier prefix, for example `DM-TEE-CORE`. */
  skuPrefix: string
  sizes: readonly string[]
  colourCodes: readonly CatalogColourCode[]
  /** Opening stock applied to every variant of this product at the single warehouse. */
  stockPerVariant: number
}

export type CatalogFixture = {
  version: number
  currencyCode: string
  collections: readonly CatalogCollection[]
  categories: readonly CatalogCategory[]
  colours: readonly CatalogColour[]
  products: readonly CatalogProduct[]
}

export type CatalogVariant = {
  sku: string
  size: string
  colourCode: CatalogColourCode
  colourName: string
  title: string
}

export type MatchConfidence = "exact-product" | "representative" | "category-representative"

export type ImageProductMapping = {
  productHandle: string
  matchConfidence: MatchConfidence
}

export type CatalogImageAsset = {
  id: string
  filename: string
  role: "product" | "editorial"
  sha256: string
  bytes: number
  width: number
  height: number
  mimeType: string
  productMappings: readonly ImageProductMapping[]
}

export type CatalogImageManifest = {
  manifestVersion: number
  assets: readonly CatalogImageAsset[]
}

export type ImportAction = "insert" | "update" | "skip" | "conflict"

export type PlannedChange = {
  field: string
  from: string
  to: string
}

export type CollectionIntent = {
  handle: string
  title: string
}

export type CategoryIntent = {
  handle: string
  name: string
}

export type ProductIntent = {
  handle: string
  title: string
  description: string
  status: string
  collectionHandle: string
  categoryHandle: string
  priceVnd: number
  variants: CatalogVariant[]
}

export type InventoryIntent = {
  sku: string
  stockedQuantity: number
}

export type ImageIntent = {
  assetId: string
  productHandle: string
  filename: string
  sha256: string
  bytes: number
  matchConfidence: MatchConfidence
}

export type PlanOperation<TIntent> = {
  action: ImportAction
  /** Stable DAYMARK-owned identifier used for matching, never a database id. */
  key: string
  label: string
  /** Existing entity id when the snapshot matched this operation. */
  targetId: string | null
  changes: PlannedChange[]
  reason: string | null
  intent: TIntent
}

export type SnapshotVariantPrice = {
  isDefault?: boolean
  id: string
  currencyCode: string
  amount: number
}

export type SnapshotVariant = {
  id: string
  sku: string | null
  title: string
  manageInventory: boolean
  allowBackorder: boolean
  prices: SnapshotVariantPrice[]
}

export type SnapshotProduct = {
  dataset?: string | null
  id: string
  handle: string
  title: string
  description: string | null
  status: string
  collectionId: string | null
  categoryIds: string[]
  optionTitles: string[]
  optionValues: Record<string, string[]>
  variants: SnapshotVariant[]
  imageUrls: string[]
  thumbnail: string | null
}

export type SnapshotCollection = {
  dataset?: string | null
  id: string
  handle: string
  title: string
}

export type SnapshotCategory = {
  dataset?: string | null
  id: string
  handle: string
  name: string
}

export type SnapshotInventoryItem = {
  id: string
  sku: string | null
}

export type SnapshotInventoryLevel = {
  id: string
  inventoryItemId: string
  locationId: string
  stockedQuantity: number
  reservedQuantity: number
}

export type CatalogSnapshot = {
  region: { id: string; name: string } | null
  salesChannelId: string | null
  stockLocation: { id: string; name: string } | null
  shippingProfileId: string | null
  collections: SnapshotCollection[]
  categories: SnapshotCategory[]
  products: SnapshotProduct[]
  inventoryItems: SnapshotInventoryItem[]
  inventoryLevels: SnapshotInventoryLevel[]
  fileProviderAvailable: boolean
}

export type ImportPlan = {
  fixtureVersion: number
  imagesEnabled: boolean
  collections: PlanOperation<CollectionIntent>[]
  categories: PlanOperation<CategoryIntent>[]
  products: PlanOperation<ProductIntent>[]
  inventory: PlanOperation<InventoryIntent>[]
  images: PlanOperation<ImageIntent>[]
  /** Problems that make `--apply` unsafe. A dry run still prints the plan. */
  blockers: string[]
  warnings: string[]
}

export type PlanCounts = Record<ImportAction, number>

export type PlanSummary = {
  collections: PlanCounts
  categories: PlanCounts
  products: PlanCounts
  inventory: PlanCounts
  images: PlanCounts
}
