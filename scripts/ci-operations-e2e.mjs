// Real isolated API -> Redis -> worker -> SMTP inbox proof. Never use shared targets.
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFileSync, writeFileSync } from "node:fs"
import { randomUUID } from "node:crypto"

assert.equal(process.env.GITHUB_ACTIONS, "true")
assert.equal(process.env.RUNNER_ENVIRONMENT, "github-hosted")
const prefix = process.env.CI_CONTAINER_PREFIX
assert.match(prefix || "", /^daymark-ci-[0-9]+-[0-9]+$/)
const directory = process.env.CI_OPERATIONS_FIXTURE_DIR
assert.ok(directory && directory.startsWith(process.env.RUNNER_TEMP + "/daymark-ci."))
const admin = JSON.parse(readFileSync(directory + "/admin.json"))
const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
assert.ok(key)
const execute = promisify(execFile)
const checks = []
const orders = []
const passed = (name) => {
  checks.push({ name, passed: true })
  console.log("PASS " + name)
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function request(path, data, token) {
  const response = await fetch("http://localhost:9000" + path, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      "content-type": "application/json",
      "x-publishable-api-key": key,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    signal: AbortSignal.timeout(45000),
  })
  const body = response.headers.get("content-type")?.includes("application/json")
    ? await response.json()
    : {}
  return { status: response.status, body }
}
async function success(path, data, token) {
  const result = await request(path, data, token)
  assert.ok(result.status >= 200 && result.status < 300, `HTTP failure at ${path.split("?")[0]}`)
  return result.body
}
async function fixture(action, orderId) {
  await execute(
    "docker",
    [
      "run",
      "--rm",
      "--label",
      `daymark.ci.run=${prefix}`,
      "--network",
      `container:${prefix}-postgres`,
      "--env-file",
      directory + "/runtime",
      "-v",
      directory + ":/ci-private",
      "-e",
      `DAYMARK_TEST_ACTION=${action}`,
      "-e",
      `DAYMARK_TEST_ORDER_ID=${orderId}`,
      "-e",
      `daymark-backend:${process.env.GITHUB_SHA}`,
      "node",
      "../../../../node_modules/@medusajs/cli/cli.js",
      "exec",
      "./src/scripts/operations-test-fixture.js",
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  )
  return action === "inspect" ? JSON.parse(readFileSync(directory + "/notification.json")) : []
}
async function inbox(orderId) {
  const list = await fetch("http://localhost:8025/api/v1/messages").then((r) => r.json())
  const matches = []
  for (const message of list.messages || []) {
    const detail = await fetch(`http://localhost:8025/api/v1/message/${message.ID}`).then((r) =>
      r.json(),
    )
    if (detail.Text?.includes(orderId)) matches.push(detail)
  }
  return matches
}
async function until(probe, label, timeout = 90000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      if (await probe()) return
    } catch {
      /* A restarting test service may briefly refuse connections. */
    }
    await sleep(2000)
  }
  throw new Error(label)
}
let phase = "setup"
let failure = null
let adminToken
let stockBefore
let inventoryPath
let inventoryVariantId
try {
  adminToken = (await success("/auth/user/emailpass", admin)).token
  const region = (await success("/store/regions")).regions.find(
    (item) => item.currency_code === "vnd",
  )
  const product = (
    await success(
      `/store/products?handle=dm-tee-core&region_id=${region.id}&fields=+variants.inventory_quantity`,
    )
  ).products[0]
  const variant = product.variants.find((item) => item.inventory_quantity > 4)
  assert.ok(variant)
  stockBefore = variant.inventory_quantity
  inventoryVariantId = variant.id
  inventoryPath = `/store/products?handle=dm-tee-core&region_id=${region.id}&fields=+variants.inventory_quantity`
  async function checkout() {
    const cart = (await success("/store/carts", { region_id: region.id })).cart
    await success(`/store/carts/${cart.id}/line-items`, { variant_id: variant.id, quantity: 1 })
    const address = {
      first_name: "DAYMARK",
      last_name: "CI",
      address_1: "Synthetic fixture",
      city: "HCM",
      postal_code: "700000",
      country_code: "vn",
      phone: "0000000000",
    }
    await success(`/store/carts/${cart.id}`, {
      email: `operations-${randomUUID()}@example.invalid`,
      shipping_address: address,
      billing_address: address,
    })
    const shipping = (await success(`/store/shipping-options?cart_id=${cart.id}`))
      .shipping_options[0]
    await success(`/store/carts/${cart.id}/shipping-methods`, { option_id: shipping.id })
    const payment = (await success("/store/payment-collections", { cart_id: cart.id }))
      .payment_collection
    await success(`/store/payment-collections/${payment.id}/payment-sessions`, {
      provider_id: "pp_system_default",
    })
    const result = await success(`/store/carts/${cart.id}/complete`, {})
    assert.equal(result.type, "order")
    orders.push(result.order.id)
    const repeated = await success(`/store/carts/${cart.id}/complete`, {})
    assert.equal(repeated.order.id, result.order.id)
    return result.order.id
  }
  const first = await checkout()
  phase = "notification_first_receipt"
  await until(async () => (await inbox(first)).length === 1, "SMTP receipt missing")
  await fixture("replay", first)
  await sleep(12000)
  assert.equal((await inbox(first)).length, 1)
  const firstRecords = await fixture("inspect", first)
  assert.equal(firstRecords.filter((record) => record.type === "order_placed").length, 1)
  assert.equal(firstRecords[0].state, "sent")
  assert.equal(firstRecords[0].attempt_count, 1)
  passed("API checkout -> Redis -> worker -> SMTP inbox; duplicate event has one outbox effect")
  phase = "notification_outage"
  await execute("docker", ["stop", prefix + "-mailpit"])
  const outage = await checkout()
  await until(
    async () => (await fixture("inspect", outage)).some((record) => record.state === "retry_wait"),
    "SMTP outage did not enter retry",
  )
  assert.equal((await success(`/admin/orders/${outage}`, undefined, adminToken)).order.id, outage)
  await execute("docker", ["start", prefix + "-mailpit"])
  await until(async () => (await inbox(outage)).length === 1, "SMTP did not recover", 150000)
  const recovered = await fixture("inspect", outage)
  assert.ok(recovered[0].attempt_count >= 2 && recovered[0].state === "sent")
  passed("SMTP outage preserves order, records retry, then delivers after provider recovery")
  phase = "notification_restart"
  await execute("docker", ["stop", prefix + "-worker"])
  const restart = await checkout()
  await fixture("expire", restart)
  await execute("docker", ["start", prefix + "-worker"])
  await until(
    async () => (await inbox(restart)).length === 1,
    "Worker restart did not reclaim expired processing",
  )
  assert.equal((await fixture("inspect", restart))[0].state, "sent")
  passed("Worker stop/restart, queued Redis event and expired processing lease recover")
  await execute("docker", ["stop", prefix + "-worker"])
  phase = "notification_competing_processors"
  const competing = await checkout()
  await fixture("expire", competing)
  await Promise.all([fixture("process", competing), fixture("process", competing)])
  assert.equal((await inbox(competing)).length, 1)
  const competed = await fixture("inspect", competing)
  assert.equal(competed[0].attempt_count, 1)
  assert.equal(competed[0].state, "sent")
  await execute("docker", ["start", prefix + "-worker"])
  passed("Concurrent independent processes use Redis lock: one send and one successful attempt")
} catch (error) {
  failure = {
    phase,
    type: error?.name || "Error",
    strictLocator: Boolean(error?.message?.includes("strict mode violation")),
  }
  console.error(`Failure phase: ${phase}`)
  console.error(
    "FAIL operations E2E; raw errors withheld to protect credentials and auth responses",
  )
  process.exitCode = 1
} finally {
  for (const orderId of orders) {
    try {
      await success(`/admin/orders/${orderId}/cancel`, {}, adminToken)
      assert.equal(
        (await success(`/admin/orders/${orderId}`, undefined, adminToken)).order.status,
        "canceled",
      )
    } catch {
      process.exitCode = 1
    }
  }
  if (orders.length && process.exitCode !== 1) {
    try {
      await until(
        async () =>
          (await inbox(orders[0])).some((message) => message.Subject?.includes("Đơn hàng đã hủy")),
        "Cancellation receipt missing",
      )
      passed("Canceled-order notification reaches the SMTP inbox")
    } catch {
      process.exitCode = 1
    }
  }
  if (orders.length && inventoryPath) {
    try {
      const snapshot = await success(inventoryPath)
      assert.equal(
        snapshot.products[0].variants.find((variant) => variant.id === inventoryVariantId)
          .inventory_quantity,
        stockBefore,
      )
      passed("All synthetic orders canceled and stock restored")
    } catch {
      process.exitCode = 1
    }
  }
  writeFileSync(
    "ci-evidence/operations-e2e.json",
    JSON.stringify(
      {
        checks,
        failure,
        passed: process.exitCode !== 1,
        syntheticOrders: orders.length,
        semantics:
          "SMTP acceptance and test inbox receipt; at-least-once across send/persist crashes, not exactly-once email delivery",
      },
      null,
      2,
    ),
  )
}
