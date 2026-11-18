import http from "k6/http"
import { check } from "k6"
import exec from "k6/execution"

const base = __ENV.BASE_URL || "http://127.0.0.1:9000"
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base))
  throw new Error("Use an isolated loopback target")
const key = __ENV.PUBLISHABLE_KEY
if (!key) throw new Error("PUBLISHABLE_KEY is required")
const headers = { "x-publishable-api-key": key }
export const options = {
  summaryTrendStats: ["avg", "med", "p(95)", "p(99)", "max"],
  scenarios: {
    catalog:
      __ENV.SMOKE === "1"
        ? { executor: "shared-iterations", vus: 1, iterations: 10 }
        : {
            executor: "constant-arrival-rate",
            rate: 30,
            timeUnit: "1s",
            duration: "10m",
            preAllocatedVUs: 50,
            maxVUs: 150,
          },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{kind:catalog}": ["p(95)<600"],
    checks: ["rate==1"],
    dropped_iterations: ["count==0"],
  },
}
export function setup() {
  const result = http.get(`${base}/store/products?limit=20`, {
    headers,
    tags: { kind: "setup", name: "catalog setup" },
    timeout: "5s",
  })
  if (result.status !== 200) throw new Error(`Catalog setup HTTP ${result.status}`)
  const products = result.json("products")
  if (!Array.isArray(products) || !products.length || !products[0].id || !products[0].title)
    throw new Error("Nonempty catalog fixture required")
  return { id: products[0].id, query: products[0].title }
}
export default function (fixture) {
  // Explicit 60% list, 20% detail, 20% search by iteration, not random drift.
  const slot = exec.scenario.iterationInTest % 5
  const path =
    slot < 3
      ? "/store/products?limit=20"
      : slot === 3
        ? `/store/products/${fixture.id}`
        : `/store/products?q=${encodeURIComponent(fixture.query)}&limit=20`
  const response = http.get(`${base}${path}`, {
    headers,
    tags: {
      kind: "catalog",
      name: slot < 3 ? "catalog list" : slot === 3 ? "catalog detail" : "catalog search",
    },
    timeout: "5s",
  })
  check(response, {
    "catalog status and product contract": (r) => {
      try {
        if (r.status !== 200) return false
        const body = r.json()
        if (slot === 3)
          return body.product.id === fixture.id && typeof body.product.title === "string"
        const products = body.products
        return (
          Array.isArray(products) &&
          products.length > 0 &&
          products.length <= 20 &&
          new Set(products.map((p) => p.id)).size === products.length &&
          products.every((p) => typeof p.id === "string" && typeof p.title === "string") &&
          (slot !== 4 || products.some((p) => p.id === fixture.id))
        )
      } catch {
        return false
      }
    },
  })
}
