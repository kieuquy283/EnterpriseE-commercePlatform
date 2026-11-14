import express from "express"
import { createServer, get, type Server } from "node:http"
import { once } from "node:events"
import { Readable } from "node:stream"
import { GET } from "../[prefix]/[key]/route"
import { resolvePublicImage } from "../../../workflows/resolve-public-image"

jest.mock("../../../workflows/resolve-public-image", () => {
  const actual = jest.requireActual("../../../workflows/resolve-public-image")
  return {
    ...actual,
    resolvePublicImageWorkflow: () => ({
      run: async ({ input }) => ({ result: actual.resolvePublicImage(input.key) }),
    }),
  }
})

describe("public image proxy", () => {
  const originalEnv = { ...process.env }
  const download = jest.fn()
  let server: Server
  let baseUrl: string

  beforeAll(async () => {
    const app = express()
    app.get("/product-images/:prefix/:key", (req, res, next) => {
      Object.assign(req, { scope: { resolve: () => ({ getDownloadStream: download }) } })
      GET(req as never, res as never).catch(next)
    })
    app.use((error, _req, res, _next) => {
      res.status(error.type === "not_found" ? 404 : 500).json({ message: error.message })
    })
    server = createServer(app)
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    const address = server.address()
    baseUrl = `http://127.0.0.1:${typeof address === "object" && address?.port}`
  })

  beforeEach(() => {
    process.env.S3_PUBLIC_IMAGE_PROXY = "true"
    process.env.S3_BUCKET = "private-images"
    download.mockReset()
  })

  afterAll(async () => {
    process.env = originalEnv
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  })

  it("streams exact image bytes without a publishable key, including encoded filenames", async () => {
    const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    download.mockResolvedValue(Readable.from([bytes]))
    const response = await fetch(`${baseUrl}/product-images/public-images/photo%20one.png`)
    expect(response.status).toBe(200)
    expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes)
    expect(download).toHaveBeenCalledWith("public-images/photo one.png")
    expect(response.headers.get("content-type")).toBe("image/png")
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600")
    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
  })

  it.each([
    "private/document.png", "public-images/catalog/photo.png", "public-images/../private.png", "public-images/./photo.png",
    "public-images//photo.png", "public-images/photo.svg", "public-images/page.html",
    "public-images/photo.constructor", "public-images/bad\\photo.png", "public-images/bad\u0000.png",
    `public-images/${"x".repeat(1024)}.png`,
  ])("rejects unsafe or non-image key %s", (key) => {
    expect(() => resolvePublicImage(key)).toThrow("Image not found")
  })

  it("rejects directory-style image URLs without accessing storage", async () => {
    const response = await fetch(`${baseUrl}/product-images/public-images/catalog/photo.png`)
    expect(response.status).toBe(404)
    expect(download).not.toHaveBeenCalled()
  })

  it("rejects encoded directory separators without accessing storage", async () => {
    const response = await fetch(`${baseUrl}/product-images/public-images/catalog%2Fphoto.png`)
    expect(response.status).toBe(404)
    expect(download).not.toHaveBeenCalled()
  })

  it("does not access storage for a private-prefix request", async () => {
    const response = await fetch(`${baseUrl}/product-images/private/photo.png`)
    expect(response.status).toBe(404)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(download).not.toHaveBeenCalled()
  })

  it("closes the upstream stream when the image client disconnects", async () => {
    let sent = false
    const stream = new Readable({
      read() {
        if (!sent) {
          sent = true
          this.push(Buffer.from("partial image"))
        }
      },
    })
    const closed = once(stream, "close")
    download.mockResolvedValue(stream)
    await new Promise<void>((resolve, reject) => {
      get(`${baseUrl}/product-images/public-images/photo.jpg`, (response) => {
        response.once("data", () => {
          response.destroy()
          resolve()
        })
      }).on("error", reject)
    })
    await closed
    expect(stream.destroyed).toBe(true)
  })

  it("terminates an incomplete response on an upstream stream failure", async () => {
    download.mockResolvedValue(new Readable({
      read() {
        this.destroy(new Error("upstream read failed"))
      },
    }))
    await expect((async () => {
      const response = await fetch(`${baseUrl}/product-images/public-images/photo.jpg`)
      await response.arrayBuffer()
    })()).rejects.toThrow()
  })

  it("fails closed when proxy configuration is disabled", () => {
    delete process.env.S3_PUBLIC_IMAGE_PROXY
    expect(() => resolvePublicImage("public-images/photo.jpg")).toThrow("Image not found")
  })

  it.each([
    [{ name: "NoSuchKey" }, 404],
    [{ $metadata: { httpStatusCode: 404 } }, 404],
    [{ name: "AccessDenied", message: "internal storage details" }, 502],
  ])("returns an uncached safe storage error", async (error, status) => {
    download.mockRejectedValue(error)
    const response = await fetch(`${baseUrl}/product-images/public-images/photo.jpg`)
    expect(response.status).toBe(status)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(await response.text()).not.toContain("internal storage details")
  })
})
