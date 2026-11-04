import http from "k6/http"
import { check, sleep } from "k6"

const base = __ENV.BASE_URL || "http://host.docker.internal:9002"
const context = __ENV.TEST_CONTEXT ? JSON.parse(open(__ENV.TEST_CONTEXT)) : { publishable_key: __ENV.PUBLISHABLE_KEY, region_id: __ENV.REGION_ID }
if (!context.publishable_key || !context.region_id) throw new Error("PUBLISHABLE_KEY and REGION_ID required")

export const options = {
  summaryTrendStats: ["avg", "min", "med", "max", "p(50)", "p(95)", "p(99)"],
  scenarios: { recommendations: {
    executor: "constant-arrival-rate", rate: Number(__ENV.RPS || 30), timeUnit: "1s",
    duration: __ENV.DURATION || "60s", preAllocatedVUs: 30, maxVUs: 100,
  } },
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<800"], dropped_iterations: ["count==0"] },
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
  const response = http.get(`${base}/store/recommendations?placement=home&region_id=${context.region_id}&limit=12`, {
    headers: { "x-publishable-api-key": context.publishable_key }, timeout: "10s", tags: { kind: "recommendation" },
  })
  check(response, {
    "status 200": (r) => r.status === 200,
    "bounded products": (r) => { try { return r.json().products.length <= 12 } catch { return false } },
  })
}
