import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import type { ExecArgs, IInventoryService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import Medusa from "@medusajs/js-sdk"
import { captureSnapshot } from "./inventory-order/snapshot"
import type { Fixture, Snapshot } from "./inventory-order/snapshot"
import {
  validateFailedCheckout,
  validateReservationSuccess,
  validateRetry,
} from "./week4-inventory/validation"

type HttpResult = { http_status: number, body: Record<string, any> }

// Executes real local checkout workflows. Successful orders/reservations remain for review.
export default async function checkWeek4Inventory({ container, args }: ExecArgs) {
  assert.notEqual(process.env.NODE_ENV, "production", "Local development/test only")
  assert.equal(process.env.WEEK4_INVENTORY_TESTS, "true", "Enable the local test provider")
  for (const name of ["DATABASE_URL", "REDIS_URL"]) {
    const value = process.env[name]
    if (!value && name === "REDIS_URL") continue
    assert.ok(value, `Configure ${name}`)
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(value).hostname), "Only local infrastructure is allowed")
  }
  const runId = args[0] ?? `week4-${new Date().toISOString().replace(/[-:.]/g, "")}`
  assert.match(runId, /^[A-Za-z0-9_-]{1,100}$/)
  const preflightOnly = args[1] === "preflight"
  assert.ok(args.length <= 2 && (!args[1] || preflightOnly), "Arguments: UNIQUE_RUN_ID [preflight]")
  const root = resolve(__dirname, "../../../..")
  const evidenceDir = resolve(root, "docs/report/evidence", `inventory-week4-${runId}`)
  await mkdir(dirname(evidenceDir), { recursive: true })
  await mkdir(evidenceDir, { recursive: false })
  const baseUrl = "http://127.0.0.1:9000"
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventory = container.resolve<IInventoryService>(Modules.INVENTORY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  let publishableKey = ""
  let currentCase = "preflight"
  let participant = ""
  let activeCartId: string | undefined
  let activeFixture: Fixture | undefined
  let fixture: Fixture | undefined
  let lastHttp: HttpResult | undefined
  const trace: Record<string, unknown>[] = []
  const timeline: Record<string, unknown>[] = []
  const results: Record<string, unknown>[] = []
  let manifest: Record<string, unknown> = { run_id: runId, state: "starting", started_at: new Date().toISOString() }
  const redact = (message: string) => {
    let safe = message
    for (const secret of [publishableKey, process.env.DATABASE_URL, process.env.REDIS_URL, process.env.JWT_SECRET, process.env.COOKIE_SECRET]) {
      if (secret) safe = safe.replaceAll(secret, "[REDACTED]")
    }
    return safe.replace(/pk_[A-Za-z0-9_]+/g, "[REDACTED_KEY]")
      .replace(/(?:postgres(?:ql)?|rediss?):\/\/[^\s]+/g, "[REDACTED_URL]")
  }
  const hidden = new Set(["email", "phone", "shipping_address", "billing_address", "customer", "password", "token", "authorization", "cookie", "access_token", "refresh_token"])
  const sanitize = (value: any): any => {
    if (typeof value === "string") return redact(value)
    if (Array.isArray(value)) return value.map(sanitize)
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).filter(([key]) => !hidden.has(key.toLowerCase())).map(([key, item]) => [key, sanitize(item)]))
    }
    return value
  }
  const save = async (path: string, value: unknown) => {
    const target = resolve(evidenceDir, path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, JSON.stringify(sanitize(value), null, 2) + "\n", "utf8")
  }
  const checkpoint = async (state: string, values: Record<string, unknown> = {}) => {
    manifest = { ...manifest, ...values, state, updated_at: new Date().toISOString() }
    await save("manifest.json", manifest)
  }
  const nativeFetch = globalThis.fetch
  // Instrument the SDK transport to retain HTTP error bodies before FetchError normalization.
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    assert.equal(url.origin, baseUrl, "The test client may only contact the local backend")
    const startedAt = new Date().toISOString()
    const sequence = trace.length + 1
    const entry: Record<string, unknown> = {
      sequence, case_id: currentCase, participant, method: init?.method ?? "GET",
      url: url.origin + url.pathname + url.search, started_at: startedAt,
    }
    trace.push(entry)
    try {
      const response = await nativeFetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(60000) })
      const body = await response.clone().json().catch(() => ({}))
      lastHttp = { http_status: response.status, body: sanitize(body) }
      Object.assign(entry, { finished_at: new Date().toISOString(), http_status: response.status,
        response_headers: { content_type: response.headers.get("content-type"), date: response.headers.get("date") } })
      const path = `${currentCase}/http/${String(sequence).padStart(3, "0")}-response.json`
      entry.response_file = path
      await save(path, { ...entry, request_body: typeof init?.body === "string" ? JSON.parse(init.body) : null, response_body: body })
      return response
    } catch (error) {
      Object.assign(entry, { finished_at: new Date().toISOString(), transport_error: redact(error instanceof Error ? error.message : String(error)) })
      throw error
    } finally {
      await save("api-trace.json", trace)
    }
  }
  const snap = async (caseId: string, name: string, stage: "T0" | "T1" | "T2", selected: Fixture, cartId?: string, orderId?: string) => {
    activeFixture = selected
    const snapshot = await captureSnapshot(container, runId, stage, selected, cartId, orderId)
    await save(`${caseId}/${name}.json`, snapshot)
    const level = snapshot.levels.find(row => row.id === selected.inventory_level_id)!
    timeline.push({ case_id: caseId, snapshot: name, captured_at: snapshot.captured_at, capture_finished_at: snapshot.capture_finished_at,
      inventory_item_id: level.inventory_item_id, location_id: level.location_id, stocked_quantity: level.stocked_quantity,
      reserved_quantity: level.reserved_quantity, incoming_quantity: level.incoming_quantity, available_quantity: level.available_quantity,
      cart_id: cartId ?? "", order_id: orderId ?? "" })
    await save("inventory-timeline.json", timeline)
    const columns = Object.keys(timeline[0])
    await writeFile(resolve(evidenceDir, "inventory-timeline.csv"), [columns.join(","), ...timeline.map(row => columns.map(key => row[key]).join(","))].join("\n") + "\n", "utf8")
    return snapshot
  }
  const record = async (id: string, validation: ReturnType<typeof validateFailedCheckout>, extra: Record<string, unknown> = {}) => {
    await save(`${id}/validation.json`, validation)
    results.push({ case_id: id, status: validation.all_passed ? "Pass" : "Fail", passed: validation.passed, total: validation.total, ...extra })
    await save("suite-summary.json", { run_id: runId, cases: results })
    assert.ok(validation.all_passed, `${id} failed: ${validation.checks.filter(row => !row.passed).map(row => row.name).join(", ")}`)
  }

  try {
    await checkpoint("preflight")
    const health = await fetch(baseUrl + "/health")
    assert.equal(health.status, 200, "Start the local backend with the test provider enabled")
    const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code", "payment_providers.id"], filters: { name: "Vietnam" } })
    const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id", "is_disabled", "publishable_api_keys.type", "publishable_api_keys.token", "publishable_api_keys.revoked_at"], filters: { name: "Online Store" } })
    assert.equal(regions.length, 1)
    assert.equal(channels.length, 1)
    assert.equal(channels[0].is_disabled, false)
    const key = channels[0].publishable_api_keys?.find(row => row?.type === "publishable" && !row.revoked_at)
    assert.ok(key?.token, "An active publishable key is required")
    publishableKey = key.token
    const sdk = new Medusa({ baseUrl, publishableKey, debug: false })
    const { data: variants } = await query.graph({ entity: "product_variant", fields: ["id", "sku", "manage_inventory", "allow_backorder", "product.id", "product.handle", "product.status", "product.sales_channels.id", "inventory_items.inventory_item_id", "inventory_items.required_quantity"], filters: { sku: "W4-INVENTORY-TEST" } })
    assert.equal(variants.length, 1, "Prepare the existing week 4 fixture; no inventory reset is performed")
    const variant = variants[0]
    assert.equal(variant.manage_inventory, true)
    assert.equal(variant.allow_backorder, false)
    assert.equal(variant.product?.status, "published")
    assert.ok(variant.product?.sales_channels?.some(row => row?.id === channels[0].id))
    assert.equal(variant.inventory_items?.length, 1)
    const link = variant.inventory_items![0]!
    assert.equal(Number(link.required_quantity), 1)
    const levels = await inventory.listInventoryLevels({ inventory_item_id: link.inventory_item_id }, { take: null })
    assert.equal(levels.length, 1)
    const level = levels[0]
    assert.ok(level.stocked_quantity - level.reserved_quantity >= 2, "At least two available units are needed; inspect existing orders before retrying")
    const { data: locations } = await query.graph({ entity: "stock_location", fields: ["id", "name", "sales_channels.id"], filters: { id: level.location_id } })
    assert.ok(locations[0]?.sales_channels?.some(row => row?.id === channels[0].id))
    const productResult = await sdk.store.product.list({ handle: variant.product!.handle, region_id: regions[0].id, fields: "+variants.calculated_price" })
    const priced = productResult.products.flatMap(row => row.variants ?? []).find(row => row.id === variant.id)
    assert.ok(priced?.calculated_price)
    const providerResult = await sdk.store.payment.listPaymentProviders({ region_id: regions[0].id })
    for (const provider of ["pp_system_default", "pp_week4_local"]) assert.ok(providerResult.payment_providers.some(row => row.id === provider), `Enable ${provider} for Vietnam`)
    fixture = {
      run_id: runId, product_id: variant.product!.id, handle: variant.product!.handle,
      variant_id: variant.id, sku: variant.sku!, manage_inventory: true, allow_backorder: false,
      required_quantity: 1, inventory_item_id: link.inventory_item_id, inventory_level_id: level.id,
      location_id: level.location_id, region_id: regions[0].id, sales_channel_id: channels[0].id,
      currency_code: regions[0].currency_code, quantity: 2,
      calculated_unit_price: Number(priced.calculated_price.calculated_amount), payment_provider_id: "pp_system_default",
    }
    const versions: Record<string, string> = {}
    for (const name of ["medusa", "js-sdk", "framework", "core-flows", "inventory", "order", "payment"]) {
      versions[name] = JSON.parse(await readFile(resolve(root, "node_modules/@medusajs", name, "package.json"), "utf8")).version
    }
    await save("environment.json", { run_id: runId, captured_at: new Date().toISOString(), environment: process.env.NODE_ENV,
      node: process.version, versions, base_url: baseUrl, provider_flag: true,
      snapshot_consistency: "Sequential module reads, no other inventory work intentionally run concurrently",
      fixture_preparation: "Reused existing fixture without reseeding, stock reset or deleting historical reservations" })
    await save("fixture.json", { ...fixture, location_name: locations[0].name })
    const preflight = await snap("preflight", "snapshot", "T0", fixture)
    const sourceFiles = [
      { path: resolve(__dirname, "check-week4-inventory.ts"), name: "check-week4-inventory.ts" },
      { path: resolve(__dirname, "inventory-order/snapshot.ts"), name: "inventory-order/snapshot.ts" },
      { path: resolve(__dirname, "week4-inventory/validation.ts"), name: "week4-inventory/validation.ts" },
      { path: resolve(__dirname, "../modules/week4-payment/service.ts"), name: "week4-payment/service.ts" },
      { path: resolve(__dirname, "../modules/week4-payment/index.ts"), name: "week4-payment/index.ts" },
    ]
    for (const file of sourceFiles) {
      const target = resolve(evidenceDir, "source", file.name)
      await mkdir(dirname(target), { recursive: true })
      await copyFile(file.path, target)
    }
    await checkpoint("preflight_passed", { fixture, initial_available: level.stocked_quantity - level.reserved_quantity })
    if (preflightOnly) {
      logger.info(`Week 4 preflight passed. Evidence: ${evidenceDir}`)
      return
    }

    // Current readback supplements the historical success evidence without re-capturing it.
    const historicalDir = resolve(root, "docs/report/evidence/inventory-week4-20261101-01/W4-01")
    const historical = JSON.parse(await readFile(resolve(historicalDir, "complete-response.json"), "utf8"))
    const historicalOrderId = historical.order.id as string
    const { data: oldLinks } = await query.graph({ entity: "order_cart", fields: ["order_id", "cart_id"], filters: { order_id: historicalOrderId } })
    assert.equal(oldLinks.length, 1, "Historical W4-01 must have one active cart/order link")
    await snap("W4-01-supplement", "current-readback", "T2", fixture, oldLinks[0].cart_id, historicalOrderId)
    const sourceHashes: { file: string, sha256: string }[] = []
    for (const name of ["complete-response.json", "capture-response.json", ...["t0", "t1", "t2", "t3"].flatMap(stage => [`${stage}-inventory.json`, `${stage}-reservations-page-0.json`]), "t2-admin-order.json", "t2-store-order.json", "t3-admin-order.json"]) {
      sourceHashes.push({ file: name, sha256: createHash("sha256").update(await readFile(resolve(historicalDir, name))).digest("hex") })
    }
    await save("W4-01-supplement/source-evidence.json", { historical_directory: historicalDir, snapshot_scope: "New current readback, not reconstructed historical snapshot timestamps", source_hashes: sourceHashes })

    const prepare = async (caseId: string, selected: Fixture, withShipping: boolean, part = "") => {
      currentCase = caseId
      participant = part
      activeFixture = selected
      const { cart } = await sdk.store.cart.create({ region_id: selected.region_id, sales_channel_id: selected.sales_channel_id,
        metadata: { sample_suite: "week4_inventory_edge_cases", sample_case: caseId, sample_run: runId, participant: part } })
      activeCartId = cart.id
      await checkpoint(`${caseId}_cart_created`, { active_case: caseId, active_cart_id: cart.id })
      await sdk.store.cart.createLineItem(cart.id, { variant_id: selected.variant_id, quantity: selected.quantity })
      const address = { first_name: "Week4", last_name: "Audit", address_1: "1 Test Street", city: "Ho Chi Minh City", country_code: "vn", postal_code: "700000" }
      await sdk.store.cart.update(cart.id, { email: `week4.${runId}.${caseId}.${part || "single"}@example.test`, shipping_address: address, billing_address: address })
      if (withShipping) {
        const { shipping_options: options } = await sdk.store.fulfillment.listCartOptions({ cart_id: cart.id })
        const shipping = options.find(row => row.name === "Standard delivery") ?? options[0]
        assert.ok(shipping, "No shipping option for fixture")
        await sdk.store.cart.addShippingMethod(cart.id, { option_id: shipping.id })
      }
      const refreshed = await sdk.store.cart.retrieve(cart.id)
      await sdk.store.payment.initiatePaymentSession(refreshed.cart, { provider_id: selected.payment_provider_id,
        data: { week4_outcome: selected.payment_provider_id === "pp_week4_local" ? "fail" : "success" } })
      await save(`${caseId}/${part ? part.toLowerCase() + "-" : ""}cart-receipt.json`, { cart_id: cart.id, quantity: selected.quantity, shipping_selected: withShipping, provider_id: selected.payment_provider_id })
      return cart.id
    }
    const complete = async (caseId: string, cartId: string, filename = "complete-response") => {
      currentCase = caseId
      activeCartId = cartId
      lastHttp = undefined
      try {
        await sdk.store.cart.complete(cartId)
      } catch (error) {
        assert.ok(typeof (error as { status?: number }).status === "number" && lastHttp, "Checkout transport failed; inspect trace before retrying")
      }
      assert.ok(lastHttp, "No HTTP response captured")
      await save(`${caseId}/${filename}.json`, lastHttp)
      return lastHttp as HttpResult
    }

    currentCase = "W4-02"
    const rejectedFixture = { ...fixture, payment_provider_id: "pp_week4_local" }
    const rejectedT0 = await snap(currentCase, "t0", "T0", rejectedFixture)
    const rejectedCart = await prepare(currentCase, rejectedFixture, true)
    const rejectedBefore = await snap(currentCase, "t1", "T1", rejectedFixture, rejectedCart)
    assert.deepEqual(rejectedBefore.levels, rejectedT0.levels, "Inventory changed while preparing payment failure case")
    assert.deepEqual(rejectedBefore.reservations, rejectedT0.reservations, "Reservation changed before complete")
    const rejectedResponse = await complete(currentCase, rejectedCart)
    const rejectedAfter = await snap(currentCase, "t2", "T2", rejectedFixture, rejectedCart)
    await record(currentCase, validateFailedCheckout(rejectedBefore, rejectedAfter, rejectedFixture, "not_allowed", rejectedResponse, "error"), { cart_id: rejectedCart })
    await checkpoint("W4-02_passed")

    currentCase = "W4-03"
    const invalidFixture = { ...fixture, quantity: 1 }
    const invalidT0 = await snap(currentCase, "t0", "T0", invalidFixture)
    const invalidCart = await prepare(currentCase, invalidFixture, false)
    const invalidBefore = await snap(currentCase, "t1", "T1", invalidFixture, invalidCart)
    assert.deepEqual(invalidBefore.levels, invalidT0.levels, "Inventory changed while preparing validation failure case")
    assert.deepEqual(invalidBefore.reservations, invalidT0.reservations, "Reservation changed before complete")
    const invalidResponse = await complete(currentCase, invalidCart)
    const invalidAfter = await snap(currentCase, "t2", "T2", invalidFixture, invalidCart)
    await record(currentCase, validateFailedCheckout(invalidBefore, invalidAfter, invalidFixture, "invalid_data", invalidResponse), { cart_id: invalidCart })
    await checkpoint("W4-03_passed")

    currentCase = "W4-04"
    const shortageBaseline = await snap(currentCase, "before-prepare", "T0", fixture)
    const currentLevel = shortageBaseline.levels.find(row => row.id === fixture!.inventory_level_id)!
    const available = currentLevel.available_quantity
    assert.ok(Number.isInteger(available) && available >= 2, "Two carts must be prepared while at least two units are available")
    const fixtureA = { ...fixture, quantity: available - 1 }
    const cartA = await prepare(currentCase, fixtureA, true, "A")
    const cartB = await prepare(currentCase, fixture, true, "B")
    const beforeA = await snap(currentCase, "t0", "T0", fixtureA, cartA)
    assert.deepEqual(beforeA.levels, shortageBaseline.levels, "Inventory changed while preparing competing carts")
    assert.deepEqual(beforeA.reservations, shortageBaseline.reservations, "Preparing carts must not reserve stock")
    participant = "A"
    const responseA = await complete(currentCase, cartA, "a-complete-response")
    assert.equal(responseA.body.type, "order")
    const orderA = responseA.body.order.id as string
    const afterA = await snap(currentCase, "a-order-snapshot", "T1", fixtureA, cartA, orderA)
    const validationA = validateReservationSuccess(beforeA, afterA, fixtureA)
    await save(`${currentCase}/validation-a.json`, validationA)
    assert.ok(validationA.all_passed, "Cart A reservation check failed")
    const beforeB = await snap(currentCase, "t1-after-a", "T1", fixture, cartB)
    participant = "B"
    const responseB = await complete(currentCase, cartB, "b-complete-response")
    const afterB = await snap(currentCase, "t2", "T2", fixture, cartB)
    await record(currentCase, validateFailedCheckout(beforeB, afterB, fixture, "inventory", responseB),
      { cart_a_id: cartA, order_a_id: orderA, cart_b_id: cartB, a_quantity: fixtureA.quantity, b_quantity: fixture.quantity })
    await checkpoint("W4-04_passed", { retained_order_id: orderA, retained_quantity: fixtureA.quantity })

    currentCase = "W4-05"
    participant = "retry-A"
    const retryBefore = await snap(currentCase, "t1", "T1", fixtureA, cartA, orderA)
    const retryResponse = await complete(currentCase, cartA)
    const retryAfter = await snap(currentCase, "t2", "T2", fixtureA, cartA, orderA)
    await record(currentCase, validateRetry(retryBefore, retryAfter, orderA, retryResponse), { cart_id: cartA, order_id: orderA })
    await save("final-state.json", { initial_level: preflight.levels.find(row => row.id === fixture!.inventory_level_id),
      final_level: retryAfter.levels.find(row => row.id === fixture!.inventory_level_id),
      retained_order_id: orderA, retained_quantity: fixtureA.quantity, cleanup: "None; retained for review, no stock resets or reservation deletions" })
    await checkpoint("completed", { cases: results, completed_at: new Date().toISOString() })
    logger.info(JSON.stringify({ run_id: runId, status: "completed", cases: results, evidence_directory: evidenceDir }))
  } catch (error) {
    if (activeFixture && activeCartId) {
      try { await snap(currentCase, "failure-readback", "T2", activeFixture, activeCartId) } catch { /* Preserve the original failure. */ }
    }
    const message = redact(error instanceof Error ? error.message : String(error))
    await save("failure.json", { run_id: runId, state: manifest.state, active_case: currentCase, cart_id: activeCartId, occurred_at: new Date().toISOString(), message })
    logger.error(`Week 4 run stopped: ${message}. Inspect ${evidenceDir}`)
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Week 4 run ${runId} stopped; inspect saved evidence`)
  } finally {
    globalThis.fetch = nativeFetch
  }
}
