import { randomUUID } from "node:crypto"
import {
  createApiKeysWorkflow,
  createProductsWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils"
import seedCommerce from "../../src/scripts/seed-commerce"

jest.setTimeout(120_000)

type RequestConfig = {
  headers: Record<string, string>
}

type ApiClient = {
  get: <T>(
    path: string,
    config: RequestConfig,
  ) => Promise<{ data: T; status: number }>
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

    describe("Auth", () => {
      it("rejects login with an incorrect password", async () => {
        const headers = storeHeaders(publishableKey)
        const email = `auth-${randomUUID()}@example.test`
        const password = `GoodPassword-${randomUUID()}aA1!`

        const { data: registration, status: registrationStatus } =
          await storeApi.post<{ token: string }>(
            "/store/auth/register",
            { email, password },
            { headers },
          )

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

    describe("Catalog and search", () => {
      it("does not include unpublished products in the catalog", async () => {
        const { data, status } = await storeApi.get<{
          products: Array<{ id: string }>
          count: number
        }>("/store/catalog", { headers: storeHeaders(publishableKey) })

        expect(status).toBe(200)
        expect(data.count).toBeGreaterThan(0)
        expect(data.products.map((product) => product.id)).not.toContain(
          draftProductId,
        )
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
        expect(data.products.map((product) => product.title)).toContain(
          "Ao thun Essential",
        )
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

        const registrationHeaders = storeHeaders(
          publishableKey,
          registration.token,
        )
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
