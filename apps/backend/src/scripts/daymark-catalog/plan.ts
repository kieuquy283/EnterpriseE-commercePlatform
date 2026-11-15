import { buildProductVariants } from "./fixture"
import type {
  CatalogFixture,
  CatalogVariant,
  CatalogImageManifest,
  CatalogProduct,
  CatalogSnapshot,
  CollectionIntent,
  CategoryIntent,
  ImageIntent,
  ImportPlan,
  InventoryIntent,
  PlanCounts,
  PlanOperation,
  PlanSummary,
  PlannedChange,
  ProductIntent,
  SnapshotProduct,
  SnapshotVariant,
} from "./types"

// Pure plan computation. `buildImportPlan` never touches a database, a file
// provider or a workflow, so a dry run and an apply share exactly the same
// decisions and the same report.

export const DAYMARK_PRODUCT_STATUS = "published"

export type BuildImportPlanInput = {
  fixture: CatalogFixture
  snapshot: CatalogSnapshot
  manifest: CatalogImageManifest | null
  imagesEnabled: boolean
  includeRepresentativeImages?: boolean
}

function plannedChange(field: string, from: string, to: string): PlannedChange {
  return { field, from, to }
}

export function productIntent(fixture: CatalogFixture, product: CatalogProduct): ProductIntent {
  return {
    handle: product.handle,
    title: product.title,
    description: product.description,
    status: DAYMARK_PRODUCT_STATUS,
    collectionHandle: product.collectionHandle,
    categoryHandle: product.categoryHandle,
    priceVnd: product.priceVnd,
    variants: buildProductVariants(fixture, product),
  }
}

function variantPrice(product: SnapshotProduct, variantId: string): number | null {
  const variant = product.variants.find((entry) => entry.id === variantId)
  if (!variant) {
    return null
  }
  const price = variant.prices.find(
    (entry) => entry.currencyCode.toLowerCase() === "vnd" && entry.isDefault !== false,
  )
  return price ? price.amount : null
}

type ProductDiff = {
  changes: PlannedChange[]
  /** Fixture SKUs missing from the product; they are added on update. */
  missingSkus: string[]
  /** Variants present in the database but absent from the fixture; left untouched. */
  staleSkus: string[]
  /** Fixture SKUs already owned by a different product. */
  foreignSkus: string[]
  optionMismatch: string | null
}

function diffExistingProduct(
  fixture: CatalogFixture,
  product: CatalogProduct,
  existing: SnapshotProduct,
  snapshot: CatalogSnapshot,
): ProductDiff {
  const changes: PlannedChange[] = []
  const desired = buildProductVariants(fixture, product)
  const intent = productIntent(fixture, product)

  if (existing.title !== intent.title) {
    changes.push(plannedChange("title", existing.title, intent.title))
  }
  if ((existing.description ?? "") !== intent.description) {
    changes.push(plannedChange("description", existing.description ?? "", intent.description))
  }
  if (existing.status !== DAYMARK_PRODUCT_STATUS) {
    changes.push(plannedChange("status", existing.status, DAYMARK_PRODUCT_STATUS))
  }

  const collection = snapshot.collections.find((entry) => entry.handle === product.collectionHandle)
  if (!collection) {
    changes.push(
      plannedChange(
        "collection",
        existing.collectionId ?? "(none)",
        `${product.collectionHandle} (does not exist yet)`,
      ),
    )
  } else if (existing.collectionId !== collection.id) {
    changes.push(
      plannedChange("collection", existing.collectionId ?? "(none)", product.collectionHandle),
    )
  }

  const category = snapshot.categories.find((entry) => entry.handle === product.categoryHandle)
  if (!category) {
    changes.push(
      plannedChange(
        "categories",
        existing.categoryIds.join(", ") || "(none)",
        `${product.categoryHandle} (does not exist yet)`,
      ),
    )
  } else {
    const current = [...existing.categoryIds].sort().join(",")
    const next = category.id
    if (!existing.categoryIds.includes(next)) {
      changes.push(plannedChange("categories", current || "(none)", product.categoryHandle))
    }
  }

  const existingBySku = new Map<string, SnapshotVariant>()
  for (const variant of existing.variants) {
    if (variant.sku) {
      existingBySku.set(variant.sku, variant)
    }
  }
  const desiredSkus = new Set(desired.map((variant) => variant.sku))
  const missingSkus: string[] = []
  const foreignSkus: string[] = []

  for (const variant of desired) {
    const match = existingBySku.get(variant.sku)
    // Ownership is checked for every desired SKU, not only for absent ones, so
    // a duplicated SKU that already lives on a different product is reported
    // instead of silently reused.
    const foreignOwner = snapshot.products.find(
      (candidate) =>
        candidate.handle !== product.handle &&
        candidate.variants.some((entry) => entry.sku === variant.sku),
    )
    if (foreignOwner) {
      foreignSkus.push(variant.sku)
      changes.push(
        plannedChange(`variants.conflict:${variant.sku}`, foreignOwner.handle, product.handle),
      )
      continue
    }
    if (!match) {
      missingSkus.push(variant.sku)
      changes.push(plannedChange("variants.add", "(absent)", variant.sku))
      continue
    }
    if (!match.manageInventory) {
      changes.push(plannedChange(`variant.manage_inventory:${variant.sku}`, "false", "true"))
    }
    if (match.allowBackorder) {
      changes.push(plannedChange(`variant.allow_backorder:${variant.sku}`, "true", "false"))
    }
    const currentPrice = variantPrice(existing, match.id)
    if (currentPrice !== product.priceVnd) {
      changes.push(
        plannedChange(
          `variant.price:${variant.sku}`,
          currentPrice === null ? "(no VND price)" : String(currentPrice),
          String(product.priceVnd),
        ),
      )
    }
  }

  for (const variant of existing.variants) {
    if (variant.sku && !desiredSkus.has(variant.sku)) {
      changes.push(plannedChange(`variants.stale:${variant.sku}`, variant.sku, "(left untouched)"))
    }
  }
  const staleSkus = existing.variants.flatMap((variant) =>
    variant.sku && !desiredSkus.has(variant.sku) ? [variant.sku] : [],
  )

  const expectedOptions = [
    { title: "Size", values: [...product.sizes] },
    { title: "Colour", values: [...product.colourCodes] },
  ]
  let optionMismatch: string | null = null
  const existingTitles = [...existing.optionTitles].sort().join(",")
  const expectedTitles = expectedOptions
    .map((option) => option.title)
    .sort()
    .join(",")
  if (existingTitles !== expectedTitles) {
    optionMismatch = `product options are [${existing.optionTitles.join(", ") || "(none)"}], the fixture expects [${expectedOptions
      .map((option) => option.title)
      .join(", ")}]`
  } else {
    for (const option of expectedOptions) {
      const current = [...(existing.optionValues[option.title] ?? [])].sort().join(",")
      const wanted = [...option.values].sort().join(",")
      if (current !== wanted) {
        optionMismatch = `option "${option.title}" has values [${current}], the fixture expects [${wanted}]`
        break
      }
    }
  }

  return { changes, missingSkus, staleSkus, foreignSkus, optionMismatch }
}

function summariseOperations<TIntent>(operations: PlanOperation<TIntent>[]): PlanCounts {
  const counts: PlanCounts = { insert: 0, update: 0, skip: 0, conflict: 0 }
  for (const operation of operations) {
    counts[operation.action] += 1
  }
  return counts
}

export function summarisePlan(plan: ImportPlan): PlanSummary {
  return {
    collections: summariseOperations(plan.collections),
    categories: summariseOperations(plan.categories),
    products: summariseOperations(plan.products),
    inventory: summariseOperations(plan.inventory),
    images: summariseOperations(plan.images),
  }
}

function planCollections(
  fixture: CatalogFixture,
  snapshot: CatalogSnapshot,
): PlanOperation<CollectionIntent>[] {
  return fixture.collections.map((collection) => {
    const intent: CollectionIntent = { handle: collection.handle, title: collection.title }
    const existing = snapshot.collections.find((entry) => entry.handle === collection.handle)
    if (!existing) {
      return {
        action: "insert",
        key: collection.handle,
        label: collection.title,
        targetId: null,
        changes: [plannedChange("collection", "(absent)", collection.handle)],
        reason: null,
        intent,
      }
    }
    if (existing.dataset !== "daymark-catalog") {
      return {
        action: "conflict",
        key: collection.handle,
        label: collection.title,
        targetId: existing.id,
        changes: [],
        intent,
        reason: "handle exists without DAYMARK dataset ownership metadata",
      }
    }
    const changes =
      existing.title === collection.title
        ? []
        : [plannedChange("title", existing.title, collection.title)]
    return {
      action: changes.length ? "update" : "skip",
      key: collection.handle,
      label: collection.title,
      targetId: existing.id,
      changes,
      reason: changes.length ? null : "collection already matches the fixture",
      intent,
    }
  })
}

function planCategories(
  fixture: CatalogFixture,
  snapshot: CatalogSnapshot,
): PlanOperation<CategoryIntent>[] {
  return fixture.categories.map((category) => {
    const intent: CategoryIntent = { handle: category.handle, name: category.name }
    const existing = snapshot.categories.find((entry) => entry.handle === category.handle)
    if (!existing) {
      return {
        action: "insert",
        key: category.handle,
        label: category.name,
        targetId: null,
        changes: [plannedChange("category", "(absent)", category.handle)],
        reason: null,
        intent,
      }
    }
    if (existing.dataset !== "daymark-catalog") {
      return {
        action: "conflict",
        key: category.handle,
        label: category.name,
        targetId: existing.id,
        changes: [],
        intent,
        reason: "handle exists without DAYMARK dataset ownership metadata",
      }
    }
    const changes =
      existing.name === category.name ? [] : [plannedChange("name", existing.name, category.name)]
    return {
      action: changes.length ? "update" : "skip",
      key: category.handle,
      label: category.name,
      targetId: existing.id,
      changes,
      reason: changes.length ? null : "category already matches the fixture",
      intent,
    }
  })
}

function planProducts(
  fixture: CatalogFixture,
  snapshot: CatalogSnapshot,
): PlanOperation<ProductIntent>[] {
  return fixture.products.map((product) => {
    const intent = productIntent(fixture, product)
    const existing = snapshot.products.find((entry) => entry.handle === product.handle)
    const base = { key: product.handle, label: product.title, intent }

    if (!existing) {
      const foreign = snapshot.products.flatMap((candidate) =>
        candidate.variants
          .filter(
            (variant) =>
              variant.sku &&
              buildProductVariants(fixture, product).some((wanted) => wanted.sku === variant.sku),
          )
          .map((variant) => `${variant.sku} is already used by "${candidate.handle}"`),
      )
      if (foreign.length) {
        return {
          ...base,
          action: "conflict" as const,
          targetId: null,
          changes: [],
          reason: foreign.join("; "),
        }
      }
      return {
        ...base,
        action: "insert" as const,
        targetId: null,
        changes: [
          plannedChange("product", "(absent)", product.handle),
          ...intent.variants.map((variant) =>
            plannedChange("variants.add", "(absent)", variant.sku),
          ),
        ],
        reason: null,
      }
    }

    if (existing.dataset !== "daymark-catalog") {
      return {
        ...base,
        action: "conflict" as const,
        targetId: existing.id,
        changes: [],
        reason: "handle exists without DAYMARK dataset ownership metadata",
      }
    }

    const diff = diffExistingProduct(fixture, product, existing, snapshot)
    if (diff.foreignSkus.length) {
      return {
        ...base,
        action: "conflict" as const,
        targetId: existing.id,
        changes: diff.changes,
        reason: `SKU ownership conflict: ${diff.foreignSkus.join(", ")} already belongs to another product`,
      }
    }
    if (diff.optionMismatch) {
      return {
        ...base,
        action: "conflict" as const,
        targetId: existing.id,
        changes: diff.changes,
        reason: `${diff.optionMismatch}. Reconcile the existing product manually; the importer will not rewrite its option set.`,
      }
    }
    if (!diff.changes.some((change) => !change.field.startsWith("variants.stale:"))) {
      return {
        ...base,
        action: "skip" as const,
        targetId: existing.id,
        changes: [],
        reason: "product and variants already match the fixture",
      }
    }
    return {
      ...base,
      action: "update" as const,
      targetId: existing.id,
      changes: diff.changes,
      reason: null,
    }
  })
}

function planInventory(
  fixture: CatalogFixture,
  snapshot: CatalogSnapshot,
): PlanOperation<InventoryIntent>[] {
  const locationId = snapshot.stockLocation?.id ?? null
  return fixture.products.flatMap((product) =>
    buildProductVariants(fixture, product).map((variant) => {
      const intent: InventoryIntent = {
        sku: variant.sku,
        stockedQuantity: product.stockPerVariant,
      }
      const base = { key: variant.sku, label: `${product.title} ${variant.title}`, intent }
      const item = snapshot.inventoryItems.find((entry) => entry.sku === variant.sku)
      if (!item || !locationId) {
        return {
          ...base,
          action: "insert" as const,
          targetId: null,
          changes: [
            plannedChange(
              "inventory_level",
              "(absent)",
              `stocked_quantity ${product.stockPerVariant}`,
            ),
          ],
          reason: null,
        }
      }
      const level = snapshot.inventoryLevels.find(
        (entry) => entry.inventoryItemId === item.id && entry.locationId === locationId,
      )
      if (!level) {
        return {
          ...base,
          action: "insert" as const,
          targetId: item.id,
          changes: [
            plannedChange(
              "inventory_level",
              "(no level at this location)",
              `stocked_quantity ${product.stockPerVariant}`,
            ),
          ],
          reason: null,
        }
      }
      return {
        ...base,
        action: "skip" as const,
        targetId: level.id,
        changes: [],
        reason: "existing stock is preserved; opening stock is only initialized once",
      }
    }),
  )
}

function planImages(
  snapshot: CatalogSnapshot,
  manifest: CatalogImageManifest | null,
  imagesEnabled: boolean,
  includeRepresentativeImages: boolean,
  warnings: string[],
): PlanOperation<ImageIntent>[] {
  if (!imagesEnabled) {
    return []
  }
  if (!manifest) {
    warnings.push(
      "Image import was requested but no manifest is available; products will be written without images.",
    )
    return []
  }
  const operations: PlanOperation<ImageIntent>[] = []
  for (const asset of manifest.assets) {
    if (asset.role !== "product") {
      continue
    }
    for (const mapping of asset.productMappings) {
      if (mapping.matchConfidence !== "exact-product" && !includeRepresentativeImages) {
        warnings.push(
          `Asset ${asset.id} is representative and requires the local demo image mode to attach to ${mapping.productHandle}`,
        )
        continue
      }
      const intent: ImageIntent = {
        assetId: asset.id,
        productHandle: mapping.productHandle,
        filename: asset.filename,
        sha256: asset.sha256,
        bytes: asset.bytes,
        matchConfidence: mapping.matchConfidence,
      }
      const product = snapshot.products.find((entry) => entry.handle === mapping.productHandle)
      const base = {
        key: `${asset.id}->${mapping.productHandle}`,
        label: `${mapping.productHandle} <- ${asset.filename}`,
        intent,
      }
      if (!snapshot.fileProviderAvailable) {
        operations.push({
          ...base,
          action: "skip",
          targetId: product?.id ?? null,
          changes: [],
          reason:
            "no file provider is configured, so media upload is unavailable; the product is imported without images",
        })
        continue
      }
      if (product && product.imageUrls.length > 0) {
        operations.push({
          ...base,
          action: "skip",
          targetId: product.id,
          changes: [],
          reason: "product already has media attached; existing media is never replaced",
        })
        continue
      }
      operations.push({
        ...base,
        action: "insert",
        targetId: product?.id ?? null,
        changes: [plannedChange("image", "(absent)", asset.filename)],
        reason: null,
      })
    }
  }
  return operations
}

export function buildImportPlan(input: BuildImportPlanInput): ImportPlan {
  const warnings: string[] = []
  const blockers: string[] = []

  if (!input.snapshot.region) {
    blockers.push(
      'No "Vietnam" region found. Run the store bootstrap (npm run seed --workspace=@dtc/backend) before the catalog import.',
    )
  }
  if (!input.snapshot.salesChannelId) {
    blockers.push(
      "The store has no default sales channel. Run the store bootstrap before the catalog import.",
    )
  }
  if (!input.snapshot.stockLocation) {
    blockers.push(
      "The store has no default stock location. Run the store bootstrap before the catalog import.",
    )
  }
  if (!input.snapshot.shippingProfileId) {
    blockers.push(
      "No default shipping profile exists. Run the store bootstrap before the catalog import.",
    )
  }
  if (!input.snapshot.fileProviderAvailable) {
    warnings.push(
      "No file provider is configured; catalog media cannot be uploaded in this environment.",
    )
  }

  const collections = planCollections(input.fixture, input.snapshot)
  const categories = planCategories(input.fixture, input.snapshot)
  const products = planProducts(input.fixture, input.snapshot)
  for (const product of products) {
    for (const variant of product.intent.variants) {
      const item = input.snapshot.inventoryItems.find((entry) => entry.sku === variant.sku)
      const ownedVariant = input.snapshot.products.some(
        (entry) =>
          entry.handle === product.key &&
          entry.dataset === "daymark-catalog" &&
          entry.variants.some((candidate) => candidate.sku === variant.sku),
      )
      if (item && !ownedVariant) blockers.push(`Inventory SKU ownership conflict: ${variant.sku}`)
    }
  }
  const inventory = planInventory(input.fixture, input.snapshot)
  const images = planImages(
    input.snapshot,
    input.manifest,
    input.imagesEnabled,
    input.includeRepresentativeImages ?? false,
    warnings,
  )
  for (const image of images) {
    if (image.action !== "insert") continue
    const product = products.find((entry) => entry.key === image.intent.productHandle)
    if (product?.action === "skip") {
      product.action = "update"
      product.reason = "attach missing product media"
    }
  }

  for (const operation of [...collections, ...categories, ...products]) {
    if (operation.action === "conflict") {
      blockers.push(`Conflict on ${operation.key}: ${operation.reason ?? "unresolved"}`)
    }
  }

  return {
    fixtureVersion: input.fixture.version,
    imagesEnabled: input.imagesEnabled,
    collections,
    categories,
    products,
    inventory,
    images,
    blockers,
    warnings,
  }
}

/** Convenience for tests and reports: the whole fixture expressed as desired state. */
export function fixtureVariantSkus(
  fixture: CatalogFixture,
  product: CatalogProduct,
): CatalogVariant[] {
  return buildProductVariants(fixture, product)
}
