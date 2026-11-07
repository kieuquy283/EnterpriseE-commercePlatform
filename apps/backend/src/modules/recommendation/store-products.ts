import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { GET as nativeGet } from "@medusajs/medusa/api/store/products/route"
import { storeProductRoutesMiddlewares } from "@medusajs/medusa/api/store/products/middlewares"
import { coalesceAnonymous } from "./coalesce"

// Version-coupled adapter for the installed Medusa 2.21.2 Store Product pipeline.
// Preserve its channel, pricing, tax and inventory rules without loopback HTTP.
export async function resolveStoreProducts(req: MedusaRequest, query: Record<string, unknown>) {
  return coalesceAnonymous(req, query, () => resolveNative(req, query))
}

async function resolveNative(req: MedusaRequest, query: Record<string, unknown>) {
  const nativeReq = Object.create(req) as MedusaRequest
  Object.defineProperty(nativeReq, "query", { value: query, writable: true, configurable: true })
  let payload: { products: unknown[] } | undefined
  let rejectMiddleware: ((error: unknown) => void) | undefined
  const nativeRes = {
    json: (body: { products: unknown[] }) => {
      if (rejectMiddleware) rejectMiddleware(new MedusaError(MedusaError.Types.INVALID_DATA, "Store product request rejected"))
      payload = body
      return nativeRes
    },
    status: () => nativeRes,
  } as unknown as MedusaResponse
  const route = storeProductRoutesMiddlewares.find((item) => item.matcher === "/store/products")
  for (const middleware of route?.middlewares || []) {
    await new Promise<void>((resolve, reject) => {
      rejectMiddleware = reject
      const handler = middleware as (request: MedusaRequest, response: MedusaResponse, next: (error?: unknown) => void) => unknown
      try {
        Promise.resolve(handler(nativeReq, nativeRes, (error) => error ? reject(error) : resolve())).catch(reject)
      } catch (error) { reject(error) }
    })
  }
  rejectMiddleware = undefined
  await nativeGet(nativeReq as Parameters<typeof nativeGet>[0], nativeRes)
  if (!payload) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Store product response missing")
  return payload
}
