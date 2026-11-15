import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import type {
  MedusaContainer,
  UpdateProductVariantWorkflowInputDTO,
} from "@medusajs/framework/types"
import {
  batchInventoryItemLevelsWorkflow,
  createCollectionsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  updateCollectionsWorkflow,
  updateProductCategoriesWorkflow,
  updateProductsWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"
import type {
  CatalogFixture,
  CatalogImageManifest,
  CatalogProduct,
  CatalogSnapshot,
  ImportPlan,
  PlanCounts,
  ProductIntent,
} from "./types"
import { productOptions } from "./fixture"
import { ImportApplicationError } from "./errors"
import { catalogMediaUrl } from "./media-url"

// Applies a plan through Medusa module workflows only. No SQL, no database
// client, no direct storage SDK call. Every step is matched on the
// DAYMARK-owned identifiers the plan already resolved.

export type ApplySummary = {
  collections: PlanCounts
  categories: PlanCounts
  products: PlanCounts
  inventory: PlanCounts
  images: PlanCounts
  imageUploadsUnavailable: number
  notes: string[]
}

export type ApplyContext = {
  container: MedusaContainer
  fixture: CatalogFixture
  manifest: CatalogImageManifest | null
  assetDir: string
  /** Reads one declared asset file from the dataset directory, by filename. */
  readAsset: (filename: string) => Buffer
}

function emptyCounts(): PlanCounts {
  return { insert: 0, update: 0, skip: 0, conflict: 0 }
}

function fixtureProductFor(fixture: CatalogFixture, handle: string): CatalogProduct | undefined {
  return fixture.products.find((product) => product.handle === handle)
}

function variantOptions(variant: { size: string; colourCode: string }): Record<string, string> {
  return { Size: variant.size, Colour: variant.colourCode }
}

export async function applyImportPlan(
  context: ApplyContext,
  plan: ImportPlan,
  snapshot: CatalogSnapshot,
): Promise<ApplySummary> {
  const { container, fixture, manifest } = context
  if (plan.blockers.length) {
    throw new ImportApplicationError("Refusing a catalog plan with unresolved blockers")
  }
  const summary: ApplySummary = {
    collections: emptyCounts(),
    categories: emptyCounts(),
    products: emptyCounts(),
    inventory: emptyCounts(),
    images: emptyCounts(),
    imageUploadsUnavailable: 0,
    notes: [],
  }

  if (!snapshot.salesChannelId || !snapshot.stockLocation || !snapshot.shippingProfileId) {
    throw new ImportApplicationError(
      "Store scaffolding is incomplete. Run the store bootstrap before applying the catalog plan.",
    )
  }

  // 1. Media uploads first, so products can be written with their final URLs.
  const imageUrlsByHandle = new Map<string, string[]>()
  for (const operation of plan.images) {
    if (operation.action !== "insert") {
      summary.images[operation.action] += 1
      if (operation.action === "skip" && operation.reason?.includes("no file provider")) {
        summary.imageUploadsUnavailable += 1
      }
      continue
    }
    const asset = manifest?.assets.find((entry) => entry.id === operation.intent.assetId)
    if (!asset) {
      throw new ImportApplicationError(
        `Image asset "${operation.intent.assetId}" is missing from the manifest`,
      )
    }
    const bytes = context.readAsset(asset.filename)
    const { result } = await uploadFilesWorkflow(container).run({
      input: {
        files: [
          {
            filename: asset.filename,
            mimeType: asset.mimeType,
            content: bytes.toString("base64"),
            access: "public",
          },
        ],
      },
    })
    const url = result?.[0]?.url
    if (!url) {
      throw new ImportApplicationError(`File provider returned no URL for asset "${asset.id}"`)
    }
    const publicUrl = catalogMediaUrl(url, process.env)
    const existing = imageUrlsByHandle.get(operation.intent.productHandle) ?? []
    imageUrlsByHandle.set(operation.intent.productHandle, [...existing, publicUrl])
    summary.images.insert += 1
  }

  // 2. Collections.
  const collectionIds = new Map<string, string>()
  for (const operation of plan.collections) {
    summary.collections[operation.action] += 1
    if (operation.action === "insert") {
      const { result } = await createCollectionsWorkflow(container).run({
        input: {
          collections: [
            {
              title: operation.intent.title,
              handle: operation.intent.handle,
              metadata: { daymark_dataset: "daymark-catalog" },
            },
          ],
        },
      })
      collectionIds.set(operation.intent.handle, result[0].id)
      continue
    }
    if (operation.action === "update" && operation.targetId) {
      await updateCollectionsWorkflow(container).run({
        input: {
          selector: { id: operation.targetId },
          update: { title: operation.intent.title },
        },
      })
      collectionIds.set(operation.intent.handle, operation.targetId)
      continue
    }
    if (operation.targetId) {
      collectionIds.set(operation.intent.handle, operation.targetId)
    }
  }

  // 3. Categories.
  const categoryIds = new Map<string, string>()
  for (const operation of plan.categories) {
    summary.categories[operation.action] += 1
    if (operation.action === "insert") {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name: operation.intent.name,
              handle: operation.intent.handle,
              is_active: true,
              metadata: { daymark_dataset: "daymark-catalog" },
            },
          ],
        },
      })
      categoryIds.set(operation.intent.handle, result[0].id)
      continue
    }
    if (operation.action === "update" && operation.targetId) {
      await updateProductCategoriesWorkflow(container).run({
        input: {
          selector: { id: operation.targetId },
          update: { name: operation.intent.name },
        },
      })
      categoryIds.set(operation.intent.handle, operation.targetId)
      continue
    }
    if (operation.targetId) {
      categoryIds.set(operation.intent.handle, operation.targetId)
    }
  }

  // 4. Products.
  for (const operation of plan.products) {
    summary.products[operation.action] += 1
    if (operation.action === "skip") {
      continue
    }
    if (operation.action === "conflict") {
      summary.notes.push(
        `Skipped conflicting product "${operation.key}": ${operation.reason ?? "unresolved"}`,
      )
      continue
    }
    const product = fixtureProductFor(fixture, operation.key)
    if (!product) {
      throw new ImportApplicationError(
        `Plan referenced product "${operation.key}" which is not in the fixture`,
      )
    }
    const collectionId = collectionIds.get(product.collectionHandle)
    const categoryId = categoryIds.get(product.categoryHandle)
    if (!collectionId || !categoryId) {
      throw new ImportApplicationError(
        `Collection or category for "${product.handle}" was not resolved before the product write`,
      )
    }
    const uploads = imageUrlsByHandle.get(product.handle) ?? []

    if (operation.action === "insert") {
      await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: product.title,
              handle: product.handle,
              description: product.description,
              status: ProductStatus.PUBLISHED,
              shipping_profile_id: snapshot.shippingProfileId,
              collection_id: collectionId,
              category_ids: [categoryId],
              metadata: {
                daymark_dataset: "daymark-catalog",
                daymark_fixture_version: fixture.version,
              },
              options: productOptions(product),
              variants: operation.intent.variants.map((variant) => ({
                title: variant.title,
                sku: variant.sku,
                options: variantOptions(variant),
                prices: [{ amount: product.priceVnd, currency_code: fixture.currencyCode }],
                manage_inventory: true,
                allow_backorder: false,
              })),
              sales_channels: [{ id: snapshot.salesChannelId as string }],
              ...(uploads.length
                ? { thumbnail: uploads[0], images: uploads.map((url) => ({ url })) }
                : {}),
            },
          ],
        },
      })
      continue
    }

    const existing = snapshot.products.find((entry) => entry.handle === product.handle)
    if (!existing) {
      throw new ImportApplicationError(
        `Plan expected an existing product "${product.handle}" but the snapshot has none`,
      )
    }
    const variants: UpdateProductVariantWorkflowInputDTO[] = operation.intent.variants.map(
      (variant) => {
        const match = existing.variants.find((entry) => entry.sku === variant.sku)
        if (!match) {
          return {
            title: variant.title,
            sku: variant.sku,
            options: variantOptions(variant),
            prices: [{ amount: product.priceVnd, currency_code: fixture.currencyCode }],
            manage_inventory: true,
            allow_backorder: false,
          }
        }
        const hasCurrency = match.prices.some(
          (price) => price.currencyCode === fixture.currencyCode && price.isDefault !== false,
        )
        const priceChanged = match.prices.some(
          (price) =>
            price.currencyCode === fixture.currencyCode &&
            price.isDefault !== false &&
            price.amount !== product.priceVnd,
        )
        // Replace only the VND amount; other currency amounts are passed through
        // unchanged so an update never drops a price the fixture does not own.
        const prices =
          priceChanged || !hasCurrency
            ? hasCurrency
              ? match.prices.map((price) => ({
                  id: price.id,
                  amount:
                    price.currencyCode === fixture.currencyCode && price.isDefault !== false
                      ? product.priceVnd
                      : price.amount,
                }))
              : [
                  ...match.prices.map((price) => ({ id: price.id, amount: price.amount })),
                  { amount: product.priceVnd, currency_code: fixture.currencyCode },
                ]
            : undefined
        return {
          id: match.id,
          ...(prices ? { prices } : {}),
          ...(match.manageInventory ? {} : { manage_inventory: true }),
          ...(match.allowBackorder ? { allow_backorder: false } : {}),
        }
      },
    )

    // Medusa replaces the supplied variant relation; retain variants outside this fixture.
    for (const variant of existing.variants) {
      if (!operation.intent.variants.some((desired) => desired.sku === variant.sku)) {
        variants.push({ id: variant.id })
      }
    }

    const currentImages = existing.imageUrls
    const newImageUrls = uploads.filter((url) => !currentImages.includes(url))
    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: existing.id },
        update: {
          title: product.title,
          description: product.description,
          status: ProductStatus.PUBLISHED,
          collection_id: collectionId,
          category_ids: [...new Set([...existing.categoryIds, categoryId])],
          variants,
          ...(newImageUrls.length
            ? {
                thumbnail: existing.thumbnail ?? newImageUrls[0],
                images: [
                  ...currentImages.map((url) => ({ url })),
                  ...newImageUrls.map((url) => ({ url })),
                ],
              }
            : {}),
        },
      },
    })
  }

  // 5. Inventory levels, DAYMARK SKUs only, at the single stock location.
  const query = context.container.resolve(ContainerRegistrationKeys.QUERY)

  const itemRows = (
    await query.graph({
      entity: "inventory_item",
      fields: ["id", "sku"],
    })
  ).data
  const itemIdBySku = new Map<string, string>()
  for (const row of itemRows) {
    if (typeof row.sku === "string") {
      itemIdBySku.set(row.sku, String(row.id))
    }
  }

  const levelRows = (
    await query.graph({
      entity: "inventory_level",
      fields: ["id", "inventory_item_id", "location_id", "stocked_quantity"],
    })
  ).data
  const levelByItem = new Map<string, { id: string; stockedQuantity: number }>()
  for (const row of levelRows) {
    if (String(row.location_id) !== snapshot.stockLocation.id) {
      continue
    }
    levelByItem.set(String(row.inventory_item_id), {
      id: String(row.id),
      stockedQuantity: Number(row.stocked_quantity ?? 0),
    })
  }

  const toCreate: {
    inventory_item_id: string
    location_id: string
    stocked_quantity: number
  }[] = []

  for (const operation of plan.inventory) {
    const itemId = itemIdBySku.get(operation.intent.sku)
    if (!itemId) {
      summary.inventory.skip += 1
      summary.notes.push(
        `No inventory item exists for SKU "${operation.intent.sku}"; its level was not written`,
      )
      continue
    }
    const level = levelByItem.get(itemId)
    if (!level) {
      summary.inventory.insert += 1
      toCreate.push({
        inventory_item_id: itemId,
        location_id: snapshot.stockLocation.id,
        stocked_quantity: operation.intent.stockedQuantity,
      })
      continue
    }
    // Existing levels may include receipts, purchases or reservations. Never reset them.
    summary.inventory.skip += 1
  }

  if (toCreate.length) {
    await batchInventoryItemLevelsWorkflow(container).run({
      input: { create: toCreate, update: [] },
    })
  }

  return summary
}
