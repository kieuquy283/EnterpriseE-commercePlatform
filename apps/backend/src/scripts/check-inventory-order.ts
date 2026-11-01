import assert from "node:assert/strict"
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import type { ExecArgs, IInventoryService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import Medusa from "@medusajs/js-sdk"
import { captureSnapshot } from "./inventory-order/snapshot"
import type { Fixture } from "./inventory-order/snapshot"
import { validateInventoryOrder } from "./inventory-order/validation"

// Each new run creates a real local order and leaves its reservation for review.
export default async function checkInventoryOrder({ container, args }: ExecArgs) {
  assert.notEqual(process.env.NODE_ENV, "production", "Use a development/test environment")
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "")
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(databaseUrl.hostname), "Only a local database is allowed")
  if (process.env.REDIS_URL) {
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.REDIS_URL).hostname), "Only local Redis is allowed")
  }
  const runId = args[0] ?? `ts-${new Date().toISOString().replace(/[-:.]/g, "")}`
  const preflightOnly = args[1] === "preflight"
  assert.match(runId, /^[a-zA-Z0-9_-]{1,100}$/)
  assert.ok(args.length <= 2 && (!args[1] || preflightOnly), "Arguments: [new-run-id] [preflight]")
  const root = resolve(__dirname, "../../../..")
  await mkdir(resolve(root, "docs/report/evidence"), { recursive: true })
  const evidenceDir = resolve(root, "docs/report/evidence", `inventory-order-${runId}`)
  // Refuse reuse, including partial runs, so an accidental retry cannot create another order.
  await mkdir(evidenceDir, { recursive: false })
  const baseUrl = "http://127.0.0.1:9000"
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventory = container.resolve<IInventoryService>(Modules.INVENTORY)
  let publishableKey = ""
  let manifest: Record<string, unknown> = {
    run_id: runId, state: "starting", started_at: new Date().toISOString(),
    environment: "local", runner: "typescript-medusa-exec", base_url: baseUrl,
  }
  const trace: { operation: string, started_at: string, completed_at?: string, outcome?: string }[] = []
  const save = async (name: string, value: unknown) => {
    await writeFile(resolve(evidenceDir, name), JSON.stringify(value, null, 2) + "\n", "utf8")
  }
  const checkpoint = async (state: string, updates: Record<string, unknown> = {}) => {
    manifest = { ...manifest, ...updates, state, updated_at: new Date().toISOString() }
    await save("manifest.json", manifest)
  }
  const call = async <T>(operation: string, action: () => Promise<T>): Promise<T> => {
    const entry: typeof trace[number] = { operation, started_at: new Date().toISOString() }
    trace.push(entry)
    try {
      const value = await action()
      entry.outcome = "success"
      return value
    } catch (error) {
      entry.outcome = "failed"
      throw error
    } finally {
      entry.completed_at = new Date().toISOString()
      await save("api-trace.json", trace)
    }
  }

  try {
    await checkpoint("preflight_started")
    const versions: Record<string, string> = {}
    for (const name of ["medusa", "js-sdk", "inventory", "order", "payment", "core-flows"]) {
      versions[name] = JSON.parse(await readFile(resolve(root, "node_modules/@medusajs", name, "package.json"), "utf8")).version
    }
    await save("environment.json", {
      run_id: runId, environment: process.env.NODE_ENV ?? "development", versions,
      node: process.version, runner: "medusa exec ./src/scripts/check-inventory-order.ts",
      base_url: baseUrl, database: { host: databaseUrl.hostname, port: databaseUrl.port, name: databaseUrl.pathname.slice(1) },
      snapshot_reader: "Medusa module services and query.graph, no raw SQL",
      snapshot_consistency: "Sequential reads; not an atomic cross-module transaction. No concurrent inventory work during this run.",
      timestamp_source: "Node.js host clock; each snapshot records read start/end",
    })
    const health = await call("GET /health", () => fetch(baseUrl + "/health", { signal: AbortSignal.timeout(10000) }))
    assert.equal(health.status, 200, "Start the backend with npm run backend:dev")
    const { data: regions } = await query.graph({
      entity: "region", fields: ["id", "currency_code"], filters: { name: "Vietnam" },
    })
    const { data: channels } = await query.graph({
      entity: "sales_channel",
      fields: ["id", "is_disabled", "publishable_api_keys.id", "publishable_api_keys.type", "publishable_api_keys.token", "publishable_api_keys.revoked_at"],
      filters: { name: "Online Store" },
    })
    assert.equal(regions.length, 1, "Prepare the existing Vietnam region")
    assert.equal(regions[0].currency_code, "vnd")
    assert.equal(channels.length, 1, "Prepare the existing Online Store channel")
    assert.equal(channels[0].is_disabled, false)
    const key = channels[0].publishable_api_keys?.find(item => item?.type === "publishable" && !item.revoked_at)
    assert.ok(key?.token, "An active publishable API key linked to Online Store is required")
    publishableKey = key.token
    const sdk = new Medusa({ baseUrl, publishableKey, debug: false })
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "manage_inventory", "allow_backorder", "product.id", "product.handle", "product.status", "product.sales_channels.id", "inventory_items.inventory_item_id", "inventory_items.required_quantity", "inventory_items.inventory.id"],
      filters: { sku: "TEE-ESSENTIAL-BLK" },
    })
    assert.equal(variants.length, 1, "Expected one existing TEE-ESSENTIAL-BLK variant; do not reseed/reset inventory")
    const variant = variants[0]
    assert.equal(variant.manage_inventory, true)
    assert.equal(variant.allow_backorder, false)
    assert.equal(variant.product?.status, "published")
    assert.ok(variant.product?.sales_channels?.some(channel => channel?.id === channels[0].id))
    assert.equal(variant.inventory_items?.length, 1, "Use a simple single-inventory-item fixture")
    const link = variant.inventory_items![0]!
    assert.ok(link.inventory?.id)
    assert.equal(Number(link.required_quantity), 1)
    const levels = await inventory.listInventoryLevels({ inventory_item_id: link.inventory_item_id }, { take: null })
    assert.equal(levels.length, 1, "Use one inventory level/location")
    const level = levels[0]
    assert.ok(level.stocked_quantity - level.reserved_quantity >= 2, "Fixture needs two available units; do not reset existing stock")
    const { data: locations } = await query.graph({
      entity: "stock_location", fields: ["id", "name", "sales_channels.id"], filters: { id: level.location_id },
    })
    assert.equal(locations.length, 1)
    assert.ok(locations[0].sales_channels?.some(channel => channel?.id === channels[0].id))
    const products = await call("GET /store/products (fixture price)", () => sdk.store.product.list({
      handle: variant.product!.handle, region_id: regions[0].id, fields: "+variants.calculated_price",
    }))
    const priced = products.products.flatMap(product => product.variants ?? []).find(item => item.id === variant.id)
    assert.ok(priced?.calculated_price)
    assert.equal(priced.calculated_price.currency_code, "vnd")
    assert.ok(Number.isFinite(Number(priced.calculated_price.calculated_amount)), "The fixture must have a calculated price")
    const providers = await call("GET /store/payment-providers", () => sdk.store.payment.listPaymentProviders({ region_id: regions[0].id }))
    assert.ok(providers.payment_providers.some(provider => provider.id === "pp_system_default"))
    const fixture: Fixture = {
      run_id: runId, product_id: variant.product!.id, handle: variant.product!.handle,
      variant_id: variant.id, sku: variant.sku!, manage_inventory: variant.manage_inventory,
      allow_backorder: variant.allow_backorder, required_quantity: Number(link.required_quantity),
      inventory_item_id: link.inventory_item_id, inventory_level_id: level.id, location_id: level.location_id,
      region_id: regions[0].id, sales_channel_id: channels[0].id, currency_code: "vnd", quantity: 2,
      calculated_unit_price: Number(priced.calculated_price.calculated_amount), payment_provider_id: "pp_system_default",
    }
    await save("fixture.json", { ...fixture, warehouse_name: locations[0].name, preparation: "Reused existing data; no seed/reset" })
    await save("preflight-inventory.json", {
      run_id: runId, captured_at: new Date().toISOString(), fixture,
      product_status: variant.product!.status, product_in_channel: true, location_in_channel: true,
      inventory_link_count: variant.inventory_items!.length, inventory_level_count: levels.length,
      levels: levels.map(row => ({ id: row.id, inventory_item_id: row.inventory_item_id, location_id: row.location_id,
        stocked_quantity: row.stocked_quantity, reserved_quantity: row.reserved_quantity, incoming_quantity: row.incoming_quantity,
        available_quantity: row.stocked_quantity - row.reserved_quantity })),
    })
    await checkpoint("preflight_complete", { fixture })
    if (preflightOnly) {
      logger.info(`Preflight passed: run=${runId}, SKU=${fixture.sku}, available=${level.stocked_quantity - level.reserved_quantity}. No cart/order created.`)
      return
    }
    await mkdir(resolve(evidenceDir, "source/inventory-order"), { recursive: true })
    for (const file of ["check-inventory-order.ts", "inventory-order/snapshot.ts", "inventory-order/validation.ts"]) {
      await copyFile(resolve(__dirname, file), resolve(evidenceDir, "source", file))
    }
    const t0 = await captureSnapshot(container, runId, "T0", fixture)
    await save("t0.json", t0)
    await checkpoint("T0_captured")
    const created = await call("POST /store/carts", () => sdk.store.cart.create({
      region_id: fixture.region_id, sales_channel_id: fixture.sales_channel_id,
      metadata: { sample_suite: "week3_inventory_order", sample_run: runId, sample_case: "quantity_2_typescript" },
    }))
    const cartId = created.cart.id
    await checkpoint("cart_created", { cart_id: cartId })
    await call("POST /store/carts/:id/line-items", () => sdk.store.cart.createLineItem(cartId, { variant_id: fixture.variant_id, quantity: fixture.quantity }))
    const address = { first_name: "Inventory", last_name: "Audit", address_1: "1 Test Street", city: "Ho Chi Minh City", country_code: "vn", postal_code: "700000" }
    await call("POST /store/carts/:id (test checkout details)", () => sdk.store.cart.update(cartId, {
      email: `inventory.${runId}@example.test`, shipping_address: address, billing_address: address,
    }))
    const options = await call("GET /store/shipping-options", () => sdk.store.fulfillment.listCartOptions({ cart_id: cartId }))
    const shipping = options.shipping_options.find(option => option.name === "Standard delivery") ?? options.shipping_options[0]
    assert.ok(shipping, "No shipping option is available for this fixture")
    await call("POST /store/carts/:id/shipping-methods", () => sdk.store.cart.addShippingMethod(cartId, { option_id: shipping.id }))
    const refreshed = await call("GET /store/carts/:id", () => sdk.store.cart.retrieve(cartId))
    const paymentResult = await call("POST /store/payment-collections and payment-sessions (SDK)", () => sdk.store.payment.initiatePaymentSession(refreshed.cart, { provider_id: fixture.payment_provider_id }))
    await checkpoint("checkout_prepared", {
      shipping_option_id: shipping.id, shipping_option_name: shipping.name,
      payment_collection_id: paymentResult.payment_collection.id,
      payment_session_ids: paymentResult.payment_collection.payment_sessions?.map(session => session.id) ?? [],
    })
    const t1 = await captureSnapshot(container, runId, "T1", fixture, cartId)
    await save("t1.json", t1)
    assert.deepEqual(t1.levels, t0.levels, "Inventory changed during cart preparation; stop before checkout")
    assert.deepEqual(t1.reservations, t0.reservations, "Reservations changed during cart preparation; stop before checkout")
    assert.equal(t1.cart_items.length, 1)
    assert.equal(t1.cart_items[0].quantity, fixture.quantity)
    assert.ok(!t1.cart?.completed_at)
    await checkpoint("T1_captured")
    const completion = await call("POST /store/carts/:id/complete", () => sdk.store.cart.complete(cartId))
    assert.equal(completion.type, "order", "Checkout did not return an Order")
    if (completion.type !== "order") throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Checkout returned a cart")
    const orderId = completion.order.id
    await checkpoint("order_created", { order_id: orderId, completion_received_at: new Date().toISOString() })
    await save("completion-receipt.json", { run_id: runId, type: completion.type, order_id: orderId, received_at: new Date().toISOString() })
    const t2 = await captureSnapshot(container, runId, "T2", fixture, cartId, orderId)
    await save("t2.json", t2)
    const retrieved = await call("GET /store/orders/:id (readback)", () => sdk.store.order.retrieve(orderId))
    // The 2.21.2 Store response includes version, but StoreOrder omits it.
    const storeOrder = retrieved.order as typeof retrieved.order & { version: number }
    assert.ok(Number.isInteger(storeOrder.version), "Readback must expose the current Order version")
    assert.ok(storeOrder.items)
    const readback = {
      id: storeOrder.id, status: storeOrder.status, version: storeOrder.version,
      currency_code: storeOrder.currency_code,
      items: storeOrder.items.map(item => ({ id: item.id, variant_id: item.variant_id, quantity: item.quantity, unit_price: item.unit_price })),
    }
    await save("order-api-readback.json", readback)
    const validation = validateInventoryOrder(t0, t1, t2, fixture, readback)
    await save("validation.json", validation)
    const csv = ["stage,captured_at,capture_finished_at,inventory_item_id,location_id,stocked_quantity,reserved_quantity,incoming_quantity,available_quantity",
      ...[t0, t1, t2].map(data => {
        const row = data.levels.find(item => item.id === fixture.inventory_level_id)!
        return [data.stage, data.captured_at, data.capture_finished_at, row.inventory_item_id, row.location_id, row.stocked_quantity, row.reserved_quantity, row.incoming_quantity, row.available_quantity].join(",")
      }),
    ].join("\n") + "\n"
    await writeFile(resolve(evidenceDir, "inventory-timeline.csv"), csv, "utf8")
    await checkpoint(validation.all_passed ? "completed" : "validation_failed", {
      order_version: t2.order?.version, order_item_ids: t2.order_items.map(item => item.order_item_id),
      order_line_item_ids: t2.order_items.map(item => item.order_line_item_id), reservation_ids: validation.new_reservation_ids,
      payment_ids: t2.payments.map(payment => payment.id), validation_passed: validation.all_passed, completed_at: new Date().toISOString(),
    })
    logger.info(JSON.stringify({ run_id: runId, state: manifest.state, cart_id: cartId, order_id: orderId,
      checks_passed: validation.passed, checks_total: validation.total, evidence_directory: evidenceDir }))
    assert.ok(validation.all_passed, "Inspect validation.json: a consistency check failed")
  } catch (error) {
    let message = error instanceof Error ? error.message : String(error)
    for (const secret of [publishableKey, process.env.DATABASE_URL, process.env.REDIS_URL, process.env.JWT_SECRET, process.env.COOKIE_SECRET]) {
      if (secret) message = message.replaceAll(secret, "[REDACTED]")
    }
    message = message.replace(/(?:postgres(?:ql)?|rediss?):\/\/[^\s]+/g, "[REDACTED_URL]").replace(/pk_[A-Za-z0-9_]+/g, "[REDACTED_KEY]")
    await save("failure.json", { run_id: runId, state: manifest.state, occurred_at: new Date().toISOString(), message: message.slice(0, 1200) })
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Inventory audit ${runId} stopped at ${manifest.state}: ${message.slice(0, 600)}. Inspect ${evidenceDir}`)
  }
}
