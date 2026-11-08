import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import PersonalizationModuleService from "../modules/personalization/service"
import { rebuildPersonalizationProfileWorkflow } from "../workflows/personalization/rebuild-profile"

type OrderSignal = { id: string }

export default async function personalizationOrderEvents({ event, container }: SubscriberArgs<OrderSignal>) {
  if (process.env.ENABLE_PERSONALIZED_RECOMMENDATIONS !== "true" ||
    process.env.ENABLE_PERSONALIZATION_ORDER_EVENTS !== "true") return
  if (event.name !== "order.placed" && event.name !== "order.canceled") return
  const order = await container.resolve(Modules.ORDER).retrieveOrder(event.data.id, { relations: ["items"] })
  if (!order.customer_id || !order.items?.length) return
  const service: PersonalizationModuleService = container.resolve("personalization")
  const [consent] = await service.listRecommendationConsents({ customer_id: order.customer_id })
  if (!consent?.granted) return
  for (const item of order.items) {
    if (!item.product_id) continue
    const orderLineKey = `${order.id}:${item.id}`
    const eventType = event.name === "order.placed" ? "order_placed" : "order_canceled"
    const eventKey = `${eventType}:${orderLineKey}`
    const [existing] = await service.listRecommendationEvents({ event_key: eventKey })
    if (existing) continue
    try {
      const created = await service.createRecommendationEvents({
        event_key: eventKey, customer_id: order.customer_id, consent_epoch: consent.epoch,
        event_type: eventType, product_id: item.product_id,
        order_line_key: orderLineKey, placement: null,
        occurred_at: eventType === "order_placed" ? new Date(order.created_at) : new Date(),
      })
      const [current] = await service.listRecommendationConsents({ customer_id: order.customer_id })
      if (!current?.granted || current.epoch !== created.consent_epoch) {
        await service.deleteRecommendationEvents(created.id)
      }
    } catch (error) {
      const [duplicate] = await service.listRecommendationEvents({ event_key: eventKey })
      if (!duplicate) throw error
    }
  }
  await rebuildPersonalizationProfileWorkflow(container).run({ input: { customerId: order.customer_id } })
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.canceled"],
}
