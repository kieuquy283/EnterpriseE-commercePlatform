import { MedusaService } from "@medusajs/framework/utils"
import RecommendationConsent from "./models/recommendation-consent"
import RecommendationEvent from "./models/recommendation-event"
import RecommendationProfile from "./models/recommendation-profile"

export default class PersonalizationModuleService extends MedusaService({
  RecommendationConsent,
  RecommendationEvent,
  RecommendationProfile,
}) {}
