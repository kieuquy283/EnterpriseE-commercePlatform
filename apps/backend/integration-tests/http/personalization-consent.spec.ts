import { randomUUID } from "node:crypto"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { createApiKeysWorkflow, createShippingProfilesWorkflow, linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import PersonalizationModuleService from "../../src/modules/personalization/service"
import RecommendationModuleService from "../../src/modules/recommendation/service"
import seedCommerce from "../../src/scripts/seed-commerce"
import { publishRecommendations, type Candidate } from "../../src/workflows/recommendation/publish"

jest.setTimeout(180_000)

medusaIntegrationTestRunner({
  env: { REDIS_URL: "", ENABLE_PERSONALIZED_RECOMMENDATIONS: "true", ENABLE_PERSONALIZATION_EVENTS: "true" },
  testSuite: ({ api, getContainer }) => {
    it("isolates consent by authenticated customer and starts a new epoch after withdrawal", async () => {
      await createShippingProfilesWorkflow(getContainer()).run({ input: { data: [{ name: "Default", type: "default" }] } })
      await seedCommerce({ container: getContainer(), args: [] })
      const products = await getContainer().resolve(Modules.PRODUCT).listProducts({ status: "published" })
      expect(products.length).toBeGreaterThanOrEqual(2)
      const { data: channels } = await getContainer().resolve(ContainerRegistrationKeys.QUERY).graph({
        entity: "sales_channel", fields: ["id"], filters: { name: "Online Store" },
      })
      const { result: [key] } = await createApiKeysWorkflow(getContainer()).run({
        input: { api_keys: [{ title: "Personalization consent test", type: "publishable", created_by: "" }] },
      })
      await linkSalesChannelsToApiKeyWorkflow(getContainer()).run({ input: { id: key.id, add: [channels[0].id] } })
      const publicHeaders = { "x-publishable-api-key": key.token }
      const { data: regions } = await api.get("/store/regions", { headers: publicHeaders })
      const region = regions.regions[0].id
      const candidates: Candidate[] = [
        { version: "pers-fixture-v1", placement: "home", context_key: "home", target_product_id: products[0].id, score: 1, rank: 1, strategy: "hm_purchase_popularity" },
        { version: "pers-fixture-v1", placement: "product_detail", context_key: `product:${products[0].id}`, target_product_id: products[1].id, score: .9, rank: 1, strategy: "hm_metadata_similarity" },
        { version: "pers-fixture-v1", placement: "product_detail", context_key: `product:${products[1].id}`, target_product_id: products[0].id, score: .9, rank: 1, strategy: "hm_metadata_similarity" },
      ]
      await publishRecommendations(getContainer(), { version: "pers-fixture-v1", manifest: { fixture: true }, candidates })
      async function createCustomer() {
        const email = `personalization-${randomUUID()}@example.test`
        const password = `${randomUUID()}aA1!`
        const registration = await api.post("/auth/customer/emailpass/register", { email, password }, { headers: publicHeaders })
        await api.post("/store/customers", { email, first_name: "Test", last_name: "Customer" }, {
          headers: { ...publicHeaders, Authorization: `Bearer ${registration.data.token}` },
        })
        const login = await api.post("/auth/customer/emailpass", { email, password }, { headers: publicHeaders })
        return { ...publicHeaders, Authorization: `Bearer ${login.data.token}` }
      }
      const a = await createCustomer()
      const b = await createCustomer()
      await expect(api.get("/store/personalization/consent", { headers: publicHeaders })).rejects.toMatchObject({ response: { status: 401 } })
      expect((await api.get("/store/personalization/consent", { headers: a })).data.granted).toBe(false)
      expect((await api.get("/store/personalization/consent", { headers: b })).data.granted).toBe(false)
      await expect(api.post("/store/personalization/consent", { granted: true, terms_version: "v1", customer_id: "cus_other" }, { headers: a }))
        .rejects.toMatchObject({ response: { status: 400 } })
      const granted = await api.post("/store/personalization/consent", { granted: true, terms_version: "v1" }, { headers: a })
      expect(granted.data.granted).toBe(true)
      expect((await api.get("/store/personalization/consent", { headers: b })).data.granted).toBe(false)
      const generic = await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: b })
      expect(generic.data.personalized).toBe(false)
      const eventId = randomUUID()
      const event = { event_id: eventId, event_type: "product_view", product_id: products[0].id }
      expect((await api.post("/store/personalization/events", event, { headers: a })).status).toBe(202)
      expect((await api.post("/store/personalization/events", event, { headers: a })).status).toBe(202)
      const personal = await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: a })
      expect(personal.data.personalized).toBe(true)
      expect(personal.data.products[0].id).toBe(products[1].id)
      expect(personal.data.products[0]).not.toHaveProperty("metadata")
      await expect(api.get(`/store/recommendations/for-you?region_id=${region}&customer_id=other`, { headers: a }))
        .rejects.toMatchObject({ response: { status: 400 } })
      await expect(api.post("/store/personalization/events", event, { headers: b }))
        .rejects.toMatchObject({ response: { status: 403 } })
      await api.post("/store/personalization/consent", { granted: true, terms_version: "v1" }, { headers: b })
      await api.post("/store/personalization/events", {
        event_id: randomUUID(), event_type: "product_view", product_id: products[1].id,
      }, { headers: b })
      const personalB = await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: b })
      expect(personalB.data.personalized).toBe(true)
      expect(personalB.data.products[0].id).toBe(products[0].id)
      expect(personalB.data.products[0].id).not.toBe(personal.data.products[0].id)
      const recommendationService: RecommendationModuleService = getContainer().resolve("recommendation")
      const [v1Run] = await recommendationService.listRecommendationRuns({ version: "pers-fixture-v1" })
      await publishRecommendations(getContainer(), { version: "pers-fixture-hybrid", manifest: { fixture: true },
        candidates: candidates.map((row) => ({ ...row, version: "pers-fixture-hybrid",
          strategy: row.placement === "home" ? row.strategy : "hm_hybrid_similarity" })) })
      const frozenV2 = await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: a })
      expect(frozenV2.data.personalized).toBe(false)
      await recommendationService.updateRecommendationActives({ id: "recommendation_active", run_id: v1Run.id })
      await expect(api.post("/store/personalization/events", { ...event, event_id: randomUUID(), event_type: "purchase" }, { headers: a }))
        .rejects.toMatchObject({ response: { status: 400 } })
      const service: PersonalizationModuleService = getContainer().resolve("personalization")
      expect(await service.listRecommendationEvents()).toHaveLength(2)
      await api.post("/store/personalization/consent", { granted: false, terms_version: "v1" }, { headers: a })
      expect((await api.get("/store/personalization/consent", { headers: a })).data.granted).toBe(false)
      expect(await service.listRecommendationEvents()).toHaveLength(1)
      const consents = await service.listRecommendationConsents()
      expect(consents).toHaveLength(2)
      const withdrawn = consents.find((row) => !row.granted)
      expect(withdrawn?.epoch).toBe(2)
      expect(withdrawn?.granted).toBe(false)
      const pg = getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const physicalEvents = await pg("recommendation_event").where({ customer_id: withdrawn!.customer_id }).count("id as count")
      expect(Number(physicalEvents[0].count)).toBe(0)
      expect((await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: b })).data.personalized).toBe(true)
    })
  },
})
