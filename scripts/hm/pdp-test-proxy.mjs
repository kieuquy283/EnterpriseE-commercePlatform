// Local-only fault harness. Never deployed or registered as an application route.
import http from "node:http"
import fs from "node:fs"
import path from "node:path"

const root = path.resolve("data/hm/processed/pdp-verification")
fs.mkdirSync(root, { recursive: true })
const modeFile = path.join(root, "proxy-mode.json")
if (!fs.existsSync(modeFile)) fs.writeFileSync(modeFile, JSON.stringify({ mode: "normal" }))
const allowed = new Set(["normal", "503", "404", "empty", "timeout", "duplicates", "hybrid"])
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1")
    const mode = JSON.parse(fs.readFileSync(modeFile, "utf8")).mode
    if (!allowed.has(mode)) throw new Error("Invalid test mode")
    if (url.pathname === "/store/recommendations" && mode !== "normal") {
      if (mode === "timeout") await new Promise((resolve) => setTimeout(resolve, 6500))
      if (["503", "404", "timeout"].includes(mode)) {
        res.writeHead(mode === "404" ? 404 : 503, { "content-type": "application/json" })
        return res.end(JSON.stringify({ message: "Injected recommendation failure" }))
      }
      if (mode === "empty") {
        res.writeHead(200, { "content-type": "application/json" })
        return res.end(JSON.stringify({ strategy: "catalog_featured", products: [] }))
      }
    }
    const headers = { ...req.headers }
    delete headers.host
    delete headers.connection
    delete headers["accept-encoding"]
    const body = []
    for await (const chunk of req) body.push(chunk)
    const response = await fetch(`http://127.0.0.1:9004${req.url}`, {
      method: req.method, headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(body),
      signal: AbortSignal.timeout(15000),
    })
    const outgoing = Object.fromEntries(response.headers)
    delete outgoing["content-encoding"]
    delete outgoing["content-length"]
    delete outgoing["transfer-encoding"]
    res.writeHead(response.status, outgoing)
    if (url.pathname === "/store/recommendations" && ["duplicates", "hybrid"].includes(mode) && response.ok) {
      const json = await response.json()
      if (mode === "duplicates" && json.products?.length) json.products = [...json.products, ...json.products]
      if (mode === "hybrid" && url.searchParams.get("placement") === "product_detail" && json.strategy === "hm_metadata_similarity") {
        json.strategy = "hm_hybrid_similarity"
      }
      return res.end(JSON.stringify(json))
    }
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch {
    if (!res.headersSent) res.writeHead(502)
    res.end()
  }
})
server.listen(9006, "127.0.0.1", () => console.log("PDP test-only fault proxy listening on 127.0.0.1:9006"))
