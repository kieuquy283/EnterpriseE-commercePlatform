import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"

type CreateCartBody = {
  region_id?: string
  customer_id?: string
  sales_channel_id?: string
  email?: string
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cartId = typeof req.query.cart_id === "string" ? req.query.cart_id : ""

  if (!cartId) {
    res.status(400).json({ message: "cart_id is required" })
    return
  }

  const cartModuleService = req.scope.resolve(Modules.CART)
  const cart = await cartModuleService.retrieveCart(cartId, {
    relations: ["items", "shipping_methods", "region"],
  })

  res.json({ cart })
}

export async function POST(
  req: MedusaRequest<CreateCartBody>,
  res: MedusaResponse
) {
  if (!req.body.region_id) {
    res.status(400).json({ message: "region_id is required" })
    return
  }

  const { result: cart } = await createCartWorkflow(req.scope).run({
    input: req.body,
  })

  res.status(201).json({ cart })
}
