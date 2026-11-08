import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import PersonalizationModuleService from "../../../../modules/personalization/service"
import { recordPersonalizationEventWorkflow } from "../../../../workflows/personalization/record-event"
import { rebuildPersonalizationProfileWorkflow } from "../../../../workflows/personalization/rebuild-profile"

type EventBody = {
  event_id?: unknown
  event_type?: unknown
  product_id?: unknown
  placement?: unknown
}

export async function POST(req: AuthenticatedMedusaRequest<EventBody>, res: MedusaResponse) {
  if (process.env.ENABLE_PERSONALIZED_RECOMMENDATIONS !== "true" ||
    process.env.ENABLE_PERSONALIZATION_EVENTS !== "true") {
    return res.status(404).json({ message: "Not found" })
  }
  if (Object.keys(req.query).length) return res.status(400).json({ message: "Unexpected query parameter" })
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Authentication required" })
  const body = req.body as EventBody | null
  if (!body || Object.keys(body).some((key) => !["event_id", "event_type", "product_id", "placement"].includes(key)) ||
    typeof body.event_id !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.event_id) ||
    !["product_view", "recommendation_click"].includes(body.event_type as string) ||
    typeof body.product_id !== "string" || !/^prod_[a-zA-Z0-9]+$/.test(body.product_id) ||
    (body.placement !== undefined && !["home", "product_detail", "for_you"].includes(body.placement as string))) {
    return res.status(400).json({ message: "Invalid recommendation event" })
  }
  const service: PersonalizationModuleService = req.scope.resolve("personalization")
  const [consent] = await service.listRecommendationConsents({ customer_id: customerId })
  if (!consent?.granted) return res.status(403).json({ message: "Personalization permission required" })
  try {
    const product = await req.scope.resolve(Modules.PRODUCT).retrieveProduct(body.product_id)
    if (product.status !== "published") return res.status(400).json({ message: "Product unavailable" })
  } catch {
    return res.status(400).json({ message: "Product unavailable" })
  }
  try {
    const { result } = await recordPersonalizationEventWorkflow(req.scope).run({
      input: { customerId, consentEpoch: consent.epoch, eventId: body.event_id,
        eventType: body.event_type as "product_view" | "recommendation_click",
        productId: body.product_id, placement: (body.placement as string | undefined) ?? null },
    })
    if (!result.accepted) return res.status(403).json({ message: "Personalization permission required" })
    try {
      await rebuildPersonalizationProfileWorkflow(req.scope).run({ input: { customerId } })
    } catch {
      // The event remains durable; the scheduled rebuild can recover a stale profile.
    }
    res.setHeader("Cache-Control", "private, no-store")
    return res.status(202).json({ accepted: true })
  } catch {
    return res.status(503).json({ message: "Event store unavailable" })
  }
}
