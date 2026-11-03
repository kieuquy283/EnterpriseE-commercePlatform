import { randomUUID } from "node:crypto"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import seedCommerce from "../../src/scripts/seed-commerce"

jest.setTimeout(120_000)

type ApiClient = {
  get: <T>(path: string, config: RequestConfig) => Promise<{ data: T }>
  post: <T>(
    path: string,
    body: Record<string, unknown>,
    config: RequestConfig
  ) => Promise<{ data: T }>
}

type RequestConfig = {
  headers: Record<string, string>
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
  simulatedOutcome: boolean
) {
  const { data: regionResponse } = await api.get<{
    regions: Array<{ id: string; name: string }>
  }>("/store/regions", { headers })
  const region = regionResponse.regions.find((item) => item.name === "Vietnam")
  if (!region) {
    throw new Error("Vietnam region is not seeded")
  }

  const { data: productResponse } = await api.get<{
    products: Array<{ variants?: Array<{ id: string }> }>
  }>(
    `/store/products?handle=ao-thun-essential&region_id=${region.id}`,
    { headers }
  )
  const variant = productResponse.products[0]?.variants?.[0]
  if (!variant) {
    throw new Error("Seed product variant is not available")
  }

  const { data: cartResponse } = await api.post<{ cart: { id: string } }>(
    "/store/carts",
    { region_id: region.id },
    { headers }
  )
  const cartId = cartResponse.cart.id

  await api.post(
    `/store/carts/${cartId}/line-items`,
    { variant_id: variant.id, quantity: 1 },
    { headers }
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
    { headers }
  )

  const { data: shippingResponse } = await api.get<{
    shipping_options: Array<{ id: string }>
  }>(
    `/store/shipping-options?cart_id=${cartId}`,
    { headers }
  )
  const shippingOption = shippingResponse.shipping_options[0]
  if (!shippingOption) {
    throw new Error("No shipping option is available for the test cart")
  }
  await api.post(
    `/store/carts/${cartId}/shipping-methods`,
    { option_id: shippingOption.id },
    { headers }
  )

  const { data: paymentResponse } = await api.post<{
    payment_collection: { id: string }
  }>(
    "/store/payment-collections",
    { cart_id: cartId },
    { headers }
  )
  await api.post(
    `/store/payment-collections/${paymentResponse.payment_collection.id}/payment-sessions`,
    {
      provider_id: simulatorProviderId,
      data: { simulated_outcome: simulatedOutcome },
    },
    { headers }
  )

  return {
    cartId,
    paymentCollectionId: paymentResponse.payment_collection.id,
  }
}

async function getSimulatorPaymentSession(
  container: MedusaContainer,
  paymentCollectionId: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: paymentSessions } = await query.graph({
    entity: "payment_session",
    fields: ["id", "provider_id", "data"],
    filters: { payment_collection_id: paymentCollectionId },
  })
  const paymentSession = paymentSessions[0]

  if (!paymentSession) {
    throw new Error("Payment session was not created")
  }

  return paymentSession
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
  env: { REDIS_URL: "" },
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

      const { result: [apiKey] } = await createApiKeysWorkflow(container).run({
        input: {
          api_keys: [{
            title: "Checkout integration tests",
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

    it("completes checkout and exposes the order in customer history and details", async () => {
      const headers = storeHeaders(publishableKey)
      const email = `checkout-${Date.now()}@example.test`
      const password = `${randomUUID()}aA1!`
      const { data: registration } = await storeApi.post<{ token: string }>(
        "/auth/customer/emailpass/register",
        { email, password },
        { headers }
      )
      expect(registration.token).toBeDefined()

      await storeApi.post(
        "/store/customers",
        { email, first_name: "Integration", last_name: "Test" },
        { headers: storeHeaders(publishableKey, registration.token) }
      )

      const { data: login } = await storeApi.post<{ token: string }>(
        "/auth/customer/emailpass",
        { email, password },
        { headers }
      )
      expect(login.token).toBeDefined()

      const customerHeaders = storeHeaders(publishableKey, login.token)
      const checkout = await prepareCheckout(
        storeApi,
        customerHeaders,
        email,
        true
      )
      const paymentSession = await getSimulatorPaymentSession(
        getContainer(),
        checkout.paymentCollectionId
      )
      expect(paymentSession.provider_id).toBe(simulatorProviderId)
      expect(paymentSession.data.simulated_outcome).toBe(true)

      const { data: completion } = await storeApi.post<{
        type: string
        order: { id: string; items: unknown[] }
      }>(
        `/store/carts/${checkout.cartId}/complete`,
        {},
        { headers: customerHeaders }
      )
      expect(completion.type).toBe("order")
      expect(completion.order.id).toBeDefined()
      expect(completion.order.items).toHaveLength(1)

      const orderId = completion.order.id
      const { data: orderResponse } = await storeApi.get<{
        order: { id: string; items: unknown[] }
      }>(`/store/orders/${orderId}`, { headers })
      expect(orderResponse.order.id).toBe(orderId)
      expect(orderResponse.order.items).toHaveLength(1)

      const { data: historyResponse } = await storeApi.get<{
        orders: Array<{ id: string }>
      }>(
        "/store/orders?limit=20",
        { headers: customerHeaders }
      )
      expect(historyResponse.orders.map((order) => order.id)).toContain(orderId)
    })

    it("does not create an order or change inventory when simulated payment fails", async () => {
      const headers = storeHeaders(publishableKey)
      const email = `payment-failure-${Date.now()}@example.test`
      const checkout = await prepareCheckout(
        storeApi,
        headers,
        email,
        false
      )
      const container = getContainer()
      const paymentSession = await getSimulatorPaymentSession(
        container,
        checkout.paymentCollectionId
      )
      expect(paymentSession.provider_id).toBe(simulatorProviderId)
      expect(paymentSession.data.simulated_outcome).toBe(false)

      const inventoryBefore = await getInventorySnapshot(container)
      await expect(
        storeApi.post(
          `/store/carts/${checkout.cartId}/complete`,
          {},
          { headers }
        )
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
      expect(await getInventorySnapshot(container)).toEqual(inventoryBefore)
    })
  },
})
