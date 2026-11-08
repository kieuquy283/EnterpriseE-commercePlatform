import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import PersonalizationModuleService from "../../modules/personalization/service"

type Input = {
  customerId: string
  consentEpoch: number
  eventId: string
  eventType: "product_view" | "recommendation_click"
  productId: string
  placement: string | null
}

const recordEventStep = createStep("record-event", async (input: Input, { container }) => {
  const service: PersonalizationModuleService = container.resolve("personalization")
  const eventKey = `${input.customerId}:${input.eventId}`
  const [existing] = await service.listRecommendationEvents({ event_key: eventKey })
  if (existing) return new StepResponse({ accepted: true })
  let event
  try {
    event = await service.createRecommendationEvents({
      event_key: eventKey, customer_id: input.customerId, consent_epoch: input.consentEpoch,
      event_type: input.eventType, product_id: input.productId, placement: input.placement,
      occurred_at: new Date(), order_line_key: null,
    })
  } catch (error) {
    const [duplicate] = await service.listRecommendationEvents({ event_key: eventKey })
    if (!duplicate) throw error
    event = duplicate
  }
  const [current] = await service.listRecommendationConsents({ customer_id: input.customerId })
  if (!current?.granted || current.epoch !== event.consent_epoch) {
    await service.deleteRecommendationEvents(event.id)
    return new StepResponse({ accepted: false })
  }
  return new StepResponse({ accepted: true })
})

export const recordPersonalizationEventWorkflow = createWorkflow("record-personalization-event", (input: Input) => {
  const result = recordEventStep(input)
  return new WorkflowResponse(result)
})
