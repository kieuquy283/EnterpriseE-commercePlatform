import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const productModuleService = req.scope.resolve(Modules.PRODUCT)
  const product = await productModuleService.retrieveProduct(req.params.productId, {
    relations: ["variants", "images", "options", "tags"],
  })

  res.json({ product })
}
