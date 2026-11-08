import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import PersonalizationModuleService from "../../../../modules/personalization/service"
import { setPersonalizationConsentWorkflow } from "../../../../workflows/personalization/set-consent"

function disabled(res: MedusaResponse) {
  return res.status(404).json({ message: "Not found" })
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  if (process.env.ENABLE_PERSONALIZED_RECOMMENDATIONS !== "true") return disabled(res)
  if (Object.keys(req.query).length) return res.status(400).json({ message: "Unexpected query parameter" })
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Authentication required" })
  const service: PersonalizationModuleService = req.scope.resolve("personalization")
  const [consent] = await service.listRecommendationConsents({ customer_id: customerId })
  res.setHeader("Cache-Control", "private, no-store")
  return res.json({ granted: consent?.granted ?? false, terms_version: consent?.terms_version ?? null })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  if (process.env.ENABLE_PERSONALIZED_RECOMMENDATIONS !== "true") return disabled(res)
  if (Object.keys(req.query).length) return res.status(400).json({ message: "Unexpected query parameter" })
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Authentication required" })
  const body = req.body as Record<string, unknown> | null
  if (!body || Object.keys(body).some((key) => !["granted", "terms_version"].includes(key)) ||
    typeof body.granted !== "boolean" || typeof body.terms_version !== "string" ||
    !/^[a-zA-Z0-9._-]{1,40}$/.test(body.terms_version)) {
    return res.status(400).json({ message: "Invalid consent request" })
  }
  try {
    const { result } = await setPersonalizationConsentWorkflow(req.scope).run({
      input: { customerId, granted: body.granted, termsVersion: body.terms_version },
    })
    res.setHeader("Cache-Control", "private, no-store")
    return res.json(result)
  } catch {
    return res.status(503).json({ message: "Consent service unavailable" })
  }
}
