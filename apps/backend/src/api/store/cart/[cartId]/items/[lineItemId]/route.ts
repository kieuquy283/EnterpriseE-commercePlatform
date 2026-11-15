import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteLegacyCartItemWorkflow } from "../../../../../../workflows/delete-legacy-cart-item"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await deleteLegacyCartItemWorkflow(req.scope).run({
    input: {
      cart_id: req.params.cartId,
      line_item_id: req.params.lineItemId,
    },
  })

  res.status(204).send()
}
