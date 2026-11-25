import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  cancelOrderWorkflow,
  createApiKeysWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import seedCommerce from "../../src/scripts/seed-commerce"

jest.setTimeout(180_000)

type RequestConfig = { headers: Record<string, string> }
type ApiClient = {
  get: <T>(path: string, config: RequestConfig) => Promise<{ data: T }>
  post: <T>(
    path: string,
    body: Record<string, unknown>,
    config: RequestConfig,
  ) => Promise<{ data: T }>
}

type AttemptResult = {
  attempt: number
  cart_id: string
  outcome: "accepted" | "rejected" | "idempotent_replay" | "payload_conflict_unenforced"
  failure_class?: "stock_conflict" | "duplicate_complete" | "invalid_state" | "timeout_after_commit" | "payload_mismatch" | "payload_mismatch_unenforced" | "other"
  http_status?: number
  error_type?: string
  error_message?: string
  order_id?: string
  payment_collection_id?: string
}

function storeHeaders(publishableKey: string) {
  return { "x-publishable-api-key": publishableKey }
}

async function classifyApiError(error: unknown): Promise<{
  http_status?: number
  error_type?: string
  error_message?: string
}> {
  if (typeof error !== "object" || error === null) {
    return {}
  }
  const candidate = error as {
    response?: { status?: number; data?: { type?: string; message?: string } }
  }
  return {
    http_status: candidate.response?.status,
    error_type: candidate.response?.data?.type,
    error_message: candidate.response?.data?.message,
  }
}

function classifyFailure(status?: number, type?: string, message?: string) {
  if (status === 409 || /inventory|stock|reservation|backorder/i.test(message ?? "")) {
    return "stock_conflict"
  }
  if (/completed|already.*complete|no.*complete|cart.*not.*found/i.test(`${type ?? ""} ${message ?? ""}`)) {
    return "duplicate_complete"
  }
  if (status === 400 || type === "invalid_data") {
    return "invalid_state"
  }
  return "other"
}

async function prepareCart(
  api: ApiClient,
  headers: RequestConfig,
  email: string,
) {
  const { data: regionResponse } = await api.get<{
    regions: Array<{ id: string; name: string }>
  }>("/store/regions", headers)
  const region = regionResponse.regions.find((item) => item.name === "Vietnam")
  if (!region) throw new Error("Vietnam region is not seeded")

  const { data: productResponse } = await api.get<{
    products: Array<{ variants?: Array<{ id: string }> }>
  }>(`/store/products?handle=ao-thun-essential&region_id=${region.id}`, headers)
  const variant = productResponse.products[0]?.variants?.[0]
  if (!variant) throw new Error("Seed product variant is not available")

  const { data: cartResponse } = await api.post<{ cart: { id: string } }>(
    "/store/carts",
    { region_id: region.id },
    headers,
  )
  const cartId = cartResponse.cart.id
  await api.post(
    `/store/carts/${cartId}/line-items`,
    { variant_id: variant.id, quantity: 1 },
    headers,
  )
  const address = {
    first_name: "Concurrency",
    last_name: "Audit",
    address_1: "1 Test Street",
    city: "Ho Chi Minh City",
    postal_code: "700000",
    country_code: "vn",
  }
  await api.post(
    `/store/carts/${cartId}`,
    { email, shipping_address: address, billing_address: address },
    headers,
  )
  const { data: shippingResponse } = await api.get<{
    shipping_options: Array<{ id: string }>
  }>(`/store/shipping-options?cart_id=${cartId}`, headers)
  const shippingOption = shippingResponse.shipping_options[0]
  if (!shippingOption) throw new Error("No shipping option is available")
  await api.post(
    `/store/carts/${cartId}/shipping-methods`,
    { option_id: shippingOption.id },
    headers,
  )
  const { data: paymentResponse } = await api.post<{
    payment_collection: { id: string }
  }>("/store/payment-collections", { cart_id: cartId }, headers)
  await api.post(
    `/store/payment-collections/${paymentResponse.payment_collection.id}/payment-sessions`,
    { provider_id: "pp_system_default" },
    headers,
  )
  return { cartId, paymentCollectionId: paymentResponse.payment_collection.id }
}

async function getInventoryFixture(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
    filters: { sku: "TEE-ESSENTIAL-BLK" },
  })
  const inventoryItem = inventoryItems[0]
  if (!inventoryItem) throw new Error("Seed inventory item is not available")
  const inventory = container.resolve(Modules.INVENTORY)
  const levels = await inventory.listInventoryLevels(
    { inventory_item_id: inventoryItem.id },
    { take: null },
  )
  if (levels.length !== 1) throw new Error("BE-03 expects one inventory level")
  return { inventory, inventoryItem, level: levels[0] }
}

async function getCartEffects(
  container: MedusaContainer,
  cartIds: string[],
) {
  if (!cartIds.length) return { orders: [], payments: [], reservations: [] }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orderLinks } = await query.graph({
    entity: "order_cart",
    fields: ["order_id", "cart_id"],
    filters: { cart_id: cartIds },
  })
  const orderIds = orderLinks.map((link: { order_id: string }) => link.order_id)
  const { data: orders } = orderIds.length
    ? await query.graph({
        entity: "order",
        fields: ["id"],
        filters: { id: orderIds },
      })
    : { data: [] }
  const { data: paymentLinks } = orderIds.length
    ? await query.graph({
        entity: "order_payment_collection",
        fields: ["order_id", "payment_collection_id"],
        filters: { order_id: orderIds },
      })
    : { data: [] }
  const paymentIds = paymentLinks.map(
    (link: { payment_collection_id: string }) => link.payment_collection_id,
  )
  const { data: payments } = paymentIds.length
    ? await query.graph({
        entity: "payment_collection",
        fields: ["id", "status"],
        filters: { id: paymentIds },
      })
    : { data: [] }
  const inventory = container.resolve(Modules.INVENTORY)
  const reservationRows = await inventory.listReservationItems(
    {},
    { take: null },
  )
  const reservations = reservationRows.map((reservation) => ({
    id: reservation.id,
    quantity: reservation.quantity,
    line_item_id: reservation.line_item_id,
  }))
  return { orders, payments, reservations }
}

medusaIntegrationTestRunner({
  env: {
    REDIS_URL: "",
  },
  testSuite: ({ api, getContainer }) => {
    let publishableKey: string
    let evidenceDir: string
    let runId: string
    const storeApi: ApiClient = api

    beforeAll(async () => {
      runId = randomUUID()
      evidenceDir = resolve(
        process.cwd(),
        "../../docs/report/evidence/be-03-2026-11-22",
      )
      await mkdir(evidenceDir, { recursive: true })

      const container = getContainer()
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: shippingProfiles } = await query.graph({
        entity: "shipping_profile",
        fields: ["id"],
      })
      if (!shippingProfiles.length) {
        await createShippingProfilesWorkflow(container).run({
          input: { data: [{ name: "Default Shipping Profile", type: "default" }] },
        })
      }
      await seedCommerce({ container, args: [] })
      const { data: salesChannels } = await query.graph({
        entity: "sales_channel",
        fields: ["id", "name"],
        filters: { name: "Online Store" },
      })
      if (salesChannels.length !== 1) throw new Error("Online Store is not seeded")
      const {
        result: [apiKey],
      } = await createApiKeysWorkflow(container).run({
        input: {
          api_keys: [{
            title: "BE-03 concurrency test",
            type: "publishable",
            created_by: "",
          }],
        },
      })
      publishableKey = apiKey.token
      await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: { id: apiKey.id, add: [salesChannels[0].id] },
      })
    })

    it("allows only one order and payment effect for concurrent duplicate completion", async () => {
      const headers = { headers: storeHeaders(publishableKey) }
      const checkout = await prepareCart(
        storeApi,
        headers,
        `be03-duplicate-${runId}@example.test`,
      )
      const calls = await Promise.allSettled([
        storeApi.post(
          `/store/carts/${checkout.cartId}/complete`,
          {},
          headers,
        ),
        storeApi.post(
          `/store/carts/${checkout.cartId}/complete`,
          {},
          headers,
        ),
      ])
      const attempts: AttemptResult[] = []
      const fulfilledOrderIds = new Set<string>()
      for (let index = 0; index < calls.length; index += 1) {
        const call = calls[index]
        if (call.status === "fulfilled") {
          const orderId = (call.value.data as { order?: { id: string } }).order?.id
          const outcome = orderId && fulfilledOrderIds.has(orderId)
            ? "idempotent_replay"
            : "accepted"
          if (orderId) fulfilledOrderIds.add(orderId)
          attempts.push({
            attempt: index + 1,
            cart_id: checkout.cartId,
            outcome,
            order_id: orderId,
            payment_collection_id: checkout.paymentCollectionId,
          })
        } else {
          const error = await classifyApiError(call.reason)
          attempts.push({
            attempt: index + 1,
            cart_id: checkout.cartId,
            outcome: "rejected",
            failure_class: classifyFailure(
              error.http_status,
              error.error_type,
              error.error_message,
            ),
            ...error,
          })
        }
      }

      const effects = await getCartEffects(getContainer(), [checkout.cartId])
      expect(effects.orders).toHaveLength(1)
      expect(effects.payments).toHaveLength(1)
      expect(
        new Set(attempts.map((attempt) => attempt.order_id).filter(Boolean)).size,
      ).toBe(1)

      await writeFile(
        resolve(evidenceDir, "duplicate-completion.json"),
        JSON.stringify({ run_id: runId, attempts, effects, verdict: "PASS" }, null, 2),
        "utf8",
      )
    })

    it("treats a post-commit retry and a conflicting payload as no-duplicate outcomes", async () => {
      const headers = { headers: storeHeaders(publishableKey) }
      const checkout = await prepareCart(
        storeApi,
        headers,
        `be03-retry-${runId}@example.test`,
      )
      const first = await storeApi.post<{
        type: string
        order: { id: string }
      }>(`/store/carts/${checkout.cartId}/complete`, { intent_payload: "A" }, headers)
      expect(first.data.type).toBe("order")
      const orderId = first.data.order.id

      const retryCalls = await Promise.allSettled([
        storeApi.post(
          `/store/carts/${checkout.cartId}/complete`,
          { intent_payload: "A" },
          headers,
        ),
        storeApi.post(
          `/store/carts/${checkout.cartId}/complete`,
          { intent_payload: "B" },
          headers,
        ),
      ])
      const attempts: AttemptResult[] = [{
        attempt: 1,
        cart_id: checkout.cartId,
        outcome: "accepted",
        order_id: orderId,
        payment_collection_id: checkout.paymentCollectionId,
      }]
      for (let index = 0; index < retryCalls.length; index += 1) {
        const call = retryCalls[index]
        if (call.status === "rejected") {
          const error = await classifyApiError(call.reason)
          attempts.push({
            attempt: index + 2,
            cart_id: checkout.cartId,
            outcome: "rejected",
            failure_class: index === 1
              ? "payload_mismatch"
              : "timeout_after_commit",
            ...error,
          })
        } else {
          const replayOrderId = (call.value.data as { order?: { id: string } }).order?.id
          attempts.push({
            attempt: index + 2,
            cart_id: checkout.cartId,
            outcome: index === 1
              ? "payload_conflict_unenforced"
              : "idempotent_replay",
            failure_class: index === 1
              ? "payload_mismatch_unenforced"
              : "timeout_after_commit",
            order_id: replayOrderId,
          })
        }
      }
      const effects = await getCartEffects(getContainer(), [checkout.cartId])
      expect(effects.orders).toHaveLength(1)
      expect(effects.payments).toHaveLength(1)
      expect(
        new Set(attempts.map((attempt) => attempt.order_id).filter(Boolean)).size,
      ).toBe(1)

      await writeFile(
        resolve(evidenceDir, "timeout-payload-retry.json"),
        JSON.stringify({
          run_id: runId,
          intent: "same-cart-post-commit-recovery",
          attempts,
          effects,
          verdict: attempts.some(
            (attempt) => attempt.failure_class === "payload_mismatch_unenforced",
          )
            ? "FAIL_PAYLOAD_MISMATCH_UNENFORCED"
            : "PASS",
        }, null, 2),
        "utf8",
      )
    })

    it("accepts no more than five of twenty last-unit attempts and reconciles reservations", async () => {
      const container = getContainer()
      const fixture = await getInventoryFixture(container)
      const baselineStocked = fixture.level.stocked_quantity
      const baselineReserved = fixture.level.reserved_quantity
      await fixture.inventory.updateInventoryLevels({
        inventory_item_id: fixture.level.inventory_item_id,
        location_id: fixture.level.location_id,
        stocked_quantity: Number(baselineReserved) + 5,
      })

      const headers = { headers: storeHeaders(publishableKey) }
      const checkouts: Array<{ cartId: string; paymentCollectionId: string }> = []
      let acceptedOrderIds: string[] = []
      try {
        for (let index = 0; index < 20; index += 1) {
          checkouts.push(await prepareCart(
            storeApi,
            headers,
            `be03-stock-${runId}-${index}@example.test`,
          ))
        }

        const completionCalls = await Promise.allSettled(
          checkouts.map((checkout) =>
            storeApi.post(
              `/store/carts/${checkout.cartId}/complete`,
              { attempt: "last-unit-concurrency" },
              headers,
            )),
        )
        const attempts: AttemptResult[] = []
        for (let index = 0; index < completionCalls.length; index += 1) {
          const call = completionCalls[index]
          const checkout = checkouts[index]
          if (call.status === "fulfilled") {
            attempts.push({
              attempt: index + 1,
              cart_id: checkout.cartId,
              outcome: "accepted",
              order_id: (call.value.data as { order?: { id: string } }).order?.id,
              payment_collection_id: checkout.paymentCollectionId,
            })
          } else {
            const error = await classifyApiError(call.reason)
            attempts.push({
              attempt: index + 1,
              cart_id: checkout.cartId,
              outcome: "rejected",
              failure_class: classifyFailure(
                error.http_status,
                error.error_type,
                error.error_message,
              ),
              ...error,
            })
          }
        }

        const cartIds = checkouts.map((checkout) => checkout.cartId)
        const effects = await getCartEffects(container, cartIds)
        const accepted = attempts.filter((attempt) => attempt.outcome === "accepted")
        const rejected = attempts.filter((attempt) => attempt.outcome === "rejected")
        acceptedOrderIds = accepted
          .map((attempt) => attempt.order_id)
          .filter((orderId): orderId is string => Boolean(orderId))
        const reconciledLevels = await fixture.inventory.listInventoryLevels(
          {
            inventory_item_id: fixture.level.inventory_item_id,
            location_id: fixture.level.location_id,
          },
          { take: null },
        )
        const reconciledLevel = reconciledLevels[0]

        expect(accepted.length).toBeLessThanOrEqual(5)
        expect(effects.orders.length).toBe(accepted.length)
        expect(effects.orders.length).toBeLessThanOrEqual(5)
        expect(Number(reconciledLevel.reserved_quantity)).toBe(
          Number(baselineReserved) + accepted.length,
        )
        expect(
          Number(reconciledLevel.stocked_quantity) -
            Number(reconciledLevel.reserved_quantity),
        ).toBe(5 - accepted.length)

        const reconciliation = {
          run_id: runId,
          fixture: {
            target_available_units: 5,
            attempted_orders: 20,
            baseline_stocked_quantity: baselineStocked,
            baseline_reserved_quantity: baselineReserved,
          },
          accepted_count: accepted.length,
          rejected_count: rejected.length,
          attempts,
          reconciliation: {
            order_count: effects.orders.length,
            payment_count: effects.payments.length,
            reservation_count: effects.reservations.length,
            accepted_reservation_quantity: accepted.length,
            reserved_quantity_before: baselineReserved,
            reserved_quantity_after: reconciledLevel.reserved_quantity,
            available_quantity_after:
              Number(reconciledLevel.stocked_quantity) -
              Number(reconciledLevel.reserved_quantity),
          },
          verdict: accepted.length === 5 ? "PASS" : "FAIL",
        }
        await writeFile(
          resolve(evidenceDir, "reconciliation.json"),
          JSON.stringify(reconciliation, null, 2),
          "utf8",
        )
        const csv = [
          "attempt,cart_id,outcome,failure_class,http_status,error_type,order_id,payment_collection_id",
          ...attempts.map((attempt) => [
            attempt.attempt,
            attempt.cart_id,
            attempt.outcome,
            attempt.failure_class ?? "",
            attempt.http_status ?? "",
            attempt.error_type ?? "",
            attempt.order_id ?? "",
            attempt.payment_collection_id ?? "",
          ].join(",")),
        ].join("\n") + "\n"
        await writeFile(resolve(evidenceDir, "reconciliation.csv"), csv, "utf8")
        expect(accepted.length).toBe(5)
        expect(rejected.length).toBe(15)
      } finally {
        for (const orderId of acceptedOrderIds) {
          await cancelOrderWorkflow(container).run({ input: { order_id: orderId } })
        }
        await fixture.inventory.updateInventoryLevels({
          inventory_item_id: fixture.level.inventory_item_id,
          location_id: fixture.level.location_id,
          stocked_quantity: baselineStocked,
        })
      }
    })
  },
})
