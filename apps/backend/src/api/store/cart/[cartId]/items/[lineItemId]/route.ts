import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteLineItemsWorkflow } from "@medusajs/medusa/core-flows"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  await deleteLineItemsWorkflow(req.scope).run({
    input: {
      cart_id: req.params.cartId,
      ids: [req.params.lineItemId],
    },
  })

  res.status(204).send()
}
