import { randomUUID } from "node:crypto"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { createApiKeysWorkflow, createShippingProfilesWorkflow, linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import PersonalizationModuleService from "../../src/modules/personalization/service"
import RecommendationModuleService from "../../src/modules/recommendation/service"
import seedCommerce from "../../src/scripts/seed-commerce"
import { publishRecommendations, type Candidate } from "../../src/workflows/recommendation/publish"
import { recordPersonalizationEventWorkflow } from "../../src/workflows/personalization/record-event"
import rebuildPersonalizationProfiles from "../../src/jobs/rebuild-personalization-profiles"

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
      const prevPersonalizationFlag = process.env.ENABLE_PERSONALIZED_RECOMMENDATIONS
      const prevEventsFlag = process.env.ENABLE_PERSONALIZATION_EVENTS
      try {
        process.env.ENABLE_PERSONALIZED_RECOMMENDATIONS = "false"
        process.env.ENABLE_PERSONALIZATION_EVENTS = "false"
        await expect(api.get("/store/personalization/consent", { headers: a })).rejects.toMatchObject({ response: { status: 404 } })
        await expect(api.post("/store/personalization/consent", { granted: true, terms_version: "v1" }, { headers: a }))
          .rejects.toMatchObject({ response: { status: 404 } })
        await expect(api.post("/store/personalization/events", { event_id: randomUUID(), event_type: "product_view", product_id: products[0].id }, { headers: a }))
          .rejects.toMatchObject({ response: { status: 404 } })
        await expect(api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: a }))
          .rejects.toMatchObject({ response: { status: 404 } })

        process.env.ENABLE_PERSONALIZED_RECOMMENDATIONS = "true"
        process.env.ENABLE_PERSONALIZATION_EVENTS = "false"
        expect((await api.get("/store/personalization/consent", { headers: a })).data.granted).toBe(false)
        await expect(api.post("/store/personalization/events", { event_id: randomUUID(), event_type: "product_view", product_id: products[0].id }, { headers: a }))
          .rejects.toMatchObject({ response: { status: 404 } })
      } finally {
        if (prevPersonalizationFlag === undefined) delete process.env.ENABLE_PERSONALIZED_RECOMMENDATIONS
        else process.env.ENABLE_PERSONALIZED_RECOMMENDATIONS = prevPersonalizationFlag
        if (prevEventsFlag === undefined) delete process.env.ENABLE_PERSONALIZATION_EVENTS
        else process.env.ENABLE_PERSONALIZATION_EVENTS = prevEventsFlag
      }
      await expect(api.get("/store/personalization/consent", { headers: publicHeaders })).rejects.toMatchObject({ response: { status: 401 } })
      await expect(api.post("/store/personalization/consent", { granted: true, terms_version: "v1" }, { headers: publicHeaders }))
        .rejects.toMatchObject({ response: { status: 401 } })
      await expect(api.post("/store/personalization/events", { event_id: randomUUID(), event_type: "product_view", product_id: products[0].id }, { headers: publicHeaders }))
        .rejects.toMatchObject({ response: { status: 401 } })
      await expect(api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: publicHeaders }))
        .rejects.toMatchObject({ response: { status: 401 } })
      expect((await api.get("/store/personalization/consent", { headers: a })).data.granted).toBe(false)
      expect((await api.get("/store/personalization/consent", { headers: b })).data.granted).toBe(false)
      await expect(api.post("/store/personalization/consent", { granted: true, terms_version: "v1", customer_id: "cus_other" }, { headers: a }))
        .rejects.toMatchObject({ response: { status: 400 } })
      const granted = await api.post("/store/personalization/consent", { granted: true, terms_version: "v1" }, { headers: a })
      expect(granted.data.granted).toBe(true)
      expect((await api.get("/store/personalization/consent", { headers: b })).data.granted).toBe(false)
      const generic = await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: b })
      expect(generic.data.personalized).toBe(false)
      expect(generic.data.strategy).toBe("catalog_fallback")
      expect(generic.data.reason).toBe("no_consent")
      expect(generic.headers["cache-control"]).toBe("private, no-store")
      const eventId = randomUUID()
      const event = { event_id: eventId, event_type: "product_view", product_id: products[0].id }
      expect((await api.post("/store/personalization/events", event, { headers: a })).status).toBe(202)
      expect((await api.post("/store/personalization/events", event, { headers: a })).status).toBe(202)
      const personal = await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: a })
      expect(personal.data.personalized).toBe(true)
      expect(personal.data.products[0].id).toBe(products[1].id)
      expect(personal.data.products[0]).not.toHaveProperty("metadata")
      expect(personal.headers["cache-control"]).toBe("private, no-store")
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
      const activeB = consents.find((row) => row.granted)
      expect(withdrawn?.epoch).toBe(2)
      expect(withdrawn?.granted).toBe(false)
      const pg = getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const physicalEvents = await pg("recommendation_event").where({ customer_id: withdrawn!.customer_id }).count("id as count")
      const physicalProfiles = await pg("recommendation_profile").where({ customer_id: withdrawn!.customer_id }).count("id as count")
      const physicalEventsB = await pg("recommendation_event").where({ customer_id: activeB!.customer_id }).count("id as count")
      const physicalProfilesB = await pg("recommendation_profile").where({ customer_id: activeB!.customer_id }).count("id as count")
      expect(Number(physicalEvents[0].count)).toBe(0)
      expect(Number(physicalProfiles[0].count)).toBe(0)
      expect(Number(physicalEventsB[0].count)).toBe(1)
      expect(Number(physicalProfilesB[0].count)).toBe(1)
      const afterRevokeA = await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: a })
      expect(afterRevokeA.data.personalized).toBe(false)
      expect(afterRevokeA.data.strategy).toBe("catalog_fallback")
      expect(afterRevokeA.data.reason).toBe("no_consent")
      expect((await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: b })).data.personalized).toBe(true)

      const reOptIn = await api.post("/store/personalization/consent", { granted: true, terms_version: "v1" }, { headers: a })
      expect(reOptIn.data.granted).toBe(true)
      const [reConsentedA] = await service.listRecommendationConsents({ customer_id: withdrawn!.customer_id })
      expect(reConsentedA.epoch).toBe(3)
      expect(reConsentedA.granted).toBe(true)
      const coldStartAfterReOptIn = await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: a })
      expect(coldStartAfterReOptIn.data.personalized).toBe(false)
      expect(coldStartAfterReOptIn.data.strategy).toBe("catalog_fallback")
      expect(coldStartAfterReOptIn.data.reason).toBe("cold_start_or_profile_pending")

      const staleAttempt = await recordPersonalizationEventWorkflow(getContainer()).run({
        input: {
          customerId: withdrawn!.customer_id,
          consentEpoch: 1,
          eventId: randomUUID(),
          eventType: "product_view",
          productId: products[0].id,
          placement: "product_detail",
        },
      })
      expect(staleAttempt.result.accepted).toBe(false)
      const physicalAfterStale = await pg("recommendation_event").where({ customer_id: withdrawn!.customer_id }).count("id as count")
      expect(Number(physicalAfterStale[0].count)).toBe(0)

      expect((await api.post("/store/personalization/events", {
        event_id: randomUUID(), event_type: "product_view", product_id: products[1].id,
      }, { headers: a })).status).toBe(202)
      const epoch3EventsA = await service.listRecommendationEvents({ customer_id: withdrawn!.customer_id })
      expect(epoch3EventsA).toHaveLength(1)
      expect(epoch3EventsA[0].consent_epoch).toBe(3)
      const [epoch3ProfileA] = await service.listRecommendationProfiles({ customer_id: withdrawn!.customer_id })
      expect(epoch3ProfileA.consent_epoch).toBe(3)
      const personalizedEpoch3A = await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: a })
      expect(personalizedEpoch3A.data.personalized).toBe(true)
      expect(personalizedEpoch3A.data.products[0].id).toBe(products[0].id)

      await recommendationService.updateRecommendationActives({ id: "recommendation_active", run_id: "missing" })
      const missingRunFallback = await api.get(`/store/recommendations/for-you?region_id=${region}`, { headers: a })
      expect(missingRunFallback.status).toBe(200)
      expect(missingRunFallback.data.personalized).toBe(false)
      expect(missingRunFallback.data.strategy).toBe("catalog_fallback")
      expect(missingRunFallback.data.reason).toBe("candidate_store_unavailable")
      expect(missingRunFallback.data.products.length).toBeGreaterThanOrEqual(1)
      await recommendationService.updateRecommendationActives({ id: "recommendation_active", run_id: v1Run.id })

      const prevJobFlag = process.env.ENABLE_PERSONALIZATION_PROFILE_JOB
      try {
        await service.deleteRecommendationProfiles(epoch3ProfileA.id)
        process.env.ENABLE_PERSONALIZATION_PROFILE_JOB = "false"
        await rebuildPersonalizationProfiles(getContainer())
        expect(await service.listRecommendationProfiles({ customer_id: withdrawn!.customer_id })).toHaveLength(0)
        process.env.ENABLE_PERSONALIZATION_PROFILE_JOB = "true"
        await rebuildPersonalizationProfiles(getContainer())
        const rebuiltProfilesA = await service.listRecommendationProfiles({ customer_id: withdrawn!.customer_id })
        expect(rebuiltProfilesA).toHaveLength(1)
        expect(rebuiltProfilesA[0].consent_epoch).toBe(3)
      } finally {
        if (prevJobFlag === undefined) delete process.env.ENABLE_PERSONALIZATION_PROFILE_JOB
        else process.env.ENABLE_PERSONALIZATION_PROFILE_JOB = prevJobFlag
      }
    })
  },
})
