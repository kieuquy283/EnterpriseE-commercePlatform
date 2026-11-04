// LOCAL TEST ONLY: activate through the explicit week 4 config gate.
import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import Week4PaymentProvider from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [Week4PaymentProvider],
})
