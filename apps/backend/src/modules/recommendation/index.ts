import { Module } from "@medusajs/framework/utils"
import RecommendationModuleService from "./service"

export const RECOMMENDATION_MODULE = "recommendation"
export default Module(RECOMMENDATION_MODULE, { service: RecommendationModuleService })
