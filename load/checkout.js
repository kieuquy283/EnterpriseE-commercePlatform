import http from "k6/http"
import { check } from "k6"
import exec from "k6/execution"
import { Trend, Rate, Counter } from "k6/metrics"

const intentDuration = new Trend("checkout_intent_duration", true)
const reconciled = new Rate("checkout_reconciled")
const completedIntents = new Counter("checkout_completed_intents")

const base = __ENV.BASE_URL || "http://localhost:9000"
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base))
  throw new Error("Use an isolated loopback target")
const key = __ENV.PUBLISHABLE_KEY
const regionId = __ENV.REGION_ID
const variantId = __ENV.VARIANT_ID
if (!key || !regionId || !variantId) {
  throw new Error("PUBLISHABLE_KEY, REGION_ID and VARIANT_ID are required")
}

export const options = {
  scenarios:
    __ENV.SMOKE === "1"
      ? { checkout: { executor: "shared-iterations", vus: 1, iterations: 1 } }
      : {
          checkout: {
            executor: "constant-arrival-rate",
            rate: 3,
            timeUnit: "1s",
            duration: "5m",
            preAllocatedVUs: 30,
            maxVUs: 100,
          },
        },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    checks: ["rate==1"],
    dropped_iterations: ["count==0"],
    checkout_reconciled: ["rate==1"],
    checkout_completed_intents: ["count>0"],
    checkout_intent_duration: ["p(95)<10000"],
    "http_req_duration{step:complete}": ["p(95)<1500"],
  },
}

const headers = {
  "content-type": "application/json",
  "x-publishable-api-key": key,
}

function post(path, body, extraHeaders = {}, step = "setup") {
  const response = http.post(`${base}${path}`, JSON.stringify(body), {
    headers: { ...headers, ...extraHeaders },
    tags: { step, name: `checkout ${step}` },
    timeout: "10s",
  })
  if (response.status !== 200) throw new Error(`${path}: HTTP ${response.status}`)
  return response.json()
}

export default function () {
  const started = Date.now()
  let success = false
  const operationId = `load-${exec.vu.idInTest}-${exec.scenario.iterationInTest}`
  headers["x-operation-id"] = operationId
  try {
    const cart = post("/store/carts", { region_id: regionId }).cart
    post(`/store/carts/${cart.id}/line-items`, { variant_id: variantId, quantity: 1 })
    const email = `load-${exec.vu.idInTest}-${exec.scenario.iterationInTest}@example.test`
    post(`/store/carts/${cart.id}`, {
      email,
      shipping_address: {
        first_name: "Load",
        last_name: "Test",
        address_1: "1 Test Street",
        city: "Ho Chi Minh City",
        postal_code: "700000",
        country_code: "vn",
      },
    })
    const optionsResponse = http.get(`${base}/store/shipping-options?cart_id=${cart.id}`, {
      headers,
    })
    const shippingOption = optionsResponse.json("shipping_options.0.id")
    if (!shippingOption) throw new Error("No shipping option for load-test cart")
    post(`/store/carts/${cart.id}/shipping-methods`, { option_id: shippingOption })
    const collection = post("/store/payment-collections", { cart_id: cart.id }).payment_collection
    post(`/store/payment-collections/${collection.id}/payment-sessions`, {
      provider_id: "pp_system_default",
    })
    const completed = post(`/store/carts/${cart.id}/complete`, {}, {}, "complete")
    const valid = check(completed, {
      "order created": (result) => result.type === "order" && !!result.order?.id,
    })
    if (!valid) throw new Error("Completion returned no order")
    const retried = post(`/store/carts/${cart.id}/complete`, {}, {}, "retry")
    const readback = http.get(`${base}/store/carts/${cart.id}`, {
      headers,
      tags: { step: "readback", name: "checkout cart readback" },
      timeout: "10s",
    })
    const readCart = readback.status === 200 ? readback.json("cart") : null
    success = check(retried, {
      "retry returns same order": (result) =>
        result.type === "order" && result.order?.id === completed.order.id,
      "completed cart and totals reconcile": () =>
        !!readCart?.completed_at &&
        typeof completed.order.total === "number" &&
        completed.order.total === readCart.total &&
        completed.order.currency_code === readCart.currency_code,
      "one expected order line": () =>
        completed.order.items?.length === 1 &&
        completed.order.items[0].variant_id === variantId &&
        completed.order.items[0].quantity === 1,
    })
    if (success) completedIntents.add(1)
    // Synthetic IDs only: offline QA reconciles this mapping against Admin inventory/order readback.
    console.log(
      JSON.stringify({
        kind: "checkout_reconciliation",
        operation_id: operationId,
        cart_id: cart.id,
        order_id: completed.order.id,
        total: completed.order.total,
        reconciled: success,
      }),
    )
  } finally {
    reconciled.add(success)
    intentDuration.add(Date.now() - started)
  }
}
