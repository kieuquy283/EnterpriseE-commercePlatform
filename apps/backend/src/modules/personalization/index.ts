import { Module } from "@medusajs/framework/utils"
import PersonalizationModuleService from "./service"

export const PERSONALIZATION_MODULE = "personalization"
export default Module(PERSONALIZATION_MODULE, { service: PersonalizationModuleService })
