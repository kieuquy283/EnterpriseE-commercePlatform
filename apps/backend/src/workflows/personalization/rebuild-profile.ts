import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import PersonalizationModuleService from "../../modules/personalization/service"
import { buildInterestProfile } from "../../modules/personalization/rank"

type Input = { customerId: string }

const rebuildProfileStep = createStep("rebuild-profile", async (input: Input, { container }) => {
  const service: PersonalizationModuleService = container.resolve("personalization")
  const [consent] = await service.listRecommendationConsents({ customer_id: input.customerId })
  if (!consent?.granted) return new StepResponse({ updated: false })
  const events = await service.listRecommendationEvents({ customer_id: input.customerId, consent_epoch: consent.epoch },
    { take: 100, order: { created_at: "DESC" } })
  const profile = buildInterestProfile(events)
  const [existing] = await service.listRecommendationProfiles({ customer_id: input.customerId })
  if (existing) await service.updateRecommendationProfiles({ id: existing.id, consent_epoch: consent.epoch,
    profile_version: "behavioral-v1", interests: profile, recent_product_ids: { ids: profile.source_products.map((row) => row.product_id) } })
  else await service.createRecommendationProfiles({ customer_id: input.customerId, consent_epoch: consent.epoch,
    profile_version: "behavioral-v1", interests: profile, recent_product_ids: { ids: profile.source_products.map((row) => row.product_id) } })
  const [current] = await service.listRecommendationConsents({ customer_id: input.customerId })
  if (!current?.granted || current.epoch !== consent.epoch) {
    const rows = await service.listRecommendationProfiles({ customer_id: input.customerId })
    if (rows.length) await service.deleteRecommendationProfiles(rows.map((row) => row.id))
    return new StepResponse({ updated: false })
  }
  return new StepResponse({ updated: true })
})

export const rebuildPersonalizationProfileWorkflow = createWorkflow("rebuild-personalization-profile", (input: Input) => {
  const result = rebuildProfileStep(input)
  return new WorkflowResponse(result)
})
