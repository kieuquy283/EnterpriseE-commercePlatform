import express from "express"
import { createServer, type Server } from "node:http"
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { requestObservability, orderOperationId } from ".."

describe("observability over real isolated HTTP", () => {
  let server: Server
  let base: string
  const lines: string[] = []
  beforeAll(async () => {
    const app = express()
    app.use((req, res, next) => {
      Object.assign(req, {
        scope: {
          resolve: () => ({
            log: (_level: string, _message: string, entry: unknown) =>
              lines.push(JSON.stringify(entry)),
          }),
        },
      })
      requestObservability(req as MedusaRequest, res as MedusaResponse, next as MedusaNextFunction)
    })
    app.post("/store/carts/:id/complete", (_req, res) =>
      res.json({ type: "order", order: { id: "order_fixture", email: "private@example.test" } }),
    )
    app.get("/failure/:token", (_req, res) =>
      res.status(503).json({ message: "Dependency unavailable" }),
    )
    server = createServer(app)
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    const address = server.address()
    if (!address || typeof address === "string") throw new Error("Missing isolated listener")
    base = `http://127.0.0.1:${address.port}`
  })
  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  })
  it("keeps retry operation stable and request IDs distinct, joining the order event", async () => {
    const first = await fetch(`${base}/store/carts/cart_fixture/complete?token=secret`, {
      method: "POST",
      headers: { "x-operation-id": "retry-1", authorization: "Bearer private" },
    })
    await first.json()
    const retry = await fetch(`${base}/store/carts/cart_fixture/complete`, {
      method: "POST",
      headers: { "x-operation-id": "retry-1" },
    })
    await retry.json()
    expect(first.headers.get("x-request-id")).not.toBe(retry.headers.get("x-request-id"))
    expect(retry.headers.get("x-operation-id")).toBe("retry-1")
    expect(lines.slice(-2).map((line) => JSON.parse(line))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operation_id: "retry-1",
          business_operation_id: orderOperationId("order_fixture"),
          route_template: "/store/carts/:id/complete",
          status_code: 200,
        }),
      ]),
    )
    expect(lines.join("\n")).not.toMatch(/private|secret|cart_fixture|order_fixture/)
  })
  it("records a real 503 with an opaque route and replaces invalid operation IDs", async () => {
    const result = await fetch(`${base}/failure/private-token`, {
      headers: { "x-operation-id": "bad@value" },
    })
    await result.json()
    expect(result.status).toBe(503)
    expect(result.headers.get("x-operation-id")).toMatch(/^[a-f0-9-]{36}$/)
    expect(JSON.parse(lines.at(-1)!)).toMatchObject({
      event: "http.completed",
      status_code: 503,
      route_template: "other",
    })
    expect(lines.join("\n")).not.toContain("private-token")
  })
})
