import { randomUUID } from "node:crypto"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  cancelOrderWorkflow,
  capturePaymentWorkflow,
  createApiKeysWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import seedCommerce from "../../src/scripts/seed-commerce"
import PersonalizationModuleService from "../../src/modules/personalization/service"

jest.setTimeout(120_000)

type ApiClient = {
  get: <T>(path: string, config: RequestConfig) => Promise<{ data: T }>
  post: <T>(
    path: string,
    body: Record<string, unknown>,
    config: RequestConfig,
  ) => Promise<{ data: T; status: number }>
}

type RequestConfig = {
  headers: Record<string, string>
}

type CheckoutOptions = {
  providerId?: string
  paymentData?: Record<string, unknown>
  createPaymentSession?: boolean
}

function storeHeaders(publishableKey: string, token?: string) {
  return {
    "x-publishable-api-key": publishableKey,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const simulatorProviderId = "pp_simulator_simulator"
const codProviderId = "pp_system_default"

type Completion = {
  type: string
  order?: { id: string }
}

async function completeCheckout(api: ApiClient, headers: RequestConfig["headers"], cartId: string) {
  return api.post<Completion>(`/store/carts/${cartId}/complete`, {}, { headers })
}

async function attemptCheckout(api: ApiClient, headers: RequestConfig["headers"], cartId: string) {
  try {
    const { data, status } = await completeCheckout(api, headers, cartId)
    return { cartId, status, type: data.type, orderId: data.order?.id }
  } catch (error) {
    const { response } = error as {
      response?: { status: number; data?: { type?: string; message?: string } }
    }
    return {
      cartId,
      status: response?.status ?? null,
      type: response?.data?.type,
      orderId: undefined,
      insufficientStock:
        response?.data?.message?.startsWith("Not enough stock available for item ") ?? false,
    }
  }
}

async function prepareCheckout(
  api: ApiClient,
  headers: ReturnType<typeof storeHeaders>,
  email: string,
  options: CheckoutOptions = {},
) {
  const { providerId = simulatorProviderId, createPaymentSession = true } = options
  const paymentData =
    options.paymentData === undefined && providerId === simulatorProviderId
      ? { simulated_outcome: true }
      : options.paymentData
  const { data: regionResponse } = await api.get<{
    regions: Array<{ id: string; name: string }>
  }>("/store/regions", { headers })
  const region = regionResponse.regions.find((item) => item.name === "Vietnam")
  if (!region) {
    throw new Error("Vietnam region is not seeded")
  }

  const { data: productResponse } = await api.get<{
    products: Array<{ variants?: Array<{ id: string }> }>
  }>(`/store/products?handle=ao-thun-essential&region_id=${region.id}`, { headers })
  const variant = productResponse.products[0]?.variants?.[0]
  if (!variant) {
    throw new Error("Seed product variant is not available")
  }

  const { data: cartResponse } = await api.post<{ cart: { id: string } }>(
    "/store/carts",
    { region_id: region.id },
    { headers },
  )
  const cartId = cartResponse.cart.id

  await api.post(
    `/store/carts/${cartId}/line-items`,
    { variant_id: variant.id, quantity: 1 },
    { headers },
  )

  const address = {
    first_name: "Integration",
    last_name: "Test",
    address_1: "1 Test Street",
    city: "Ho Chi Minh City",
    postal_code: "700000",
    country_code: "vn",
    phone: "+84900000000",
  }
  await api.post(
    `/store/carts/${cartId}`,
    { email, shipping_address: address, billing_address: address },
    { headers },
  )

  const { data: shippingResponse } = await api.get<{
    shipping_options: Array<{ id: string }>
  }>(`/store/shipping-options?cart_id=${cartId}`, { headers })
  const shippingOption = shippingResponse.shipping_options[0]
  if (!shippingOption) {
    throw new Error("No shipping option is available for the test cart")
  }
  await api.post(
    `/store/carts/${cartId}/shipping-methods`,
    { option_id: shippingOption.id },
    { headers },
  )

  const { data: paymentResponse } = await api.post<{
    payment_collection: { id: string }
  }>("/store/payment-collections", { cart_id: cartId }, { headers })
  if (createPaymentSession) {
    await api.post(
      `/store/payment-collections/${paymentResponse.payment_collection.id}/payment-sessions`,
      {
        provider_id: providerId,
        ...(paymentData ? { data: paymentData } : {}),
      },
      { headers },
    )
  }

  return {
    cartId,
    paymentCollectionId: paymentResponse.payment_collection.id,
  }
}

async function getPaymentSessions(container: MedusaContainer, paymentCollectionId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: paymentSessions } = await query.graph({
    entity: "payment_session",
    fields: ["id", "provider_id", "data"],
    filters: { payment_collection_id: paymentCollectionId },
  })

  return paymentSessions
}

type Checkout = Awaited<ReturnType<typeof prepareCheckout>>

async function getInventorySnapshot(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
    filters: { sku: "TEE-ESSENTIAL-BLK" },
  })
  const inventoryItem = inventoryItems[0]

  if (!inventoryItem) {
    throw new Error("Seed inventory item is not available")
  }

  const inventory = container.resolve(Modules.INVENTORY)
  const filter = { inventory_item_id: inventoryItem.id }
  const [levels, reservations] = await Promise.all([
    inventory.listInventoryLevels(filter, { take: null, order: { id: "ASC" } }),
    inventory.listReservationItems(filter, { take: null, order: { id: "ASC" } }),
  ])
  return {
    levels: levels.map((level) => ({
      id: level.id,
      inventory_item_id: level.inventory_item_id,
      location_id: level.location_id,
      stocked_quantity: Number(level.stocked_quantity),
      reserved_quantity: Number(level.reserved_quantity),
    })),
    reservations: reservations.map((reservation) => ({
      id: reservation.id,
      location_id: reservation.location_id,
      line_item_id: reservation.line_item_id,
      quantity: Number(reservation.quantity),
    })),
  }
}

async function getCheckoutReadback(container: MedusaContainer, checkouts: Checkout[]) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const order = container.resolve(Modules.ORDER)
  const payment = container.resolve(Modules.PAYMENT)
  const collectionIds = checkouts.map(({ paymentCollectionId }) => paymentCollectionId)
  const [cartLinks, paymentLinks, collections, orders, inventory] = await Promise.all([
    query.graph({
      entity: "order_cart",
      fields: ["cart_id", "order_id"],
      filters: { cart_id: checkouts.map(({ cartId }) => cartId) },
    }),
    query.graph({
      entity: "order_payment_collection",
      fields: ["order_id", "payment_collection_id"],
      filters: { payment_collection_id: collectionIds },
    }),
    payment.listPaymentCollections(
      { id: collectionIds },
      {
        take: null,
        order: { id: "ASC" },
        relations: [
          "payment_sessions",
          "payments.payment_session",
          "payments.captures",
          "payments.refunds",
        ],
      },
    ),
    order.listOrders({}, { take: null, order: { id: "ASC" }, relations: ["items"] }),
    getInventorySnapshot(container),
  ])
  const fulfillmentLinks = orders.length
    ? (
        await query.graph({
          entity: "order_fulfillment",
          fields: ["order_id", "fulfillment_id"],
          filters: { order_id: orders.map(({ id }) => id) },
        })
      ).data
    : []

  return {
    cartLinks: cartLinks.data
      .map(({ cart_id, order_id }) => ({ cart_id, order_id }))
      .sort((left, right) => left.cart_id.localeCompare(right.cart_id)),
    paymentLinks: paymentLinks.data
      .map(({ order_id, payment_collection_id }) => ({
        order_id,
        payment_collection_id,
      }))
      .sort((left, right) => left.payment_collection_id.localeCompare(right.payment_collection_id)),
    orders: orders.map((row) => ({
      id: row.id,
      status: row.status,
      currency_code: row.currency_code,
      items: row.items?.map(({ id, quantity }) => ({ id, quantity: Number(quantity) })),
    })),
    fulfillmentLinks: fulfillmentLinks.map(({ order_id, fulfillment_id }) => ({
      order_id,
      fulfillment_id,
    })),
    collections: collections.map((collection) => ({
      id: collection.id,
      status: collection.status,
      amount: Number(collection.amount),
      currency_code: collection.currency_code,
      authorized_amount: Number(collection.authorized_amount ?? 0),
      captured_amount: Number(collection.captured_amount ?? 0),
      sessions:
        collection.payment_sessions?.map(({ id, status, provider_id }) => ({
          id,
          status,
          provider_id,
        })) ?? [],
      payments:
        collection.payments?.map((row) => ({
          id: row.id,
          payment_session_id: row.payment_session?.id,
          canceled: Boolean(row.canceled_at),
          captures: row.captures?.map(({ id, amount }) => ({ id, amount: Number(amount) })) ?? [],
          refunds: row.refunds?.map(({ id, amount }) => ({ id, amount: Number(amount) })) ?? [],
        })) ?? [],
    })),
    ...inventory,
  }
}

function recordReadback(scenario: string, evidence: object) {
  if (process.env.DAYMARK_DATA_03_EVIDENCE === "1") {
    console.log(`DATA-03 ${JSON.stringify({ scenario, ...evidence })}`)
  }
}

type CheckoutReadback = Awaited<ReturnType<typeof getCheckoutReadback>>

function expectAuthorized(
  collection: CheckoutReadback["collections"][number],
  providerId = simulatorProviderId,
) {
  expect(collection).toMatchObject({
    status: "authorized",
    amount: 279000,
    currency_code: "vnd",
    authorized_amount: 279000,
    captured_amount: 0,
    sessions: [{ provider_id: providerId, status: "authorized" }],
  })
  expect(collection.payments).toMatchObject([
    {
      payment_session_id: collection.sessions[0].id,
      canceled: false,
      captures: [],
      refunds: [],
    },
  ])
}

function expectOrderReservation(readback: CheckoutReadback, checkout: Checkout, orderId: string) {
  expect(readback.cartLinks.filter(({ cart_id }) => cart_id === checkout.cartId)).toEqual([
    { cart_id: checkout.cartId, order_id: orderId },
  ])
  expect(readback.paymentLinks.filter(({ order_id }) => order_id === orderId)).toEqual([
    { order_id: orderId, payment_collection_id: checkout.paymentCollectionId },
  ])
  const order = readback.orders.find(({ id }) => id === orderId)
  expect(order).toMatchObject({ status: "pending", currency_code: "vnd", items: [{ quantity: 1 }] })
  const lineItemId = order?.items?.[0]?.id
  expect(lineItemId).toBeDefined()
  expect(readback.reservations.filter(({ line_item_id }) => line_item_id === lineItemId)).toEqual([
    expect.objectContaining({ location_id: readback.levels[0].location_id, quantity: 1 }),
  ])
  expect(readback.fulfillmentLinks.filter(({ order_id }) => order_id === orderId)).toEqual([])
}

medusaIntegrationTestRunner({
  env: {
    REDIS_URL: "",
    ENABLE_PERSONALIZED_RECOMMENDATIONS: "true",
    ENABLE_PERSONALIZATION_ORDER_EVENTS: "true",
  },
  testSuite: ({ api, getContainer }) => {
    let publishableKey: string
    const storeApi: ApiClient = api

    beforeAll(async () => {
      const container = getContainer()
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: shippingProfiles } = await query.graph({
        entity: "shipping_profile",
        fields: ["id"],
      })
      if (!shippingProfiles.length) {
        await createShippingProfilesWorkflow(container).run({
          input: {
            data: [{ name: "Default Shipping Profile", type: "default" }],
          },
        })
      }

      await seedCommerce({ container, args: [] })
      await seedCommerce({ container, args: [] })

      const { data: salesChannels } = await query.graph({
        entity: "sales_channel",
        fields: ["id", "name"],
        filters: { name: "Online Store" },
      })
      expect(salesChannels).toHaveLength(1)

      const {
        result: [apiKey],
      } = await createApiKeysWorkflow(container).run({
        input: {
          api_keys: [
            {
              title: "Checkout integration tests",
              type: "publishable",
              created_by: "",
            },
          ],
        },
      })
      publishableKey = apiKey.token

      await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: { id: apiKey.id, add: [salesChannels[0].id] },
      })
    })

    it("completes checkout and exposes the order in customer history and details", async () => {
      const headers = storeHeaders(publishableKey)
      const email = `checkout-${Date.now()}@example.test`
      const password = `${randomUUID()}aA1!`
      const { data: registration } = await storeApi.post<{ token: string }>(
        "/auth/customer/emailpass/register",
        { email, password },
        { headers },
      )
      expect(registration.token).toBeDefined()

      await storeApi.post(
        "/store/customers",
        { email, first_name: "Integration", last_name: "Test" },
        { headers: storeHeaders(publishableKey, registration.token) },
      )

      const { data: login } = await storeApi.post<{ token: string }>(
        "/auth/customer/emailpass",
        { email, password },
        { headers },
      )
      expect(login.token).toBeDefined()

      const customerHeaders = storeHeaders(publishableKey, login.token)
      await storeApi.post(
        "/store/personalization/consent",
        { granted: true, terms_version: "v1" },
        { headers: customerHeaders },
      )
      const inventoryBefore = await getInventorySnapshot(getContainer())
      const checkout = await prepareCheckout(storeApi, customerHeaders, email, {
        paymentData: { simulated_outcome: true },
      })
      const paymentSessions = await getPaymentSessions(getContainer(), checkout.paymentCollectionId)
      expect(paymentSessions).toHaveLength(1)
      expect(paymentSessions[0].provider_id).toBe(simulatorProviderId)
      expect(paymentSessions[0].data.simulated_outcome).toBe(true)

      const { data: repeatedCollection } = await storeApi.post<{
        payment_collection: { id: string }
      }>("/store/payment-collections", { cart_id: checkout.cartId }, { headers: customerHeaders })
      expect(repeatedCollection.payment_collection.id).toBe(checkout.paymentCollectionId)
      const { data: cartPaymentLinks } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "cart_payment_collection",
          fields: ["payment_collection_id"],
          filters: { cart_id: checkout.cartId },
        })
      expect(cartPaymentLinks).toEqual([{ payment_collection_id: checkout.paymentCollectionId }])
      await storeApi.post(
        `/store/payment-collections/${checkout.paymentCollectionId}/payment-sessions`,
        {
          provider_id: simulatorProviderId,
          data: { simulated_outcome: true },
        },
        { headers: customerHeaders },
      )
      expect(await getPaymentSessions(getContainer(), checkout.paymentCollectionId)).toHaveLength(1)

      const { data: completion } = await storeApi.post<{
        type: string
        order: { id: string; items: unknown[] }
      }>(`/store/carts/${checkout.cartId}/complete`, {}, { headers: customerHeaders })
      expect(completion.type).toBe("order")
      expect(completion.order.id).toBeDefined()
      expect(completion.order.items).toHaveLength(1)

      const orderId = completion.order.id
      const readback = await getCheckoutReadback(getContainer(), [checkout])
      recordReadback("simulator_success", { inventoryBefore, readback })
      expect(readback.levels).toEqual(
        inventoryBefore.levels.map((level) => ({
          ...level,
          reserved_quantity: level.reserved_quantity + 1,
        })),
      )
      expect(readback.orders).toHaveLength(1)
      expectOrderReservation(readback, checkout, orderId)
      expectAuthorized(readback.collections[0])

      const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
      const { data: orderStates } = await query.graph({
        entity: "order",
        fields: ["id", "currency_code", "total", "item_total", "shipping_total"],
        filters: { id: orderId },
      })
      expect(orderStates).toHaveLength(1)
      expect(orderStates[0]).toMatchObject({
        currency_code: "vnd",
      })
      expect(Number(orderStates[0].total)).toBe(279000)
      expect(Number(orderStates[0].item_total)).toBe(249000)
      expect(Number(orderStates[0].shipping_total)).toBe(30000)

      const { data: orderResponse } = await storeApi.get<{
        order: {
          id: string
          items: unknown[]
          total: number
          currency_code: string
          payment_status: string
          fulfillment_status: string
          fulfillments: unknown[]
        }
      }>(
        `/store/orders/${orderId}?fields=total,currency_code,items,payment_status,fulfillment_status,fulfillments`,
        { headers },
      )
      expect(orderResponse.order.id).toBe(orderId)
      expect(orderResponse.order.items).toHaveLength(1)
      expect(orderResponse.order).toMatchObject({
        total: 279000,
        currency_code: "vnd",
        fulfillment_status: "not_fulfilled",
      })
      expect(orderResponse.order.payment_status).not.toBe("captured")
      expect(orderResponse.order.fulfillments).toHaveLength(0)

      const { data: historyResponse } = await storeApi.get<{
        orders: Array<{ id: string }>
      }>("/store/orders?limit=20", { headers: customerHeaders })
      expect(historyResponse.orders.map((order) => order.id)).toContain(orderId)
      const personalization: PersonalizationModuleService =
        getContainer().resolve("personalization")
      let orderSignals = await personalization.listRecommendationEvents({
        event_type: "order_placed",
      })
      for (
        let attempt = 0;
        attempt < 30 &&
        !orderSignals.some((row) => row.event_key.startsWith(`order_placed:${orderId}:`));
        attempt++
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        orderSignals = await personalization.listRecommendationEvents({
          event_type: "order_placed",
        })
      }
      expect(
        orderSignals.filter((row) => row.event_key.startsWith(`order_placed:${orderId}:`)),
      ).toHaveLength(1)
      await cancelOrderWorkflow(getContainer()).run({ input: { order_id: orderId } })
      const canceled = await getCheckoutReadback(getContainer(), [checkout])
      recordReadback("cancel_before_fulfillment", { inventoryBefore, readback: canceled })
      expect(canceled.levels).toEqual(inventoryBefore.levels)
      expect(canceled.reservations).toEqual(inventoryBefore.reservations)
      expect(canceled.orders).toMatchObject([{ id: orderId, status: "canceled" }])
      expect(canceled.cartLinks).toEqual(readback.cartLinks)
      expect(canceled.paymentLinks).toEqual(readback.paymentLinks)
      expect(canceled.fulfillmentLinks).toEqual([])
      expect(canceled.collections).toMatchObject([
        {
          id: checkout.paymentCollectionId,
          captured_amount: 0,
          payments: [{ id: readback.collections[0].payments[0].id, canceled: true, captures: [] }],
        },
      ])
      let canceledSignals = await personalization.listRecommendationEvents({
        event_type: "order_canceled",
      })
      for (
        let attempt = 0;
        attempt < 30 &&
        !canceledSignals.some((row) => row.event_key.startsWith(`order_canceled:${orderId}:`));
        attempt++
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        canceledSignals = await personalization.listRecommendationEvents({
          event_type: "order_canceled",
        })
      }
      expect(
        canceledSignals.filter((row) => row.event_key.startsWith(`order_canceled:${orderId}:`)),
      ).toHaveLength(1)
      let [profile] = await personalization.listRecommendationProfiles({
        customer_id: orderSignals[0].customer_id,
      })
      for (
        let attempt = 0;
        attempt < 30 &&
        (profile?.interests as { source_products?: unknown[] } | undefined)?.source_products
          ?.length;
        attempt++
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        const updatedProfiles = await personalization.listRecommendationProfiles({
          customer_id: orderSignals[0].customer_id,
        })
        profile = updatedProfiles[0]
      }
      expect((profile.interests as { source_products: unknown[] }).source_products).toEqual([])
    })

    it("does not create an order or change inventory when simulated payment fails", async () => {
      const headers = storeHeaders(publishableKey)
      const email = `payment-failure-${Date.now()}@example.test`
      const checkout = await prepareCheckout(storeApi, headers, email, {
        paymentData: { simulated_outcome: false },
      })
      const container = getContainer()
      const paymentSessions = await getPaymentSessions(container, checkout.paymentCollectionId)
      expect(paymentSessions).toHaveLength(1)
      expect(paymentSessions[0].provider_id).toBe(simulatorProviderId)
      expect(paymentSessions[0].data.simulated_outcome).toBe(false)

      const inventoryBefore = await getInventorySnapshot(container)
      const attempt = await attemptCheckout(storeApi, headers, checkout.cartId)
      const readback = await getCheckoutReadback(container, [checkout])
      recordReadback("simulator_decline", { attempt, inventoryBefore, readback })
      expect(attempt.status).toBe(400)
      expect(readback.cartLinks).toEqual([])
      expect(readback.orders).toEqual([])
      expect(readback.paymentLinks).toEqual([])
      expect(readback.levels).toEqual(inventoryBefore.levels)
      expect(readback.reservations).toEqual(inventoryBefore.reservations)
      expect(readback.collections).toMatchObject([
        {
          id: checkout.paymentCollectionId,
          authorized_amount: 0,
          captured_amount: 0,
          sessions: [{ id: paymentSessions[0].id, status: "error" }],
          payments: [],
        },
      ])
      expect(readback.collections[0].status).not.toBe("captured")
    })

    it("reconciles a same-cart retry to a single order, payment, and reservation", async () => {
      const container = getContainer()
      const headers = storeHeaders(publishableKey)
      const checkout = await prepareCheckout(storeApi, headers, "same-cart-retry@example.test")
      const inventoryBefore = await getInventorySnapshot(container)
      const concurrentAttempts = await Promise.all([
        attemptCheckout(storeApi, headers, checkout.cartId),
        attemptCheckout(storeApi, headers, checkout.cartId),
      ])
      const first = await getCheckoutReadback(container, [checkout])
      const retry = await attemptCheckout(storeApi, headers, checkout.cartId)
      const afterRetry = await getCheckoutReadback(container, [checkout])

      recordReadback("same_cart_retry", {
        inventoryBefore,
        concurrentAttempts,
        first,
        retry,
        afterRetry,
      })
      expect(first.orders).toHaveLength(1)
      const orderId = first.orders[0].id
      const successfulAttempts = concurrentAttempts.filter(({ type }) => type === "order")
      expect(successfulAttempts.length).toBeGreaterThan(0)
      for (const attempt of concurrentAttempts) {
        expect(
          attempt.status === 409 || (attempt.status === 200 && attempt.orderId === orderId),
        ).toBe(true)
      }
      expect(retry).toMatchObject({ status: 200, type: "order", orderId })
      expect(afterRetry).toEqual(first)
      expectOrderReservation(afterRetry, checkout, orderId)
      expectAuthorized(afterRetry.collections[0])
      expect(afterRetry.levels).toEqual(
        inventoryBefore.levels.map((level) => ({
          ...level,
          reserved_quantity: level.reserved_quantity + 1,
        })),
      )
      expect(afterRetry.reservations).toHaveLength(inventoryBefore.reservations.length + 1)
    })

    it("reconciles 20 checkout attempts against five units of stock", async () => {
      const container = getContainer()
      const headers = storeHeaders(publishableKey)
      const stock = await getInventorySnapshot(container)
      expect(stock.levels).toHaveLength(1)
      expect(stock.reservations).toEqual([])
      const level = stock.levels[0]
      await updateInventoryLevelsWorkflow(container).run({
        input: {
          updates: [
            {
              id: level.id,
              inventory_item_id: level.inventory_item_id,
              location_id: level.location_id,
              stocked_quantity: 5,
            },
          ],
        },
      })
      const inventoryBefore = await getInventorySnapshot(container)
      expect(inventoryBefore.levels[0]).toMatchObject({ stocked_quantity: 5, reserved_quantity: 0 })

      const checkouts: Checkout[] = []
      for (let batchStart = 0; batchStart < 20; batchStart += 5) {
        const batch = await Promise.all(
          Array.from({ length: 5 }, (_, index) =>
            prepareCheckout(storeApi, headers, `last-stock-${batchStart + index}@example.test`),
          ),
        )
        checkouts.push(...batch)
      }
      expect(await getInventorySnapshot(container)).toEqual(inventoryBefore)

      const attempts = await Promise.all(
        checkouts.map(({ cartId }) => attemptCheckout(storeApi, headers, cartId)),
      )
      const readback = await getCheckoutReadback(container, checkouts)
      recordReadback("last_five_units", { inventoryBefore, attempts, readback })

      const accepted = attempts.filter(({ type }) => type === "order")
      expect(accepted).toHaveLength(5)
      expect(new Set(accepted.map(({ orderId }) => orderId)).size).toBe(5)
      const rejected = attempts.filter(({ type }) => type !== "order")
      expect(rejected).toHaveLength(15)
      for (const attempt of rejected) {
        expect(attempt).toMatchObject({ status: 400, insufficientStock: true })
      }
      expect(readback.orders).toHaveLength(5)
      expect(readback.cartLinks).toHaveLength(5)
      expect(readback.paymentLinks).toHaveLength(5)
      expect(readback.reservations).toHaveLength(5)
      expect(readback.levels).toEqual([{ ...inventoryBefore.levels[0], reserved_quantity: 5 }])
      expect(readback.collections).toHaveLength(20)

      for (const [index, checkout] of checkouts.entries()) {
        const attempt = attempts[index]
        const collection = readback.collections.find(
          ({ id }) => id === checkout.paymentCollectionId,
        )!
        if (attempt.orderId) {
          expect(attempt.status).toBe(200)
          expectOrderReservation(readback, checkout, attempt.orderId)
          expectAuthorized(collection)
        } else {
          expect(readback.cartLinks.some(({ cart_id }) => cart_id === checkout.cartId)).toBe(false)
          expect(
            readback.paymentLinks.some(
              ({ payment_collection_id }) => payment_collection_id === checkout.paymentCollectionId,
            ),
          ).toBe(false)
          expect(collection).toMatchObject({
            authorized_amount: 0,
            captured_amount: 0,
            sessions: [{ provider_id: simulatorProviderId, status: "pending" }],
            payments: [],
          })
        }
      }
    })

    it("separates COD checkout authorization from technical capture", async () => {
      const container = getContainer()
      const headers = storeHeaders(publishableKey)
      const checkout = await prepareCheckout(storeApi, headers, "cod-readback@example.test", {
        providerId: codProviderId,
      })
      const inventoryBefore = await getInventorySnapshot(container)
      const completion = await attemptCheckout(storeApi, headers, checkout.cartId)
      const authorized = await getCheckoutReadback(container, [checkout])
      recordReadback("cod_checkout_authorization", {
        inventoryBefore,
        completion,
        readback: authorized,
      })
      expect(completion).toMatchObject({ status: 200, type: "order", orderId: expect.any(String) })
      expectOrderReservation(authorized, checkout, completion.orderId!)
      expectAuthorized(authorized.collections[0], codProviderId)

      const payment = authorized.collections[0].payments[0]
      await capturePaymentWorkflow(container).run({ input: { payment_id: payment.id } })
      const captured = await getCheckoutReadback(container, [checkout])
      recordReadback("cod_technical_capture", { readback: captured })
      expect(captured.levels).toEqual(authorized.levels)
      expect(captured.reservations).toEqual(authorized.reservations)
      expect(captured.orders).toEqual(authorized.orders)
      expect(captured.fulfillmentLinks).toEqual([])
      expect(captured.collections).toMatchObject([
        {
          id: checkout.paymentCollectionId,
          status: "completed",
          captured_amount: 279000,
          payments: [{ id: payment.id, captures: [{ amount: 279000 }] }],
        },
      ])
    })

    it("accepts COD without marking payment collected or order fulfilled", async () => {
      const headers = storeHeaders(publishableKey)
      const checkout = await prepareCheckout(storeApi, headers, `cod-${Date.now()}@example.test`, {
        providerId: codProviderId,
      })
      const paymentSessions = await getPaymentSessions(getContainer(), checkout.paymentCollectionId)
      expect(paymentSessions).toHaveLength(1)
      expect(paymentSessions[0].provider_id).toBe(codProviderId)

      const { data: completion } = await storeApi.post<{
        type: string
        order: { id: string }
      }>(`/store/carts/${checkout.cartId}/complete`, {}, { headers })
      expect(completion.type).toBe("order")

      const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
      const { data: paymentCollections } = await query.graph({
        entity: "payment_collection",
        fields: ["status", "amount", "currency_code"],
        filters: { id: checkout.paymentCollectionId },
      })
      expect(paymentCollections[0]).toMatchObject({
        status: "authorized",
        amount: 279000,
        currency_code: "vnd",
      })
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id"],
        filters: { id: completion.order.id },
      })
      expect(orders).toHaveLength(1)
      const { data: orderResponse } = await storeApi.get<{
        order: {
          payment_status: string
          fulfillment_status: string
          fulfillments: unknown[]
        }
      }>(
        `/store/orders/${completion.order.id}?fields=payment_status,fulfillment_status,fulfillments`,
        { headers },
      )
      expect(orderResponse.order.payment_status).not.toBe("captured")
      expect(orderResponse.order.fulfillment_status).toBe("not_fulfilled")
      expect(orderResponse.order.fulfillments).toHaveLength(0)
    })

    it("rejects malformed simulator data without creating a payment session", async () => {
      const headers = storeHeaders(publishableKey)
      const checkout = await prepareCheckout(
        storeApi,
        headers,
        `invalid-payment-${Date.now()}@example.test`,
        { createPaymentSession: false },
      )
      const sensitiveMarker = "simulator-input-must-not-be-echoed"
      const result = await storeApi
        .post(
          `/store/payment-collections/${checkout.paymentCollectionId}/payment-sessions`,
          {
            provider_id: simulatorProviderId,
            data: { simulated_outcome: sensitiveMarker },
          },
          { headers },
        )
        .then(
          () => ({ status: 200, body: undefined }),
          (error: { response?: { status?: number; data?: unknown } }) => ({
            status: error.response?.status,
            body: error.response?.data,
          }),
        )

      expect(result.status).toBe(400)
      expect(JSON.stringify(result.body)).not.toContain(sensitiveMarker)
      expect(await getPaymentSessions(getContainer(), checkout.paymentCollectionId)).toHaveLength(0)
    })
  },
})
