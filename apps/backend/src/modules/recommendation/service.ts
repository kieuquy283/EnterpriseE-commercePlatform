import { MedusaService } from "@medusajs/framework/utils"
import RecommendationRun from "./models/recommendation-run"
import RecommendationCandidate from "./models/recommendation-candidate"
import RecommendationActive from "./models/recommendation-active"

export default class RecommendationModuleService extends MedusaService({
  RecommendationRun,
  RecommendationCandidate,
  RecommendationActive,
}) {}
