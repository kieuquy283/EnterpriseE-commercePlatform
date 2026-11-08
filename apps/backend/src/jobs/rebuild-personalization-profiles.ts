import type { MedusaContainer } from "@medusajs/framework/types"
import PersonalizationModuleService from "../modules/personalization/service"
import { rebuildPersonalizationProfileWorkflow } from "../workflows/personalization/rebuild-profile"

export default async function rebuildPersonalizationProfiles(container: MedusaContainer) {
  if (process.env.ENABLE_PERSONALIZATION_PROFILE_JOB !== "true") return
  const service: PersonalizationModuleService = container.resolve("personalization")
  for (let skip = 0; ; skip += 100) {
    const consents = await service.listRecommendationConsents({ granted: true }, { take: 100, skip })
    if (!consents.length) break
    for (const consent of consents) {
      await rebuildPersonalizationProfileWorkflow(container).run({ input: { customerId: consent.customer_id } })
    }
    if (consents.length < 100) break
  }
}

export const config = { name: "rebuild-personalization-profiles", schedule: "0 * * * *" }
