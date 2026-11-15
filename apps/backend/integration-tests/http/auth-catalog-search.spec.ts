import { randomUUID } from "node:crypto"
import {
  createApiKeysWorkflow,
  createInvitesWorkflow,
  createProductsWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import seedCommerce from "../../src/scripts/seed-commerce"

jest.setTimeout(120_000)

type RequestConfig = {
  headers: Record<string, string>
}

type ApiClient = {
  get: <T>(path: string, config: RequestConfig) => Promise<{ data: T; status: number }>
  delete: (path: string, config: RequestConfig) => Promise<{ status: number }>
  post: <T>(
    path: string,
    body: Record<string, unknown>,
    config: RequestConfig,
  ) => Promise<{ data: T; status: number }>
}

function storeHeaders(publishableKey: string, token?: string) {
  return {
    "x-publishable-api-key": publishableKey,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

medusaIntegrationTestRunner({
  env: { REDIS_URL: "" },
  testSuite: ({ api, getContainer }) => {
    const storeApi: ApiClient = api
    let publishableKey: string
    let draftProductId: string

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

      const {
        result: [apiKey],
      } = await createApiKeysWorkflow(container).run({
        input: {
          api_keys: [
            {
              title: "Auth, catalog, and search integration tests",
              type: "publishable",
              created_by: "",
            },
          ],
        },
      })
      publishableKey = apiKey.token

      const { data: salesChannels } = await query.graph({
        entity: "sales_channel",
        fields: ["id"],
        filters: { name: "Online Store" },
      })
      expect(salesChannels).toHaveLength(1)

      await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: { id: apiKey.id, add: [salesChannels[0].id] },
      })

      const {
        result: [draftProduct],
      } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: "Unpublished integration product",
              handle: `unpublished-${randomUUID()}`,
              status: ProductStatus.DRAFT,
              options: [{ title: "Variant", values: ["Default"] }],
              variants: [
                {
                  title: "Default",
                  options: { Variant: "Default" },
                  prices: [{ amount: 1000, currency_code: "vnd" }],
                },
              ],
            },
          ],
        },
      })
      draftProductId = draftProduct.id
    })

    describe("Admin onboarding", () => {
      it("accepts a staff invite and keeps customer authentication separate", async () => {
        const email = `staff-${randomUUID()}@example.test`
        const password = `${randomUUID()}aA1!`
        const {
          result: [invite],
        } = await createInvitesWorkflow(getContainer()).run({ input: { invites: [{ email }] } })
        const { data: registration } = await storeApi.post<{ token: string }>(
          "/auth/user/emailpass/register",
          { email, password },
          { headers: {} },
        )
        await storeApi.post(
          `/admin/invites/accept?token=${encodeURIComponent(invite.token)}`,
          { email, first_name: "Test", last_name: "Staff" },
          { headers: { Authorization: `Bearer ${registration.token}` } },
        )
        const { data: login } = await storeApi.post<{ token: string }>(
          "/auth/user/emailpass",
          { email, password },
          { headers: {} },
        )
        const { status } = await storeApi.get("/admin/users/me", {
          headers: { Authorization: `Bearer ${login.token}` },
        })
        expect(status).toBe(200)
        await expect(
          storeApi.get("/store/customers/me", {
            headers: storeHeaders(publishableKey, login.token),
          }),
        ).rejects.toMatchObject({ response: { status: 401 } })
        await expect(
          storeApi.post(
            `/admin/invites/accept?token=${encodeURIComponent(invite.token)}`,
            { email },
            { headers: { Authorization: `Bearer ${registration.token}` } },
          ),
        ).rejects.toMatchObject({ response: { status: 401 } })
      })
    })

    describe("Auth", () => {
      it.each([
        { email: [], password: "test" },
        { email: "a@example.test", password: {} },
        { email: "a@example.test", password: "test", customer_id: "cus_other" },
      ])("rejects malformed credentials %j", async (body) => {
        await expect(
          storeApi.post("/store/auth/login", body, { headers: storeHeaders(publishableKey) }),
        ).rejects.toMatchObject({ response: { status: 400 } })
      })

      it("rejects login with an incorrect password", async () => {
        const headers = storeHeaders(publishableKey)
        const email = `auth-${randomUUID()}@example.test`
        const password = `GoodPassword-${randomUUID()}aA1!`

        const { data: registration, status: registrationStatus } = await storeApi.post<{
          token: string
        }>("/store/auth/register", { email, password }, { headers })

        expect(registrationStatus).toBe(201)
        expect(registration.token).toEqual(expect.any(String))

        await expect(
          storeApi.post(
            "/store/auth/login",
            { email, password: `Wrong-${randomUUID()}aA1!` },
            { headers },
          ),
        ).rejects.toMatchObject({
          response: { status: 401 },
        })
      })

      it("rejects login when required credentials are missing", async () => {
        await expect(
          storeApi.post(
            "/store/auth/login",
            { email: "missing-password@example.test" },
            { headers: storeHeaders(publishableKey) },
          ),
        ).rejects.toMatchObject({
          response: { status: 400 },
        })
      })
    })

    describe("Legacy cart trust boundary", () => {
      async function createGuestCart() {
        const headers = storeHeaders(publishableKey)
        const { data } = await storeApi.get<{ regions: { id: string }[] }>("/store/regions", {
          headers,
        })
        return storeApi.post<{ cart: { id: string } }>(
          "/store/cart",
          { region_id: data.regions[0].id },
          { headers },
        )
      }

      it("preserves guest creation and projects public fields", async () => {
        const { data, status } = await createGuestCart()
        expect(status).toBe(201)
        const response = await storeApi.get<{ cart: Record<string, unknown> }>(
          `/store/cart?cart_id=${data.cart.id}`,
          { headers: storeHeaders(publishableKey) },
        )
        expect(Object.keys(response.data.cart).sort()).toEqual([
          "currency_code",
          "id",
          "items",
          "region_id",
        ])
      })

      it("associates only the verified customer identity", async () => {
        const headers = storeHeaders(publishableKey)
        const email = `cart-owner-${randomUUID()}@example.test`
        const password = `${randomUUID()}aA1!`
        const { data: registered } = await storeApi.post<{ token: string }>(
          "/auth/customer/emailpass/register",
          { email, password },
          { headers },
        )
        const { data: created } = await storeApi.post<{ customer: { id: string } }>(
          "/store/customers",
          { email },
          { headers: storeHeaders(publishableKey, registered.token) },
        )
        const { data: login } = await storeApi.post<{ token: string }>(
          "/auth/customer/emailpass",
          { email, password },
          { headers },
        )
        const { data: regions } = await storeApi.get<{ regions: { id: string }[] }>(
          "/store/regions",
          { headers },
        )
        const { data } = await storeApi.post<{ cart: { id: string } }>(
          "/store/cart",
          { region_id: regions.regions[0].id },
          { headers: storeHeaders(publishableKey, login.token) },
        )
        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: ["customer_id"],
          filters: { id: data.cart.id },
        })
        expect(carts[0].customer_id).toBe(created.customer.id)
      })

      it.each([{ customer_id: "cus_other" }, { total: 1 }, { sales_channel_id: "sc_other" }])(
        "rejects identity, price or channel tampering: %j",
        async (extra) => {
          const headers = storeHeaders(publishableKey)
          const { data } = await storeApi.get<{ regions: { id: string }[] }>("/store/regions", {
            headers,
          })
          await expect(
            storeApi.post("/store/cart", { region_id: data.regions[0].id, ...extra }, { headers }),
          ).rejects.toMatchObject({ response: { status: 400 } })
        },
      )

      it.each([0, -1, 1.5, "2", null])(
        "rejects invalid quantity %j before invoking commerce",
        async (quantity) => {
          await expect(
            storeApi.post(
              "/store/cart/cart_missing/items",
              { variant_id: "variant_missing", quantity },
              { headers: storeHeaders(publishableKey) },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } })
        },
      )

      it("does not delete a line belonging to a different cart", async () => {
        const headers = storeHeaders(publishableKey)
        const first = await createGuestCart()
        const second = await createGuestCart()
        const { data: products } = await storeApi.get<{
          products: { variants: { id: string }[] }[]
        }>("/store/products?handle=ao-thun-essential", { headers })
        const variant_id = products.products[0].variants[0].id
        await storeApi.post(
          `/store/cart/${first.data.cart.id}/items`,
          { variant_id, quantity: 1 },
          { headers },
        )
        const { data: before } = await storeApi.get<{ cart: { items: { id: string }[] } }>(
          `/store/cart?cart_id=${first.data.cart.id}`,
          { headers },
        )
        const lineId = before.cart.items[0].id
        await expect(
          storeApi.delete(`/store/cart/${second.data.cart.id}/items/${lineId}`, { headers }),
        ).rejects.toMatchObject({ response: { status: 404 } })
        await expect(
          storeApi.delete(`/store/carts/${second.data.cart.id}/line-items/${lineId}`, { headers }),
        ).rejects.toMatchObject({ response: { status: 404 } })
        const { data: after } = await storeApi.get<{ cart: { items: { id: string }[] } }>(
          `/store/cart?cart_id=${first.data.cart.id}`,
          { headers },
        )
        expect(after.cart.items).toEqual(before.cart.items)
        const nativeDeletion = await storeApi.delete(
          `/store/carts/${first.data.cart.id}/line-items/${lineId}`,
          { headers },
        )
        expect(nativeDeletion.status).toBe(200)
        await storeApi.post(
          `/store/cart/${first.data.cart.id}/items`,
          { variant_id, quantity: 1 },
          { headers },
        )
        const { data: restored } = await storeApi.get<{ cart: { items: { id: string }[] } }>(
          `/store/cart?cart_id=${first.data.cart.id}`,
          { headers },
        )

        expect(
          (
            await storeApi.delete(
              `/store/cart/${first.data.cart.id}/items/${restored.cart.items[0].id}`,
              { headers },
            )
          ).status,
        ).toBe(204)
      })
    })

    describe("Catalog and search", () => {
      it("does not include unpublished products in the catalog", async () => {
        const { data, status } = await storeApi.get<{
          products: Array<{ id: string }>
          count: number
        }>("/store/catalog", { headers: storeHeaders(publishableKey) })

        expect(status).toBe(200)
        expect(data.count).toBeGreaterThan(0)
        expect(data.products.map((product) => product.id)).not.toContain(draftProductId)
      })

      it("returns matching published products for a search query", async () => {
        const query = encodeURIComponent("Ao thun Essential")
        const { data, status } = await storeApi.get<{
          products: Array<{ title: string }>
          count: number
        }>(`/store/catalog?q=${query}`, {
          headers: storeHeaders(publishableKey),
        })

        expect(status).toBe(200)
        expect(data.count).toBeGreaterThan(0)
        expect(data.products.map((product) => product.title)).toContain("Ao thun Essential")
      })

      it("returns an empty result when the search has no matches", async () => {
        const query = encodeURIComponent(`no-match-${randomUUID()}`)
        const { data, status } = await storeApi.get<{
          products: unknown[]
          count: number
        }>(`/store/catalog?q=${query}`, {
          headers: storeHeaders(publishableKey),
        })

        expect(status).toBe(200)
        expect(data.products).toEqual([])
        expect(data.count).toBe(0)
      })
    })

    describe("Customer data authorization", () => {
      it("allows an authenticated customer to access their own profile", async () => {
        const headers = storeHeaders(publishableKey)
        const email = `authorized-${randomUUID()}@example.test`
        const password = `GoodPassword-${randomUUID()}aA1!`

        const { data: registration } = await storeApi.post<{ token: string }>(
          "/store/auth/register",
          { email, password },
          { headers },
        )
        expect(registration.token).toEqual(expect.any(String))

        const registrationHeaders = storeHeaders(publishableKey, registration.token)
        await storeApi.post(
          "/store/customers",
          { email, first_name: "Integration", last_name: "Test" },
          { headers: registrationHeaders },
        )

        const { data: login } = await storeApi.post<{ token: string }>(
          "/store/auth/login",
          { email, password },
          { headers },
        )
        expect(login.token).toEqual(expect.any(String))

        const customerHeaders = storeHeaders(publishableKey, login.token)
        const { data, status } = await storeApi.get<{
          customer: { email: string }
        }>("/store/customers/me", { headers: customerHeaders })

        expect(status).toBe(200)
        expect(data.customer.email).toBe(email)
      })

      it("does not expose the current customer profile without a valid token", async () => {
        await expect(
          storeApi.get("/store/customers/me", {
            headers: storeHeaders(publishableKey),
          }),
        ).rejects.toMatchObject({
          response: { status: 401 },
        })

        await expect(
          storeApi.get("/store/customers/me", {
            headers: storeHeaders(publishableKey, "invalid.integration.token"),
          }),
        ).rejects.toMatchObject({
          response: { status: 401 },
        })
      })
    })
  },
})
