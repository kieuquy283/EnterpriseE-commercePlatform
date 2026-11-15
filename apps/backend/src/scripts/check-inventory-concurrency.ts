import assert from "node:assert/strict"
import { randomUUID, createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { performance } from "node:perf_hooks"
import type { ExecArgs, ICartModuleService, IInventoryService, IOrderModuleService, IPaymentModuleService, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules, ProductStatus } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow, createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { validateConcurrency } from "./inventory-concurrency/validation"
import type { CompletionAttempt, ConcurrencyFixture, ConcurrencySnapshot } from "./inventory-concurrency/validation"

type Participant = { label: string, customer_id: string, cart_id: string, payment_collection_id: string, token: string }
type JsonBody = Record<string, any>
type HttpReceipt = {
  operation: string, method: string, path: string, started_at: string, completed_at: string
  started_ms: number, completed_ms: number, status: number, request: Record<string, unknown>, response: Record<string, unknown>
}

function number(value: unknown) {
  assert.ok(value !== null && value !== undefined && typeof value !== "boolean" &&
    !(typeof value === "string" && !value.trim()), "A persisted quantity is missing or invalid")
  const result = Number(value)
  assert.ok(Number.isFinite(result), "A persisted quantity is not finite")
  return result
}

async function snapshot(container: MedusaContainer, stage: string, fixture: ConcurrencyFixture, participants: Participant[]): Promise<ConcurrencySnapshot> {
  const capturedAt = new Date().toISOString()
  const inventory = container.resolve<IInventoryService>(Modules.INVENTORY)
  const carts = container.resolve<ICartModuleService>(Modules.CART)
  const orders = container.resolve<IOrderModuleService>(Modules.ORDER)
  const payment = container.resolve<IPaymentModuleService>(Modules.PAYMENT)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const levels = await inventory.listInventoryLevels({ inventory_item_id: fixture.inventory_item_id }, { take: null, order: { id: "ASC" } })
  const reservations = await inventory.listReservationItems({ inventory_item_id: fixture.inventory_item_id }, { take: null, order: { id: "ASC" } })
  const cartRows = await Promise.all(participants.map(row => carts.retrieveCart(row.cart_id, { relations: ["items"] })))
  const customerIds = participants.map(row => row.customer_id)
  const orderRows = customerIds.length ? await orders.listOrders({ customer_id: customerIds }, { take: null, relations: ["items"], order: { id: "ASC" } }) : []
  const cartLinks = participants.length ? (await query.graph({ entity: "order_cart", fields: ["cart_id", "order_id"], filters: { cart_id: participants.map(row => row.cart_id) } })).data : []
  const collections = participants.length ? await payment.listPaymentCollections({ id: participants.map(row => row.payment_collection_id) }, { take: null, relations: ["payment_sessions"] }) : []
  return {
    stage, captured_at: capturedAt, capture_finished_at: new Date().toISOString(),
    levels: levels.map(row => ({ id: row.id, stocked_quantity: number(row.stocked_quantity), reserved_quantity: number(row.reserved_quantity), available_quantity: number(row.stocked_quantity) - number(row.reserved_quantity) })),
    reservations: reservations.map(row => ({ id: row.id, line_item_id: row.line_item_id ?? null, quantity: number(row.quantity), allow_backorder: Boolean(row.allow_backorder) })),
    carts: cartRows.map(row => ({ id: row.id, customer_id: row.customer_id ?? null, completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      items: (row.items ?? []).map(item => ({ id: item.id, variant_id: item.variant_id ?? null, quantity: number(item.quantity) })) })),
    orders: orderRows.map(row => ({ id: row.id, customer_id: row.customer_id ?? null, items: (row.items ?? []).map(item => ({ id: item.id, variant_id: item.variant_id ?? null, quantity: number(item.quantity) })) })),
    order_cart_links: cartLinks.map(row => ({ cart_id: row.cart_id, order_id: row.order_id })),
    payment_collections: collections.map(row => ({ id: row.id, status: row.status, sessions: (row.payment_sessions ?? []).map(session => ({ id: session.id, provider_id: session.provider_id, status: session.status })) })),
  }
}

export default async function checkInventoryConcurrency({ container, args }: ExecArgs) {
  assert.notEqual(process.env.NODE_ENV, "production", "Use development/test only")
  const database = new URL(process.env.DATABASE_URL ?? "")
  const localHosts = ["localhost", "127.0.0.1", "[::1]"]
  assert.ok(localHosts.includes(database.hostname), "Only a local database is allowed")
  if (process.env.REDIS_URL) assert.ok(localHosts.includes(new URL(process.env.REDIS_URL).hostname), "Only local Redis is allowed")
  assert.ok(process.env.REDIS_URL, "Use the configured Redis workflow/locking environment for this live test")
  const baseUrl = process.env.WEEK5_BASE_URL ?? "http://127.0.0.1:9000"
  assert.ok(new URL(baseUrl).protocol === "http:" && localHosts.includes(new URL(baseUrl).hostname), "Only a local HTTP backend is allowed")
  const runId = args[0] ?? `week5-${new Date().toISOString().replace(/[-:.]/g, "")}`
  assert.match(runId, /^[A-Za-z0-9_-]{1,90}$/)
  const rounds = args[1] ? Number(args[1]) : 3
  assert.ok(args.length <= 2 && Number.isInteger(rounds) && rounds >= 1 && rounds <= 5, "Arguments: [unique-run-id] [rounds 1..5, default 3]")
  const root = resolve(__dirname, "../../../..")
  const evidenceDir = resolve(root, "docs/report/evidence", `week5-inventory-concurrency-${runId}`)
  await mkdir(resolve(root, "docs/report/evidence"), { recursive: true })
  await mkdir(evidenceDir, { recursive: false })
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const secrets: string[] = []
  const scrub = (value: string) => {
    let result = value
    for (const secret of [...secrets, process.env.DATABASE_URL, process.env.REDIS_URL, process.env.JWT_SECRET, process.env.COOKIE_SECRET]) {
      if (secret) result = result.replaceAll(secret, "[REDACTED]")
    }
    return result.replace(/(?:postgres(?:ql)?|rediss?):\/\/[^\s]+/g, "[REDACTED_URL]").replace(/pk_[A-Za-z0-9_]+/g, "[REDACTED_KEY]").replace(/[\w.+-]+@[\w.-]+/g, "[REDACTED_EMAIL]")
  }
  const save = async (path: string, value: unknown) => writeFile(resolve(evidenceDir, path), JSON.stringify(value, null, 2) + "\n", "utf8")
  const manifest: Record<string, unknown> = { run_id: runId, state: "starting", started_at: new Date().toISOString(), requested_rounds: rounds, fixture_policy: "Fresh products/stock1 per round; no existing stock reset; all records retained" }
  const checkpoint = async (state: string, values: Record<string, unknown> = {}) => {
    Object.assign(manifest, values, { state, updated_at: new Date().toISOString() })
    await save("manifest.json", manifest)
  }
  const trace: HttpReceipt[] = []
  let publishableKey = ""
  const request = async (method: string, path: string, body?: JsonBody, token?: string) => {
    const startedAt = new Date().toISOString()
    const startedMs = performance.now()
    let status = 0
    let payload: JsonBody = {}
    try {
      const response = await fetch(baseUrl + path, {
        method, signal: AbortSignal.timeout(120000),
        headers: { "content-type": "application/json", ...(publishableKey ? { "x-publishable-api-key": publishableKey } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      status = response.status
      const text = await response.text()
      try { payload = JSON.parse(text) as JsonBody } catch { payload = { message: text.slice(0, 300) } }
    } catch (error) {
      payload = { type: "transport_error", message: scrub(error instanceof Error ? error.message : String(error)) }
    }
    const receipt: HttpReceipt = {
      operation: `${method} ${path}`, method, path, started_at: startedAt, completed_at: new Date().toISOString(),
      started_ms: startedMs, completed_ms: performance.now(), status,
      request: Object.fromEntries(Object.entries(body ?? {}).filter(([key]) => ["variant_id", "quantity", "region_id", "sales_channel_id", "option_id", "cart_id", "provider_id", "metadata"].includes(key))),
      response: {
        ...(payload.type ? { type: payload.type } : {}),
        ...(payload.message ? { message: scrub(String(payload.message)) } : {}),
        ...(payload.error ? { error: { type: payload.error.type, message: scrub(String(payload.error.message ?? "")) } } : {}),
        ...(payload.order?.id ? { order_id: payload.order.id } : {}),
        ...(payload.cart?.id ? { cart_id: payload.cart.id } : {}),
        ...(payload.customer?.id ? { customer_id: payload.customer.id } : {}),
        ...(payload.payment_collection?.id ? { payment_collection_id: payload.payment_collection.id } : {}),
      },
    }
    trace.push(receipt)
    return { payload, receipt }
  }
  const success = async (method: string, path: string, body?: JsonBody, token?: string) => {
    const result = await request(method, path, body, token)
    assert.ok(result.receipt.status >= 200 && result.receipt.status < 300, `${method} ${path}: HTTP${result.receipt.status} ${scrub(String(result.payload.message ?? result.payload.error?.message ?? ""))}`)
    return result.payload
  }
  const summaries: Record<string, unknown>[] = []
  let currentFixture: ConcurrencyFixture | undefined
  let currentParticipants: Participant[] = []
  let currentRoundDir = ""
  try {
    await checkpoint("preflight")
    const health = await request("GET", "/health")
    assert.equal(health.receipt.status, 200, "Start the backend before running this test")
    const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code", "payment_providers.id"], filters: { name: "Vietnam" } })
    const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id", "is_disabled", "publishable_api_keys.token", "publishable_api_keys.type", "publishable_api_keys.revoked_at"], filters: { name: "Online Store" } })
    const { data: locations } = await query.graph({ entity: "stock_location", fields: ["id", "sales_channels.id"], filters: { name: "Vietnam Warehouse" } })
    const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"], filters: { type: "default" } })
    assert.equal(regions.length, 1, "Vietnam region must already exist")
    assert.equal(regions[0].currency_code, "vnd")
    assert.ok(regions[0].payment_providers?.some(row => row?.id === "pp_system_default"), "System payment provider must be enabled")
    assert.equal(channels.length, 1, "Online Store must already exist")
    assert.equal(channels[0].is_disabled, false)
    assert.equal(locations.length, 1, "Vietnam Warehouse must already exist")
    assert.ok(locations[0].sales_channels?.some(row => row?.id === channels[0].id), "Warehouse must be linked to Online Store")
    assert.ok(profiles[0], "A default shipping profile must already exist")
    const key = channels[0].publishable_api_keys?.find(row => row?.type === "publishable" && !row.revoked_at)
    assert.ok(key?.token, "An active Online Store publishable API key is required")
    publishableKey = key.token
    secrets.push(publishableKey)
    await save("environment.json", {
      node: process.version, medusa: JSON.parse(await readFile(resolve(root, "node_modules/@medusajs/medusa/package.json"), "utf8")).version,
      base_url: baseUrl, database: { host: database.hostname, port: database.port, name: database.pathname.slice(1) },
      redis_configured: Boolean(process.env.REDIS_URL), command: `npm run check:inventory-concurrency -- ${runId} ${rounds}`,
      request_clock: "performance.now monotonic milliseconds and UTC host wall clock",
      snapshot_consistency: "Sequential Medusa module/query reads after both HTTP requests settle; not a cross-module atomic SQL snapshot",
      concurrency_scope: "Overlapping client HTTP intervals; does not prove the internal SQL statements overlap",
      source_sha256: createHash("sha256").update(await readFile(__filename)).digest("hex"),
    })
    for (let round = 1; round <= rounds; round++) {
      currentParticipants = []
      currentFixture = undefined
      currentRoundDir = `round-${round}`
      await mkdir(resolve(evidenceDir, currentRoundDir))
      await checkpoint("creating_fixture", { current_round: round })
      const sku = `W5-CONCURRENT-${runId}-${round}`
      const handle = `w5-concurrent-${runId.toLowerCase()}-${round}`
      const { result: products } = await createProductsWorkflow(container).run({ input: { products: [{
        title: `Week 5 concurrency ${runId} round ${round}`, handle, status: ProductStatus.PUBLISHED,
        shipping_profile_id: profiles[0].id, metadata: { week5_run: runId, week5_round: round, synthetic_price: true, synthetic_inventory: true },
        options: [{ title: "Variant", values: ["Test"] }],
        variants: [{ title: "Test", sku, options: { Variant: "Test" }, manage_inventory: true, allow_backorder: false, prices: [{ currency_code: "vnd", amount: 100 }] }],
        sales_channels: [{ id: channels[0].id }],
      }] } })
      await save(`${currentRoundDir}/product-created.json`, { product_id: products[0].id, sku, handle })
      const { data: variants } = await query.graph({ entity: "product_variant", fields: ["id", "sku", "manage_inventory", "allow_backorder", "inventory_items.inventory_item_id", "inventory_items.required_quantity"], filters: { sku } })
      assert.equal(variants.length, 1)
      assert.equal(variants[0].inventory_items?.length, 1)
      const inventoryLink = variants[0].inventory_items![0]!
      currentFixture = {
        product_id: products[0].id, variant_id: variants[0].id, sku, inventory_item_id: inventoryLink.inventory_item_id,
        location_id: locations[0].id, manage_inventory: variants[0].manage_inventory, allow_backorder: variants[0].allow_backorder,
        required_quantity: number(inventoryLink.required_quantity),
      }
      await save(`${currentRoundDir}/fixture.json`, currentFixture)
      await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: [{ inventory_item_id: currentFixture.inventory_item_id, location_id: locations[0].id, stocked_quantity: 1 }] } })
      const before = await snapshot(container, "T0-before-preparation", currentFixture, [])
      await save(`${currentRoundDir}/t0.json`, before)
      await checkpoint("preparing_carts")
      for (const label of ["A", "B"]) {
        const email = `week5.${runId}.${round}.${label.toLowerCase()}@example.test`
        const password = `${randomUUID()}aA1!`
        secrets.push(password)
        const registration = await success("POST", "/auth/customer/emailpass/register", { email, password })
        assert.ok(registration.token, "Registration must return a token")
        secrets.push(registration.token)
        const customerResponse = await success("POST", "/store/customers", { email, first_name: "Week5", last_name: label }, registration.token)
        assert.ok(customerResponse.customer?.id)
        const login = await success("POST", "/auth/customer/emailpass", { email, password })
        assert.ok(login.token)
        secrets.push(login.token)
        const token = login.token as string
        const me = await success("GET", "/store/customers/me", undefined, token)
        assert.equal(me.customer?.id, customerResponse.customer.id, "Authenticated customer identity must match")
        const created = await success("POST", "/store/carts", { region_id: regions[0].id, sales_channel_id: channels[0].id, metadata: { week5_run: runId, week5_round: round, participant: label } }, token)
        const cartId = created.cart?.id as string
        assert.ok(cartId)
        await success("POST", `/store/carts/${cartId}/line-items`, { variant_id: currentFixture.variant_id, quantity: 1 }, token)
        const address = { first_name: "Week5", last_name: "Synthetic", address_1: "1 Test Street", city: "Ho Chi Minh City", country_code: "vn", postal_code: "700000" }
        await success("POST", `/store/carts/${cartId}`, { email, shipping_address: address, billing_address: address }, token)
        const options = await success("GET", `/store/shipping-options?cart_id=${cartId}`, undefined, token)
        const shipping = options.shipping_options?.find((row: { name: string }) => row.name === "Standard delivery") ?? options.shipping_options?.[0]
        assert.ok(shipping?.id, "A shipping option must be available")
        await success("POST", `/store/carts/${cartId}/shipping-methods`, { option_id: shipping.id }, token)
        const payment = await success("POST", "/store/payment-collections", { cart_id: cartId }, token)
        assert.ok(payment.payment_collection?.id)
        const collectionId = payment.payment_collection.id as string
        await success("POST", `/store/payment-collections/${collectionId}/payment-sessions`, { provider_id: "pp_system_default" }, token)
        currentParticipants.push({ label, customer_id: me.customer.id, cart_id: cartId, payment_collection_id: collectionId, token })
        await save(`${currentRoundDir}/participants.json`, currentParticipants.map(({ token: _token, ...row }) => row))
      }
      const prepared = await snapshot(container, "T1-before-complete", currentFixture, currentParticipants)
      await save(`${currentRoundDir}/t1.json`, prepared)
      assert.deepEqual(prepared.levels, before.levels, "Cart preparation changed stock")
      assert.deepEqual(prepared.reservations, before.reservations, "Cart preparation reserved stock")
      assert.equal(prepared.orders.length, 0)
      await checkpoint("completing_concurrently")
      let release!: () => void
      const gate = new Promise<void>(resolveGate => { release = resolveGate })
      const pending = currentParticipants.map(async participant => {
        await gate
        const { payload, receipt } = await request("POST", `/store/carts/${participant.cart_id}/complete`, {}, participant.token)
        return {
          participant: participant.label, customer_id: participant.customer_id, cart_id: participant.cart_id,
          started_at: receipt.started_at, completed_at: receipt.completed_at, started_ms: receipt.started_ms, completed_ms: receipt.completed_ms,
          status: receipt.status, response_type: payload.type ?? null, order_id: payload.order?.id ?? null,
          error_type: payload.error?.type ?? (payload.type === "order" ? null : payload.type) ?? null,
          error_message: payload.error?.message ? scrub(String(payload.error.message)) : payload.message ? scrub(String(payload.message)) : null,
        } satisfies CompletionAttempt
      })
      release()
      const attempts = await Promise.all(pending)
      await save(`${currentRoundDir}/completion-attempts.json`, attempts)
      await save("http-trace.json", trace)
      const successfulAttempt = attempts.find(row => row.status === 200 && row.response_type === "order" && row.order_id)
      let storeReadback: { order_id: string, customer_id: string | null, items: { id: string, variant_id: string, quantity: number }[] } | null = null
      if (successfulAttempt) {
        const participant = currentParticipants.find(row => row.cart_id === successfulAttempt.cart_id)!
        const result = await success("GET", `/store/orders/${successfulAttempt.order_id}`, undefined, participant.token)
        storeReadback = { order_id: result.order?.id, customer_id: result.order?.customer_id ?? null,
          items: (result.order?.items ?? []).map((item: { id: string, variant_id: string, quantity: number }) => ({ id: item.id, variant_id: item.variant_id, quantity: number(item.quantity) })) }
      }
      await save(`${currentRoundDir}/store-order-readback.json`, storeReadback)
      // HTTP Complete returns after workflow compensation; confirm two consecutive
      // persisted fixture snapshots agree instead of assuming response status is enough.
      let after = await snapshot(container, "T2-after-both-settle", currentFixture, currentParticipants)
      let stable = false
      for (let read = 0; read < 20; read++) {
        await new Promise(resolveDelay => setTimeout(resolveDelay, 100))
        const next = await snapshot(container, "T2-after-both-settle", currentFixture, currentParticipants)
        const comparable = (value: ConcurrencySnapshot) => JSON.stringify({ levels: value.levels, reservations: value.reservations, orders: value.orders, carts: value.carts, links: value.order_cart_links, payment: value.payment_collections })
        stable = comparable(next) === comparable(after)
        after = next
        if (stable) break
      }
      await save(`${currentRoundDir}/t2.json`, after)
      const validation = validateConcurrency(currentFixture, before, prepared, after, attempts)
      validation.checks.push({ id: "settled_readback_stable", expected: "Two consecutive post-response fixture snapshots agree", actual: stable, passed: stable })
      validation.checks.push({ id: "store_api_order_readback", expected: "Returned order is readable over Store API with the selected variant and quantity 1", actual: storeReadback,
        passed: Boolean(storeReadback && storeReadback.order_id === successfulAttempt?.order_id && storeReadback.items.length === 1 && storeReadback.items[0].variant_id === currentFixture.variant_id && storeReadback.items[0].quantity === 1 && after.orders[0]?.items[0]?.id === storeReadback.items[0].id) })
      validation.total = validation.checks.length
      validation.passed = validation.checks.filter(row => row.passed).length
      validation.all_passed = validation.checks.every(row => row.passed)
      await save(`${currentRoundDir}/validation.json`, validation)
      const summary = { round, all_passed: validation.all_passed, passed: validation.passed, total: validation.total, overlap_ms: validation.overlap_ms, fixture: currentFixture, participants: currentParticipants.map(({ token: _token, ...row }) => row), order_ids: after.orders.map(row => row.id), reservation_ids: after.reservations.map(row => row.id) }
      summaries.push(summary)
      await save("summary.json", { run_id: runId, all_passed: summaries.every(row => row.all_passed), completed_rounds: summaries.length, requested_rounds: rounds, rounds: summaries })
      await save("http-trace.json", trace)
      assert.ok(validation.all_passed, `Round ${round} failed; inspect its validation.json`)
    }
    await checkpoint("completed", { completed_rounds: rounds, all_passed: true, completed_at: new Date().toISOString(), retained_data: summaries, cleanup: "None; independent test products/customers/carts/orders/reservations retained for review. No fulfillment, cancellation or reset." })
    logger.info(JSON.stringify({ run_id: runId, all_passed: true, rounds, evidence_directory: evidenceDir }))
  } catch (error) {
    await save("http-trace.json", trace)
    if (currentFixture && currentRoundDir) {
      try { await save(`${currentRoundDir}/failure-readback.json`, await snapshot(container, "failure-readback", currentFixture, currentParticipants)) } catch { /* Preserve the original failure if readback also fails. */ }
    }
    const message = scrub(error instanceof Error ? error.message : String(error))
    await save("failure.json", { run_id: runId, state: manifest.state, occurred_at: new Date().toISOString(), message: message.slice(0, 1800), completed_rounds: summaries.length })
    await checkpoint("failed", { failed_from: manifest.state, message: message.slice(0, 1000), all_passed: false })
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `Week 5 concurrency ${runId} failed: ${message.slice(0, 700)}. Inspect ${evidenceDir}`)
  }
}
