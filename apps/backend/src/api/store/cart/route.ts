import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http"
import type { CartDTO } from "@medusajs/framework/types"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { GetLegacyCart } from "./validators"

type CreateCartBody = {
  region_id: string
  sales_channel_id?: string
  email?: string
}

// This compatibility DTO deliberately excludes customer data and internal metadata.
function cartResponse(cart: CartDTO) {
  return {
    id: cart.id,
    region_id: cart.region_id,
    currency_code: cart.currency_code,
    items: cart.items?.map(({ id, variant_id, quantity }) => ({
      id,
      variant_id,
      quantity: Number(quantity),
    })),
  }
}

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const query = GetLegacyCart.safeParse(req.query)
  if (!query.success) {
    res.status(400).json({ message: "cart_id is required" })
    return
  }
  const cartModuleService = req.scope.resolve(Modules.CART)
  const cart = await cartModuleService.retrieveCart(query.data.cart_id, { relations: ["items"] })
  res.json({ cart: cartResponse(cart) })
}

export async function POST(req: MedusaStoreRequest<CreateCartBody>, res: MedusaResponse) {
  const body = req.validatedBody
  const channels = req.publishable_key_context?.sales_channel_ids ?? []
  const salesChannelId = body.sales_channel_id ?? (channels.length === 1 ? channels[0] : undefined)
  if (!salesChannelId || !channels.includes(salesChannelId)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Select a sales channel associated with the publishable key",
    )
  }
  const { result: cart } = await createCartWorkflow(req.scope).run({
    input: {
      region_id: body.region_id,
      email: body.email,
      sales_channel_id: salesChannelId,
      customer_id: req.auth_context?.actor_id,
    },
  })
  res.status(201).json({ cart: cartResponse(cart) })
}
