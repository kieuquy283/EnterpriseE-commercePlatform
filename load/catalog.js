import http from "k6/http"
import { check, sleep } from "k6"

const base = __ENV.BASE_URL || "http://localhost:9000"
const key = __ENV.PUBLISHABLE_KEY
if (!key) throw new Error("PUBLISHABLE_KEY is required")

export const options = {
  scenarios: {
    catalog: {
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
    http_req_duration: ["p(95)<600"],
  },
}

export default function () {
  const result = http.get(`${base}/store/products?limit=20`, {
    headers: { "x-publishable-api-key": key },
  })
  check(result, { "catalog 200": (r) => r.status === 200 })
  sleep(0.1)
}
