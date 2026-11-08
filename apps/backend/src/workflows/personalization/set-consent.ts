import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import PersonalizationModuleService from "../../modules/personalization/service"
import { nextConsent } from "../../modules/personalization/consent-state"
import { erasePersonalizationData } from "../../modules/personalization/erase"

type Input = { customerId: string; granted: boolean; termsVersion: string }

const setConsentStep = createStep("set-consent", async (input: Input, { container }) => {
  const service: PersonalizationModuleService = container.resolve("personalization")
  const [current] = await service.listRecommendationConsents({ customer_id: input.customerId })
  const next = nextConsent(current ? {
    granted: current.granted, epoch: current.epoch, terms_version: current.terms_version,
  } : null, input.granted, input.termsVersion)
  if (!current) await service.createRecommendationConsents({ customer_id: input.customerId, ...next })
  else if (next.granted !== current.granted || next.epoch !== current.epoch) {
    await service.updateRecommendationConsents({ id: current.id, ...next })
  }
  if (!next.granted) await erasePersonalizationData(service, input.customerId)
  return new StepResponse({ granted: next.granted, terms_version: next.terms_version })
})

export const setPersonalizationConsentWorkflow = createWorkflow("set-personalization-consent", (input: Input) => {
  const result = setConsentStep(input)
  return new WorkflowResponse(result)
})
