import http from "k6/http"
import { check, sleep } from "k6"
import exec from "k6/execution"
import { Counter } from "k6/metrics"

const capacityRejections = new Counter("capacity_rejections")
const dependencyErrors = new Counter("dependency_errors")

const base = __ENV.BASE_URL || "http://host.docker.internal:9002"
const context = __ENV.TEST_CONTEXT ? JSON.parse(open(__ENV.TEST_CONTEXT)) : { publishable_key: __ENV.PUBLISHABLE_KEY, region_id: __ENV.REGION_ID }
if (!context.publishable_key || !context.region_id) throw new Error("PUBLISHABLE_KEY and REGION_ID required")
const placement = __ENV.PLACEMENT || "home"
const productIds = __ENV.PRODUCT_CONTEXTS ? JSON.parse(open(__ENV.PRODUCT_CONTEXTS)) : []
if (!["home", "product_detail"].includes(placement)) throw new Error("Invalid placement")
if (placement === "product_detail" && productIds.length < 3) throw new Error("PDP load requires multiple product contexts")
const limit = placement === "product_detail" ? 6 : 12

export const options = {
  summaryTrendStats: ["avg", "min", "med", "max", "p(50)", "p(95)", "p(99)"],
  scenarios: { recommendations: {
    executor: "constant-arrival-rate", rate: Number(__ENV.RPS || 30), timeUnit: "1s",
    duration: __ENV.DURATION || "60s", preAllocatedVUs: 30, maxVUs: 100,
  } },
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<800"], dropped_iterations: ["count==0"], checks: ["rate>0.99"] },
}

export function setup() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const health = http.get(`${base}/health`, { timeout: "2s", tags: { kind: "setup" } })
    if (health.status === 200) return
    sleep(1)
  }
  throw new Error("Test API must become healthy before load starts")
}

export default function () {
  const product = placement === "product_detail" ? productIds[exec.scenario.iterationInTest % productIds.length] : null
  const response = http.get(`${base}/store/recommendations?placement=${placement}&region_id=${context.region_id}&limit=${limit}${product ? `&product_id=${product}` : ""}`, {
    headers: { "x-publishable-api-key": context.publishable_key }, timeout: "10s", tags: { kind: "recommendation" },
  })
  if (response.status !== 200) {
    if (response.status === 503 && response.body.includes("capacity")) capacityRejections.add(1)
    else dependencyErrors.add(1)
  }
  check(response, {
    "status 200": (r) => r.status === 200,
    "bounded unique non-self products": (r) => { try { const ids = r.json().products.map((p) => p.id); return ids.length <= limit && new Set(ids).size === ids.length && !ids.includes(product) } catch { return false } },
  })
}
