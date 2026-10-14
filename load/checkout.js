import http from "k6/http"
import { check } from "k6"
import exec from "k6/execution"

const base = __ENV.BASE_URL || "http://localhost:9000"
const key = __ENV.PUBLISHABLE_KEY
const regionId = __ENV.REGION_ID
const variantId = __ENV.VARIANT_ID
if (!key || !regionId || !variantId) {
  throw new Error("PUBLISHABLE_KEY, REGION_ID and VARIANT_ID are required")
}

export const options = {
  scenarios: __ENV.SMOKE === "1"
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
    tags: { step },
  })
  if (response.status !== 200) throw new Error(`${path}: HTTP ${response.status}`)
  return response.json()
}

export default function () {
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
  const optionsResponse = http.get(`${base}/store/shipping-options?cart_id=${cart.id}`, { headers })
  const shippingOption = optionsResponse.json("shipping_options.0.id")
  if (!shippingOption) throw new Error("No shipping option for load-test cart")
  post(`/store/carts/${cart.id}/shipping-methods`, { option_id: shippingOption })
  const collection = post("/store/payment-collections", { cart_id: cart.id }).payment_collection
  post(`/store/payment-collections/${collection.id}/payment-sessions`, {
    provider_id: "pp_system_default",
  })
  const completed = post(`/store/carts/${cart.id}/complete`, {}, {}, "complete")
  check(completed, { "order created": (result) => result.type === "order" && !!result.order?.id })
}
