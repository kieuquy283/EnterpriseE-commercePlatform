// Read-only smoke probe. The private key/context never appears in output.
import fs from "node:fs"

const context = JSON.parse(fs.readFileSync("data/hm/processed/recommendation-test-context.json", "utf8"))
const ids = JSON.parse(fs.readFileSync("data/hm/processed/k6/pdp-contexts.json", "utf8"))
const start = Date.now()
const response = await fetch(`${process.env.PDP_PROBE_BASE_URL || "http://127.0.0.1:9004"}/store/recommendations?placement=product_detail&product_id=${ids[0]}&region_id=${context.region_id}&limit=6`, {
  headers: { "x-publishable-api-key": context.publishable_key }, signal: AbortSignal.timeout(12000),
})
const text = await response.text()
let json
try { json = JSON.parse(text) } catch { json = {} }
const expected = Number(process.env.PDP_PROBE_EXPECT_STATUS || 200)
const validProducts = Array.isArray(json.products) && json.products.length <= 6 && !json.products.some((p) => p.id === ids[0]) && new Set(json.products.map((p) => p.id)).size === json.products.length
console.log(JSON.stringify({ status: response.status, elapsed_ms: Date.now() - start, count: json.products?.length, version: json.version, strategy: json.strategy, expected_status: expected, pass: response.status === expected && (expected !== 200 || validProducts) }))
if (response.status !== expected || (expected === 200 && !validProducts)) process.exitCode = 1
