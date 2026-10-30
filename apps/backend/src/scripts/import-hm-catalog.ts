import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules, ProductStatus } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow, createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { createReadStream, existsSync, mkdirSync, createWriteStream } from "node:fs"
import { createInterface } from "node:readline"
import { resolve } from "node:path"

// Demo prices are synthetic whole VND, unrelated to historical H&M transaction prices.

type Article = { article_id: string; color: string }
type PreparedProduct = {
  product_key: string
  source_hash: string
  product_code: string
  title: string
  description: string
  product_group: string
  product_type: string
  department: string
  section: string
  index_group: string
  garment_group: string
  variants: Article[]
}

function demoPrice(code: string) {
  const hash = [...code].reduce((value, char) => value * 31 + char.charCodeAt(0), 0)
  return 199000 + (Math.abs(hash) % 7) * 50000
}

export default async function importHmCatalog({ container }: ExecArgs) {
  const inputPath = resolve(process.cwd(), "../../data/hm/processed/catalog.jsonl")
  const outputDir = resolve(process.cwd(), "../../data/hm/processed")
  if (!existsSync(inputPath)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Missing ${inputPath}. Run python scripts/hm/prepare.py from repo root first.`)
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productService = container.resolve(Modules.PRODUCT)
  const { data: channels } = await query.graph({
    entity: "sales_channel", fields: ["id"], filters: { name: "Online Store" },
  })
  const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const { data: locations } = await query.graph({
    entity: "stock_location", fields: ["id"], filters: { name: "Vietnam Warehouse" },
  })
  if (!channels[0] || !profiles[0] || !locations[0]) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Run the commerce seed first; sales channel, shipping profile or stock location is missing")
  }

  mkdirSync(outputDir, { recursive: true })
  const mapping = createWriteStream(resolve(outputDir, "medusa-mapping.jsonl"), { flags: "w" })
  let created = 0
  let existing = 0
  let variantsMapped = 0
  try {
    const lines = createInterface({ input: createReadStream(inputPath), crlfDelay: Infinity })
    for await (const line of lines) {
      if (!line.trim()) continue
      const item = JSON.parse(line) as PreparedProduct
      const handle = `hm-${item.product_key}`
      const found = await productService.listProducts({ handle }, { take: 1, relations: ["variants"] })
      let product = found[0]
      if (!product) {
        const price = demoPrice(item.product_code)
        const { result } = await createProductsWorkflow(container).run({
          input: { products: [{
            title: item.title,
            handle,
            description: item.description || undefined,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: profiles[0].id,
            metadata: {
              source: "hm_historical_catalog",
              source_hash: item.source_hash,
              product_code: item.product_code,
              product_group: item.product_group,
              product_type: item.product_type,
              department: item.department,
              section: item.section,
              index_group: item.index_group,
              garment_group: item.garment_group,
              synthetic_price: true,
              synthetic_inventory: true,
            },
            options: [
              { title: "Color", values: [...new Set(item.variants.map((variant) => variant.color))] },
              { title: "Article", values: item.variants.map((variant) => variant.article_id) },
            ],
            variants: item.variants.map((variant) => ({
              title: `${variant.color} ${variant.article_id}`,
              sku: `HM-${variant.article_id}`,
              options: { Color: variant.color, Article: variant.article_id },
              metadata: { source_article_id: variant.article_id },
              prices: [{ amount: price, currency_code: "vnd" }],
              manage_inventory: true,
            })),
            sales_channels: [{ id: channels[0].id }],
          }] },
        })
        product = result[0]
        created++
      } else {
        if (product.metadata?.source !== "hm_historical_catalog" ||
          product.metadata?.source_hash !== item.source_hash) {
          throw new MedusaError(MedusaError.Types.INVALID_DATA,
            `Existing ${handle} has changed source data or different provenance; reconcile before re-import`)
        }
        existing++
      }

      const resolved = await productService.listProducts({ handle }, { take: 1, relations: ["variants"] })
      const bySku = new Map(resolved[0]?.variants?.map((variant) => [variant.sku, variant]) || [])
      for (const variant of item.variants) {
        const medusaVariant = bySku.get(`HM-${variant.article_id}`)
        if (!medusaVariant) {
          throw new MedusaError(MedusaError.Types.INVALID_DATA, `Existing product ${handle} lacks article ${variant.article_id}; refusing incomplete mapping`)
        }
        mapping.write(JSON.stringify({
          source: "hm", article_id: variant.article_id, product_code: item.product_code,
          product_id: product.id, variant_id: medusaVariant.id,
        }) + "\n")
        variantsMapped++
      }

      const skus = item.variants.map((variant) => `HM-${variant.article_id}`)
      const { data: inventoryItems } = await query.graph({
        entity: "inventory_item", fields: ["id", "sku"], filters: { sku: skus },
      })
      if (inventoryItems.length !== skus.length) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Inventory items missing for ${handle}`)
      }
      const { data: inventoryLevels } = await query.graph({
        entity: "inventory_level", fields: ["inventory_item_id", "location_id"],
        filters: { inventory_item_id: inventoryItems.map((inventoryItem) => inventoryItem.id) },
      })
      const stocked = new Set(inventoryLevels
        .filter((level) => level.location_id === locations[0].id)
        .map((level) => level.inventory_item_id))
      const missing = inventoryItems.filter((inventoryItem) => !stocked.has(inventoryItem.id))
      if (missing.length) {
        await createInventoryLevelsWorkflow(container).run({
          input: { inventory_levels: missing.map((inventoryItem) => ({
            inventory_item_id: inventoryItem.id,
            location_id: locations[0].id,
            stocked_quantity: 20,
          })) },
        })
      }
      if ((created + existing) % 100 === 0) logger.info(`H&M import: ${created} created, ${existing} existing`)
    }
  } finally {
    await new Promise<void>((done) => mapping.end(done))
  }
  logger.info(`H&M catalog import complete: ${created} created, ${existing} existing, ${variantsMapped} variants mapped`)
}
