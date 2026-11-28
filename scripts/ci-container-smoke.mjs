// Read-only probes. Only the isolated GitHub runner stack is accepted.
import { execFileSync } from "node:child_process"
import assert from "node:assert/strict"

assert.equal(process.env.GITHUB_ACTIONS, "true", "Run only on a disposable GitHub runner")
const prefix = process.env.CI_CONTAINER_PREFIX
assert.match(prefix || "", /^daymark-ci-[0-9]+-[0-9]+$/)
const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
assert.ok(key, "Fixture publishable key required")
const api = "http://localhost:9000"
const response = await fetch(`${api}/store/products?handle=dm-tee-core&fields=+images`, {
  headers: { "x-publishable-api-key": key },
  signal: AbortSignal.timeout(15000),
})
assert.equal(response.status, 200, "Catalog HTTP status")
const { products } = await response.json()
assert.equal(products.length, 1, "Published DAYMARK fixture product")
assert.equal(products[0].title, "Core Cotton Tee")
assert.ok(products[0].thumbnail, "Fixture thumbnail required")
const media = new URL(products[0].thumbnail)
assert.equal(media.origin, api, "Media must stay inside disposable fixture")
const image = await fetch(media, { signal: AbortSignal.timeout(15000) })
assert.equal(image.status, 200, "Fixture media HTTP status")
assert.match(image.headers.get("content-type") || "", /^image\//)
assert.ok((await image.arrayBuffer()).byteLength > 0)
for (const path of ["/vn", "/vn/products/dm-tee-core"]) {
  const page = await fetch(`http://localhost:8000${path}`, { signal: AbortSignal.timeout(30000) })
  assert.equal(page.status, 200, `Storefront ${path}`)
  assert.match(await page.text(), /Core Cotton Tee|DAYMARK/)
}
const worker = `${prefix}-worker`
assert.equal(
  execFileSync("docker", ["inspect", "--format", "{{.State.Running}}", worker], {
    encoding: "utf8",
  }).trim(),
  "true",
)
// Medusa start retains /health in worker mode, but skips API/Admin entrypoints.
execFileSync(
  "docker",
  [
    "exec",
    worker,
    "node",
    "-e",
    `
(async () => {
  const health = await fetch('http://127.0.0.1:9000/health', { signal: AbortSignal.timeout(5000) })
  if (health.status !== 200) process.exit(1)
  for (const path of ['/store/products', '/admin/users', '/staff/me', '/app']) {
    const response = await fetch('http://127.0.0.1:9000' + path, { signal: AbortSignal.timeout(5000) })
    if (response.status !== 404) process.exit(1)
  }
})().catch(() => process.exit(1))
`,
  ],
  { stdio: "pipe" },
)
console.log("PASS: catalog, fixture media, storefront and worker API/Admin isolation")
console.log("Worker liveness is not evidence of notification delivery/retry semantics")
