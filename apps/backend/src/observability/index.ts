import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID, createHash } from "node:crypto"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { Logger } from "@medusajs/framework/types"

const identifier = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/

export function boundedId(value: unknown): string | undefined {
  return typeof value === "string" && identifier.test(value) ? value : undefined
}

// A join key, never an authorization or idempotency key.
export function orderOperationId(orderId: string): string {
  return `order.${createHash("sha256").update(orderId).digest("hex").slice(0, 32)}`
}

type OperationRecord = {
  event:
    | "http.completed"
    | "http.aborted"
    | "order.event.started"
    | "order.event.completed"
    | "order.event.failed"
  request_id?: string
  operation_id: string
  business_operation_id?: string
  route_template?: string
  method?: string
  status_code?: number
  duration_ms?: number
}

export function logOperation(logger: Pick<Logger, "log">, record: OperationRecord) {
  // Explicit projection prevents accidental logging of bodies, tokens and provider errors.
  const entry = {
    timestamp_utc: new Date().toISOString(),
    service: process.env.WORKER_MODE === "worker" ? "worker" : "api",
    release_sha: boundedId(process.env.RELEASE_SHA),
    event: record.event,
    request_id: boundedId(record.request_id),
    operation_id: boundedId(record.operation_id),
    business_operation_id: boundedId(record.business_operation_id),
    route_template: record.route_template,
    method: record.method,
    status_code: record.status_code,
    duration_ms: record.duration_ms,
  }
  const failed =
    record.event.endsWith("failed") ||
    record.event === "http.aborted" ||
    (record.status_code ?? 0) >= 500
  logger.log(failed ? "error" : "info", record.event, entry)
}

function routeTemplate(path: string) {
  // Never log raw paths: unknown routes may contain customer data or tokens.
  const known = path
    .split("?")[0]
    .match(
      /^\/(store|admin)\/(products|carts|orders|recommendations|regions)(?:\/[^/]+)?(?:\/(complete|line-items|shipping-methods))?\/?$/,
    )
  if (!known) return "other"
  const segments = path.split("?")[0].split("/").filter(Boolean)
  return `/${known[1]}/${known[2]}${segments.length >= 3 ? "/:id" : ""}${known[3] ? `/${known[3]}` : ""}`
}

// Parent mounts first on matcher "/*" in api/middlewares.ts. No auth/body access.
export function requestObservability(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const started = performance.now()
  const requestId = randomUUID()
  const operationId = boundedId(req.headers["x-operation-id"]) ?? randomUUID()
  req.requestId = requestId
  res.setHeader("x-request-id", requestId)
  res.setHeader("x-operation-id", operationId)
  const logger = req.scope.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
  let businessOperationId: string | undefined
  const json = res.json.bind(res)
  res.json = (body: unknown) => {
    if (
      body &&
      typeof body === "object" &&
      "type" in body &&
      body.type === "order" &&
      "order" in body
    ) {
      const order = body.order
      if (order && typeof order === "object" && "id" in order && boundedId(order.id)) {
        businessOperationId = orderOperationId(order.id as string)
      }
    }
    return json(body)
  }
  let logged = false
  const finish = (aborted: boolean) => {
    if (logged) return
    logged = true
    logOperation(logger, {
      event: aborted ? "http.aborted" : "http.completed",
      request_id: requestId,
      operation_id: operationId,
      business_operation_id: businessOperationId,
      route_template: routeTemplate(req.path),
      method: ["GET", "POST", "DELETE", "OPTIONS", "HEAD", "PUT", "PATCH"].includes(req.method)
        ? req.method
        : "OTHER",
      status_code: aborted ? undefined : res.statusCode,
      duration_ms: Math.round((performance.now() - started) * 100) / 100,
    })
  }
  res.once("finish", () => finish(false))
  res.once("close", () => finish(!res.writableFinished))
  next()
}
