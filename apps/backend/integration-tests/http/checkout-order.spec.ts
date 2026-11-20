import { randomUUID } from "node:crypto"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  cancelOrderWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
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
  ) => Promise<{ data: T }>
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

async function prepareCheckout(
  api: ApiClient,
  headers: ReturnType<typeof storeHeaders>,
  email: string,
  options: CheckoutOptions = {},
) {
  const {
    providerId = simulatorProviderId,
    createPaymentSession = true,
  } = options
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

async function getPaymentSessions(
  container: MedusaContainer,
  paymentCollectionId: string,
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: paymentSessions } = await query.graph({
    entity: "payment_session",
    fields: ["id", "provider_id", "data"],
    filters: { payment_collection_id: paymentCollectionId },
  })

  return paymentSessions
}

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

  const { data: inventoryLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["id", "location_id", "stocked_quantity", "reserved_quantity"],
    filters: { inventory_item_id: inventoryItem.id },
  })

  return inventoryLevels.map((level) => ({
    id: level.id,
    location_id: level.location_id,
    stocked_quantity: level.stocked_quantity,
    reserved_quantity: level.reserved_quantity,
  }))
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
      const paymentSessions = await getPaymentSessions(
        getContainer(),
        checkout.paymentCollectionId,
      )
      expect(paymentSessions).toHaveLength(1)
      expect(paymentSessions[0].provider_id).toBe(simulatorProviderId)
      expect(paymentSessions[0].data.simulated_outcome).toBe(true)

      const { data: repeatedCollection } = await storeApi.post<{
        payment_collection: { id: string }
      }>(
        "/store/payment-collections",
        { cart_id: checkout.cartId },
        { headers: customerHeaders },
      )
      expect(repeatedCollection.payment_collection.id).toBe(checkout.paymentCollectionId)
      const { data: cartPaymentLinks } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "cart_payment_collection",
          fields: ["payment_collection_id"],
          filters: { cart_id: checkout.cartId },
        })
      expect(cartPaymentLinks).toEqual([
        { payment_collection_id: checkout.paymentCollectionId },
      ])
      await storeApi.post(
        `/store/payment-collections/${checkout.paymentCollectionId}/payment-sessions`,
        {
          provider_id: simulatorProviderId,
          data: { simulated_outcome: true },
        },
        { headers: customerHeaders },
      )
      expect(
        await getPaymentSessions(getContainer(), checkout.paymentCollectionId),
      ).toHaveLength(1)

      const { data: completion } = await storeApi.post<{
        type: string
        order: { id: string; items: unknown[] }
      }>(`/store/carts/${checkout.cartId}/complete`, {}, { headers: customerHeaders })
      expect(completion.type).toBe("order")
      expect(completion.order.id).toBeDefined()
      expect(completion.order.items).toHaveLength(1)

      const inventoryReserved = await getInventorySnapshot(getContainer())
      expect(inventoryReserved).toEqual(
        inventoryBefore.map((level) => ({
          ...level,
          reserved_quantity: Number(level.reserved_quantity) + 1,
        })),
      )
      const { data: paymentCollections } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "payment_collection",
          fields: ["status", "amount", "currency_code"],
          filters: { id: checkout.paymentCollectionId },
        })
      expect(paymentCollections[0]).toMatchObject({
        status: "authorized",
        amount: 279000,
        currency_code: "vnd",
      })

      const orderId = completion.order.id
      const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
      const { data: orderStates } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "currency_code",
          "total",
          "item_total",
          "shipping_total",
        ],
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
      expect(await getInventorySnapshot(getContainer())).toEqual(inventoryBefore)
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
      await expect(
        storeApi.post(`/store/carts/${checkout.cartId}/complete`, {}, { headers }),
      ).rejects.toMatchObject({
        response: { status: 400 },
      })

      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: orderLinks } = await query.graph({
        entity: "order_cart",
        fields: ["id"],
        filters: { cart_id: checkout.cartId },
      })
      expect(orderLinks).toHaveLength(0)
      const { data: paymentCollections } = await query.graph({
        entity: "payment_collection",
        fields: ["status"],
        filters: { id: checkout.paymentCollectionId },
      })
      expect(paymentCollections[0].status).not.toBe("captured")
      expect(await getInventorySnapshot(container)).toEqual(inventoryBefore)
    })

    it("accepts COD without marking payment collected or order fulfilled", async () => {
      const headers = storeHeaders(publishableKey)
      const checkout = await prepareCheckout(
        storeApi,
        headers,
        `cod-${Date.now()}@example.test`,
        { providerId: "pp_system_default", paymentData: undefined },
      )
      const paymentSessions = await getPaymentSessions(
        getContainer(),
        checkout.paymentCollectionId,
      )
      expect(paymentSessions).toHaveLength(1)
      expect(paymentSessions[0].provider_id).toBe("pp_system_default")

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
      expect(
        await getPaymentSessions(getContainer(), checkout.paymentCollectionId),
      ).toHaveLength(0)
    })
  },
})
