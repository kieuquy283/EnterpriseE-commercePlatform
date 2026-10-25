import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"

type AddItemBody = {
  variant_id?: string
  quantity?: number
}

export async function POST(
  req: MedusaRequest<AddItemBody>,
  res: MedusaResponse
) {
  const { variant_id: variantId, quantity } = req.body

  if (!variantId || !quantity || quantity <= 0) {
    res.status(400).json({
      message: "variant_id and a positive quantity are required",
    })
    return
  }

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id: req.params.cartId,
      items: [{ variant_id: variantId, quantity }],
    },
  })

  res.status(201).json({ cart_id: req.params.cartId, variant_id: variantId })
}
