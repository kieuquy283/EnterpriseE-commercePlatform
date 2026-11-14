import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { pipeline } from "node:stream/promises"
import { resolvePublicImageWorkflow } from "../../../../workflows/resolve-public-image"

// Public route: browsers cannot attach Store API keys to ordinary image requests.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store")
  const { result } = await resolvePublicImageWorkflow(req.scope).run({
    input: { key: `${req.params.prefix}/${req.params.key}` },
  })

  const fileService = req.scope.resolve(Modules.FILE)
  let stream
  try {
    stream = await fileService.getDownloadStream(result.key)
  } catch (error) {
    if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
      res.status(404).json({ message: "Image not found" })
      return
    }
    res.status(502).json({ message: "Image storage unavailable" })
    return
  }

  res.setHeader("Content-Type", result.contentType)
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("Cache-Control", "public, max-age=3600")
  res.on("close", () => stream.destroy())
  try {
    await pipeline(stream, res)
  } catch {
    // pipeline closes the response on an upstream error or client disconnect.
    res.destroy()
  }
}
