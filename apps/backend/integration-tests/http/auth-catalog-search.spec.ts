import { createHmac, randomUUID } from "node:crypto"
import {
  createApiKeysWorkflow,
  createInvitesWorkflow,
  createProductsWorkflow,
  createSalesChannelsWorkflow,
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

function expireJwtToken(token: string, secret: Parameters<typeof createHmac>[1]) {
  const [encodedHeader, encodedPayload, signature, extra] = token.split(".")
  if (!encodedHeader || !encodedPayload || !signature || extra) {
    throw new Error("Expected a signed JWT")
  }

  const header = JSON.parse(
    Buffer.from(encodedHeader, "base64url").toString("utf8"),
  ) as Record<string, unknown>
  if (header.alg !== "HS256") {
    throw new Error("Expected an HS256 JWT")
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as Record<string, unknown>
  payload.exp = Math.floor(Date.now() / 1000) - 60

  const signingInput = `${encodedHeader}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`
  const expiredSignature = createHmac("sha256", secret).update(signingInput).digest("base64url")
  return `${signingInput}.${expiredSignature}`
}

medusaIntegrationTestRunner({
  env: { REDIS_URL: "" },
  testSuite: ({ api, getContainer }) => {
    const storeApi: ApiClient = api
    let publishableKey: string
    let draftProductId: string
    let draftVariantId: string

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
      draftVariantId = draftProduct.variants[0].id
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
        const { data: regions } = await storeApi.get<{ regions: { id: string }[] }>(
          "/store/regions",
          { headers: storeHeaders(publishableKey) },
        )
        const { data: nativeGuestCart } = await storeApi.post<{ cart: { id: string } }>(
          "/store/carts",
          { region_id: regions.regions[0].id },
          { headers: storeHeaders(publishableKey, login.token) },
        )
        const { data: legacyGuestCart } = await storeApi.post<{ cart: { id: string } }>(
          "/store/cart",
          { region_id: regions.regions[0].id },
          { headers: storeHeaders(publishableKey, login.token) },
        )
        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: ["customer_id"],
          filters: { id: [nativeGuestCart.cart.id, legacyGuestCart.cart.id] },
        })
        expect(carts).toHaveLength(2)
        expect(carts.every((cart) => !cart.customer_id)).toBe(true)
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
      async function createGuestCart(email?: string) {
        const headers = storeHeaders(publishableKey)
        const { data } = await storeApi.get<{ regions: { id: string }[] }>("/store/regions", {
          headers,
        })
        return storeApi.post<{ cart: { id: string } }>(
          "/store/cart",
          { region_id: data.regions[0].id, ...(email ? { email } : {}) },
          { headers },
        )
      }

      it("preserves guest creation and projects public fields", async () => {
        const { data, status } = await createGuestCart("guest-private@example.test")
        expect(status).toBe(201)
        const { data: products } = await storeApi.get<{
          products: { variants: { id: string }[] }[]
        }>("/store/products?handle=ao-thun-essential", {
          headers: storeHeaders(publishableKey),
        })
        await storeApi.post(
          `/store/cart/${data.cart.id}/items`,
          { variant_id: products.products[0].variants[0].id, quantity: 1 },
          { headers: storeHeaders(publishableKey) },
        )
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
        expect(Object.keys((response.data.cart.items as Record<string, unknown>[])[0]).sort()).toEqual(
          ["id", "quantity", "variant_id"],
        )
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
        const { data: nativeCart } = await storeApi.post<{ cart: { id: string } }>(
          "/store/carts",
          { region_id: regions.regions[0].id },
          { headers: storeHeaders(publishableKey, login.token) },
        )
        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: ["customer_id"],
          filters: { id: [data.cart.id, nativeCart.cart.id] },
        })
        expect(carts).toHaveLength(2)
        expect(carts.map((cart) => cart.customer_id)).toEqual([
          created.customer.id,
          created.customer.id,
        ])
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
          await expect(
            storeApi.post("/store/carts", { region_id: data.regions[0].id, ...extra }, { headers }),
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
          await expect(
            storeApi.post(
              "/store/carts/cart_missing/line-items",
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

    it("scopes native and legacy catalog and carts to the publishable key channel", async () => {
      const container = getContainer()
      const { result: [isolatedChannel] } = await createSalesChannelsWorkflow(container).run({
        input: { salesChannelsData: [{ name: `Isolated ${randomUUID()}` }] },
      })
      const {
        result: [isolatedKey],
      } = await createApiKeysWorkflow(container).run({
        input: {
          api_keys: [
            {
              title: "Isolated channel integration test",
              type: "publishable",
              created_by: "",
            },
          ],
        },
      })
      await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: { id: isolatedKey.id, add: [isolatedChannel.id] },
      })

      const isolatedHeaders = storeHeaders(isolatedKey.token)
      const { data: nativeCatalog } = await storeApi.get<{ products: unknown[] }>(
        "/store/products",
        { headers: isolatedHeaders },
      )
      const { data: legacyCatalog } = await storeApi.get<{ products: unknown[] }>(
        "/store/catalog",
        { headers: isolatedHeaders },
      )
      expect(nativeCatalog.products).toEqual([])
      expect(legacyCatalog.products).toEqual([])

      const { data: regions } = await storeApi.get<{ regions: { id: string }[] }>(
        "/store/regions",
        { headers: isolatedHeaders },
      )
      const { data: nativeCart } = await storeApi.post<{ cart: { id: string } }>(
        "/store/carts",
        { region_id: regions.regions[0].id },
        { headers: isolatedHeaders },
      )
      const { data: legacyCart } = await storeApi.post<{ cart: { id: string } }>(
        "/store/cart",
        { region_id: regions.regions[0].id },
        { headers: isolatedHeaders },
      )
      const { data: mainProducts } = await storeApi.get<{
        products: { variants: { id: string }[] }[]
      }>("/store/products?handle=ao-thun-essential", {
        headers: storeHeaders(publishableKey),
      })
      const mainVariantId = mainProducts.products[0].variants[0].id
      await expect(
        storeApi.post(
          `/store/carts/${nativeCart.cart.id}/line-items`,
          { variant_id: mainVariantId, quantity: 1 },
          { headers: isolatedHeaders },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })
      await expect(
        storeApi.post(
          `/store/cart/${legacyCart.cart.id}/items`,
          { variant_id: mainVariantId, quantity: 1 },
          { headers: isolatedHeaders },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: carts } = await query.graph({
        entity: "cart",
        fields: ["sales_channel_id"],
        filters: { id: [nativeCart.cart.id, legacyCart.cart.id] },
      })
      expect(carts).toHaveLength(2)
      expect(carts.map((cart) => cart.sales_channel_id)).toEqual([
        isolatedChannel.id,
        isolatedChannel.id,
      ])

      const mainHeaders = storeHeaders(publishableKey)
      const { data: mainRegions } = await storeApi.get<{ regions: { id: string }[] }>(
        "/store/regions",
        { headers: mainHeaders },
      )
      await expect(
        storeApi.post(
          "/store/carts",
          { region_id: mainRegions.regions[0].id, sales_channel_id: isolatedChannel.id },
          { headers: mainHeaders },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })
      await expect(
        storeApi.post(
          "/store/cart",
          { region_id: mainRegions.regions[0].id, sales_channel_id: isolatedChannel.id },
          { headers: mainHeaders },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })
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
        const { data: nativeData } = await storeApi.get<{ products: { id: string }[] }>(
          `/store/products?id=${draftProductId}`,
          { headers: storeHeaders(publishableKey) },
        )
        expect(nativeData.products.map((product) => product.id)).not.toContain(draftProductId)

        const { data: regions } = await storeApi.get<{ regions: { id: string }[] }>(
          "/store/regions",
          { headers: storeHeaders(publishableKey) },
        )
        const { data: legacyCart } = await storeApi.post<{ cart: { id: string } }>(
          "/store/cart",
          { region_id: regions.regions[0].id },
          { headers: storeHeaders(publishableKey) },
        )
        const { data: nativeCart } = await storeApi.post<{ cart: { id: string } }>(
          "/store/carts",
          { region_id: regions.regions[0].id },
          { headers: storeHeaders(publishableKey) },
        )
        await expect(
          storeApi.post(
            `/store/cart/${legacyCart.cart.id}/items`,
            { variant_id: draftVariantId, quantity: 1 },
            { headers: storeHeaders(publishableKey) },
          ),
        ).rejects.toMatchObject({ response: { status: 400 } })
        await expect(
          storeApi.post(
            `/store/carts/${nativeCart.cart.id}/line-items`,
            { variant_id: draftVariantId, quantity: 1 },
            { headers: storeHeaders(publishableKey) },
          ),
        ).rejects.toMatchObject({ response: { status: 400 } })
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

      it("protects the customer profile and keeps invalid-token carts anonymous", async () => {
        const { data: regions } = await storeApi.get<{ regions: { id: string }[] }>("/store/regions", {
          headers: storeHeaders(publishableKey),
        })
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

        const { data: nativeGuestCart } = await storeApi.post<{ cart: { id: string } }>(
          "/store/carts",
          { region_id: regions.regions[0].id },
          { headers: storeHeaders(publishableKey, "invalid.integration.token") },
        )
        const { data: legacyGuestCart } = await storeApi.post<{ cart: { id: string } }>(
          "/store/cart",
          { region_id: regions.regions[0].id },
          { headers: storeHeaders(publishableKey, "invalid.integration.token") },
        )
        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: ["customer_id"],
          filters: { id: [nativeGuestCart.cart.id, legacyGuestCart.cart.id] },
        })
        expect(carts).toHaveLength(2)
        expect(carts.every((cart) => !cart.customer_id)).toBe(true)
      })

      it("does not associate carts with expired customer tokens", async () => {
        const headers = storeHeaders(publishableKey)
        const email = `expired-${randomUUID()}@example.test`
        const password = `${randomUUID()}aA1!`
        const { data: registration } = await storeApi.post<{ token: string }>(
          "/store/auth/register",
          { email, password },
          { headers },
        )
        const config = getContainer().resolve(ContainerRegistrationKeys.CONFIG_MODULE)
        const jwtSecret = config.projectConfig.http.jwtSecret
        if (typeof jwtSecret !== "string" && !Buffer.isBuffer(jwtSecret)) {
          throw new Error("A string or Buffer JWT secret is required for the integration test")
        }
        const expiredToken = expireJwtToken(registration.token, jwtSecret)
        const { data: regions } = await storeApi.get<{ regions: { id: string }[] }>("/store/regions", {
          headers,
        })
        await expect(
          storeApi.get("/store/customers/me", {
            headers: storeHeaders(publishableKey, expiredToken),
          }),
        ).rejects.toMatchObject({ response: { status: 401 } })

        const { data: nativeGuestCart } = await storeApi.post<{ cart: { id: string } }>(
          "/store/carts",
          { region_id: regions.regions[0].id },
          { headers: storeHeaders(publishableKey, expiredToken) },
        )
        const { data: legacyGuestCart } = await storeApi.post<{ cart: { id: string } }>(
          "/store/cart",
          { region_id: regions.regions[0].id },
          { headers: storeHeaders(publishableKey, expiredToken) },
        )
        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: ["customer_id"],
          filters: { id: [nativeGuestCart.cart.id, legacyGuestCart.cart.id] },
        })
        expect(carts).toHaveLength(2)
        expect(carts.every((cart) => !cart.customer_id)).toBe(true)
      })
    })
  },
})
