import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { extname, resolve } from "node:path"
import type { ExecArgs, IInventoryService, IProductModuleService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { validateLiveData } from "./hm-data-quality/validation"
import { claimLiveAuditOutput, safeDatabaseTarget, sourceProvenance } from "./hm-data-quality/provenance"
import { AUDIT_PERSISTENCE_FAILURE, liveEvidenceIO, persistLiveAuditEvidence } from "./hm-data-quality/evidence"
import type { CatalogProduct, LiveLevel, LiveProduct, LiveReservation, LiveVariant, Mapping } from "./hm-data-quality/validation"

const batchSize = 100

function chunks<T>(values: T[]) {
  const batches: T[][] = []
  for (let index = 0; index < values.length; index += batchSize) batches.push(values.slice(index, index + batchSize))
  return batches
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, "\"\"")}"`
}

async function readJsonLines<T>(path: string): Promise<{ rows: T[], sha256: string }> {
  const content = await readFile(path, "utf8")
  const rows = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim()).map(line => JSON.parse(line) as T)
  return { rows, sha256: createHash("sha256").update(content).digest("hex") }
}

export default async function checkHmDataQuality({ container }: ExecArgs) {
  const root = resolve(__dirname, "../../../..")
  const startedAt = new Date().toISOString()
  const dataDir = resolve(process.env.HM_AUDIT_DATA_DIR ?? resolve(root, "data/hm"))
  const mappingPath = resolve(process.env.HM_AUDIT_MAPPING_PATH ?? resolve(dataDir, "processed/medusa-mapping.jsonl"))
  const outputDir = resolve(process.env.HM_AUDIT_OUTPUT_DIR ?? resolve(root, "docs/report/evidence", `week5-hm-${Date.now()}`))
  await mkdir(outputDir, { recursive: true })
  const run = {
    started_at: startedAt,
    command: "medusa exec ./src/scripts/check-hm-data-quality.ts",
    npm_alias: "npm run check:hm-data-quality",
    working_directory: process.cwd(),
    database_target: safeDatabaseTarget(process.env.DATABASE_URL),
    inputs: { catalog: resolve(dataDir, "processed/catalog.jsonl"), mapping: mappingPath },
    ...await sourceProvenance(root, {
      "apps/backend/src/scripts/check-hm-data-quality": __filename,
      "apps/backend/src/scripts/hm-data-quality/validation": resolve(__dirname, `hm-data-quality/validation${extname(__filename)}`),
      "apps/backend/src/scripts/hm-data-quality/provenance": resolve(__dirname, `hm-data-quality/provenance${extname(__filename)}`),
      "apps/backend/src/scripts/hm-data-quality/evidence": resolve(__dirname, `hm-data-quality/evidence${extname(__filename)}`),
      "apps/backend/src/scripts/import-hm-catalog": resolve(__dirname, `import-hm-catalog${extname(__filename)}`),
    }),
  }
  await claimLiveAuditOutput(outputDir, run)
  const save = async (name: string, value: unknown) => writeFile(resolve(outputDir, name), JSON.stringify(value, null, 2) + "\n", { encoding: "utf8", flag: "wx" })
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    if (process.env.NODE_ENV === "production") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Use a development/test environment")
    const catalogFile = await readJsonLines<CatalogProduct>(resolve(dataDir, "processed/catalog.jsonl"))
    const mappingFile = await readJsonLines<Mapping>(mappingPath)
    const catalog = catalogFile.rows
    const mapping = mappingFile.rows
    if (!catalog.length || !mapping.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Catalog and mapping must be nonempty")
    for (const product of catalog) {
      if (!product.product_key || !Array.isArray(product.variants) || !product.variants.length ||
        product.variants.some(variant => typeof variant.article_id !== "string" || !variant.article_id)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid catalog schema; run the offline audit first")
      }
    }
    for (const row of mapping) {
      if ([row.article_id, row.product_id, row.variant_id, row.product_code].some(value => typeof value !== "string" || !value)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Mapping identifiers must be nonempty strings; run the offline audit first")
      }
    }
    const productService = container.resolve<IProductModuleService>(Modules.PRODUCT)
    const inventory = container.resolve<IInventoryService>(Modules.INVENTORY)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Scan identity fields of the Product module only. This also discovers
    // H&M rows missing from the supplied mapping, rather than trusting its IDs.
    const hmProductIds = new Set(mapping.map(row => row.product_id))
    let scannedProducts = 0
    let productTotal = 0
    do {
      const [rows, count] = await productService.listAndCountProducts({}, {
        select: ["id", "handle", "metadata"], skip: scannedProducts, take: batchSize, order: { id: "ASC" },
      })
      productTotal = count
      for (const product of rows) {
        if (product.handle?.startsWith("hm-") || product.metadata?.source === "hm_historical_catalog") hmProductIds.add(product.id)
      }
      scannedProducts += rows.length
      if (!rows.length) break
    } while (scannedProducts < productTotal)
    const variantIds = new Set(mapping.map(row => row.variant_id))
    let scannedVariants = 0
    let variantTotal = 0
    do {
      const [rows, count] = await productService.listAndCountProductVariants({}, {
        select: ["id", "product_id", "sku", "metadata"], skip: scannedVariants, take: batchSize, order: { id: "ASC" },
      })
      variantTotal = count
      for (const variant of rows) {
        if (variant.sku?.startsWith("HM-") || (variant.product_id && hmProductIds.has(variant.product_id))) {
          variantIds.add(variant.id)
          if (variant.product_id) hmProductIds.add(variant.product_id)
        }
      }
      scannedVariants += rows.length
      if (!rows.length) break
    } while (scannedVariants < variantTotal)

    const products: LiveProduct[] = []
    for (const ids of chunks([...hmProductIds])) {
      const { data } = await query.graph({ entity: "product",
        fields: ["id", "handle", "title", "status", "metadata", "shipping_profile.id", "sales_channels.id"], filters: { id: ids },
        pagination: { take: batchSize, order: { id: "ASC" } },
      })
      products.push(...data as LiveProduct[])
    }
    const variants: LiveVariant[] = []
    for (const ids of chunks([...variantIds])) {
      const { data } = await query.graph({ entity: "product_variant",
        fields: ["id", "product_id", "sku", "title", "metadata", "manage_inventory", "allow_backorder",
          "prices.id", "prices.amount", "prices.currency_code", "prices.price_list_id", "prices.min_quantity", "prices.max_quantity",
          "prices.rules_count", "prices.price_rules.id", "prices.price_rules.attribute",
          "inventory_items.inventory_item_id", "inventory_items.required_quantity", "inventory_items.inventory.id", "inventory_items.inventory.sku"],
        filters: { id: ids }, pagination: { take: batchSize, order: { id: "ASC" } },
      })
      variants.push(...data as LiveVariant[])
    }
    const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id", "name", "is_disabled"], filters: { name: "Online Store" } })
    const { data: expectedLocations } = await query.graph({ entity: "stock_location", fields: ["id", "name"], filters: { name: "Vietnam Warehouse" } })
    const inventoryIds = [...new Set(variants.flatMap(variant => (variant.inventory_items ?? []).map(link => link.inventory_item_id)))]
    const levels: LiveLevel[] = []
    const reservations: LiveReservation[] = []
    for (const ids of chunks(inventoryIds)) {
      let skip = 0
      let total = 0
      do {
        const [rows, count] = await inventory.listAndCountInventoryLevels({ inventory_item_id: ids }, { take: batchSize, skip, order: { id: "ASC" } })
        levels.push(...rows.map(row => ({ id: row.id, inventory_item_id: row.inventory_item_id,
          location_id: row.location_id, stocked_quantity: row.stocked_quantity,
          reserved_quantity: row.reserved_quantity, incoming_quantity: row.incoming_quantity })))
        total = count
        skip += rows.length
        if (!rows.length) break
      } while (skip < total)
      skip = 0
      do {
        const [rows, count] = await inventory.listAndCountReservationItems({ inventory_item_id: ids }, { take: batchSize, skip, order: { id: "ASC" } })
        reservations.push(...rows.map(row => ({ id: row.id, inventory_item_id: row.inventory_item_id,
          location_id: row.location_id, quantity: row.quantity })))
        total = count
        skip += rows.length
        if (!rows.length) break
      } while (skip < total)
    }
    const locations: { id: string, sales_channels?: { id: string }[] }[] = []
    for (const ids of chunks([...new Set(levels.map(level => level.location_id))])) {
      const { data } = await query.graph({ entity: "stock_location", fields: ["id", "sales_channels.id"], filters: { id: ids }, pagination: { take: batchSize } })
      locations.push(...data.map(location => ({ id: location.id,
        sales_channels: (location.sales_channels ?? []).flatMap(channel => channel?.id ? [{ id: channel.id }] : []),
      })))
    }
    const { findings, mappingChecks, checked_inventory_items } = validateLiveData({
      catalog, mapping, products, variants, levels, reservations, locations,
      salesChannelId: channels.length === 1 && !channels[0].is_disabled ? channels[0].id : null,
      expectedLocationId: expectedLocations.length === 1 ? expectedLocations[0].id : null,
    })
    if (channels.length !== 1 || channels[0]?.is_disabled) findings.push({ code: "sales_channel_precondition", identifier: "Online Store", expected: "one enabled channel", actual: channels.length, severity: "error" })
    if (expectedLocations.length !== 1) findings.push({ code: "warehouse_precondition", identifier: "Vietnam Warehouse", expected: 1, actual: expectedLocations.length, severity: "error" })
    const findingCounts: Record<string, number> = {}
    for (const finding of findings) findingCounts[finding.code] = (findingCounts[finding.code] ?? 0) + 1
    const status = findings.some(finding => finding.severity === "error") ? "FAIL" : "PASS"
    const report = {
      schema_version: 1, status, captured_at: startedAt, capture_finished_at: new Date().toISOString(),
      run,
      runtime: { node: process.version, platform: process.platform, arch: process.arch, node_env: process.env.NODE_ENV ?? "development" },
      source: "Medusa Product/Inventory module services and query.graph; read-only", database_mutations: 0,
      consistency: "Paginated sequential reads across modules, not an atomic snapshot. Run without unrelated H&M writes.",
      file_hashes: { catalog_sha256: catalogFile.sha256, mapping_sha256: mappingFile.sha256 },
      counts: { catalog_products: catalog.length, catalog_articles: catalog.reduce((sum, product) => sum + product.variants.length, 0),
        mapping_rows: mapping.length, database_products_scanned: scannedProducts, database_variants_scanned: scannedVariants,
        mapped_product_ids_expected: new Set(mapping.map(row => row.product_id)).size,
        mapped_variant_ids_expected: new Set(mapping.map(row => row.variant_id)).size,
        mapped_product_ids_missing: new Set(mapping.filter(row => !products.some(product => product.id === row.product_id)).map(row => row.product_id)).size,
        mapped_variant_ids_missing: new Set(mapping.filter(row => !variants.some(variant => variant.id === row.variant_id)).map(row => row.variant_id)).size,
        products_read: products.length, variants_read: variants.length, inventory_items_checked: checked_inventory_items,
        inventory_levels_read: levels.length, reservations_read: reservations.length, mapping_rows_passed: mappingChecks.filter(row => row.status === "PASS").length },
      finding_counts: findingCounts, findings,
      limits: ["Live persisted base VND prices and links checked; Store API calculated pricing is not asserted for every context.",
        "No customer/transaction datasets read, no reimport/reset, no requirement that current stock remains the initial 20.",
        "Concurrency is a separate test; this audit alone does not prove no overselling."],
    }
    await persistLiveAuditEvidence(liveEvidenceIO(outputDir), { report,
      mappingCsv: ["article_id,product_id,variant_id,sku,status",
        ...mappingChecks.map(row => [row.article_id, row.product_id, row.variant_id, row.sku, row.status].map(csvCell).join(","))].join("\n") + "\n",
      inventory: { captured_at: startedAt, capture_finished_at: report.capture_finished_at, levels, reservations },
    })
    logger.info(`H&M live audit ${status}: ${products.length} products, ${variants.length} variants; ${findings.length} findings. Evidence: ${outputDir}`)
    if (status !== "PASS") throw new MedusaError(MedusaError.Types.INVALID_DATA, "H&M live audit found data quality violations; see live-audit.json")
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure"
    if (message !== "H&M live audit found data quality violations; see live-audit.json" && message !== AUDIT_PERSISTENCE_FAILURE) {
      await save("live-audit-incomplete.json", { status: "INCOMPLETE", captured_at: startedAt,
        run,
        capture_finished_at: new Date().toISOString(), error_type: error instanceof Error ? error.name : "Error",
        message: "Live audit could not complete. Verify runtime connectivity, input schema and installed Medusa query fields; no PASS is asserted." })
    }
    throw new MedusaError(MedusaError.Types.INVALID_DATA, message === "H&M live audit found data quality violations; see live-audit.json" ? message : `H&M live audit incomplete. Evidence: ${outputDir}`)
  }
}
